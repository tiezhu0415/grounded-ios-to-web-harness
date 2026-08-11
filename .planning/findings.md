# Findings

Record only evidence-backed discoveries needed for the active MVP. Do not copy full logs or duplicate human documents.

| Date | Finding | Evidence | Consequence |
| --- | --- | --- | --- |
| 2026-08-10 | Project scaffold created; implementation has not started | Repository files | Await user approval |
| 2026-08-10 | `eCommerce-main` was copied exactly from the previous local Harness, but the source was ignored there and has no independent Git repository | Source/destination comparison and Git checks | Phase 1 must establish a reproducible input identity before claiming the source is fixed |
| 2026-08-11 | Codex found that the selected iOS feature had source evidence but no runtime evidence beyond the login page | Launch screenshot and blueprint | Downgrade to runtime-unverified and revalidate after login |
| 2026-08-11 | eCommerce references exist in the current example artifacts; the only generic config example was also eCommerce-specific | Repository scan | Genericize `harness.example.yaml` and document example/core boundary |
