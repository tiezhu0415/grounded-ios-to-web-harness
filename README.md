# iOS→Web 轻量 Harness

目标：让 AI 从任意 iOS App 的源码、Assets 和真实运行页面出发，生成完整、连贯、手机尺寸的 WebApp。

## 用户怎么用

只需说：

```text
把 <project-id> 整个项目迁移成 WebApp。
```

Harness 内部流程：

```text
扫描源码页面和状态分支
→ codebase-memory 从 App 入口追踪导航页面
→ Claude 生成当前 App 的 Maestro Flow
→ Maestro 逐页点击 iOS 并截图
→ 三方对账：源码、关系图、实际访问不能有遗漏
→ Claude 实现 WebApp
→ Playwright 执行同样状态并截图
→ Pixelmatch + SSIM 逐页对比和精修
→ 用户打开链接验收
```

Harness 不写死业务功能。Claude 负责理解每个 App，Maestro、Playwright 和视觉比较器负责可重复执行与留证。

## 当前 ecommerce-main

| 项目 | 状态 |
| --- | --- |
| 旧实验 | 已移出仓库，不作为新迁移输入 |
| 新 WebApp | 尚未生成 |
| 新 full-app Run | 尚未创建 |
| 最终状态 | `NOT_STARTED` |

## 只看这些

- [技术方案](docs/项目技术方案.md)
- [项目与功能清单](docs/项目清单.md)
- [WebApp 查看清单](docs/WebApp查看清单.md)
