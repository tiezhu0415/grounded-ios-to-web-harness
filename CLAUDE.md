# Claude Code 入口

先读 `AGENTS.md`，迁移任务自动使用 `.claude/skills/ios-web-harness/SKILL.md`。

Claude 是实现主导者，但源码事实不是 Claude 自己猜的。先用静态扫描、codebase-memory 和必要的 iOS 运行证据完成事实包与 Critical Visual Set，并执行：

```bash
./harness ios-run --project <project-id> --run-id <run-id>
./harness facts-lock --project <project-id> --run-id <run-id>
./harness context --project <project-id> --run-id <run-id>
```

`context` 会按页面生成当前事实切片，并从关键 iOS 截图提取文字位置、主色、尺寸与资源引用。读取对应页面的小 context 后自主完成首版，不要把截图做成背景。首版完成立即记录：

```bash
./harness checkpoint --project <project-id> --run-id <run-id> --stage first-pass
```

之后运行：

```bash
./harness reconcile --project <project-id> --run-id <run-id>
./harness behavior-check --project <project-id> --run-id <run-id>
./harness visual-check --project <project-id> --run-id <run-id>
./harness check --project <project-id> --run-id <run-id> --mode app
```

自动检查必须使用当前工作区的独占 Web 服务与本 Run 新截图；状态型核心页面要覆盖空/有数据，桌面浏览器中的固定层不得越出手机壳。根据差异修复后执行 `checkpoint --stage repair`，最多两轮；达到上限必须停止汇报。只有返回 `AUTO_COMPLETE` 且给出可打开链接，才能请用户验收；只有用户可以定为 `USER_ACCEPTED`。
