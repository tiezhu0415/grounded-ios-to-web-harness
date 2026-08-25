import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkpointWorkCycle, createWorkCycle, validateWorkCycle } from '../scripts/work_cycle.mjs';

test('first pass stays distinct from at most two evidence-driven repair rounds', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-work-cycle-'));
  const web = path.join(directory, 'web');
  fs.mkdirSync(path.join(web, 'src'), { recursive: true });
  fs.writeFileSync(path.join(web, 'src/App.tsx'), 'export const App = () => null;');
  const contextIndex = { status: 'READY', facts_lock_sha256: 'facts-v1', visual_plan_sha256: 'visual-v1', truth_sources_sha256: 'truth-v1' };
  const cycle = createWorkCycle('generic-app', 2);

  checkpointWorkCycle({ cycle, stage: 'first-pass', webDirectory: web, contextIndex });
  assert.deepEqual(validateWorkCycle({ cycle, webDirectory: web, contextIndex }), []);
  fs.writeFileSync(path.join(web, 'src/App.tsx'), 'export const App = () => <main />;');
  assert.ok(validateWorkCycle({ cycle, webDirectory: web, contextIndex }).some((error) => error.includes('changed')));

  checkpointWorkCycle({ cycle, stage: 'repair', webDirectory: web, contextIndex });
  fs.writeFileSync(path.join(web, 'src/App.tsx'), 'export const App = () => <main>done</main>;');
  checkpointWorkCycle({ cycle, stage: 'repair', webDirectory: web, contextIndex });
  assert.throws(() => checkpointWorkCycle({ cycle, stage: 'repair', webDirectory: web, contextIndex }), /repair round limit reached/);
  assert.equal(cycle.repairs.length, 2);
});
