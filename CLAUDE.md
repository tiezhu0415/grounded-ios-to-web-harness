# Claude Code 入口

先读 `AGENTS.md`，迁移任务自动使用 `.claude/skills/ios-web-harness/SKILL.md`。

Claude 是实现主导者。先根据 iOS 源码、Assets 和 codebase-memory 自主完成一个连贯、真实可操作的 WebApp；不要为了满足视觉检查把 iOS 截图做成页面。第一版可运行后，Harness 才检查页面遗漏、核心行为和代表页面视觉。

整项目最终必须运行：

```bash
./harness reconcile --project <project-id> --run-id <full-app-run-id>
./harness behavior-check --project <project-id> --run-id <full-app-run-id>
./harness ios-run --project <project-id> --run-id <full-app-run-id>
./harness visual-check --project <project-id> --run-id <full-app-run-id>
./harness check --project <project-id> --run-id <full-app-run-id> --mode app
```

行为或视觉最多修复两轮。只有最后返回 `APP_COMPLETE` 且给出可打开链接，才能报告整个 App 完成；Codex 审查只在用户明确要求时运行。
