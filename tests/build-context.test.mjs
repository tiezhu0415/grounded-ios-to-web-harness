import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { PNG } from 'pngjs';
import { createBuildContexts, validateContextIndex } from '../scripts/build_context.mjs';
import { createSourceFacts } from '../scripts/source_facts.mjs';
import { createVisualMatrix } from '../scripts/visual_matrix.mjs';

const root = path.resolve(import.meta.dirname, '..');

function setup() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-context-'));
  const screens = ['Home', 'Detail'].map((name) => ({
    id: `Views/${name}View.swift#${name}View`,
    declaration: `${name}View`,
    source: `Views/${name}View.swift`,
    route: `/${name.toLowerCase()}`,
    discovery: {
      source: { status: 'FOUND', evidence: `Views/${name}View.swift#${name}View` },
      graph: { status: 'FOUND', evidence: [`graph:${name}`], inbound: [], outbound: [] },
      runtime: { status: 'FOUND', flow_state_ids: [`${name.toLowerCase()}-default`] },
    },
    states: [{
      id: `${name.toLowerCase()}-default`, label: `${name} default`, confidence: 'CONFIRMED',
      source_evidence: [`RUNTIME:${name}`],
    }],
  }));
  const coverage = { project: 'generic-app', screens, supporting_components: [] };
  const facts = createSourceFacts(coverage);
  for (const value of Object.values(facts.discovery)) { value.status = 'COMPLETE'; value.evidence = ['evidence/ref']; }
  for (const value of Object.values(facts.assessments)) { value.status = 'CONFIRMED'; value.evidence = ['evidence/ref']; }
  const matrix = createVisualMatrix(coverage);
  for (const screen of matrix.screens) {
    screen.critical = true;
    screen.selection_reason = 'CORE_FLOW';
    screen.states[0].required = true;
    const image = new PNG({ width: 4, height: 2 });
    for (let offset = 0; offset < image.data.length; offset += 4) {
      image.data[offset] = offset < image.data.length / 2 ? 255 : 0;
      image.data[offset + 1] = 0;
      image.data[offset + 2] = offset < image.data.length / 2 ? 0 : 255;
      image.data[offset + 3] = 255;
    }
    const screenshot = path.join(directory, screen.states[0].ios_screenshot);
    fs.mkdirSync(path.dirname(screenshot), { recursive: true });
    fs.writeFileSync(screenshot, PNG.sync.write(image));
  }
  const files = {
    coverage: path.join(directory, 'coverage.json'), facts: path.join(directory, 'facts.json'), matrix: path.join(directory, 'matrix.json'),
  };
  fs.writeFileSync(files.coverage, JSON.stringify(coverage));
  fs.writeFileSync(files.facts, JSON.stringify(facts));
  fs.writeFileSync(files.matrix, JSON.stringify(matrix));
  const locked = spawnSync('node', [path.join(root, 'scripts/lock_source_facts.mjs'),
    `--coverage=${files.coverage}`, `--facts=${files.facts}`, `--matrix=${files.matrix}`], { encoding: 'utf8' });
  assert.equal(locked.status, 0, locked.stderr);
  return { directory, coverage, facts: JSON.parse(fs.readFileSync(files.facts)), matrix, truthMap: {
    status: 'CONFIRMED', data_status: 'NOT_APPLICABLE', asset_status: 'CONFIRMED', data_sources: [], external_resources: [], blocked: [],
    assets: [{ source: 'Views/HomeView.swift', evidence: 'graph:Home', web_path: 'public/home.png' }],
  } };
}

test('build context keeps one current fact slice per screen and adds pre-generation visual grounding', () => {
  const value = setup();
  const index = createBuildContexts({ ...value, runDirectory: value.directory, noOcr: true });
  assert.equal(index.contexts.length, 2);
  assert.equal(index.visual_grounding.length, 2);
  const homeEntry = index.contexts.find((item) => item.source_id.includes('HomeView'));
  const home = JSON.parse(fs.readFileSync(path.join(value.directory, homeEntry.file)));
  assert.ok(home.source_facts.every((fact) => fact.source === 'Views/HomeView.swift'));
  assert.ok(home.source_facts.every((fact) => !fact.id.includes('DetailView')));
  assert.equal(home.truth.assets.length, 1);
  const grounding = JSON.parse(fs.readFileSync(path.join(value.directory, home.visual_grounding[0])));
  assert.deepEqual(grounding.screenshot.width, 4);
  assert.deepEqual(grounding.screenshot.height, 2);
  assert.ok(grounding.palette.some((item) => item.hex === '#FF0000'));
  assert.equal(grounding.text.status, 'DISABLED');
  assert.deepEqual(validateContextIndex({ ...value, runDirectory: value.directory, index }), []);
});

test('edited or stale context is rejected instead of silently guiding a later repair', () => {
  const value = setup();
  const index = createBuildContexts({ ...value, runDirectory: value.directory, noOcr: true });
  const entry = index.contexts[0];
  const context = JSON.parse(fs.readFileSync(path.join(value.directory, entry.file)));
  context.source_facts[0].fact = 'stale invented fact';
  fs.writeFileSync(path.join(value.directory, entry.file), JSON.stringify(context));
  const errors = validateContextIndex({ ...value, runDirectory: value.directory, index });
  assert.ok(errors.some((error) => error.includes('content changed')));
});

test('replaced iOS evidence or changed source truth invalidates the build context', () => {
  const value = setup();
  const index = createBuildContexts({ ...value, runDirectory: value.directory, noOcr: true });
  const grounding = JSON.parse(fs.readFileSync(path.join(value.directory, index.visual_grounding[0].file)));
  fs.appendFileSync(path.join(value.directory, grounding.screenshot.path), 'changed');
  let errors = validateContextIndex({ ...value, runDirectory: value.directory, index });
  assert.ok(errors.some((error) => error.includes('screenshot changed')));

  value.truthMap.assets[0].source = 'Views/Replacement.swift';
  errors = validateContextIndex({ ...value, runDirectory: value.directory, index });
  assert.ok(errors.some((error) => error.includes('stale Data/Asset')));
});
