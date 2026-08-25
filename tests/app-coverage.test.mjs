import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createCoverage } from '../scripts/app_inventory.mjs';

const root = path.resolve(import.meta.dirname, '..');

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-app-coverage-'));
  const source = path.join(directory, 'source');
  const web = path.join(directory, 'web');
  fs.mkdirSync(path.join(source, 'Views', 'Subviews'), { recursive: true });
  fs.mkdirSync(path.join(web, 'src'), { recursive: true });
  fs.mkdirSync(path.join(web, 'e2e'), { recursive: true });
  fs.writeFileSync(path.join(source, 'Views', 'HomeView.swift'), 'import SwiftUI\nstruct HomeView: View { var body: some View { Text("Home") } }\n');
  fs.writeFileSync(path.join(source, 'Views', 'Subviews', 'CardView.swift'), 'import SwiftUI\nstruct CardView: View { var body: some View { Text("Card") } }\n');
  fs.writeFileSync(path.join(web, 'src', 'Home.tsx'), 'export default function Home() { return null }\n');
  fs.writeFileSync(path.join(web, 'e2e', 'app.spec.ts'), `test('home-render', async ({ page }) => { page.on('pageerror', () => {}); await page.goto('/home'); expect(page).toBeTruthy(); })\ntest('card-render', async ({ page }) => { page.on('console', () => {}); await page.goto('/card'); expect(page).toBeTruthy(); })\n`);
  return { directory, source, web };
}

function completeScreen(item, route, testId) {
  item.status = 'IMPLEMENTED';
  item.web = 'src/Home.tsx';
  item.route = route;
  item.test = 'e2e/app.spec.ts';
  item.states ||= [{
    id: `${item.declaration.replace(/View$/, '').toLowerCase()}-default`,
    source_evidence: [`ALWAYS_VISIBLE:${item.source}#${item.declaration}`],
    confidence: 'SUPPORTED',
  }];
  for (const state of item.states) {
    state.status = 'IMPLEMENTED';
    state.web_route = route;
    state.render_test = `e2e/app.spec.ts#${testId}`;
    state.render_status = 'PASSED';
  }
}

function runCheck(coverageFile, source, web) {
  return spawnSync('node', [
    path.join(root, 'scripts/check_app_coverage.mjs'),
    `--coverage=${coverageFile}`,
    `--source=${source}`,
    `--web=${web}`,
  ], { encoding: 'utf8' });
}

test('full-app coverage fails while source screens remain pending', () => {
  const { directory, source, web } = fixture();
  const coverageFile = path.join(directory, 'coverage.json');
  fs.writeFileSync(coverageFile, JSON.stringify(createCoverage('demo', source)));
  const result = runCheck(coverageFile, source, web);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /HomeView/);
});

test('full-app coverage passes only with a real route, Web file, and behavior test', () => {
  const { directory, source, web } = fixture();
  const coverageFile = path.join(directory, 'coverage.json');
  const coverage = createCoverage('demo', source);
  for (const item of coverage.screens) {
    completeScreen(item, '/home', 'home-render');
  }
  fs.writeFileSync(coverageFile, JSON.stringify(coverage));
  const result = runCheck(coverageFile, source, web);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /APP COVERAGE PASSED/);
});

test('an excluded source screen keeps a full-app run incomplete', () => {
  const { directory, source, web } = fixture();
  const coverageFile = path.join(directory, 'coverage.json');
  const coverage = createCoverage('demo', source);
  for (const item of coverage.screens) {
    item.status = 'EXCLUDED';
    item.web = 'src/Home.tsx';
  }
  fs.writeFileSync(coverageFile, JSON.stringify(coverage));
  const result = runCheck(coverageFile, source, web);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /EXCLUDED/);
});

test('a codebase-memory navigation target can promote a scanned component to a required screen', () => {
  const { directory, source, web } = fixture();
  const coverageFile = path.join(directory, 'coverage.json');
  const coverage = createCoverage('demo', source);
  const promoted = coverage.supporting_components.find((item) => item.declaration === 'CardView');
  coverage.supporting_components = coverage.supporting_components.filter((item) => item !== promoted);
  coverage.screens.push({
    ...promoted,
    status: 'IMPLEMENTED',
    web: 'src/Home.tsx',
    route: '/card',
    test: 'e2e/app.spec.ts',
    discovery: {
      ...promoted.discovery,
      graph: { status: 'CONFIRMED', navigation_entry: 'HomeView', evidence: ['trace_path'], inbound: [], outbound: [] },
    },
  });
  completeScreen(coverage.screens.at(-1), '/card', 'card-render');
  for (const item of coverage.screens.filter((item) => item.declaration === 'HomeView')) {
    completeScreen(item, '/home', 'home-render');
  }
  fs.writeFileSync(coverageFile, JSON.stringify(coverage));
  const result = runCheck(coverageFile, source, web);
  assert.equal(result.status, 0, result.stderr);
});
