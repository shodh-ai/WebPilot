import OpenAI from 'openai';

export const client = new OpenAI({
  apiKey: process.env['NEXT_PUBLIC_OPENAI_API_KEY'],
  dangerouslyAllowBrowser: true,
});

export async function testOpenAI() {
  const response = await client.responses.create({
    model: 'gpt-3.5-turbo',
    instructions: 'You are a coding assistant that talks like a pirate',
    input: 'Are semicolons optional in JavaScript?',
  });

  console.log(response.output_text);
}
