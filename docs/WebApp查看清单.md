# WebApp 查看清单

| 项目 | 当前内容 | 验证链接 | 如何启动 | 状态 |
| --- | --- | --- | --- | --- |
| [eCommerce-main](项目/ecommerce-main/项目蓝图.md) | 完整 iOS App 候选：20 屏、43 状态、5 条跨页行为路径；10 个视觉状态（含购物车/收藏的空和有数据） | [打开 WebApp](http://localhost:5180/) · [result.json](../.runs/ecommerce-main/20260822-104706-full-app/result.json) · [视觉报告](../.runs/ecommerce-main/20260822-104706-full-app/visual) | `cd webapps/ecommerce-main && npm install && npm run dev -- --host 127.0.0.1 --port 5180 --strictPort` | `NEEDS_REVISION`：35/35 功能测试通过、430px 手机壳通过；首页视觉仍建议检查 |

只有自动检查返回 `AUTO_COMPLETE` 后才登记为“等待用户验收”；只有用户确认后才写 `USER_ACCEPTED`。`NEEDS_REVISION` 的链接仍可用于查看当前候选，但不能宣称已完成。
