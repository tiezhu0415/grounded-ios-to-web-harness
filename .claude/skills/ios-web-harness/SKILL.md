---
name: ios-web-harness
description: Migrate a whole iOS app to one coherent WebApp using current per-screen fact slices and pre-generation visual grounding, while leaving React implementation choices to Claude and limiting repair to two evidence-driven rounds.
---

# iOS→Web Harness（SIMPLIFY v2）

## 工作流

1. 读取 `AGENTS.md`、技术方案、项目蓝图和 Handoff。
2. 没有 full-app Run 时执行 `./harness prepare --project <project-id>`。
3. 完成事实发现：静态扫描给出候选页面和状态；codebase-memory 从 App 入口确认导航、依赖和遗漏；真实运行只补充静态代码无法确认的状态；Claude 只负责整理，不得猜数据、资源或页面。
4. 补全 `项目覆盖.json` 的 Screen+State、`source-facts.json` 的证据与可信度、`truth-map.json` 的数据/资源来源。
5. 在 `visual-matrix.json` 选择至少策略要求数量的关键页面：设 `critical: true`、填写通用风险 `selection_reason`，并把需比较状态设 `required: true`。状态型核心页面同时覆盖空和有数据，不得用多个相同路由凑数量。
6. Data / Asset 来源先写入 `truth-map.json`，用 `ios-run` 采集 Critical Visual Set 并完成运行事实，再执行 `facts-lock` 和 `./harness context --project <project-id> --run-id <run-id>`。它会生成每屏小型事实切片以及截图 OCR、主色、尺寸和 Asset 引用；旧事实锁或被替换的截图不能复用。
7. 实现某屏前读对应 `contexts/*.json`；自主实现一个统一的 `webapps/<project-id>/`。React 架构、组件、路由库和状态管理由 Claude 决定，视觉依据不能变成截图背景。
8. 所有 Screen+State 都写基础 Playwright 渲染测试；少量核心跨页流程写入 `behavior-journeys.json`。
9. 自由首版完成后执行 `checkpoint --stage first-pass`。只为 Critical Visual Set 建立 Maestro 与 Web 同状态截图，再运行 `visual-check`。检查必须使用当前工作区的独占服务和本 Run 新截图；不得复用旧服务或 baseline。Pixelmatch/SSIM 是实验指标，不靠降低阈值“过关”。每次证据驱动修复后执行 `checkpoint --stage repair`；最多两轮，然后停止汇报。
10. 最终运行 `./harness check --project <project-id> --run-id <run-id> --mode app`。
11. 检查桌面浏览器时，所有页面、弹层和 `position: fixed` 导航都必须留在手机壳边界内。出现 `REVIEW_RECOMMENDED` 时返回 `NEEDS_REVISION`，不得宣称完成。
12. `AUTO_COMPLETE` 后更新现有项目文档和验证链接，等待用户决定；不得自行写成 `USER_ACCEPTED`。

## 禁止

- iOS 截图背景、占位图、测试数据或隐藏 DOM 伪实现；
- 无证据增删事实；
- 自动 Codex 循环；
- 为单个项目写死页面名、按钮名或业务提示词。
