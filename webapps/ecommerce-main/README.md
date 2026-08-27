# ecommerce-main WebApp reference

由 `Grounded iOS-to-Web Harness` 生成并验证的手机 WebApp 参考实现。

## 运行

```bash
npm install
npm run dev
```

打开 [http://localhost:5173](http://localhost:5173)。页面在桌面浏览器中保持手机宽度，不会扩展成桌面站点。

## 验证

```bash
npm run build
npm run lint
npm test
```

实现包含认证、首页、商店与分类、商品列表、商品详情、收藏、购物车、Checkout、个人资料、地址和订单等路由。测试覆盖基础渲染、关键同状态截图和三条跨页面核心旅程。

参考迁移的公开证据见 [`../../docs/evidence/ecommerce-main/`](../../docs/evidence/ecommerce-main/README.md)。源 iOS 工程不属于本仓库。
