import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

function setupTruth(directory, web, source) {
  fs.mkdirSync(source, { recursive: true });
  const truth = path.join(directory, 'truth-map.json');
  fs.writeFileSync(truth, JSON.stringify({
    status: 'CONFIRMED', data_status: 'NOT_APPLICABLE', asset_status: 'CONFIRMED',
    data_sources: [], assets: [], external_resources: [], blocked: [],
  }));
  return truth;
}

function run(web, runDirectory, source, truth) {
  return spawnSync('node', [
    path.join(root, 'scripts/check_web_integrity.mjs'),
    `--web=${web}`,
    `--run-dir=${runDirectory}`,
    `--source=${source}`,
    `--truth-map=${truth}`,
  ], { encoding: 'utf8' });
}

test('normal source Assets remain allowed', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-integrity-'));
  const web = path.join(directory, 'web');
  const runDirectory = path.join(directory, 'run');
  const source = path.join(directory, 'source');
  fs.mkdirSync(path.join(web, 'src'), { recursive: true });
  fs.mkdirSync(path.join(web, 'public'), { recursive: true });
  fs.mkdirSync(runDirectory);
  fs.mkdirSync(path.join(source, 'Assets.xcassets'), { recursive: true });
  fs.writeFileSync(path.join(web, 'src', 'App.tsx'), `export function App() { return <img src="/product.png" />; }`);
  fs.writeFileSync(path.join(web, 'public', 'product.png'), 'source-product-asset');
  fs.writeFileSync(path.join(source, 'Assets.xcassets', 'product.png'), 'source-product-asset');
  const truth = setupTruth(directory, web, source);
  const result = run(web, runDirectory, source, truth);
  assert.equal(result.status, 0, result.stderr);
});

test('copied iOS runtime screens and invisible DOM labels are rejected', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-integrity-'));
  const web = path.join(directory, 'web');
  const runDirectory = path.join(directory, 'run');
  const source = path.join(directory, 'source');
  fs.mkdirSync(path.join(web, 'src'), { recursive: true });
  fs.mkdirSync(path.join(web, 'public'), { recursive: true });
  fs.mkdirSync(path.join(runDirectory, 'ios'), { recursive: true });
  fs.writeFileSync(path.join(runDirectory, 'ios', 'home.png'), 'runtime-screen');
  fs.copyFileSync(path.join(runDirectory, 'ios', 'home.png'), path.join(web, 'public', 'page.png'));
  fs.writeFileSync(path.join(web, 'src', 'App.tsx'), `export function App() { return <span style={{ opacity: 0, pointerEvents: 'none' }}>Passed</span>; }`);
  const truth = setupTruth(directory, web, source);
  const result = run(web, runDirectory, source, truth);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /copies an iOS runtime screenshot/);
  assert.match(result.stderr, /hides non-interactive content/);
});

test('placeholder services and test-like production data are rejected', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-integrity-'));
  const web = path.join(directory, 'web');
  const source = path.join(directory, 'source');
  const runDirectory = path.join(directory, 'run');
  fs.mkdirSync(path.join(web, 'src', 'data', 'fixtures'), { recursive: true });
  fs.mkdirSync(runDirectory);
  fs.writeFileSync(path.join(web, 'src', 'data', 'fixtures', 'users.ts'), `export const user = { email: 'jane@example.com', image: 'https://placehold.co/100' };`);
  const truth = setupTruth(directory, web, source);
  const result = run(web, runDirectory, source, truth);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /fixture\/mock\/fake|placeholder image service|test-like production data/);
});
