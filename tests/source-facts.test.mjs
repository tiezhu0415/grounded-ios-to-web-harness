import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createSourceFacts } from '../scripts/source_facts.mjs';
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
  const matrix = createVisualMatrix(coverage);
  for (const screen of matrix.screens) {
    screen.critical = true;
    screen.selection_reason = 'CORE_FLOW';
    screen.states[0].required = true;
  }
  const files = {
    coverage: path.join(directory, 'coverage.json'),
    facts: path.join(directory, 'source-facts.json'),
    matrix: path.join(directory, 'visual-matrix.json'),
  };
  fs.writeFileSync(files.coverage, JSON.stringify(coverage));
  fs.writeFileSync(files.facts, JSON.stringify(facts));
  fs.writeFileSync(files.matrix, JSON.stringify(matrix));
  return files;
}

function run(script, value) {
  return spawnSync('node', [path.join(root, `scripts/${script}`),
    `--coverage=${value.coverage}`, `--facts=${value.facts}`, `--matrix=${value.matrix}`,
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

test('a locked but unresolved source fact cannot reach AUTO_COMPLETE', () => {
  const value = fixture();
  const facts = JSON.parse(fs.readFileSync(value.facts));
  facts.facts[0].confidence = 'BLOCKED';
  fs.writeFileSync(value.facts, JSON.stringify(facts));
  assert.equal(run('lock_source_facts.mjs', value).status, 0);
  const checked = run('check_source_facts.mjs', value);
  assert.notEqual(checked.status, 0);
  assert.match(checked.stderr, /fact is unresolved/);
});
