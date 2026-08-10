# Current Handoff

| Field | Value |
| --- | --- |
| Repository | `iOS-WebApp-Harness-MVP` |
| Branch | `main` |
| Commit | `21b0d2a` |
| Current phase | Phase 5 完成 / 等待最终验收 |
| Authority | `2026-08-10.1-draft` |
| Current goal | 完成一个最小、真实、可自动验证的 iOS→Web 功能闭环 |
| Completed | 源项目本地身份建立；iOS App 构建启动；蓝图生成；功能选择；Web 实现；Playwright 验证 |
| Unresolved | 明早由用户触发 Codex 只读审查；用户最终验收决定（CONTINUE / ADJUST / STOP） |
| Allowed next work | 整理 `docs/项目负责人/最终验收报告.md`；等待用户触发 Codex 审查 |
| Prohibited | 调用 Codex 主动审查；扩大范围迁移整个 App；推送任何远程仓库 |

## 关键产物

| 产物 | 路径 | 说明 |
| --- | --- | --- |
| 源项目本地身份 | `xcode/eCommerce-main/.git` | commit `8792b0d`，未推送，未包含 GoogleService-Info.plist / xcuserdata |
| iOS 构建与启动证据 | `.runs/2026-08-10/source.json` | 构建命令、模拟器、启动截图、日志 |
| 源项目蓝图 | `docs/项目负责人/源项目蓝图.md` | 模块、功能、选中范围、UNVERIFIED 项 |
| Web 迁移计划 | `docs/项目负责人/Web迁移计划.md` | 9 项任务，全部完成 |
| React WebApp | `webapp/` | 商品列表 + 分类筛选；144 条本地数据；不依赖 Firebase |
| Playwright 测试结果 | `webapp/playwright-report/index.html` | 6/6 通过；含 trace |
| Web 状态截图 | `.runs/2026-08-10/web-*.png` | 正常 / 筛选 / 子分类 / 空 / 错误 五种状态 |

## 已验证事实

1. `eCommerce.xcodeproj` / `eCommerce` scheme 在 iPhone 17 Pro 模拟器上 `BUILD SUCCEEDED`。
2. App 正常启动，首屏为 Sign In（见 `.runs/2026-08-10/launch_screenshot.png`）。
3. 使用 `codebase-memory-mcp` 索引并分析了源项目结构。
4. 选中功能：商品列表 + 分类筛选（Store → ProductsListView），排除登录/搜索/详情/购物车/支付。
5. WebApp 使用 `ProductDatabase.swift` 的本地数据（`webapp/src/data/products.ts`，144 条）。
6. `npm run build` 成功；`npx playwright test` 6/6 通过。

## 已知限制与差异

- WebApp 未实现登录、搜索、商品详情、购物车、收藏、支付、用户资料、订单。
- 商品图片继续使用 Firebase Storage URL；若 URL 失效，图片占位符会显示为空白。
- 源 App 中 `StoreView.searchable` 的 `searchText` 未实际使用，Web 中虽然实现了搜索框，但不属于迁移目标，仅作为空状态触发手段。
- WebApp 未连接 Firestore，数据为静态本地数据。

## _instructions for the next Claude / Codex session

1. 读取 `docs/00-authority.md`、`.planning/HANDOFF.md` 和 `docs/项目负责人/项目总览.md`。
2. 如需继续，整理 `docs/项目负责人/最终验收报告.md`。
3. 明早由用户单独触发 Codex 进行只读审查；当前会话不要主动调用 Codex。
4. 不要扩大范围或迁移整个 App。
5. 不要推送任何远程仓库。
