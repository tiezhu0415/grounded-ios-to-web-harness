---
name: ios-web-harness
description: Migrate or verify any iOS App by deriving its screens and runtime states from source, generating project-specific Maestro and Playwright flows, and requiring matched per-screen visual evidence without hard-coded business prompts.
---

# iOS→Web 轻量 Harness

## 通用边界

Harness 只规定流程和证据格式，不知道某个 App 有什么业务功能。

Claude 必须使用 codebase-memory-mcp 和 iOS 运行结果，为当前 App 推导：

- 真实页面与入口；
- 导航路径与交互；
- 需要对比的页面状态；
- Maestro 点击流程；
- Playwright 对应流程。

不要要求用户重复说明这些内部步骤。

## 整个 App

1. 若已有 full-app Run，使用它；否则执行 `./harness prepare --project <project-id>`。
2. 读取 `项目覆盖.json` 和 `visual-matrix.json`。
3. 用 codebase-memory-mcp 从 App 入口追踪导航目标，区分真实页面、App Shell 和支持组件，确认路由、数据和 Assets。
4. 将关系图结果写回 `项目覆盖.json`：
   - `graph_discovery` 标记 `COMPLETE`，记录入口、全部目标和查询证据；
   - 每个页面的 `discovery.graph` 标记 `CONFIRMED`，记录入口和关系证据；
   - 关系图发现但扫描清单缺少的真实页面，补入 `screens` 和 `visual-matrix.json`，不要静默忽略。
5. 处理 `state_candidates`：每个源码分支标记为 `MAPPED` 并填写页面/视觉状态，或标记 `NOT_USER_VISIBLE` 并写明理由。
6. 根据当前 App 编辑 `visual-matrix.json`：每个可见页面至少一个必需状态；明显的空/有数据、成功/错误、登录/未登录状态要分开，并在 `source_evidence` 引用对应 candidate id。
7. 为每个状态创建 `flows/ios/<state-id>.yaml`。优先通过登录、点击、输入等真实交互到达；外部数据不稳定时可使用仅 DEBUG 生效的 fixture。
8. 每个 Maestro Flow 必须保存对应 `ios/<state-id>.png`，并可由以下命令重复执行：

```bash
./harness ios-run --project <project-id> --run-id <run-id>
```

9. 运行三方对账；未通过时先补页面、状态或 Flow，不得开始宣称迁移完整：

```bash
./harness reconcile --project <project-id> --run-id <run-id>
```

10. 建立统一手机 App Shell、全局导航、路由与共享状态，再按覆盖清单实现页面。
11. 为每个视觉状态在 Playwright 中创建唯一测试 ID，执行与 iOS 相同的数据和操作，保存 `web/<state-id>.png`。`visual-matrix.json` 中的 `web_test` 使用 `relative-file#unique-test-id`。
12. 执行批量对比：

```bash
./harness visual-check --project <project-id> --run-id <run-id>
```

13. 根据 comparison 图和最高差异区域精修，最多两轮。不得用修改阈值或删除必需状态的方式绕过。
14. 最后执行 `check --mode app`；缺少三方对账、任何页面、Flow、双端截图、唯一 Web 测试或视觉报告都不得返回 `APP_COMPLETE`。

## 实现自由

以下由 Claude 自主决定：React 组件拆分、CSS 组织、状态管理、数据层、实现顺序与修复方法。

以下不允许自行改写：用户可见内容、原 Assets/字体/颜色、页面层级、核心交互与 iOS 实际状态。

## 限制

- 不写死任何项目名、页面名、按钮名或业务流程；
- 不使用一张登录图代替全 App 的视觉证据；
- 不伪造 Firebase、Stripe 或其他外部服务成功；
- 不增加治理文档或调用 Codex，除非用户明确要求。
