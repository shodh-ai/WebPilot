import OpenAI from 'openai';

export const client = new OpenAI({
  apiKey: process.env['NEXT_PUBLIC_OPENAI_API_KEY'],
  dangerouslyAllowBrowser: true,
});

export async function streamOpenAI(input: string, onStream: (chunk: string) => void) {
  const stream = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: input }],
    stream: true,
  });

  try {
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        onStream(chunk.choices[0].delta.content);
      }
    }
  } catch (error) {
    console.error("Error streaming response:", error);
  }
}
