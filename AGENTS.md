# 所有 AI 工作规则

1. 先读取 `README.md`、`docs/项目技术方案.md`、`docs/项目清单.md`、当前项目的 `项目蓝图.md` 和 `.planning/HANDOFF.md`。
2. 采集或迁移任务必须先运行 `./harness capture --project <project-id> --feature <feature-id>`；所有证据使用命令返回的 run 目录。
3. 用户只需指定项目和功能；AI 必须自动触发 Harness，不要求用户重复 codebase-memory、组件映射或禁止重设计等内部规则。
4. 编码前必须用 codebase-memory-mcp 找到页面、子组件、依赖与 Assets；把可见文字/数据、组件关系、原始资源和 Web 对应项写入当前 run 的 `组件映射.md` 并通过检查。
5. 三项事实不可改写：用户可见内容与功能、原 Assets/字体/颜色、页面层级与核心交互。React 实现方式可由 AI 自主选择，但不得自行 Web 化重设计。
6. 编码前运行目标 iOS 功能；iOS 与 Web 必须使用同一数据、同一状态、同一资源加载结果和可对齐的画布采集证据。状态不一致时先重拍，不得把结果当作还原度。
7. 不同源 App 分别使用 `xcode/<project-id>/`、`webapps/<project-id>/`、`docs/项目/<project-id>/` 和 `.runs/<project-id>/`。
8. 每个项目只有一份用户和 AI 共用的 `项目蓝图.md`，不得复制第二份。
9. 每次迁移保存 `.runs/<project-id>/<run-id>/scope.md`、`组件映射.md`、iOS/Web 证据、视觉差异结果和 `result.json`。
10. Web 首版完成后，对组件映射表声明的每个状态运行 `./harness compare`。Pixelmatch 是主差异，SSIM 是辅助结构分数；按差异最大的区域局部精修，同一问题最多两轮，不能用 Playwright 通过代替视觉忠实度结论。
11. 完成功能后更新项目蓝图、`docs/项目清单.md`、`docs/WebApp查看清单.md` 和 `.planning/HANDOFF.md`。Codex 仅由用户要求或两轮失败后调用。
12. 不建设自研 Analyzer、通用 Runner、复杂 Gate、Schema、数据库或 Agent 平台。
13. 不提交密钥、本机配置、生成缓存和包含明文凭据的证据。
14. 视觉指标只帮助定位问题，不设置自动发布阈值，也不得要求用户增加中间审批。
