# iOS→Web 轻量 Harness

目标：把任意 iOS App 迁移成一个完整、可操作、手机尺寸的 WebApp，同时让 Claude 自由实现、让源码事实可核对。

## 用户怎么用

只需说：`把 <project-id> 整个项目迁移成 WebApp。`

```text
静态扫描 + codebase-memory + 必要的真实运行
→ 锁定 Screen / State / Flow / Data / Asset 事实
→ 每屏生成小型事实切片；关键状态先提取截图文字框、颜色、尺寸和原始 Assets
→ Claude 自主完成一版 WebApp
→ 所有页面和状态做基础渲染检查
→ 核心流程做行为测试
→ 关键页面及关键空/有数据状态做 Pixelmatch + SSIM 对比
→ AUTO_COMPLETE 或 NEEDS_REVISION
→ 用户打开链接决定是否接受
```

Harness 不写死业务，也不规定 React 写法。它只防止漏页面/状态、假数据、占位图、截图伪实现、陈旧服务证据和没有交互却声称完成。检查时使用独占临时端口，桌面浏览器中的所有页面与固定导航也必须被限制在手机壳内。

Claude 不再把整仓库资料一次塞进上下文：`context` 会按 Screen 生成与事实锁绑定的小文件，事实或关键视觉计划一变就自动失效。关键 iOS 截图在首版编码前生成轻量视觉依据；实现仍由 Claude 自主决定。首版单独留档，之后最多记录两轮证据驱动精修，避免 review—修复无限循环。

| 状态 | 含义 |
| --- | --- |
| `AUTO_COMPLETE` | 自动覆盖、真实性、行为与关键视觉证据齐全 |
| `USER_ACCEPTED` | 用户实际打开并接受结果 |
| `NEEDS_REVISION` | 仍有事实、页面、行为或视觉缺口 |

当前 ecommerce-main 候选是上一轮 SIMPLIFY v2 证据，状态仍为 `NEEDS_REVISION`；它不代表新增“生成前视觉依据 + 事实切片”流程已经完成真实项目验证。新流程需用 fresh Run 重跑后再判断效果。

- [技术方案](docs/项目技术方案.md)
- [项目与功能清单](docs/项目清单.md)
- [WebApp 查看清单](docs/WebApp查看清单.md)
