# 5 分钟给 GitHub 仓库加上 AI PR 助手

**痛点：** 团队 PR 描述质量参差不齐，review 前要先猜改了什么。

**方案：** 用 [PR Genie](https://github.com/a62136920/pr-genie) 这个 GitHub Action，PR 一开就自动评论结构化摘要。

## 步骤

1. 仓库 Settings → Secrets → 添加 `OPENAI_API_KEY`（或用 DeepSeek 更便宜）
2. 新建 `.github/workflows/pr-summary.yml`（见仓库 examples）
3. 提个 PR 测试

## 成本

DeepSeek：约 ¥0.001/次。10 人团队每天 5 个 PR，一个月不到 ¥5。

## 为什么不用 Copilot

- 不绑 Copilot 订阅
- 支持自定义模板（Pro）
- 中英文自动切换

Star 支持一下 👉 github.com/a62136920/pr-genie
