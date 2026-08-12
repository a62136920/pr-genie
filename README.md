# PR Genie ✨

> 用 AI 自动生成 GitHub PR 描述和 Release Notes 的 GitHub Action  
> 零服务器 · 自带 API Key · 支持 OpenAI / DeepSeek 等兼容接口

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 为什么用它

写 PR 描述和发版说明很费时间，但团队又需要统一格式。PR Genie 在 PR 打开或推送 tag 时自动调用 AI，生成结构化 markdown，并评论到 PR 或写入 Release。

**成本：** 只有 AI API 调用费（gpt-4o-mini 约 ¥0.01/次 PR）

---

## 快速开始

### 1. 添加 Secret

在仓库 Settings → Secrets → Actions 添加：

| Secret | 说明 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI 或兼容 API 的 Key |

### 2. PR 自动摘要

复制 [`examples/pr-summary.yml`](examples/pr-summary.yml) 到 `.github/workflows/pr-summary.yml`：

```yaml
name: PR Summary
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
  pull-requests: write
jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: a62136920/pr-genie@v0.1.0
        with:
          mode: pr-summary
          api-key: ${{ secrets.OPENAI_API_KEY }}
          language: zh
```

### 3. 发版自动生成 Release Notes

复制 [`examples/release-notes.yml`](examples/release-notes.yml) 到 `.github/workflows/release-notes.yml`，推送 `v*` tag 即可。

---

## 使用 DeepSeek（更便宜）

```yaml
- uses: a62136920/pr-genie@v0.1.0
  with:
    mode: pr-summary
    api-key: ${{ secrets.DEEPSEEK_API_KEY }}
    api-base: https://api.deepseek.com/v1
    model: deepseek-chat
    language: zh
```

---

## 输入参数

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `mode` | ✅ | — | `pr-summary` 或 `release-notes` |
| `api-key` | ✅ | — | API Key |
| `api-base` | | `https://api.openai.com/v1` | 兼容 OpenAI 的 Base URL |
| `model` | | `gpt-4o-mini` | 模型名 |
| `language` | | `auto` | `zh` / `en` / `auto` |
| `template-path` | | — | YAML 模板路径（Pro） |
| `write-to-body` | | `false` | 是否覆盖 PR 正文 |
| `update-release` | | `true` | 是否写入 GitHub Release |
| `tag` | | 当前 ref | release-notes 模式的 tag |
| `previous-tag` | | 自动推断 | 对比的上一个 tag |

---

## 输出示例

PR 评论会包含：

```markdown
## 概要 / Summary
本次 PR 重构了用户认证模块，改用 JWT 替代 session。

## 变更点 / Changes
- 新增 `/api/auth/refresh` 端点
- 移除 cookie-based session 中间件
- 更新登录页错误提示

## 测试建议 / Test plan
- [ ] 登录 / 登出流程
- [ ] Token 过期刷新
- [ ] 旧 session 用户迁移

## 风险 / Risks
需数据库迁移，部署前备份。
```

---

## 本地开发

```bash
npm install
npm run build
npm run typecheck
```

---

## 变现路线（开源 + 增值）

| 版本 | 内容 | 定价建议 |
|------|------|----------|
| **Free** | PR 摘要 + Release Notes + 中英输出 | 开源 MIT |
| **Pro** | 自定义模板、Jira/飞书同步、团队统计 | ¥49/月 |
| **Team** | 私有模板库、SLA、多仓库统一配置 | ¥199/月 |

---

## Roadmap

- [ ] 自定义 prompt 模板（YAML）
- [ ] 多语言 commit 规范检测
- [ ] Slack / 飞书 webhook 通知
- [ ] GitHub Marketplace 上架

---

## License

MIT — 自由使用、修改、商用。
