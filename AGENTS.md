# Agent 工作规则

所有 Agent 必须先读取 `docs/00-authority.md`。

- Claude 是默认执行者。
- Codex 默认只读，且仅在用户要求、最终验收前或连续两轮修复失败时审查。
- 用户负责批准 Authority、选择迁移功能和最终验收。
- Agent 不得自行扩大范围或把 MVP 改造成通用平台。
- 交接必须更新 `.planning/HANDOFF.md`。
