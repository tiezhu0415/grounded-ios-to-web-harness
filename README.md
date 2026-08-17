# iOS→Web Harness

用户指定一个 iOS 功能，AI 自动运行源 App、读取源码、忠实实现 Web，并用同状态、同画布视觉差异做最多两轮精修，最后由用户打开链接查看结果。

## 我想了解或使用项目

1. [阅读总技术方案](docs/项目技术方案.md)
2. [选择项目和功能](docs/项目清单.md)
3. [查看已经实现的 WebApp](docs/WebApp查看清单.md)

当前项目：`eCommerce-main`。个人资料、Store 分类入口、子分类和单列商品列表已按源码、原始资源与同画布差异完成修正；商品详情仍等待同样流程精修。

## 开始一次任务

你只需要告诉 AI：

```text
迁移 ecommerce-main 的购物车功能。
```

AI 会自动调用 Harness、codebase-memory-mcp 和组件映射流程，不需要你重复提示内部步骤。

```bash
./harness capture --project ecommerce-main --feature product-detail
```

命令会创建唯一 run 目录。AI 必须把本次范围、源码与资源映射、iOS/Web 证据、视觉差异结果和 `result.json` 放在该目录，再执行 `./harness check`。这就是“正在使用 Harness”的可见证据。

首次使用视觉比较工具时，在仓库根目录执行一次 `npm install`。

内部固定流程：

```text
源码与 Assets 定事实 → 固定相同运行状态 → 生成 Web 首版 → 同画布截图 → Pixelmatch 主差异 + SSIM 辅助分数 → 最多两轮局部精修 → 用户验收
```

组件映射表中列出的每个状态都必须有比较报告。视觉分数只用于发现问题，不设置自动通过线，也不会增加用户审批步骤。

## AI 接手项目

先读取 `AGENTS.md`、当前项目的 `项目蓝图.md` 和 `.planning/HANDOFF.md`。

Claude Code 还必须读取项目 Skill：`.claude/skills/ios-web-harness/SKILL.md`。

项目目录规则：

```text
xcode/<project-id>/
webapps/<project-id>/
docs/项目/<project-id>/
.runs/<project-id>/<run-id>/
```
