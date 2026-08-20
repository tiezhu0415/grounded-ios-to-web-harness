import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { PNG } from 'pngjs';
import { createVisualMatrix } from '../scripts/visual_matrix.mjs';

const root = path.resolve(import.meta.dirname, '..');

function coverage() {
  return {
    project: 'generic-app',
    screens: [
      { id: 'Views/WelcomeView.swift#WelcomeView', declaration: 'WelcomeView', route: '/welcome' },
      { id: 'Views/ItemsView.swift#ItemsView', declaration: 'ItemsView', route: '/items' },
    ],
  };
}

function writePng(file) {
  const image = new PNG({ width: 12, height: 12 });
  image.data.fill(240);
  for (let index = 3; index < image.data.length; index += 4) image.data[index] = 255;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(image));
}

function materialize(directory, matrix, changedReport = false) {
  const web = path.join(directory, 'webapp');
  for (const screen of matrix.screens) {
    screen.representative = true;
    for (const state of screen.states) {
      state.required = true;
      for (const relative of [state.ios_flow, state.ios_screenshot, state.web_screenshot, state.report]) {
        fs.mkdirSync(path.dirname(path.join(directory, relative)), { recursive: true });
      }
      fs.writeFileSync(path.join(directory, state.ios_flow), 'appId: example.app\n---\n- launchApp\n');
      writePng(path.join(directory, state.ios_screenshot));
      writePng(path.join(directory, state.web_screenshot));
      fs.writeFileSync(path.join(directory, state.report), JSON.stringify({
        engine: { primary: 'pixelmatch' },
        changed_ratio: changedReport ? 0.4 : 0.05,
        ssim_score: changedReport ? 0.5 : 0.95,
      }));
      const [testFile, testId] = state.web_test.split('#');
      fs.mkdirSync(path.dirname(path.join(web, testFile)), { recursive: true });
      fs.appendFileSync(path.join(web, testFile), `test('${testId}', () => {})\n`);
    }
  }
  return web;
}

function runCheck(directory, web, coverageFile, matrixFile) {
  return spawnSync('node', [
    path.join(root, 'scripts/check_visual_matrix.mjs'),
    `--coverage=${coverageFile}`,
    `--matrix=${matrixFile}`,
    `--run-dir=${directory}`,
    `--web=${web}`,
  ], { encoding: 'utf8' });
}

test('visual matrix is generated from arbitrary source screens without project-specific prompts', () => {
  const matrix = createVisualMatrix(coverage());
  assert.equal(matrix.screens.length, 2);
  assert.equal(matrix.screens[0].states[0].id, 'welcome-view-default');
  assert.equal(matrix.screens[1].states[0].id, 'items-view-default');
  assert.equal(matrix.screens[0].representative, false);
  assert.equal(matrix.screens[0].states[0].required, false);
  assert.doesNotMatch(JSON.stringify(matrix), /cart|favorite|ecommerce/i);
});

test('visual coverage requires evidence for selected representative screens', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-visual-matrix-'));
  const coverageFile = path.join(directory, 'coverage.json');
  const matrixFile = path.join(directory, 'visual-matrix.json');
  const sourceCoverage = coverage();
  const matrix = createVisualMatrix(sourceCoverage);
  for (const screen of matrix.screens) {
    screen.representative = true;
    screen.states[0].required = true;
  }
  fs.writeFileSync(coverageFile, JSON.stringify(sourceCoverage));
  fs.writeFileSync(matrixFile, JSON.stringify(matrix));
  const missing = runCheck(directory, path.join(directory, 'webapp'), coverageFile, matrixFile);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /iOS flow/);
  assert.match(missing.stderr, /Web screenshot/);

  const web = materialize(directory, matrix);
  fs.writeFileSync(matrixFile, JSON.stringify(matrix));
  const complete = runCheck(directory, web, coverageFile, matrixFile);
  assert.equal(complete.status, 0, complete.stderr);
  assert.match(complete.stdout, /SCREENS=2/);
  assert.match(complete.stdout, /STATES=2/);
});

test('large structural visual differences keep the app incomplete', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-visual-quality-'));
  const coverageFile = path.join(directory, 'coverage.json');
  const matrixFile = path.join(directory, 'visual-matrix.json');
  const sourceCoverage = coverage();
  const matrix = createVisualMatrix(sourceCoverage);
  fs.writeFileSync(coverageFile, JSON.stringify(sourceCoverage));
  const web = materialize(directory, matrix, true);
  fs.writeFileSync(matrixFile, JSON.stringify(matrix));
  const result = runCheck(directory, web, coverageFile, matrixFile);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /changed_ratio/);
  assert.match(result.stderr, /SSIM/);
});

test('batch comparison fills the generic matrix and result without business-specific logic', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-visual-batch-'));
  const matrixFile = path.join(directory, 'visual-matrix.json');
  const resultFile = path.join(directory, 'result.json');
  const matrix = createVisualMatrix({ project: 'demo', screens: [coverage().screens[0]] });
  const state = matrix.screens[0].states[0];
  matrix.screens[0].representative = true;
  state.required = true;
  writePng(path.join(directory, state.ios_screenshot));
  writePng(path.join(directory, state.web_screenshot));
  fs.writeFileSync(matrixFile, JSON.stringify(matrix));
  fs.writeFileSync(resultFile, JSON.stringify({ visual_comparisons: [] }));
  const compared = spawnSync('node', [
    path.join(root, 'scripts/compare_visual_matrix.mjs'),
    `--matrix=${matrixFile}`,
    `--run-dir=${directory}`,
    `--result=${resultFile}`,
  ], { encoding: 'utf8' });
  assert.equal(compared.status, 0, compared.stderr);
  assert.match(compared.stdout, /STATUS=PASS/);
  assert.ok(fs.existsSync(path.join(directory, state.report)));
  assert.equal(JSON.parse(fs.readFileSync(matrixFile)).screens[0].states[0].status, 'PASS');
  assert.equal(JSON.parse(fs.readFileSync(resultFile)).visual_status, 'PASS');
});

test('iOS flow runner derives all clicks from the project matrix', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-ios-flows-'));
  const matrix = createVisualMatrix(coverage());
  const matrixFile = path.join(directory, 'visual-matrix.json');
  const coverageFile = path.join(directory, 'coverage.json');
  for (const screen of matrix.screens) {
    screen.representative = true;
    for (const state of screen.states) {
      state.required = true;
      const flow = path.join(directory, state.ios_flow);
      fs.mkdirSync(path.dirname(flow), { recursive: true });
      fs.writeFileSync(flow, 'appId: example.app\n---\n- launchApp\n');
    }
  }
  fs.writeFileSync(matrixFile, JSON.stringify(matrix));
  fs.writeFileSync(coverageFile, JSON.stringify(coverage()));
  const run = spawnSync('node', [
    path.join(root, 'scripts/run_ios_visual_flows.mjs'),
    `--matrix=${matrixFile}`,
    `--coverage=${coverageFile}`,
    `--run-dir=${directory}`,
    '--dry-run',
  ], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /welcome-view-default/);
  assert.match(run.stdout, /items-view-default/);
  assert.match(run.stdout, /STATES=2/);
});
