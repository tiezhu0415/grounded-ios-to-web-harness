# iOS→Web 轻量 Harness

目标：让 AI 从任意 iOS App 的源码、Assets 和真实运行页面出发，生成完整、连贯、手机尺寸的 WebApp。

## 用户怎么用

只需说：

```text
把 <project-id> 整个项目迁移成 WebApp。
```

Harness 内部流程：

```text
源码、Assets 和 codebase-memory 帮助 Claude 理解 App
→ Claude 自主完成第一版完整、可操作 WebApp
→ 源码页面、关系图和 Web 路由对账，补遗漏
→ Playwright 验证少量核心“操作→结果”旅程
→ Maestro + Pixelmatch + SSIM 精修代表页面
→ 最多两轮修复后停止
→ 用户打开链接验收
```

Harness 不写死业务功能，也不规定 Claude 怎么组织 React。它只防止漏页面、静态截图伪实现、没有真实交互却宣称完成。

## 当前 ecommerce-main

| 项目 | 状态 |
| --- | --- |
| 旧实验 | 已移出仓库，不作为新迁移输入 |
| 当前 WebApp | 尚未生成；等待 Claude 从零实现 |
| 当前 full-app Run | `20260820-103708-full-app` |
| 最终状态 | `BUILD_PENDING` |

## 只看这些

- [技术方案](docs/项目技术方案.md)
- [项目与功能清单](docs/项目清单.md)
- [WebApp 查看清单](docs/WebApp查看清单.md)
