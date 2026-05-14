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
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");

  const schema = `Look at the LAST user message in the conversation above. The assistant has already replied.

Based on the user's latest message ("${lastUserMsg?.content || ""}"), output ONLY a JSON object:
{"action":"...","data":{...},"quickActions":[...]}

Choose action by matching user's words:
- "添加任务：XXX" or "创建任务：XXX" or "新建任务" → "create_task"
  data: {"title":"XXX", "estimatedPomodoros":<number>, "priority":"MEDIUM"}
  Only include dueDate if a valid YYYY-MM-DD date is mentioned; skip it for Chinese dates like "明天"/"后天"
- "开始做XXX" or "开始XXX" or "计时XXX" → "start_pomodoro"
  data: (find the task with matching title from the task list above, use its ID and title)
- "停止计时" or "暂停" or "结束番茄" → "stop_pomodoro", data: {}
- "完成XXX" or "做完了" or "搞定XXX" → "complete_task"
  data: (find task ID from list above by title)
- "今天做了什么" or "总结" or "报告" → "get_insights", data: {}
- Otherwise → "chat", data: {}

IMPORTANT:
- For start_pomodoro/complete_task/update_task, extract the ID from the task list (ID=xxx).
- If the task isn't in the list, use "chat" and suggest creating it.
- quickActions: 1-3 short Chinese suggestion buttons for the NEXT thing the user might do.`;

  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      ...messages,
      { role: "system", content: schema },
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: 0.1,
    max_tokens: 512,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}
