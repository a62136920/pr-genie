# PR Genie 发布清单

## 发布前（可自主完成）

- [x] MVP 代码
- [x] README 产品页
- [x] 示例 workflow
- [x] Pro 模板样例 ×3
- [x] 推广文案草稿 ×2
- [x] CI workflow
- [x] 提交 dist/ 到 git（已构建，待 push）

## 需要你时

- [x] GitHub 账号：创建公开仓库 `pr-genie` 并推送 → https://github.com/a62136920/pr-genie
- [x] Release v0.1.0 已发布
- [x] GitHub Pages 已开（docs/ + CNAME pr-genie.xinrongstar.chat）
- [ ] DNS：在域名面板添加 `pr-genie` CNAME → `a62136920.github.io`（见 ../域名.md）
- [x] GitHub Secrets：`GROQ_API_KEY` + `DOUBAO_API_KEY` 已配置
- [ ] dogfood workflow：需 PAT 增加 `workflow` scope 后推送 `.github/workflows/pr-summary.yml`（或 GitHub 网页手动粘贴 `examples/groq-doubao.yml`）

## 发布后 7 天

- [ ] V2EX 发帖
- [ ] 掘金发文
- [ ] Product Hunt 提交
- [ ] 在 3 个自己的仓库接入 dogfood

## 30 天目标

- 200+ stars
- 20+ 仓库使用
- 上架 Gumroad Pro 模板包 ¥99
