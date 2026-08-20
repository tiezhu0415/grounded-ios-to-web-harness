import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

function run(web, runDirectory) {
  return spawnSync('node', [
    path.join(root, 'scripts/check_web_integrity.mjs'),
    `--web=${web}`,
    `--run-dir=${runDirectory}`,
  ], { encoding: 'utf8' });
}

test('normal source Assets remain allowed', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-integrity-'));
  const web = path.join(directory, 'web');
  const runDirectory = path.join(directory, 'run');
  fs.mkdirSync(path.join(web, 'src'), { recursive: true });
  fs.mkdirSync(path.join(web, 'public'), { recursive: true });
  fs.mkdirSync(runDirectory);
  fs.writeFileSync(path.join(web, 'src', 'App.tsx'), `export function App() { return <img src="/product.png" />; }`);
  fs.writeFileSync(path.join(web, 'public', 'product.png'), 'source-product-asset');
  const result = run(web, runDirectory);
  assert.equal(result.status, 0, result.stderr);
});

test('copied iOS runtime screens and invisible DOM labels are rejected', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-integrity-'));
  const web = path.join(directory, 'web');
  const runDirectory = path.join(directory, 'run');
  fs.mkdirSync(path.join(web, 'src'), { recursive: true });
  fs.mkdirSync(path.join(web, 'public'), { recursive: true });
  fs.mkdirSync(path.join(runDirectory, 'ios'), { recursive: true });
  fs.writeFileSync(path.join(runDirectory, 'ios', 'home.png'), 'runtime-screen');
  fs.copyFileSync(path.join(runDirectory, 'ios', 'home.png'), path.join(web, 'public', 'page.png'));
  fs.writeFileSync(path.join(web, 'src', 'App.tsx'), `export function App() { return <span style={{ opacity: 0, pointerEvents: 'none' }}>Passed</span>; }`);
  const result = run(web, runDirectory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /copies an iOS runtime screenshot/);
  assert.match(result.stderr, /hides non-interactive content/);
});
