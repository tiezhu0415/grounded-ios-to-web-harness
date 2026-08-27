# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-grounded-rerun` |
| Harness 基线 | 当前工作区：在轻量事实切片基础上新增 ACTION/NAVIGATION、同状态快照和有效修复轮约束；40/40 单元与反例测试通过 |
| iOS 输入 | `xcode/eCommerce-main`；保留现状，未在清理中修改 |
| WebApp | `webapps/ecommerce-main/`；完整迁移参考实现 |
| full-app Run | `.runs/ecommerce-main/20260826-200915-full-app/` |
| 自动测试 | Harness 单元与反例测试 40/40 通过；Web 构建、类型检查与 Playwright 验证通过 |
| 当前状态 | `USER_ACCEPTED_AFTER_VISUAL_REVIEW`；机器视觉状态仍如实保留为 `NEEDS_REVISION` |

## 本轮执行规则

1. 顺序固定为 `prepare → 事实发现/ios-run → ACTION/NAVIGATION + State Snapshot → facts-lock → context → Claude 首版 → checkpoint first-pass → 自动检查`。
2. 编码某屏时读取对应的 `contexts/*.json` 和 `visual-grounding/*.json`；不得使用旧实验结果。
3. 状态型核心页面同时准备空/有数据状态；核心行为测试引用锁定 ACTION；Critical Visual Set 的 iOS/Web 使用同一个 `state-snapshots.json` 状态。
4. 失败后只根据当前 Run 证据修复并记录 `checkpoint repair --evidence <报告>`；无代码变化不能占用轮次，最多两轮，不自动调用 Codex。
5. 最终提供可点击验证链接与启动命令；`AUTO_COMPLETE` 不等于 `USER_ACCEPTED`。
