# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-cleanroom-v2` |
| iOS 输入 | `xcode/eCommerce-main`，分支 `main`，commit `4863146`，工作树干净 |
| WebApp | 不存在；必须使用新 Harness 从零生成 |
| Full-app Run | 尚未创建 |
| 完成状态 | `NOT_STARTED` |
| 旧实验 | 已移出仓库，不得作为新迁移输入 |

## 入口

- [项目蓝图](../docs/项目/ecommerce-main/项目蓝图.md)
- [WebApp 查看清单](../docs/WebApp查看清单.md)

## 下一位 AI

1. 执行 `./harness prepare --project ecommerce-main` 创建唯一的新 full-app Run；
2. 用 codebase-memory 从 App 入口追踪所有导航目标，写回 `项目覆盖.json`；
3. 将 `state_candidates` 映射到 `visual-matrix.json` 状态，或说明其不是用户可见状态；
4. 生成并执行全部 Maestro Flow，运行 `reconcile`，保存 iOS 截图；
5. 从零建立完整 WebApp，使用 Playwright 建立相同数据和状态；
6. 运行 `visual-check`，最多精修两轮；最后运行 `check --mode app`。
