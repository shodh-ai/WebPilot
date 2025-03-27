// api/openai.ts
import { OpenAI } from "openai";
import functionsDefinition from "../functions/index.json";
import { handleToolCall } from "./functionHandler";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function streamOpenAI(
  input: string,
  onStream: (chunk: string) => void,
  onFunctionOutput?: (output: string) => void
): Promise<void> {
  console.log("Starting streamOpenAI with input:", input);
  const messages = [{ role: "user", content: input }];
  console.log("Constructed messages:", messages);

  const streamResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    functions: functionsDefinition,
    function_call: "auto",
    stream: true,
  });
  console.log("Stream response initiated.");

  let accumulatedResponse = "";
  try {
    for await (const part of streamResponse) {
      const delta = part.choices[0].delta;
      console.log("debug print  ",part)
      if (delta?.function_call) {
        const funcCall = delta.function_call;
        const toolName = funcCall.name;
        const argsStr = funcCall.arguments || "{}";
        let args;
        try {
          args = JSON.parse(argsStr);
        } catch (err) {
          console.error(`Failed to parse arguments for ${toolName}:`, argsStr);
          args = {};
        }
        console.log("Detected function call:", toolName, "with arguments:", args);
        // Call the local implementation and get its raw result.
        const rawResult = await handleToolCall(toolName, args);
        console.log(`Function "${toolName}" raw result:`, rawResult);

        // Now make a second chat completion call using the tool's result.
        const secondChatCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "user", content: input },
            {
              role: "function", 
              name: toolName,
              content:
                typeof rawResult === "string"
                  ? rawResult
                  : JSON.stringify(rawResult),
            },
          ],
        });
        
        const finalOutput = secondChatCompletion.choices[0].message.content;
        console.log("Final natural language output:", finalOutput);
        if (onFunctionOutput) {
          onFunctionOutput(finalOutput);
        } else {
          accumulatedResponse += `\n\n${finalOutput}`;
          onStream(accumulatedResponse);
        }
      }
      if (delta?.content) {
        console.log("Received content chunk:", delta.content);
        accumulatedResponse += delta.content;
        onStream(accumulatedResponse);
      }
    }
  } catch (error) {
    console.error("Error streaming response:", error);
  }
}
