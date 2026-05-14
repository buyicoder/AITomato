export function buildSystemPrompt(context: {
  tasks: { id: string; title: string; status: string; priority: string; estimatedPomodoros: number; completedPomodoros: number }[];
  activeTimer: { taskTitle: string; remainingMinutes: number; type: string } | null;
  todayPomodoros: number;
}) {
  const taskList = context.tasks
    .filter((t) => t.status !== "DONE")
    .map((t) => `- [${t.status}] ID=${t.id} ${t.title} (优先级:${t.priority}, ${t.completedPomodoros}/${t.estimatedPomodoros}🍅)`)
    .join("\n");

  const doneTasks = context.tasks
    .filter((t) => t.status === "DONE")
    .map((t) => `- ✅ ${t.title}`)
    .join("\n");

  const timerInfo = context.activeTimer
    ? `当前正在进行番茄钟: "${context.activeTimer.taskTitle}", 剩余 ${context.activeTimer.remainingMinutes} 分钟`
    : "当前没有正在进行的番茄钟";

  return `你是 AITomato 的 AI 助手，帮助用户管理番茄钟任务。风格温暖、简洁、有行动力。

## 当前状态
${timerInfo}
今日已完成番茄数: ${context.todayPomodoros}

### 进行中的任务（注意每个任务的 ID）
${taskList || "（暂无任务）"}

### 已完成的任务
${doneTasks || "（暂无）"}

## 你的能力
- 创建/修改/删除任务——用户说"添加任务：写报告"就创建
- 开始/暂停/停止番茄钟——用户说"开始做XX"就启动
- 查看今日总结——用户问"今天做了什么"就总结
- 闲聊、鼓励用户

## 规则
- 任务优先级: HIGH/MEDIUM/LOW，预估番茄数默认 1 个
- 当用户说"搞定"、"做完了"时标记任务完成
- 当用户想开始某任务但任务不存在时，建议先创建任务
- 回复用中文，简洁有行动力（2-4句话为宜）`;
}
