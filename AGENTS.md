# 所有 AI 工作规则

1. 先读取 `README.md`、`docs/项目技术方案.md`、当前项目的 `项目蓝图.md` 和 `.planning/HANDOFF.md`。
2. 用户要求迁移整个 App 时，先运行 `./harness prepare --project <project-id>`；用户只要求单功能时，运行 `./harness capture --project <project-id> --feature <feature-id>`。
3. 全项目任务必须先建立统一手机 App Shell、原生全局导航和全部路由，再逐项迁移；不得先做一批孤立页面后宣称完成。
4. `prepare` 自动从 iOS `Views` 生成 `项目覆盖.json`。每个源页面必须有 Web 路由、实现文件和行为测试；源页面被 `EXCLUDED` 或 `PENDING` 时，整个 App 不得称为完成。
5. 编码前用 codebase-memory-mcp 定位页面、子组件、依赖、导航和 Assets。源码与 Assets 决定“应该是什么”，运行截图检查“做出来像不像”。
6. 三项事实不可改写：用户可见内容与功能、原 Assets/字体/颜色、页面层级与核心交互。React 实现方式可自主选择，不得自行 Web 化重设计。
7. 全项目只使用一个 `webapps/<project-id>/` 和一个 full-app run；关键视觉状态可继续使用 `capture`、`webshot`、`compare` 精修。
8. `check --mode complete` 只代表一个功能的证据齐全，状态为 `FEATURE_EVIDENCE_COMPLETE`；只有 `check --mode app` 可以产生 `APP_COMPLETE`。
9. `check --mode app` 必须同时通过源码覆盖、build、lint、Playwright 和桌面浏览器中的手机容器/全局导航检查。
10. Pixelmatch 与 SSIM 只帮助定位视觉差异，不代表功能完整，也不设置自动发布阈值。
11. 不同源 App 分别使用 `xcode/<project-id>/`、`webapps/<project-id>/`、`docs/项目/<project-id>/` 和 `.runs/<project-id>/`。
12. 文档只维护现有的技术方案、项目清单、项目蓝图、WebApp查看清单和 Handoff；不得增加重复治理文档。
13. 用户只参与两次：开始时指定范围，结束时查看结果。两轮仍失败或遇到敏感/付费外部条件时再询问。
14. 不建设自研语义 Analyzer、通用 Runner、复杂 Gate、Schema、数据库或 Agent 平台，不提交密钥、本机配置和生成缓存。
