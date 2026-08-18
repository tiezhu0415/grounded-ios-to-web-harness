# Claude Code 入口

先读取 `AGENTS.md`，迁移任务自动使用 `.claude/skills/ios-web-harness/SKILL.md`。

- 整个 App：先执行 `./harness prepare --project <project-id>`，先建手机外壳、全局导航和路由，再按 `项目覆盖.json` 实现。
- 单个功能：执行 `./harness capture --project <project-id> --feature <feature-id>`，用于源码映射、运行证据和视觉精修。

不得把单功能的 `FEATURE_EVIDENCE_COMPLETE` 写成整项目完成。整项目只能在以下命令通过后称为完成：

```bash
./harness check --project <project-id> --run-id <full-app-run-id> --mode app
```
