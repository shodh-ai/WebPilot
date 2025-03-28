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
      content:
        "You are a database LLM. You have three functions avaialable: getDBData, getUserData, and getDBSchema. To get user details use getUserData, to get data related to user use getDBData (no need to get user data before it. It will work), and finally to get the schema of DB so that you can know what tables and columns are available use getDBSchema. For example to get user's messages directly call getDBSchema and find tables to call in on getDBData.",
    },
    { role: "user", content: "If you are using getDBData, first use getDBSchema. Also keep an eye out for relation tables. Do include them in your schema." },
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
      console.log(func);
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
      console.log(data);
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
