# WebApp 查看清单

| 项目 | 已实现功能 | 验证链接 | 如何启动服务 |
| --- | --- | --- | --- |
| [eCommerce-main](项目/ecommerce-main/项目蓝图.md)：分类与商品列表 | 原生四项分类入口、子分类导航、单列商品卡、原分类 Assets、分页、折扣和收藏；25/25 测试通过 | [打开 Store](http://localhost:5173/store) | `cd webapps/ecommerce-main`<br>`npm install`<br>`npm run dev` |
| [eCommerce-main](项目/ecommerce-main/项目蓝图.md)：购物车 | 空状态、商品列表行、数量增减、删除、金额汇总、Checkout 按钮；`empty` 0.019/SSIM 0.911，`populated` 0.128/SSIM 0.656；25/25 测试通过 | [打开购物车](http://localhost:5173/cart) | 使用同一个服务 |
| [eCommerce-main](项目/ecommerce-main/项目蓝图.md)：商品详情 | 功能测试通过；页面布局和加购控件待忠实度修正 | [打开商品详情](http://localhost:5173/products/10000) | 使用同一个服务 |
| [eCommerce-main](项目/ecommerce-main/项目蓝图.md)：个人资料 | 真实姓名/邮箱、空地址、OpenSans 和五项 Tab 已复验；25/25 测试通过 | [打开个人资料](http://localhost:5173/profile) | 使用同一个服务 |

> `http://localhost:5173` 是本地验证地址，必须先启动服务；它不是永久在线地址。

视觉复验采用同状态、同画布的 Pixelmatch 主差异和 SSIM 辅助分数；功能测试数量仍以各行记录为准。
