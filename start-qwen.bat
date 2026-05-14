@echo off
REM 清除可能残留的其他环境变量
set ANTHROPIC_BASE_URL=
set ANTHROPIC_AUTH_TOKEN=
set ANTHROPIC_API_KEY=

REM 设置 DeepSeek 的 API 地址和你的 Key
set ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
set ANTHROPIC_API_KEY=sk-dc92ae512daf42b1bb2633133710deb6

REM 全局开启自动同意（一路 YES）
set CLAUDE_AUTO_APPROVE=true

REM 用正版 Claude Code 启动 + 自动确认所有操作
"C:\Users\Lenovo\claude-tools\official\node_modules\.bin\claude.cmd" %*