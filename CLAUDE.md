# Claude Code 入口

先读 `AGENTS.md`，迁移任务自动使用 `.claude/skills/ios-web-harness/SKILL.md`。

Claude 负责理解不同 App 的页面、状态和导航，然后生成当前项目的 Maestro 与 Playwright 流程。Harness 本身不包含任何项目或业务专用提示词。

整项目最终必须运行：

```bash
./harness ios-run --project <project-id> --run-id <full-app-run-id>
./harness reconcile --project <project-id> --run-id <full-app-run-id>
./harness visual-check --project <project-id> --run-id <full-app-run-id>
./harness check --project <project-id> --run-id <full-app-run-id> --mode app
```

只有最后返回 `APP_COMPLETE` 才能报告整个 App 完成。
