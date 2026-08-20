# WebApps 目录

一个 iOS App 只对应一个集成 WebApp：

```text
webapps/<project-id>/
```

同一项目的页面和功能必须共享手机 App Shell、全局导航、数据层和 Playwright 测试，不按功能复制项目。

WebApp 必须由真实 React/HTML/CSS 和状态逻辑组成。iOS 源 Assets 可以复用，但不得把 Maestro/iOS 运行截图作为页面背景，也不得用不可见 DOM 文案让测试误判成功。完成后在 `docs/WebApp查看清单.md` 只登记一个最终入口。
