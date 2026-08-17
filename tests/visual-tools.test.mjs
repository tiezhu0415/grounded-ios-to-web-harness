import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { PNG } from 'pngjs';

const root = path.resolve(import.meta.dirname, '..');

function writeImage(file, mutate = false) {
  const image = new PNG({ width: 20, height: 20 });
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const offset = (image.width * y + x) << 2;
      const changed = mutate && x >= 5 && x < 15 && y >= 5 && y < 15;
      image.data[offset] = changed ? 220 : 245;
      image.data[offset + 1] = changed ? 20 : 245;
      image.data[offset + 2] = changed ? 20 : 245;
      image.data[offset + 3] = 255;
    }
  }
  fs.writeFileSync(file, PNG.sync.write(image));
}

function runCompare(directory, changed) {
  const ios = path.join(directory, 'ios.png');
  const web = path.join(directory, 'web.png');
  const prefix = path.join(directory, changed ? 'changed' : 'same');
  writeImage(ios);
  writeImage(web, changed);
  const result = spawnSync(
    'python3',
    [path.join(root, 'scripts/visual_compare.py'), '--ios', ios, '--web', web, '--output-prefix', prefix],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(fs.readFileSync(`${prefix}.json`, 'utf8'));
}

test('Pixelmatch and SSIM report identical images without differences', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-visual-same-'));
  const report = runCompare(directory, false);
  assert.equal(report.engine.primary, 'pixelmatch');
  assert.equal(report.changed_ratio, 0);
  assert.equal(report.ssim_score, 1);
});

test('Pixelmatch and SSIM both expose a visible region change', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-visual-change-'));
  const report = runCompare(directory, true);
  assert.ok(report.changed_ratio > 0);
  assert.ok(report.ssim_score < 1);
  assert.ok(fs.existsSync(path.join(directory, 'changed-pixelmatch.png')));
});

test('coverage check requires every mapped state and the new comparison engine', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-coverage-'));
  const mapping = path.join(directory, 'mapping.md');
  const result = path.join(directory, 'result.json');
  fs.writeFileSync(mapping, '## 对比状态\n\n| 状态 ID | iOS 截图 | Web URL | 同画布尺寸 |\n| --- | --- | --- | --- |\n| first | ios-first.png | /first | 20x20 |\n| second | ios-second.png | /second | 20x20 |\n');
  fs.writeFileSync(path.join(directory, 'visual-first.json'), JSON.stringify({ engine: { primary: 'pixelmatch' }, ssim_score: 0.9 }));
  fs.writeFileSync(result, JSON.stringify({ visual_comparisons: [{ state: 'first', report: 'visual-first.json' }] }));
  const checked = spawnSync(
    'node',
    [path.join(root, 'scripts/check_visual_coverage.mjs'), `--mapping=${mapping}`, `--result=${result}`, `--run-dir=${directory}`],
    { encoding: 'utf8' },
  );
  assert.notEqual(checked.status, 0);
  assert.match(checked.stderr, /second/);

  fs.writeFileSync(path.join(directory, 'visual-second.json'), JSON.stringify({ engine: { primary: 'pixelmatch' }, ssim_score: 0.8 }));
  fs.writeFileSync(result, JSON.stringify({
    visual_comparisons: [
      { state: 'first', report: 'visual-first.json' },
      { state: 'second', report: 'visual-second.json' },
    ],
  }));
  const complete = spawnSync(
    'node',
    [path.join(root, 'scripts/check_visual_coverage.mjs'), `--mapping=${mapping}`, `--result=${result}`, `--run-dir=${directory}`],
    { encoding: 'utf8' },
  );
  assert.equal(complete.status, 0, complete.stderr);
  assert.match(complete.stdout, /STATES=first,second/);
});
