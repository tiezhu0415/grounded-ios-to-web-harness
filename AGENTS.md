# 所有 AI 工作规则

1. 先读 `README.md`、`docs/项目技术方案.md`、当前项目蓝图和 `.planning/HANDOFF.md`。
2. 整个 App 只使用一个 `webapps/<project-id>/` 和一个 full-app Run；Harness 不写死项目、页面或业务功能。
3. 编码前用静态扫描、codebase-memory 和必要的 iOS 运行证据整理 `Screen + State + Action + Navigation + Flow + Data + Asset`；Claude 可以整理事实，但不得创造事实。每个页面必须明确呈现方式、所属 Tab、TabBar 可见性和进入/退出效果。
4. 每条重要事实必须有 `source`、`evidence` 和 `confidence`。Data / Asset 来源写入 `truth-map.json`；Critical Visual Set 的 iOS 与 Web 必须在 `state-snapshots.json` 绑定同一用户、数据、选中项和页面状态。完成后执行 `facts-lock`，再执行 `context`。
5. 编码某屏时优先读取本 Run 对应的 `contexts/*.json` 和 `visual-grounding/*.json`，不要让陈旧整仓资料反复占据上下文。锁定后 Claude 仍自主决定 React 架构、组件、状态管理和 CSS。新证据需要改范围时用有记录的 `facts-lock --revise` 并重新生成 context，不得静默删减。
6. 所有用户可见 `Screen + State` 都要有路由和基础 Playwright 渲染检查：能打开、非空、关键内容存在、图片可加载、无严重 console/page error。
7. 少量核心旅程再做 Playwright 行为验证；每个真实交互步骤必须引用锁定的 `ACTION` 事实及确认的状态快照，测试预期不得由 Web 实现反推。只 `goto`、查文字或截图不算行为测试。
8. 只有锁定的 Critical Visual Set 使用 Maestro + 生成前视觉依据 + Pixelmatch + SSIM；状态型核心页面同时覆盖空和有数据。完成自由首版后记录 `first-pass` checkpoint；每轮 `repair` 必须引用本 Run 的失败证据且 Web 内容哈希发生变化，否则不计入修复轮次。最多两轮，v0.x 指标用于分流而非永久统一阈值。
9. 禁止把 iOS 截图当 Web 页面、背景或遮罩；禁止占位图片、测试数据、不可见 DOM 或无来源资源冒充真实迁移。
10. 自动检查必须启动当前工作区的独占服务并生成本 Run 新截图，禁止复用旧端口、旧服务和旧视觉证据。所有固定页面、弹层和导航在桌面浏览器中也不得越出手机壳。
11. `AUTO_COMPLETE` 只表示自动规则通过；最终仍是 `USER_ACCEPTED`。AI 必须提供验证链接，不能自行宣称用户已验收。
12. 不自动调用 Codex，不形成 review—修复循环。只有用户明确要求时才审查。
13. 只维护现有技术方案、项目清单、项目蓝图、WebApp 查看清单和 Handoff；不新增重复治理文档。
