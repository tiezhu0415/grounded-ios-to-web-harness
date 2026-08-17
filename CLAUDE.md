# Claude Code 入口

先读取 `AGENTS.md`。

用户只需说“迁移某项目的某功能”。凡是采集 iOS 证据或迁移 Web 功能，必须自动使用项目 Skill：
`.claude/skills/ios-web-harness/SKILL.md`。

执行必须从下面的命令开始：

```bash
./harness capture --project <project-id> --feature <feature-id>
```

不得要求用户重复说明内部步骤。不得跳过命令、codebase-memory 分析、组件映射、同状态同画布截图、每个映射状态的 Pixelmatch + SSIM 比较和视觉差异精修，也不得仅在聊天中汇报完成。
