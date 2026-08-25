# AI Handoff

| 项目 | 当前事实 |
| --- | --- |
| 仓库 / 分支 | `iOS-WebApp-Harness-MVP` / `codex/ecommerce-cleanroom-v2` |
| iOS 输入 | `xcode/eCommerce-main`，commit `4863146` |
| 当前 full-app Run | `.runs/ecommerce-main/20260822-104706-full-app`，事实锁 v4 |
| 当前 Harness | 已加入通用“每屏事实切片 + 生成前视觉依据 + 首版/最多两轮修复记录”；单元/反例测试 30/30 通过 |
| 当前样例状态 | 既有 Run 仍为 `NEEDS_REVISION`：35/35 Playwright、430px 手机壳、5 条核心旅程和 10 个视觉状态；它早于新流程，不能作为新流程已验证的证据 |
| 未解决问题 | 需要 fresh full-app Run 验证新 context 是否改善 Claude 首版；既有 `home-loaded` 仍为 `REVIEW_RECOMMENDED`，本轮不手工修 WebApp |

## 后续执行规则

1. 新 Run 顺序固定为 `prepare → 事实发现/ios-run → facts-lock → context → Claude 首版 → checkpoint first-pass → 自动检查`。
2. Claude 编码某屏只读对应 context；状态型核心页面必须同时准备空/有数据状态。
3. 失败后依据报告修复并记录 `checkpoint repair`；最多两轮，不自动调用 Codex。
4. 新流程尚需 fresh Run 验证；不要用手工精修旧 WebApp 冒充 Harness 效果。
