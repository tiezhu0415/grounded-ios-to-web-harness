import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createCoverage } from '../scripts/app_inventory.mjs';
import { createVisualMatrix } from '../scripts/visual_matrix.mjs';

const root = path.resolve(import.meta.dirname, '..');

function fixture(withStateBranch = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-reconcile-'));
  const source = path.join(directory, 'source');
  fs.mkdirSync(path.join(source, 'Views'), { recursive: true });
  fs.writeFileSync(path.join(source, 'Views', 'WelcomeView.swift'), withStateBranch
    ? 'import SwiftUI\nstruct WelcomeView: View {\n  var items: [String] = []\n  var body: some View {\n    if items.isEmpty {\n      Text("Empty")\n    } else {\n      Text("Full")\n    }\n  }\n}\n'
    : 'import SwiftUI\nstruct WelcomeView: View { var body: some View { Text("Welcome") } }\n');
  const coverage = createCoverage('generic-app', source);
  coverage.screens[0].route = '/welcome';
  const matrix = createVisualMatrix(coverage);
  matrix.screens[0].route = '/welcome';
  const coverageFile = path.join(directory, 'coverage.json');
  const matrixFile = path.join(directory, 'visual-matrix.json');
  return { directory, coverage, matrix, coverageFile, matrixFile };
}

function completeReconciliation(coverage, matrix) {
  const screen = coverage.screens[0];
  const state = matrix.screens[0].states[0];
  coverage.graph_discovery = {
    status: 'COMPLETE',
    entry_points: [screen.id],
    targets: [{ source_id: screen.id, evidence: 'codebase-memory trace from App entry' }],
    evidence: ['search_graph + trace_path'],
    note: '',
  };
  screen.discovery.graph = {
    status: 'CONFIRMED',
    navigation_entry: 'APP_ENTRY',
    evidence: ['codebase-memory: WelcomeView'],
    inbound: [],
    outbound: [],
  };
  screen.discovery.runtime = { status: 'VISITED', flow_state_ids: [state.id] };
  state.discovered_by = ['source', 'runtime'];
  state.runtime_status = 'CAPTURED';
  for (const candidate of coverage.state_candidates) {
    candidate.status = 'MAPPED';
    candidate.screen_ids = [screen.id];
    candidate.state_ids = [state.id];
  }
}

function runCheck(fixtureValue) {
  fs.writeFileSync(fixtureValue.coverageFile, JSON.stringify(fixtureValue.coverage));
  fs.writeFileSync(fixtureValue.matrixFile, JSON.stringify(fixtureValue.matrix));
  return spawnSync('node', [
    path.join(root, 'scripts/check_reconciliation.mjs'),
    `--coverage=${fixtureValue.coverageFile}`,
    `--matrix=${fixtureValue.matrixFile}`,
    `--run-dir=${fixtureValue.directory}`,
  ], { encoding: 'utf8' });
}

test('three-way reconciliation fails when graph or runtime evidence is missing', () => {
  const value = fixture();
  const result = runCheck(value);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /codebase-memory/);
  assert.match(result.stderr, /Maestro/);
});

test('three-way reconciliation passes when source, graph, and runtime agree', () => {
  const value = fixture();
  completeReconciliation(value.coverage, value.matrix);
  const result = runCheck(value);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /THREE-WAY RECONCILIATION PASSED/);
});

test('source UI-state candidates must be mapped or explicitly dismissed', () => {
  const value = fixture(true);
  assert.ok(value.coverage.state_candidates.length > 0);
  completeReconciliation(value.coverage, value.matrix);
  value.coverage.state_candidates[0].status = 'PENDING';
  const unresolved = runCheck(value);
  assert.notEqual(unresolved.status, 0);
  assert.match(unresolved.stderr, /state candidate is unresolved/);

  value.coverage.state_candidates[0].status = 'NOT_USER_VISIBLE';
  value.coverage.state_candidates[0].note = 'Implementation-only branch with no distinct rendered state.';
  const resolved = runCheck(value);
  assert.equal(resolved.status, 0, resolved.stderr);
});

test('a graph-discovered navigation target outside screen coverage is rejected', () => {
  const value = fixture();
  completeReconciliation(value.coverage, value.matrix);
  value.coverage.graph_discovery.targets.push({ source_id: 'graph:HiddenScreen', evidence: 'trace_path result' });
  const result = runCheck(value);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing from screen coverage/);
});
