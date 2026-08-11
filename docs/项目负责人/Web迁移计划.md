# Web迁移计划

> 当前状态：`WEB REVALIDATED / IOS RUNTIME REVALIDATION PENDING`
> 关联蓝图：`docs/项目负责人/源项目蓝图.md`
> 完成时间：2026-08-10
> 测试结果：移动端 Playwright 7/7 通过；`npm run lint` 和 `npm run build` 通过

## 迁移目标

| 项目 | 当前值 |
| --- | --- |
| 来源功能 | 商品列表 + 分类筛选（`StoreView` → `ProductsListView`） |
| Web 页面 | `/` 商品列表页；支持按 `Clothing / Shoes / Accessories` 及子分类筛选 |
| 验收标准 | 页面可启动；商品列表正常渲染；分类筛选可用；空状态与错误状态有截图/trace 证据；Playwright 测试通过 |

## 约束

- 只实现选中功能：商品列表与分类筛选。
- 不实现登录、搜索、商品详情、购物车、收藏、支付、用户相关功能。
- 不创建通用平台、Runner、Gate、Schema、数据库或 Agent routing。
- 使用本地 `ProductDatabase` 数据，不依赖 Firebase。
- WebApp 路径：`./webapp`。

## 最小任务（共 9 项）

| 编号 | 任务 | 验收方式 | 状态 |
| --- | --- | --- | --- |
| W01 | 初始化 React + TypeScript + Vite 项目于 `webapp/`，安装必要依赖（React、TypeScript、Vite、Playwright） | `npm install` 成功；`vite` 可启动 | `DONE` |
| W02 | 将 `ProductDatabase.swift` 中的商品数据提取为 `webapp/src/data/products.ts`（含 `Product` 类型定义） | 类型检查通过；数据条数与源数据库一致（144 条） | `DONE` |
| W03 | 实现 `src/services/productService.ts`：支持按 `category` / `subCategory` 过滤、分页（每页 10 条）、折扣/NEW IN 标签查询 | Playwright 测试验证过滤结果正确 | `DONE` |
| W04 | 实现 `src/components/ProductCard.tsx`：展示商品首图、名称、品牌、价格、折扣/NEW IN 标签 | 视觉与源 `ProductCellView` 一致 | `DONE` |
| W05 | 实现 `src/components/CategoryFilter.tsx`：展示 `All / Clothing / Shoes / Accessories` 及子分类选项 | 点击后更新筛选条件 | `DONE` |
| W06 | 实现 `src/App.tsx` 商品列表页：组合筛选器与产品卡片列表，支持滚动加载更多 | 正常状态可滚动加载；空状态显示无结果 | `DONE` |
| W07 | 添加空状态和错误状态 UI（无匹配商品、数据加载失败） | Playwright 截图证明两种状态 | `DONE` |
| W08 | 配置移动端 Playwright 并编写 E2E 测试：页面启动、正常列表、分类筛选、标签、空状态、错误状态 | `npx playwright test` 全部通过 | `DONE — 7/7` |
| W09 | 运行 Playwright，保存测试报告、截图和 trace 到 `webapp/test-results/` 和 `.runs/2026-08-10/` | 报告文件存在且核心路径通过 | `DONE` |

## 排除项

| 功能 | 排除理由 |
| --- | --- |
| 搜索 | 源 App 中 `StoreView.searchable` 的 `searchText` 未实际使用；Web 搜索 UI 和过滤逻辑已移除 |
| 商品详情页 | 超出本轮最小范围；可后续扩展 |
| 收藏 / 购物车 / 支付 | 依赖 Firebase Auth 和用户状态 |
| 登录 / 注册 | 需要 Firebase Auth 和完整用户流程 |
| Firebase 实时同步 | Web 使用本地静态数据，不同步 |
| 用户资料 / 订单 | 依赖登录和后端 |

## 与人类文档的一致性

本计划直接对应 `源项目蓝图.md` 中「选中功能详细分析」的入口、文件、调用关系和状态，不维护两套冲突计划。若实现过程中发现范围过大，将优先删减 W07 之后的非核心任务并更新本文件。
