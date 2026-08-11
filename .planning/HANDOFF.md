# Current Handoff

| Field | Value |
| --- | --- |
| Repository | `iOS-WebApp-Harness-MVP` |
| Branch | `main` |
| Commit | Base `ef1664b`; current fixes are uncommitted |
| Current phase | Phase 5 — revalidation complete; user decision: `CONTINUE` |
| Authority | `2026-08-11.1` |
| Current goal | 完成一个最小、真实、可自动验证的 iOS→Web 功能闭环；进入第二项目通用性验证准备 |
| Completed | 首轮 MVP；Codex ADJUST 审查；Debug 登录预填、移动端布局、搜索移除、测试和治理修正；Claude 登录后 iOS Store 目标功能验证；Web 7/7 重新验证；用户批准 CONTINUE |
| Unresolved | 第二 iOS 项目来源与通用性验证执行 |
| Allowed next work | 提交当前 MVP 成果到本地分支；准备第二项目通用性验证计划；不执行第二项目实现 |
| Prohibited | 调用 Codex 主动审查；扩大范围迁移整个 App；推送任何远程仓库；在没有第二项目输入前开始实现 |

## 关键产物

| 产物 | 路径 | 说明 |
| --- | --- | --- |
| 源项目本地身份 | `xcode/eCommerce-main/.git` | commit `4863146`（在 `8792b0d` 基础上增加 DEBUG 预填凭证），未推送，未包含 GoogleService-Info.plist / xcuserdata |
| iOS 构建与启动证据 | `.runs/2026-08-10/source.json` | 构建命令、模拟器、启动截图、日志 |
| 源项目蓝图 | `docs/项目负责人/源项目蓝图.md` | 模块、功能、选中范围、UNVERIFIED 项 |
| Web 迁移计划 | `docs/项目负责人/Web迁移计划.md` | 9 项任务，全部完成 |
| React WebApp | `webapp/` | 商品列表 + 分类筛选；144 条本地数据；不依赖 Firebase |
| Playwright 测试结果 | `webapp/playwright-report/index.html` | 7/7 通过；含 trace |
| iOS 登录后目标功能验证记录 | `.runs/2026-08-11/ios-verification.json` | 登录方式、验证截图、观察结果 |
| Web 重新验证记录 | `.runs/2026-08-11/web-verification.json` | 7/7 Playwright 通过、截图路径 |

## 已验证事实

1. `eCommerce.xcodeproj` / `eCommerce` scheme 在 iPhone 17 Pro 模拟器上 `BUILD SUCCEEDED`。
2. App 正常启动，首屏为 Sign In（见 `.runs/2026-08-10/launch_screenshot.png`）。
3. 使用 DEBUG 预填账号在模拟器中完成登录，进入主界面并验证 Store 目标功能（见 `.runs/2026-08-11/ios_*.png`）。
4. Store 页面展示主分类 `Clothing / Shoes / Accessories`，子分类包含 `Dresses / T-Shirts / Shirts / Sweatshirts / Trousers / Jeans / Shorts / Skirts`。
5. 商品列表渲染正常，包含价格、`-30% / -40%` 折扣标签和 `New In` 标签。
6. 使用 `codebase-memory-mcp` 索引并分析了源项目结构。
7. 选中功能：商品列表 + 分类筛选（Store → ProductsListView），排除登录/搜索/详情/购物车/支付。
8. WebApp 使用 `ProductDatabase.swift` 的本地数据（`webapp/src/data/products.ts`，144 条）。
9. `npm run build` 成功；`npx playwright test` 7/7 通过。

## 已知限制与差异

- WebApp 未实现登录、搜索、商品详情、购物车、收藏、支付、用户资料、订单。
- 商品图片继续使用 Firebase Storage URL；若 URL 失效，图片占位符会显示为空白。
- 源 App 中 `StoreView.searchable` 的 `searchText` 未实际使用，Web 中搜索 UI 和过滤逻辑已移除。
- WebApp 未连接 Firestore，数据为静态本地数据。

## _instructions for the next Claude / Codex session

1. 读取 `docs/00-authority.md`、`.planning/HANDOFF.md` 和 `docs/项目负责人/第二项目通用性验证计划.md`。
2. 当前 MVP 已提交到本地分支；不要推送远程仓库。
3. 等待用户提供第二 iOS 项目输入，再开始通用性验证执行。
