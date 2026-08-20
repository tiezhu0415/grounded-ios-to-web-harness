import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-behavior-'));
  const web = path.join(directory, 'web');
  fs.mkdirSync(path.join(web, 'tests'), { recursive: true });
  const coverage = { screens: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const journeys = {
    policy: { minimum_core_journeys: 3, repair_round_limit: 2 },
    journeys: Array.from({ length: 3 }, (_, index) => ({
      id: `journey-${index + 1}`,
      source_evidence: ['Views/AppView.swift#AppView'],
      routes: index === 0 ? ['/home', '/detail'] : ['/home'],
      steps: [{ action: 'click', target: `item-${index + 1}` }],
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
  fs.writeFileSync(coverageFile, JSON.stringify(coverage));
  fs.writeFileSync(journeysFile, JSON.stringify(journeys));
  return { directory, web, coverageFile, journeysFile, journeys };
}

function run(value) {
  fs.writeFileSync(value.journeysFile, JSON.stringify(value.journeys));
  return spawnSync('node', [
    path.join(root, 'scripts/check_behavior_journeys.mjs'),
    `--coverage=${value.coverageFile}`,
    `--journeys=${value.journeysFile}`,
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
