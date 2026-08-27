import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createSourceFacts } from '../scripts/source_facts.mjs';
import { createStateSnapshots } from '../scripts/state_snapshots.mjs';
import { createVisualMatrix } from '../scripts/visual_matrix.mjs';

const root = path.resolve(import.meta.dirname, '..');

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-source-facts-'));
  const coverage = {
    project: 'generic-app',
    screens: ['Home', 'Detail'].map((name) => ({
      id: `Views/${name}View.swift#${name}View`,
      declaration: `${name}View`,
      source: `Views/${name}View.swift`,
      route: `/${name.toLowerCase()}`,
      discovery: { source: { evidence: `Views/${name}View.swift#${name}View` } },
      states: [{
        id: `${name.toLowerCase()}-default`,
        label: `${name} default`,
        source_evidence: [`ALWAYS_VISIBLE:Views/${name}View.swift#${name}View`],
        confidence: 'SUPPORTED',
      }],
    })),
  };
  const facts = createSourceFacts(coverage);
  for (const item of Object.values(facts.discovery)) {
    item.status = 'COMPLETE';
    item.evidence = ['evidence/ref'];
  }
  for (const item of Object.values(facts.assessments)) {
    item.status = 'CONFIRMED';
    item.evidence = ['evidence/ref'];
  }
  for (const fact of facts.facts.filter((item) => item.type === 'NAVIGATION')) {
    fact.presentation = 'TAB_ROOT';
    fact.tab_bar_visible = true;
    fact.owning_tab = 'main';
    fact.entry_effect = 'App entry or tab selection';
    fact.exit_effect = 'Remain in the owning tab';
    fact.evidence = [{ kind: 'SOURCE', ref: fact.source }];
    fact.confidence = 'SUPPORTED';
  }
  const matrix = createVisualMatrix(coverage);
  for (const screen of matrix.screens) {
    screen.critical = true;
    screen.selection_reason = 'TOP_LEVEL_NAV';
    screen.states[0].required = true;
  }
  const snapshots = createStateSnapshots(coverage, matrix);
  for (const snapshot of snapshots.snapshots) {
    snapshot.status = 'CONFIRMED';
    snapshot.confidence = 'SUPPORTED';
    snapshot.identity = { variant: snapshot.state_id };
    snapshot.source_evidence = [`RUNTIME:${snapshot.state_id}`];
    snapshot.ios_setup.evidence = [`RUNTIME:${snapshot.state_id}`];
    snapshot.web_setup.seed_evidence = [`SOURCE:${snapshot.state_id}`];
  }
  const files = {
    coverage: path.join(directory, 'coverage.json'),
    facts: path.join(directory, 'source-facts.json'),
    matrix: path.join(directory, 'visual-matrix.json'),
    snapshots: path.join(directory, 'state-snapshots.json'),
  };
  fs.writeFileSync(files.coverage, JSON.stringify(coverage));
  fs.writeFileSync(files.facts, JSON.stringify(facts));
  fs.writeFileSync(files.matrix, JSON.stringify(matrix));
  fs.writeFileSync(files.snapshots, JSON.stringify(snapshots));
  return files;
}

function run(script, value) {
  return spawnSync('node', [path.join(root, `scripts/${script}`),
    `--coverage=${value.coverage}`, `--facts=${value.facts}`, `--matrix=${value.matrix}`,
    `--snapshots=${value.snapshots}`,
  ], { encoding: 'utf8' });
}

test('source facts and the Critical Visual Set become an immutable lock', () => {
  const value = fixture();
  const locked = run('lock_source_facts.mjs', value);
  assert.equal(locked.status, 0, locked.stderr);
  assert.match(locked.stdout, /SOURCE FACTS LOCKED/);
  const checked = run('check_source_facts.mjs', value);
  assert.equal(checked.status, 0, checked.stderr);

  const facts = JSON.parse(fs.readFileSync(value.facts));
  facts.facts[0].fact = 'Invented replacement';
  fs.writeFileSync(value.facts, JSON.stringify(facts));
  const changed = run('check_source_facts.mjs', value);
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /changed after lock/);
});

test('changing the locked Critical Visual Set is detected', () => {
  const value = fixture();
  assert.equal(run('lock_source_facts.mjs', value).status, 0);
  const matrix = JSON.parse(fs.readFileSync(value.matrix));
  matrix.screens[0].critical = false;
  fs.writeFileSync(value.matrix, JSON.stringify(matrix));
  const changed = run('check_source_facts.mjs', value);
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /Critical Visual Set changed after lock/);
});

test('changing a locked iOS/Web state identity is detected', () => {
  const value = fixture();
  assert.equal(run('lock_source_facts.mjs', value).status, 0);
  const snapshots = JSON.parse(fs.readFileSync(value.snapshots));
  snapshots.snapshots[0].identity = { variant: 'different-runtime-record' };
  fs.writeFileSync(value.snapshots, JSON.stringify(snapshots));
  const changed = run('check_source_facts.mjs', value);
  assert.notEqual(changed.status, 0);
  assert.match(changed.stderr, /state snapshots changed after lock/);
});

test('an unresolved source fact cannot be locked for implementation', () => {
  const value = fixture();
  const facts = JSON.parse(fs.readFileSync(value.facts));
  facts.facts[0].confidence = 'BLOCKED';
  fs.writeFileSync(value.facts, JSON.stringify(facts));
  const locked = run('lock_source_facts.mjs', value);
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /fact is unresolved/);
});

test('placeholder facts and missing navigation contracts cannot be locked', () => {
  const value = fixture();
  const facts = JSON.parse(fs.readFileSync(value.facts));
  facts.facts.find((fact) => fact.type === 'STATE').fact = 'Default meaningful state; refine after discovery';
  facts.facts = facts.facts.filter((fact) => fact.type !== 'NAVIGATION' || !fact.screen_id.includes('Detail'));
  fs.writeFileSync(value.facts, JSON.stringify(facts));
  const locked = run('lock_source_facts.mjs', value);
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /placeholder content/);
  assert.match(locked.stderr, /missing navigation\/presentation/);
});

test('a critical mutation screen needs a structured ACTION fact', () => {
  const value = fixture();
  const matrix = JSON.parse(fs.readFileSync(value.matrix));
  matrix.screens[0].selection_reason = 'FORM_OR_MUTATION';
  fs.writeFileSync(value.matrix, JSON.stringify(matrix));
  let locked = run('lock_source_facts.mjs', value);
  assert.notEqual(locked.status, 0);
  assert.match(locked.stderr, /no ACTION fact/);

  const facts = JSON.parse(fs.readFileSync(value.facts));
  facts.additional_facts.push({
    id: 'action:home:save', type: 'ACTION', fact: 'Save the edited value', screen_id: matrix.screens[0].source_id,
    action: 'Tap Save', preconditions: ['Form is valid'], data_effects: ['Persist edited value'],
    navigation_effect: { kind: 'DISMISS' }, visible_feedback: ['Updated value is visible'],
    source: 'Views/HomeView.swift', evidence: [{ kind: 'SOURCE', ref: 'Views/HomeView.swift#save' }], confidence: 'SUPPORTED',
  });
  fs.writeFileSync(value.facts, JSON.stringify(facts));
  locked = run('lock_source_facts.mjs', value);
  assert.equal(locked.status, 0, locked.stderr);
});
