import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

export async function chatCompletion(
  messages: { role: string; content: string }[],
  stream = false,
) {
  return deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: 0.7,
    max_tokens: 2048,
    stream,
  });
}

export async function chatCompletionStream(
  messages: { role: string; content: string }[],
) {
  return deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  });
}
