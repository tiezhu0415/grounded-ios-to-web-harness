# 所有 AI 工作规则

1. 先读 `README.md`、`docs/项目技术方案.md`、当前项目蓝图和 `.planning/HANDOFF.md`。
2. 整个 App 使用一个 `webapps/<project-id>/` 和一个 full-app Run；不拼接多个功能项目。
3. `prepare` 会生成 `项目覆盖.json` 和 `visual-matrix.json`。这两份都是通用机器清单，不得写死某个 App 或功能。
4. 编码前使用 codebase-memory-mcp 从 App 入口追踪导航目标，并把结果写回 `项目覆盖.json`；脚本扫描、关系图和运行访问三份结果必须对账。
5. 源码中的条件、弹层和导航分支会进入 `state_candidates`；每项必须映射到视觉状态，或说明为什么不是用户可见状态。
6. Claude 根据当前 App 生成 Maestro Flow；Maestro 负责真正访问页面、建立状态并截图。Playwright 在 Web 中执行对应状态。
7. 每个真实可见页面至少要有一个对比状态；空/有数据、登录/未登录等明显不同的状态应分别记录。
8. iOS 与 Web 必须使用相同数据、页面状态和有效画布。优先用真实 UI 操作建立状态；外部服务不可用时只能用 DEBUG fixture/mock，不得虚构联网成功。
9. `./harness reconcile` 检查源码、codebase-memory 与 Maestro 是否互相一致；`visual-check` 再运行 Pixelmatch + SSIM。明显结构差异最多精修两轮。
10. `check --mode app` 必须同时通过三方对账、源码覆盖、build、lint、Playwright、手机外壳、逐页双端截图和视觉报告，否则不得称为 `APP_COMPLETE`。
11. 约束的是可见事实与验证证据；React 组件划分、CSS、状态管理和实现顺序由 AI 自主决定。
12. 用户只参与两次：开始指定范围，结束查看结果。两轮仍失败或遇到敏感/付费外部条件时再询问。
13. 只维护现有技术方案、项目清单、项目蓝图、WebApp查看清单和 Handoff；不增加重复治理文档。
