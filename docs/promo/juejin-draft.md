# 开源了一个 GitHub Action：AI 自动写 PR 描述和 Release Notes

做 Side Project 最烦的两件事：
1. 写 PR 描述
2. 发版写 changelog

用 Cursor 花了一下午做了 **PR Genie**——一个零服务器的 GitHub Action。

## 功能

- PR 打开 → 自动评论：概要 / 变更 / 测试建议 / 风险
- 推送 tag → 自动生成 Release Notes 并写入 GitHub Release
- 支持 OpenAI / DeepSeek 等兼容 API

## 接入

```yaml
- uses: a62136920/pr-genie@v0.1.0
  with:
    mode: pr-summary
    api-key: ${{ secrets.OPENAI_API_KEY }}
    language: zh
```

## 计划

开源免费，后续卖 Pro 模板包（前端/后端/用户向发版等）。

GitHub：`a62136920/pr-genie`  
欢迎 star 和 issue 🙏
