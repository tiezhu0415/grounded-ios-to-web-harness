# 所有 AI 工作规则

1. 先读 `README.md`、`docs/项目技术方案.md`、当前项目蓝图和 `.planning/HANDOFF.md`。
2. 整个 App 使用一个 `webapps/<project-id>/` 和一个 full-app Run；不拼接多个功能项目。
3. `prepare` 只建立通用覆盖、行为旅程和代表视觉清单，不要求编码前完成全部截图。
4. Claude 先用源码、Assets 和 codebase-memory 理解 App，自主完成一个连贯、真实可操作的 WebApp；Harness 不规定 React 架构、实现顺序或 CSS 写法。
5. 第一版可运行后再对账：源码页面、关系图目标和 Web 路由必须一致。遗漏页面只补缺口，不推翻整体实现。
6. Playwright 必须验证少量核心“操作→结果”旅程，并至少覆盖一个跨页面状态流；只 `goto`、查文字或截图不算行为测试。
7. Maestro 和 Pixelmatch + SSIM 只用于代表页面和关键状态精修，不再要求每个页面先截图才能编码。
8. 禁止把 iOS 运行截图作为 Web 页面、背景或遮罩；禁止用不可见 DOM 文案冒充功能。iOS 源 Assets 可以直接复用。
9. iOS 与 Web 的核心旅程和代表视觉状态使用相同确定数据。外部服务不可用时只能使用明确的 DEBUG fixture/mock，不得虚构联网成功。
10. 行为和视觉问题最多修复两轮；之后停止并向用户报告剩余差异。不得自动调用 Codex 形成 review—修复循环。
11. `APP_COMPLETE` 必须同时通过页面覆盖、build、lint、Playwright、手机外壳、实现真实性、核心行为、代表视觉，并提供验证链接。
12. 用户只参与两次：开始指定迁移范围，结束打开链接决定继续、调整或停止。
13. 只维护现有技术方案、项目清单、项目蓝图、WebApp 查看清单和 Handoff；不增加重复治理文档。
