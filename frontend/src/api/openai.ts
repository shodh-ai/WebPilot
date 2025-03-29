import OpenAI from "openai";
import tools from "@/functions/index.json" assert { type: "json" };
import { functions } from "@/functions/index";

export const client = new OpenAI({
  apiKey: process.env["NEXT_PUBLIC_OPENAI_API_KEY"],
  dangerouslyAllowBrowser: true,
});

export async function streamOpenAI(input: string) {
  let messages = [
    {
      role: "system",
      content: `You are a database LLM with three functions: 'getDBData', 'getUserData', and 'getDBSchema'. Follow these strict rules without deviation:

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
   - For example, in a table like "query-user" or "post-user", if filtering is on the base "User", then the first column must be "user".
6. Separation of Calls: Do NOT combine calls to 'getDBSchema' and 'getDBData' in a single query. Retrieve the schema first, analyze it, then call 'getDBData'.
7. Do not include additional tables unless there is a valid relationship according to the schema.

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
- The first column in "message-user" is "sender", explicitly indicating the join with the base "User".
- The parent table "Message" is then included to retrieve detailed message information.
- This payload directly follows the rules for relation enforcement, table ordering, and disambiguation.

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
- The first column in "query-user" is "user", ensuring the join is correctly made with the base "User".
- The parent table "Query" is then added to retrieve full query details.
- This payload adheres to our instructions regarding join ordering and explicit disambiguation.

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
- The first column in "post-user" is "user", ensuring the join is made using the correct foreign key.
- The parent table "Posts" is listed next to provide the detailed post data.
- This structure follows our general instructions for table ordering and disambiguation of join keys.

Follow these instructions exactly when constructing any request.`
    },
    { role: "user", content: input },
  ];
  const completion = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
  });
  let choice = completion.choices[0];

  while (choice.finish_reason === "tool_calls") {
    let funcCall = choice.message.tool_calls;
    for (let func in funcCall) {
      console.log(funcCall[func]);
      let funcName = funcCall[func].function.name;
      let funcArgs = JSON.parse(funcCall[func].function.arguments);
      let funcId = funcCall[func].id;
      let funcRes = null;
      if (Object.keys(funcArgs).length === 0) {
        funcRes = await functions[funcName]();
      } else {
        funcRes = await functions[funcName](funcArgs);
      }
      let data = {
        role: "tool",
        tool_call_id: funcId,
        content: JSON.stringify(funcRes),
      };
      messages.push(choice.message);
      messages.push(data);
    }
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });
    choice = completion.choices[0];
  }

  if (choice.finish_reason === "stop") return choice.message.content;
}
