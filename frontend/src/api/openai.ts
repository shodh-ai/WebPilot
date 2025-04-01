import OpenAI from "openai";
import tools from "@/functions/index.json" assert { type: "json" };
import { functions } from "@/functions/index";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

// Define the interface for route context
export interface RouteContext {
  route: string;
  pageDescription?: string;
  context?: { [key: string]: any };
  interactiveElements?: Array<{
    elementName: string;
    elementType: string;
    eventType: string;
    boundFunction: string;
    referencedFunctions: string[];
  }>;
}

export const client = new OpenAI({
  apiKey: process.env["NEXT_PUBLIC_OPENAI_API_KEY"],
  dangerouslyAllowBrowser: true,
});

// Function to create context-aware system prompt based on the current route/context
export const createSystemPrompt = (routeContext: RouteContext | null = null) => {
  const dbSystemPrompt = `You are a database LLM with three functions: 'getDBData', 'getUserData', and 'getDBSchema'. Follow these strict rules without deviation:

GENERAL INSTRUCTIONS:
1. Schema Retrieval First: Always call 'getDBSchema' before using 'getDBData' to obtain the exact table names and columns. Do NOT assume or invent any schema details.
2. Relation Tables Enforcement: When data is relational, identify all necessary tables and include any relation tables required for proper joins.
3. Base Table Consideration: The query always starts from the base table "User" (via .from('User')). Do NOT include "User" in the join chain; it is implicit.
4. Ordering of Tables in the Join Chain:
   - Include only the additional tables (beyond "User") in your join chain.
   - The table that contains the foreign key (child/relation table) MUST be listed first.
   - The table being referenced (parent table) MUST come after the relation table.
   - Every table in 'getDBData' must have at least one valid column specified.
5. Disambiguation of Foreign Keys:
   - If a relation table has multiple foreign keys referencing different tables, explicitly choose the correct join key by placing it as the first element in that table's column array.
   - For example, in a table like "query-user" or "post-user", if filtering is on the base "User", then the first column must be the foreign key that relates to "User".
6. Separation of Calls: Do NOT combine calls to 'getDBSchema' and 'getDBData' in a single query. Retrieve the schema first, analyze it, then call 'getDBData'.
7. Do not include additional tables unless there is a valid relationship according to the schema.
8. Column Selection Based on Table Relationships:
   - When constructing join queries, include only the columns that are actually present in the table as defined by the schema.
   - Do not assume that columns available in a parent table are available in a relation table.
   - Always verify that the join key (the first element in the columns array) corresponds to a valid foreign key relationship.
   - Ensure that any additional columns listed for a table exist in that table to avoid errors.

THREE-SHOT EXAMPLES:

Example 1:
User Query: "get me the last 5 messages sent by any user"
Expected 'getDBData' Payload:
{
  "tables": ["message-user", "Message"],
  "columns": [
    ["sender", "message", "created_at"],
    ["message_id", "created_at", "message", "seen"]
  ]
}
Reasoning:
- The base "User" is implicit (via .from('User')), so it is not included in the join chain.
- The relation table "message-user" is listed first because it holds the foreign keys linking a user to a message.
- The first column in "message-user" is chosen to correctly indicate the join with the base "User".
- The parent table "Message" is then included to retrieve detailed message information.
- Additionally, the selected columns are verified against the schema, ensuring that only columns existing in each table are requested.

Example 2:
User Query: "get me the last 3 latest queries raised by any user"
Expected 'getDBData' Payload:
{
  "tables": ["query-user", "Query"],
  "columns": [
    ["user", "created_at"],
    ["query_id", "created_at", "text", "department", "user_mail"]
  ]
}
Reasoning:
- The base "User" is implicit, so only additional tables are included.
- The relation table "query-user" is listed first as it links the base "User" to the queries.
- The first column in "query-user" is chosen to ensure the join is correctly made with the base "User".
- The parent table "Query" is then added to retrieve full query details.
- Additionally, the columns selected for the relation table are verified to exist in that table per the schema, avoiding inclusion of columns that belong only to the parent table.

Example 3:
User Query: "what was the details of post about AI Technology? get me the details of the post"
Expected 'getDBData' Payload:
{
  "tables": ["post-user", "Posts"],
  "columns": [
    ["user", "created_at"],
    ["post_id", "Title", "Content"]
  ]
}
Reasoning:
- The base "User" table is implicit; therefore, the join chain includes only the additional tables.
- The relation table "post-user" is listed first because it contains the foreign keys connecting to "User".
- The first column in "post-user" is chosen to ensure the join is made using the correct foreign key.
- The parent table "Posts" is listed next to provide the detailed post data.
- Additionally, the selection of columns in each table respects the schema, ensuring that no invalid columns are requested.`;

  // If we have route context, create a web assistant prompt
  const webAssistantPrompt = routeContext ? 
    `You are Rox, a helpful AI assistant for a web application.
    You are currently on the ${routeContext.route} page.
    Page Description: ${routeContext.pageDescription || 'Not provided'}
    Page Context: ${JSON.stringify(routeContext.context || {})}
    Interactive Elements: ${JSON.stringify(routeContext.interactiveElements || [])}

    Your primary goal is to:
    - Provide context-specific guidance for this page
    - Help users understand page features and actions
    - Offer step-by-step assistance
    - Be conversational and proactively helpful` : '';

  // Combine the prompts with appropriate context switching
  return `${dbSystemPrompt}

${webAssistantPrompt ? webAssistantPrompt : ''}

If the user query appears to be requesting database information, use the database functions following the specified rules.
If the user query appears to be asking for help with navigation or understanding the current page, respond as Rox the web assistant.
Always provide helpful, concise responses appropriate to the context of the query.`;
};

// Main streaming function with context support
export async function streamOpenAI(input: string, routeContext: RouteContext | null = null) {
  let messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: createSystemPrompt(routeContext)
    },
    { role: "user", content: input },
  ];
  
  const typedTools = tools as ChatCompletionTool[];
  
  const completion = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    tools: typedTools,
    tool_choice: "auto",
  });
  
  let choice = completion.choices[0];

  while (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
    let funcCalls = choice.message.tool_calls;
    
    for (let i = 0; i < funcCalls.length; i++) {
      const funcCall = funcCalls[i];
      let funcName = funcCall.function.name;
      let funcArgs = JSON.parse(funcCall.function.arguments);
      let funcId = funcCall.id;
      let funcRes = null;
      
      // Type assertion to access functions with string index
      const typedFunctions = functions as {[key: string]: Function};
      
      if (Object.keys(funcArgs).length === 0) {
        funcRes = await typedFunctions[funcName]();
      } else {
        funcRes = await typedFunctions[funcName](funcArgs);
      }
      
      // Add tool response as a message with correct typing
      messages.push(choice.message);
      messages.push({
        role: "tool",
        tool_call_id: funcId,
        content: JSON.stringify(funcRes),
      });
    }
    
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      tools: typedTools,
      tool_choice: "auto",
    });
    
    choice = completion.choices[0];
  }

  if (choice.finish_reason === "stop") return choice.message.content;
  return null; // Handle case where finish_reason is neither "tool_calls" nor "stop"
}