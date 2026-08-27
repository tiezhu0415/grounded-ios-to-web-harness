import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createStateSnapshots } from '../scripts/state_snapshots.mjs';
import { createVisualMatrix } from '../scripts/visual_matrix.mjs';

const root = path.resolve(import.meta.dirname, '..');

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-behavior-'));
  const web = path.join(directory, 'web');
  fs.mkdirSync(path.join(web, 'tests'), { recursive: true });
  const coverage = { project: 'generic-app', screens: ['a', 'b', 'c'].map((id) => ({ id, declaration: id, route: `/${id}`, states: [{ id: `${id}-default`, label: `${id} default` }] })) };
  const matrix = createVisualMatrix(coverage);
  matrix.screens[0].critical = true;
  matrix.screens[0].selection_reason = 'CORE_FLOW';
  matrix.screens[0].states[0].required = true;
  const snapshots = createStateSnapshots(coverage, matrix);
  for (const snapshot of snapshots.snapshots) {
    snapshot.status = 'CONFIRMED'; snapshot.confidence = 'SUPPORTED'; snapshot.identity = { variant: snapshot.id };
    snapshot.source_evidence = [`SOURCE:${snapshot.id}`]; snapshot.ios_setup.evidence = [`RUNTIME:${snapshot.id}`];
    snapshot.web_setup.seed_evidence = [`SOURCE:${snapshot.id}`];
  }
  const actionFacts = Array.from({ length: 3 }, (_, index) => ({
    id: `action:a:journey-${index + 1}`, type: 'ACTION', fact: `Perform journey ${index + 1}`, screen_id: 'a',
    action: `Tap item ${index + 1}`, preconditions: [], data_effects: [`Set item ${index + 1}`],
    navigation_effect: index === 0 ? { kind: 'PUSH', target: '/detail' } : { kind: 'STAY' },
    visible_feedback: ['Selected state is visible'], source: 'Views/AppView.swift',
    evidence: [{ kind: 'SOURCE', ref: `Views/AppView.swift#journey-${index + 1}` }], confidence: 'SUPPORTED',
  }));
  const facts = { lock: { content_sha256: 'facts-lock', state_snapshots_sha256: 'snapshots-lock' }, facts: [], additional_facts: actionFacts };
  const journeys = {
    facts_lock_sha256: 'facts-lock',
    state_snapshots_sha256: 'snapshots-lock',
    policy: { minimum_core_journeys: 3, repair_round_limit: 2 },
    journeys: actionFacts.map((actionFact, index) => ({
      id: `journey-${index + 1}`,
      source_evidence: [actionFact.evidence[0].ref],
      routes: index === 0 ? ['/home', '/detail'] : ['/home'],
      steps: [{ action: 'click', target: `item-${index + 1}`, source_fact_id: actionFact.id, expected_effects: {
        data_effects: actionFact.data_effects,
        navigation_effect: actionFact.navigation_effect,
        visible_feedback: actionFact.visible_feedback,
      } }],
      state_snapshot_ids: ['a-default'],
      expected_outcomes: ['The selected state becomes visible.'],
      web_test: `tests/core.spec.ts#journey-${index + 1}`,
      status: 'PASSED',
    })),
  };
  fs.writeFileSync(path.join(web, 'tests', 'core.spec.ts'), `
    test('journey-1', async ({ page }) => { await page.getByRole('button').click(); await expect(page.getByText('Done')).toBeVisible(); });
    test('journey-2', async ({ page }) => { await page.getByRole('button').click(); await expect(page.getByText('Done')).toBeVisible(); });
    test('journey-3', async ({ page }) => { await page.getByRole('button').click(); await expect(page.getByText('Done')).toBeVisible(); });
  `);
  const coverageFile = path.join(directory, 'coverage.json');
  const journeysFile = path.join(directory, 'journeys.json');
  const factsFile = path.join(directory, 'facts.json');
  const snapshotsFile = path.join(directory, 'snapshots.json');
  const matrixFile = path.join(directory, 'matrix.json');
  fs.writeFileSync(coverageFile, JSON.stringify(coverage));
  fs.writeFileSync(journeysFile, JSON.stringify(journeys));
  fs.writeFileSync(factsFile, JSON.stringify(facts));
  fs.writeFileSync(snapshotsFile, JSON.stringify(snapshots));
  fs.writeFileSync(matrixFile, JSON.stringify(matrix));
  return { directory, web, coverageFile, journeysFile, factsFile, snapshotsFile, matrixFile, journeys };
}

function run(value) {
  fs.writeFileSync(value.journeysFile, JSON.stringify(value.journeys));
  return spawnSync('node', [
    path.join(root, 'scripts/check_behavior_journeys.mjs'),
    `--coverage=${value.coverageFile}`,
    `--journeys=${value.journeysFile}`,
    `--facts=${value.factsFile}`,
    `--snapshots=${value.snapshotsFile}`,
    `--matrix=${value.matrixFile}`,
    `--web=${value.web}`,
  ], { encoding: 'utf8' });
}

test('core behavior passes with real actions, observable outcomes, and a cross-route journey', () => {
  const value = fixture();
  const result = run(value);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /JOURNEYS=3/);
});

test('screenshot-only page tests cannot count as core behavior', () => {
  const value = fixture();
  fs.writeFileSync(path.join(value.web, 'tests', 'core.spec.ts'), `test('journey-1 journey-2 journey-3', async ({ page }) => { await page.goto('/'); await page.screenshot(); });`);
  const result = run(value);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no Playwright interaction/);
  assert.match(result.stderr, /no observable Playwright assertion/);
});

test('core behavior requires a composed cross-route journey', () => {
  const value = fixture();
  for (const journey of value.journeys.journeys) journey.routes = ['/home'];
  const result = run(value);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cross Web routes/);
});

test('core behavior cannot invent a navigation outcome that differs from the locked ACTION fact', () => {
  const value = fixture();
  value.journeys.journeys[0].steps[0].expected_effects.navigation_effect = { kind: 'STAY' };
  const result = run(value);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /differ from locked ACTION fact/);
});

test('core behavior requires a confirmed shared state snapshot', () => {
  const value = fixture();
  value.journeys.journeys[0].state_snapshot_ids = ['missing-state'];
  const result = run(value);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unconfirmed state snapshot/);
});

test('new full-app runs start with a generic behavior manifest', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-behavior-init-'));
  const coverageFile = path.join(directory, 'coverage.json');
  const outputFile = path.join(directory, 'behavior-journeys.json');
  fs.writeFileSync(coverageFile, JSON.stringify({ project: 'generic-app', screens: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] }));
  const result = spawnSync('node', [
    path.join(root, 'scripts/init_behavior_journeys.mjs'),
    `--coverage=${coverageFile}`,
    `--output=${outputFile}`,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  assert.equal(manifest.policy.minimum_core_journeys, 3);
  assert.equal(manifest.policy.repair_round_limit, 2);
  assert.deepEqual(manifest.journeys, []);
  assert.doesNotMatch(JSON.stringify(manifest), /cart|favorite|ecommerce/i);
});
