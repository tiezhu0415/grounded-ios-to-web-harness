# iOS→Web 轻量 Harness

目标：让 AI 从 iOS 源码、Assets 和运行状态出发，生成一个完整、连贯、手机尺寸的 WebApp。

## 当前实验

| 项目 | 状态 |
| --- | --- |
| iOS 源项目 | `xcode/eCommerce-main`，已固定在 commit `4863146` |
| WebApp | 不存在，等待从零生成 |
| 分支 | `codex/ecommerce-cleanroom-v2` |
| Full-app Run | `.runs/ecommerce-main/20260818-cleanroom-full-app` |

## 怎么用

用户只需说：

```text
把 ecommerce-main 整个项目迁移成 WebApp。
```

AI 自动执行：

```text
读取项目覆盖清单
→ 用 codebase-memory 确认页面、导航、依赖和 Assets
→ 建立手机 App Shell、全局导航和路由
→ 按源码逐页实现
→ Playwright 验证行为
→ 关键页面做 iOS/Web 视觉对比
→ 用户打开链接验收
```

最终只有下面命令返回 `APP_COMPLETE` 才能称为整项目完成：

```bash
./harness check --project ecommerce-main --run-id 20260818-cleanroom-full-app --mode app
```

## 只看这些

- [技术方案](docs/项目技术方案.md)
- [项目与功能清单](docs/项目清单.md)
- [WebApp 查看清单](docs/WebApp查看清单.md)
