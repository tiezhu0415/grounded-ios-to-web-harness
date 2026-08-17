---
name: ios-web-harness
description: Run this repository's minimal iOS-to-Web workflow for a named project and feature. Use automatically when the user simply asks to migrate, capture, re-shoot, continue, or verify an iOS feature, even if the user does not mention the Harness or this skill. The workflow uses codebase-memory-mcp to build an iOS-to-Web component mapping before implementation, creates a visible run directory, and avoids extra user approval gates.
---

# iOS→Web Harness

## Start every task

1. Read `AGENTS.md`, `docs/项目技术方案.md`, `docs/项目清单.md`, `docs/项目/<project-id>/项目蓝图.md`, and `.planning/HANDOFF.md`.
2. Identify one project ID and one lowercase feature ID. Ask only if either cannot be inferred.
3. From the repository root run:

```bash
./harness capture --project <project-id> --feature <feature-id>
```

Use the returned `RUN_DIR` for every artifact. Do not claim the Harness was used if this command did not succeed.
If the root visual tools are not installed, run `npm install` once in the repository root before comparison.

## Build the source mapping

1. Use codebase-memory-mcp first: `search_graph` for the page entry, `trace_path` for inbound/outbound relationships, and `get_code_snippet` for the page and every non-framework child component.
2. Trace View/ViewController → child views → ViewModel/Model/Service → navigation → referenced image, color, and font Assets. Do not infer completeness from filenames alone.
3. Read the complete selected SwiftUI/UIKit layout and modifiers. Record explicit sizes, spacing, alignment, order, colors, fonts, corner radii, conditions, and gestures in `RUN_DIR/组件映射.md`.
4. Record every user-visible string/value and its source or observed run state. Do not replace live iOS values with preview, placeholder, or invented data.
5. Record every referenced Asset, custom font, color token, and SF Symbol. Copy reusable source files into the project WebApp; only recreate a system symbol when no source file exists.
6. Map every native component to a Web component. Replace the three pending Harness markers with `HARNESS:MAPPING_READY`, `HARNESS:SOURCE_TRUTH_CONFIRMED`, and `HARNESS:ASSETS_CONFIRMED` only after the tables contain source-backed facts.
7. Run the internal mapping check before writing Web code:

```bash
./harness check --project <project-id> --run-id <run-id> --mode mapping
```

If codebase-memory-mcp is unavailable or the selected source graph is incomplete, stop and report that blocker. Do not silently replace it with free-form design.

## Capture the running behavior

1. Build and launch the configured source project. Read `harness.yaml` for the current local Xcode settings.
2. Navigate to the requested feature and save screenshots as `ios-<state>.png` in `RUN_DIR`.
3. Use runtime observation to confirm navigation, conditional states, scrolling, animation, and system behavior that source alone does not settle.
4. Use the same product, account state, UI state, visible data, and resource-loading result in iOS and Web evidence. If one side has missing or loaded images while the other does not, fix or recapture the state before comparing. Screenshots are runtime evidence, not the primary source for layout translation.
5. Save the simulator screenshot directly with `xcrun simctl io booted screenshot RUN_DIR/ios-<state>.png`. Record its pixel size and the simulator scale in the mapping.
6. For an evidence-only request, finish with:

```bash
./harness check --project <project-id> --run-id <run-id> --mode ios
```

Then stop and report the evidence path.

## Migrate and verify

For a migration task:

1. Implement only the selected feature in `webapps/<project-id>/`, following the checked `组件映射.md` row by row.
2. Preserve source-defined hierarchy, navigation, layout direction, component order, sizes, spacing, colors, fonts, Assets, controls, visible data, and behavior. Do not apply a conventional Web redesign.
3. Run the existing build, lint, and Playwright commands for that WebApp. Functional tests prove behavior only, not visual fidelity.
4. Declare every acceptance state in the `组件映射.md` “对比状态” table, then capture each state on the same logical canvas and scale:

```bash
./harness webshot --project <project-id> --run-id <run-id> --state <state> \
  --url http://localhost:<port>/<route> --width <logical-width> --height <logical-height> --scale <scale>
```

5. Compare the matching evidence. Crop only simulator/browser system chrome that is not part of the migrated UI, and use identical final dimensions:

```bash
./harness compare --project <project-id> --run-id <run-id> --state <state> \
  --ios ios-<state>.png --web web-<state>.png
```

6. Read `visual-<state>.json` and `visual-<state>-comparison.png`. Treat Pixelmatch `changed_ratio` as the primary location signal and `ssim_score` as an auxiliary structural signal; neither is an automatic release gate. Fix the highest-difference regions locally, recapture, and compare again. Stop after two refinement rounds and report remaining visible differences honestly.
7. Finish with:

```bash
./harness check --project <project-id> --run-id <run-id> --mode complete
```

8. Update only the maintained files required by `AGENTS.md`.

## Limits

- The user chooses the feature at the start and reviews the result at the end; do not add intermediate approval gates.
- Fix the same failure at most twice, then stop with evidence.
- Do not invoke Codex review unless the user asks or two repair attempts fail.
- Do not store passwords, keys, local settings, or credentials in run evidence.
- Do not build a generic Runner, analyzer, schema system, or agent platform.
- Do not begin Web implementation before `check --mode mapping` passes.
- `check --mode complete` must cover every state declared in the mapping table; one comparison cannot stand in for the whole feature.
