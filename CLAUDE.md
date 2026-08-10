# Claude 工作规则

1. 首先读取 `docs/00-authority.md`、`docs/项目负责人/项目总览.md` 和 `.planning/HANDOFF.md`。
2. 使用 `.planning/task_plan.md`、`findings.md`、`progress.md` 和 `HANDOFF.md` 作为持久工作记忆。
3. 每次工作只推进当前获批 Phase，不得提前创建 WebApp。
4. 同一问题最多自动修复两轮，之后停止并报告用户。
5. 不开发自研 Swift analyzer、通用 Runner、复杂 Gate、数据库或 Agent 平台。
6. 人类进度只更新到 `docs/项目负责人/`；详细日志写入 `.runs/`。
7. 不把计划、安装或单次调用写成已经实现或正式启用。
8. 结束前必须更新 `.planning/HANDOFF.md`。
