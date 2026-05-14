import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

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

export async function extractAction(
  messages: { role: string; content: string }[],
) {
  const schema = `Analyze the conversation above. Output ONLY a JSON object (no markdown, no extra text):
{
  "action": "chat",
  "data": {},
  "quickActions": []
}

action must be one of:
- "chat": casual talk. data: {}
- "create_task": data: {"title": string, "estimatedPomodoros"?: number, "priority"?: "LOW"|"MEDIUM"|"HIGH", "dueDate"?: string, "description"?: string}
- "update_task": data: {"id": string, ...fields}
- "complete_task": data: {"id": string}
- "start_pomodoro": data: {"taskId": string, "taskTitle": string, "duration"?: number}
- "stop_pomodoro": data: {}
- "get_insights": data: {}

For start_pomodoro, taskId MUST be from the task list (IDs shown as ID=xxx).
If no matching task, use "chat" and suggest creating one first.
quickActions: 1-3 short Chinese button labels for follow-up actions.`;

  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      ...messages,
      { role: "user", content: schema },
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: 0.1,
    max_tokens: 512,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}
