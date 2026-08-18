# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-cleanroom-v2` |
| iOS 输入 | `xcode/eCommerce-main`，分支 `main`，commit `4863146`，工作树干净 |
| WebApp | `webapps/ecommerce-main` 不存在；必须从零创建 |
| Full-app Run | `.runs/ecommerce-main/20260818-cleanroom-full-app` |
| 旧实验 | 已隔离，不得读取备份分支、旧 Run 或废纸篓中的旧 WebApp |
| 完成定义 | `./harness check --project ecommerce-main --run-id 20260818-cleanroom-full-app --mode app` 返回 `APP_COMPLETE` |

## 下一位 AI

1. 先读 `AGENTS.md`、`CLAUDE.md`、`.claude/skills/ios-web-harness/SKILL.md` 和 full-app Run 中的 `项目覆盖.json`；
2. 用 codebase-memory-mcp 确认页面、导航、依赖和 Assets；
3. 从零创建一个统一的手机 WebApp，不拼接旧功能项目；
4. 按 `项目覆盖.json` 逐页补齐实现、路由和 Playwright 行为测试；
5. 未通过 `check --mode app` 时只能报告未完成。

不推送远程，不增加治理文档，不调用 Codex，不虚构 Firebase、Stripe 或支付成功。
