# iOS→Web Harness MVP

这是一个计划在 1～2 天内验证价值的轻量 iOS→Web Harness。

它不追求一次迁移完整 App，也不建设通用 Agent 平台。首个目标是：选择一个真实、可运行的 iOS 项目，把其中一个小功能迁移为 Web，并完成自动验证和人工验收。

## 项目负责人入口

请从以下文档开始：

1. [项目总览](docs/项目负责人/项目总览.md)
2. [两天实施计划](docs/项目负责人/两天实施计划.md)
3. [源项目蓝图](docs/项目负责人/源项目蓝图.md)
4. [Web迁移计划](docs/项目负责人/Web迁移计划.md)
5. [WebApp查看清单](docs/项目负责人/WebApp查看清单.md)
6. [最终验收报告](docs/项目负责人/最终验收报告.md)

## 当前状态

| 项目 | 状态 |
| --- | --- |
| 方案 | `APPROVED — CONTINUE` |
| Harness 工作方法 | `SMOKE_VERIFIED — ONE PROJECT` |
| 源 iOS 项目 | `eCommerce-main`，已建立本地 Git 输入身份并启动；登录后 Store/分类/商品列表已验证 |
| WebApp | 商品列表与分类筛选已实现；手机优先布局已验证 |
| 自动验证 | 移动端 Playwright 7/7 通过；iOS 目标功能运行复验已完成 |
| 下一步 | 准备第二项目通用性验证 |

AI 执行者应先阅读 [Authority](docs/00-authority.md)、`CLAUDE.md` 和 `.planning/HANDOFF.md`。

## 通用 Harness 与示例

`harness.example.yaml`、Authority、planning 和 handoff 规则属于通用 Harness。`xcode/eCommerce-main`、`webapp/` 和当前项目负责人文档是首个 eCommerce 示例产物，不代表 Harness 针对商品功能写死。当前只验证过一个项目，跨项目通用性尚未证明。
