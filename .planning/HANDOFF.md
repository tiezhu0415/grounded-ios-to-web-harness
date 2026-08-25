# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-grounded-rerun` |
| Harness 基线 | `f0aa2ab`：每屏事实切片、生成前视觉依据、首版与最多两轮修复记录 |
| iOS 输入 | `xcode/eCommerce-main`；保留现状，未在清理中修改 |
| WebApp | 不存在，等待 Claude 从零生成 `webapps/ecommerce-main/` |
| full-app Run | 不存在，等待 `./harness prepare --project ecommerce-main` 创建 |
| 自动测试 | Harness 单元与反例测试 31/31 通过 |
| 当前状态 | `READY_FOR_FRESH_RUN` |

## 本轮执行规则

1. 顺序固定为 `prepare → 事实发现/ios-run → facts-lock → context → Claude 首版 → checkpoint first-pass → 自动检查`。
2. 编码某屏时读取对应的 `contexts/*.json` 和 `visual-grounding/*.json`；不得使用旧实验结果。
3. 状态型核心页面同时准备空/有数据状态；所有 Screen+State 做基础渲染，核心流程做行为检查，Critical Visual Set 做 VRT。
4. 失败后只根据当前 Run 证据修复并记录 `checkpoint repair`；最多两轮，不自动调用 Codex。
5. 最终提供可点击验证链接与启动命令；`AUTO_COMPLETE` 不等于 `USER_ACCEPTED`。
