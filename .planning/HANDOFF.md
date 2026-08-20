# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-cleanroom-v2` |
| 新 Harness commit | `c8748c7` — Claude 主导、事后轻量验收 |
| iOS 输入 | `xcode/eCommerce-main`，分支 `main`，commit `4863146` |
| WebApp | 当前不存在；必须从零建立 `webapps/ecommerce-main` |
| Full-app Run | `.runs/ecommerce-main/20260820-103708-full-app` |
| 当前状态 | `BUILD_PENDING` |
| 旧实验 | 已移出仓库，不得作为实现输入 |

## 本轮执行顺序

1. 读取源码、Assets、项目蓝图和新 Run；使用 codebase-memory 从 App 入口追踪页面、导航和依赖。
2. Claude 自主完成一个统一、真实可操作的 React WebApp。先形成完整整体，不要在编码前逐页截图。
3. 第一版可运行后，补全 `项目覆盖.json`，运行页面与路由对账。
4. 在 `behavior-journeys.json` 写入核心“操作→结果”旅程，至少一个跨路由，并用 Playwright 实际执行。
5. 选择至少三个代表页面，再使用 Maestro、Pixelmatch + SSIM 精修视觉。
6. 行为或视觉最多修复两轮，不降低检查、不使用 iOS 运行截图背景、不调用 Codex 循环。
7. 运行 `./harness check --project ecommerce-main --run-id 20260820-103708-full-app --mode app`。
8. 只有返回 `APP_COMPLETE` 后，更新项目蓝图、项目清单、WebApp 查看清单和本 Handoff，并给用户验证链接。
