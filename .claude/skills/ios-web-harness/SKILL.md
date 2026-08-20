---
name: ios-web-harness
description: Let Claude lead a complete iOS-to-Web implementation, then use lightweight post-build coverage, behavior, and representative visual verification without project-specific prompts or automated review loops.
---

# iOS→Web 轻量 Harness

## 原则

Claude 决定如何实现；Harness 只检查结果是否完整、可操作、没有视觉伪实现。不要在第一版编码前把工作拆成大量截图门禁。

## 整个 App

1. 读取 `AGENTS.md`、技术方案、当前项目蓝图和 Handoff。
2. 若没有 full-app Run，执行：

```bash
./harness prepare --project <project-id>
```

3. 使用 codebase-memory 从 App 入口追踪页面、导航、依赖和 Assets，把结果写入 `项目覆盖.json`。这一步建立范围，不要求先跑完所有视觉状态。
4. 自主完成一个统一的 `webapps/<project-id>/`：手机 App Shell、全局导航、真实组件、共享状态和完整路由。优先形成可运行整体，再补细节。
5. 不得把 iOS/Maestro 截图作为 Web 页面、背景或遮罩；不得用不可见 DOM 文案欺骗测试。源项目 Assets 可以复用。
6. 第一版可运行后，把每个 iOS 页面映射到 Web 文件、路由和到达测试，处理源码状态候选：
   - 用核心旅程覆盖：`BEHAVIOR_COVERED`；
   - 用代表视觉覆盖：`MAPPED`；
   - 非用户可见：`NOT_USER_VISIBLE` 并说明理由。
7. 在 `behavior-journeys.json` 定义至少策略要求数量的核心旅程。每项包含源码依据、经过路由、真实操作、预期结果和唯一 Playwright test id；多页面 App 至少一个跨路由。
8. 运行：

```bash
./harness reconcile --project <project-id> --run-id <run-id>
./harness behavior-check --project <project-id> --run-id <run-id>
```

9. 只选择 `visual-matrix.json` 要求数量的代表页面，设 `representative: true` 并把需要比较的状态设 `required: true`。为这些状态建立 Maestro、Web 截图和视觉报告：

```bash
./harness ios-run --project <project-id> --run-id <run-id>
./harness visual-check --project <project-id> --run-id <run-id>
```

10. 行为或视觉失败时最多修复两轮，不降低阈值、不删除覆盖项、不调用 Codex 循环。
11. 最后运行：

```bash
./harness check --project <project-id> --run-id <run-id> --mode app
```

12. 只有返回 `APP_COMPLETE` 且 `docs/WebApp查看清单.md` 有可打开链接，才向用户报告完成。

## 实现自由

Claude 自由决定 React 组件、CSS、路由库、状态管理、数据层和开发顺序。Harness 不包含固定项目名、页面名、按钮名或业务流程。

## 停止条件

两轮修复仍未通过，或者遇到账号、付费、敏感外部服务时，停止并报告实际缺口，让用户决定继续、调整或停止。
