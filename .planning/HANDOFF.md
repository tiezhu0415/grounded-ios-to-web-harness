# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `mvp/ecommerce-product-list` |
| Git | 当前修改尚未提交 |
| 当前源项目 | `eCommerce-main` |
| WebApp | `webapps/ecommerce-main/` |
| 测试 | build、lint 通过；iPhone 17 Pro 内容画布 Playwright 25/25 通过 |
| 当前问题 | 商品详情仍未完成同画布精修；Shirts 原生证据抓取时远程商品图加载失败，因此其 changed ratio 不能单独当作还原度结论 |
| 已完成优化 | 购物车 `empty` 0.01919/SSIM 0.911，`populated` 0.128/SSIM 0.656；compare 已升级为 Pixelmatch 主差异 + SSIM 辅助分数；完整检查要求覆盖映射表全部状态；个人资料 `0.03701 / SSIM 0.77018`，Store 分类 `0.06968 / 0.88807`，Clothing 子分类 `0.03179 / 0.78023`；分类、商品列表和购物车已恢复原生结构与本地持久化 |
| 下一步 | 用户查看购物车；随后选择精修商品详情或迁移其他功能 |
| Harness 入口 | 用户只指定项目和功能；AI 自动执行 capture、codebase-memory、组件/资源映射、首版、视觉差异与最多两轮精修 |

## 接手顺序

1. 读 `AGENTS.md`；
2. 读 `docs/项目技术方案.md`；
3. 读 `docs/项目/ecommerce-main/项目蓝图.md`；
4. 用户指定功能后自动运行 `./harness capture`；
5. 用 codebase-memory-mcp 完成可见事实和组件/资源映射，通过 mapping 检查后再实现；
6. 确认数据、资源加载和页面状态一致，对映射表每个状态运行 `./harness compare`；以 Pixelmatch 定位差异、SSIM 辅助判断结构，最多精修两轮；
7. 中间不增加用户审批，完成后更新蓝图、项目清单、WebApp 查看清单和本文件。

## 当前限制

- 不推送远程仓库；
- 不自行 Web 化重设计；
- 不调用 Codex，除非用户要求或同一问题两轮失败；
- 不开始用户未指定的新功能。
- 不把 Pixelmatch 或 SSIM 设为自动发布 Gate；最终仍由用户打开链接验收。
