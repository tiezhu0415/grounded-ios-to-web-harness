# WebApps 目录规则

本目录保存 Harness 生成的 WebApp。一级目录必须对应一个源 iOS App，不按单次聊天或单个功能复制整套项目。

```text
webapps/
├── ecommerce-main/   # 来源：xcode/eCommerce-main
├── shop-app/         # 来源：xcode/shopApp（示例）
└── <project-id>/
```

## 所有 LLM 必须遵守

1. 新源 App 使用独立目录 `webapps/<project-id>/`；
2. 每个项目独立维护 `package.json`、源码、构建配置和 Playwright 测试；
3. 同一源 App 的多个功能保留在同一个项目内，以独立 URL 和测试文件区分；
4. `harness.yaml` 的 `web.path` 指向当前项目目录；
5. 完成功能后更新 `docs/WebApp查看清单.md`，每次迁移成果单独一行；
6. 不得创建新的根目录 `webapp/`，不得把不同源 App 混放在同一项目。
7. 对应蓝图必须位于 `docs/项目/<project-id>/项目蓝图.md`，并登记到 `docs/项目清单.md`。

当前项目 `ecommerce-main` 的直接验证地址：

- 商品列表：`http://localhost:5173/store`
- 商品详情：`http://localhost:5173/products/10000`
