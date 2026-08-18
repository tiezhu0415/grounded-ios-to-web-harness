---
name: ios-web-harness
description: Migrate or verify either a complete iOS App or one named feature. Full-app work starts from an automatically generated source-view inventory, builds the integrated mobile shell and navigation first, then verifies coverage, behavior, and selected visual states without intermediate user gates.
---

# iOS→Web 轻量 Harness

## 先判断范围

读取 `AGENTS.md`、`docs/项目技术方案.md`、当前项目蓝图和 `.planning/HANDOFF.md`。

- 用户说“整个项目/整个 App”：执行 `./harness prepare --project <project-id>`。
- 用户只说某个功能：执行 `./harness capture --project <project-id> --feature <feature-id>`。

用户不需要重复说明 codebase-memory、组件映射、Assets 或禁止重设计等内部规则。

## 整个 App

1. 使用 `prepare` 返回的唯一 full-app run；不要为每个模块创建一套项目或用单功能 Run 宣称整项目完成。
2. `项目覆盖.json` 来自 iOS `Views` 自动扫描。用 codebase-memory-mcp 补充导航、依赖和业务关系，但不得删除不想实现的源页面。
3. 编写业务页面前先完成：统一手机 App Shell、原生顶层导航、全部页面路由、共享状态/数据层。
4. 按覆盖清单逐项实现。只需为源 screen 填写 `IMPLEMENTED`、Web 文件、路由和行为测试；supporting components 只供分析参考，不逐项维护状态。
5. 外部服务不可用时可以记录真实限制，但该页面保持 `EXCLUDED` 或 `PENDING`，整个 App 仍是未完成。
6. 为页面和关键按钮编写真实 Playwright 测试；`No tests found` 是失败。
7. 对关键视觉状态使用下面的单功能视觉流程精修。
8. 最终执行：

```bash
./harness check --project <project-id> --run-id <full-app-run-id> --mode app
```

只有返回 `APP_COMPLETE` 才能向用户报告整个项目完成。

## 单功能视觉流程

1. 用 codebase-memory-mcp 查找入口、所有子组件、ViewModel/Model/Service、导航和 Assets。
2. 把源码事实写入 run 的 `组件映射.md`，替换三个 pending 标记后执行 `check --mode mapping`。
3. 运行 iOS 功能，保存与 Web 相同数据、状态、资源结果和画布的 `ios-<state>.png`。
4. 按源码与 Assets 实现；截图只确认动态状态，不允许凭截图自行重新设计。
5. 使用 `webshot` 和 `compare` 生成 Pixelmatch + SSIM 报告，按最大差异区域最多精修两轮。
6. 执行 `check --mode complete`。它只产生 `FEATURE_EVIDENCE_COMPLETE`，不能代表整个 App 完成。

## 限制

- 用户只在开始指定范围、结束查看结果；不增加中间审批。
- 不虚构登录、支付、Firebase 或 Stripe 成功。
- 不创建第二份蓝图或新的治理文档。
- 不建设通用 Runner、语义 Analyzer、复杂 Gate、Schema、数据库或 Agent 平台。
- 不调用 Codex 审查，除非用户要求或同一问题两轮仍失败。
