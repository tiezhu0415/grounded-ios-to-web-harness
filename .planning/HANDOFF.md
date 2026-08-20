# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-cleanroom-v2` |
| Harness 基线 | `36c9645` 之后正在改为 Claude 主导、事后轻量验收 |
| iOS 输入 | `xcode/eCommerce-main`，分支 `main`，commit `4863146` |
| 当前 WebApp | `webapps/ecommerce-main` 是未提交的静态视觉失败样本，不是交付结果 |
| 失败 Run | `.runs/ecommerce-main/20260818-145908-full-app`；旧规则错误返回过 `APP_COMPLETE` |
| 当前完成状态 | `NEEDS_RERUN_WITH_CLAUDE_FIRST_FLOW` |

## 已修正的 Harness

- Claude 先自主完成一个真实、连贯 WebApp；不再要求编码前逐页截图。
- 页面覆盖在第一版之后通过源码、codebase-memory 和 Web 路由对账。
- `behavior-journeys.json` 要求真实“操作→结果”和至少一个跨路由旅程。
- `visual-matrix.json` 只选择代表页面精修，不再逐页视觉阻断。
- 禁止 iOS 运行截图背景和不可见 DOM 伪实现。
- 行为或视觉最多修复两轮；不自动调用 Codex。

## 下一位 AI

1. 不要把当前静态失败样本描述为完成，也不要复用其中的 iOS 页面背景。
2. 在用户批准重跑后，先归档或清空当前 `webapps/ecommerce-main` 与失败 Run，再创建新 full-app Run。
3. 用源码、Assets 和 codebase-memory 理解 App，然后自主完成第一版真实 React WebApp。
4. 第一版可运行后再完成页面对账、核心行为旅程和三个以上代表页面视觉精修。
5. 最多修复两轮，运行 `check --mode app`，并在 `docs/WebApp查看清单.md` 填写实际验证链接。
