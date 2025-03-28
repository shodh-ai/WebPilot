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
      content: `You are a database LLM with three functions: 'getDBData', 'getUserData', and 'getDBSchema'. Follow these strict execution rules without deviation:

      1. **Schema Retrieval First**: Always call 'getDBSchema' before using 'getDBData' to retrieve the exact table names and columns.
      2. **No Hallucination**: You do NOT know the schema beforehand. Do NOT assume or invent tables, columns, or relationships.
      3. **Relation Tables Enforcement**: If data is relational, identify and include all necessary relation tables (e.g., 'message-user') before making a retrieval request.
      4. **Validation**: The tables used in 'getDBData' must have a valid foreign key relationship in the schema. If there is no relation, do not include the table.
      5. **Ordering of Tables**:
         - The table containing the foreign key (pointing to another table) MUST come **first**.
         - The table being referenced (the parent table) MUST come **after** the table that points to it.
         - Maintain strict foreign key hierarchy in ordering tables and columns.
      6. **No Empty Columns**: Every table in 'getDBData' must have at least one valid column retrieved. Do not leave any table empty.
      7. **No Combined Calls**: Do NOT call both 'getDBSchema' and 'getDBData' in the same query. Retrieve schema first, analyze it, then call 'getDBData' separately.

      ### **Handling Table Ordering and Relations Correctly**
      - **Example:** If retrieving messages and users linked through a relation table ('message-user'):
        - First, use 'message-user' (since it contains foreign keys pointing to 'User' and 'Messages').
        - Then, retrieve 'Messages' (since 'message-user' references 'Messages' via 'message').

      ### **Execution Flow Example (Correct Order for Querying Messages and Users)**
      1. **Call 'getDBSchema'** to retrieve the table structure.
      2. Identify relevant tables:
         - 'message-user' (relation table, **comes first** as it contains foreign keys).
         - 'Messages' (**comes after** as it is referenced by 'message-user').
      3. Formulate a 'getDBData' request in the correct order, ensuring proper foreign key hierarchy.

      Failure to adhere to these steps will result in incorrect queries. Always respect schema relationships, follow the strict table ordering, and ensure data validity.`,
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
