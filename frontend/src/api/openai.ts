import OpenAI from "openai";
import tools from "@/functions/index.json" assert { type: "json" };
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import executeUICommand from "@/utils/executor";

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

// Robust JSON parser that removes markdown code block markers if present.
function parseJSONResponse(response: string): any {
  let trimmed = response.trim();
  if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```(json)?/i, "").trim();
    if (trimmed.endsWith("```")) {
      trimmed = trimmed.slice(0, -3).trim();
    }
  }
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    console.error("[parseJSONResponse] Error parsing JSON:", err, "Response:", trimmed);
    return null;
  }
}

// Create a system prompt that incorporates the route context dynamically.
// (Retained exactly as before, including the three-shot examples.)
export const createSystemPrompt = (routeContext: RouteContext | null = null) => {
  const dbSystemPrompt = ` Choice 1 : You are a database LLM with three functions: 'getDBData', 'getUserData', and 'getDBSchema'. Follow these strict rules without deviation:

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
   - If a relation table has multiple foreign keys referencing different tables, explicitly choose the correct join key by placing it as the first element in that table’s column array.
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

  const webAssistantPrompt = routeContext ? 
    ` Choice 2 : You are Rox, a helpful AI assistant for a web application.
You are currently on the ${routeContext.route} page.
Page Description: ${routeContext.pageDescription || 'Not provided'}
Page Context: ${JSON.stringify(routeContext.context || {})}
Interactive Elements: ${JSON.stringify(routeContext.interactiveElements || [])}

Your primary goal is to:
- Provide context-specific guidance for this page
- Help users understand page features and actions
- Offer step-by-step assistance
- Be conversational and proactively helpful` : '';

  const uiExecutionPrompt = `Choice 3 : UI EXECUTION MODE:
If the user query is intended to update the UI state (for example, "set title as: hi"), output a JSON object following exactly this schema:

{
  "action": "ui_execution",
  "function": "<functionName>",
  "arguments": {
    // function arguments here
  }
}
In case of UI Execution mode, only give a JSON structure like above and nothing else.
Guidelines:
- The "function" value must match one of the interactive functions provided in the route context.
- The "arguments" object must include only the keys required for that function.
- IMPORTANT: Do not output any additional text—only a valid JSON structure as described.`;

  return `${dbSystemPrompt}

${webAssistantPrompt ? webAssistantPrompt : ''}

${uiExecutionPrompt}

If the user query appears to be requesting database information, use the database functions following the specified rules.
If the user query appears to be asking for help with navigation or understanding the current page, respond as Rox the web assistant.
If the user query appears to be instructing a UI update, output a JSON structure following the schema above.`;
};

// Main streaming function with classification logging
export async function streamOpenAI(input: string, routeContext: RouteContext | null = null): Promise<string | null> {
  console.log("[streamOpenAI] Called with input:", input, "and routeContext:", routeContext);
  let messages: ChatCompletionMessageParam[] = [
    { role: "system", content: createSystemPrompt(routeContext) },
    { role: "user", content: input },
  ];
  console.log("[streamOpenAI] Initial messages:", messages);
  
  const typedTools = tools as ChatCompletionTool[];
  let choice = (await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    tools: typedTools,
    tool_choice: "auto",
  })).choices[0];
  console.log("[streamOpenAI] Initial choice received:", choice);

  while (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
    const funcCalls = choice.message.tool_calls;
    console.log("[streamOpenAI] Processing tool_calls:", funcCalls);
    
    for (let i = 0; i < funcCalls.length; i++) {
      const funcCall = funcCalls[i];
      const funcName = funcCall.function.name;
      const funcArgs = JSON.parse(funcCall.function.arguments);
      const funcId = funcCall.id;
      console.log(`[streamOpenAI] Tool call ${i + 1}/${funcCalls.length}:`, { funcName, funcArgs, funcId });
      let funcRes = null;
      
      const typedFunctions = {} as { [key: string]: Function };
      
      if (Object.keys(funcArgs).length === 0) {
        console.log(`[streamOpenAI] Calling function ${funcName} with no arguments.`);
        funcRes = await typedFunctions[funcName]?.();
      } else {
        console.log(`[streamOpenAI] Calling function ${funcName} with arguments:`, funcArgs);
        funcRes = await typedFunctions[funcName]?.(funcArgs);
      }
      
      console.log(`[streamOpenAI] Result from function ${funcName}:`, funcRes);
      
      messages.push(choice.message);
      messages.push({
        role: "tool",
        tool_call_id: funcId,
        content: JSON.stringify(funcRes),
      });
      console.log("[streamOpenAI] Updated messages after tool call:", messages);
    }
    
    choice = (await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      tools: typedTools,
      tool_choice: "auto",
    })).choices[0];
    console.log("[streamOpenAI] Updated choice after tool calls:", choice);
  }

  console.log("[streamOpenAI] Final message content:", choice.message.content);
  
  // Classification: Attempt to parse the final response and classify it.
  const parsed = parseJSONResponse(choice.message.content);
  if (parsed) {
    console.log("[streamOpenAI] Parsed final message as JSON:", parsed);
    if (parsed.action && parsed.action === "ui_execution") {
      console.log("[streamOpenAI] Classified response as UI execution mode.");
      console.log("[streamOpenAI] Redirecting to execute UI command...");
      const result = await executeUICommand(parsed);
      console.log("[streamOpenAI] Result from executeUICommand:", result);
      return `UI command executed: ${JSON.stringify(result)}`;
    } else {
      console.log("[streamOpenAI] Parsed JSON does not indicate UI execution. Treating as guidance/database response.");
      return choice.message.content;
    }
  } else {
    console.log("[streamOpenAI] No valid JSON detected. Classifying response as plain text (likely page guidance or database query).");
    return choice.message.content;
  }
}
