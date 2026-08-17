# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-full-migration` |
| 当前目标 | 从零迁移 `eCommerce-main` 全项目，最终交付一个 WebApp |
| WebApp | `webapps/ecommerce-main/` 当前不存在，等待 AI 重建 |
| 安全基线 | 提交 `51bb4e9`；标签 `ecommerce-harness-mvp-baseline-20260817`；原分支 `mvp/ecommerce-product-list` |
| 保留内容 | Harness、iOS源码目录、项目蓝图和本机旧 `.runs` 证据均未删除；旧 run 仅作备份，不得作为本实验输入 |
| 验证规则 | 每个模块单独创建 run；源码与 Assets 定事实；运行截图定状态；Pixelmatch + SSIM 检查结果 |
| 用户参与 | 开始时授权全项目迁移，全部完成后查看一个最终链接；中间不增加审批 |

## 执行顺序

1. 读取 `AGENTS.md`、`docs/项目技术方案.md` 和项目蓝图；
2. 按认证、首页、商店、收藏、购物车、订单/个人资料逐模块执行；
3. 每个模块先运行 `./harness capture`，完成映射和源端证据后再写 Web；
4. 所有模块集成到同一个 `webapps/ecommerce-main/`，不得为每个功能创建独立 WebApp；
5. 每个映射状态执行视觉比较，同一问题最多精修两轮；
6. 最后统一运行 build、lint、Playwright并更新现有四份精简文档。

## 限制

- 不读取或复制标签中的旧 WebApp 实现；本实验验证从零迁移效果；
- 不复用旧 `.runs` 的组件映射或 Web 证据；每个模块必须创建新 run；
- 不虚构 Firebase、Stripe或其他外部服务成功；
- 不推送远程、不调用 Codex、不增加复杂 Gate或新治理文档；
- 全部完成前不要求用户逐模块审批。
