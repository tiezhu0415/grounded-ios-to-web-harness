#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function parseOptions(argv) {
  return Object.fromEntries(
    argv.map((argument) => {
      const separator = argument.indexOf('=');
      if (separator === -1) throw new Error(`invalid argument: ${argument}`);
      return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
    }),
  );
}

function safePath(root, relative, label) {
  if (typeof relative !== 'string' || relative.length === 0 || path.isAbsolute(relative)) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`${label} leaves run directory`);
  return resolved;
}

function atomicWrite(file, value) {
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

const options = parseOptions(process.argv.slice(2));
for (const required of ['matrix', 'run-dir', 'result']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const root = path.resolve(import.meta.dirname, '..');
const runDirectory = path.resolve(options['run-dir']);
const matrixFile = path.resolve(options.matrix);
const resultFile = path.resolve(options.result);
const matrix = JSON.parse(fs.readFileSync(matrixFile, 'utf8'));
const comparisons = [];
const failures = [];
const triage = matrix.quality_policy?.review_triage || {};
const changedRatioTrigger = Number(triage.changed_ratio_at_or_above);
const ssimTrigger = Number(triage.ssim_at_or_below);

if (triage.provisional !== true || !Number.isFinite(changedRatioTrigger) || !Number.isFinite(ssimTrigger)) {
  throw new Error('visual matrix is missing provisional review_triage values');
}

for (const screen of matrix.screens || []) {
  if (screen.critical !== true) continue;
  for (const state of screen.states || []) {
    if (state.required !== true) continue;
    const label = `${screen.declaration}/${state.id}`;
    const ios = safePath(runDirectory, state.ios_screenshot, `${label} iOS screenshot`);
    const web = safePath(runDirectory, state.web_screenshot, `${label} Web screenshot`);
    const report = safePath(runDirectory, state.report, `${label} report`);
    if (!fs.existsSync(ios) || !fs.existsSync(web)) {
      failures.push(`${label} is missing ${!fs.existsSync(ios) ? 'iOS' : 'Web'} screenshot`);
      state.status = 'PENDING';
      state.review_status = 'NOT_MEASURED';
      continue;
    }
    fs.mkdirSync(path.dirname(report), { recursive: true });
    const args = [
      path.join(root, 'scripts/visual_compare.py'),
      '--ios', ios,
      '--web', web,
      '--output-prefix', report.replace(/\.json$/i, ''),
    ];
    if (state.ios_crop) args.push('--ios-crop', state.ios_crop);
    if (state.web_crop) args.push('--web-crop', state.web_crop);
    const compared = spawnSync('python3', args, { encoding: 'utf8' });
    if (compared.status !== 0) {
      failures.push(`${label} comparison failed: ${(compared.stderr || compared.stdout).trim()}`);
      state.status = 'ERROR';
      state.review_status = 'NOT_MEASURED';
      continue;
    }
    const metrics = JSON.parse(fs.readFileSync(report, 'utf8'));
    state.status = 'MEASURED';
    state.metrics = {
      changed_ratio: metrics.changed_ratio,
      ssim_score: metrics.ssim_score,
      mean_channel_error: metrics.mean_channel_error,
    };
    state.review_status = state.metrics.changed_ratio >= changedRatioTrigger || state.metrics.ssim_score <= ssimTrigger
      ? 'REVIEW_RECOMMENDED'
      : 'NO_AUTOMATIC_FLAG';
    comparisons.push({
      state: state.id,
      source_id: screen.source_id,
      report: state.report,
      comparison_engine: metrics.engine?.primary,
      ...state.metrics,
      status: state.status,
      review_status: state.review_status,
    });
  }
}

atomicWrite(matrixFile, matrix);
const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
result.visual_comparisons = comparisons;
result.visual_status = failures.length === 0 ? 'MEASURED' : 'INCOMPLETE';
result.visual_review_status = failures.length > 0
  ? 'NOT_READY'
  : comparisons.some((comparison) => comparison.review_status === 'REVIEW_RECOMMENDED')
    ? 'NEEDS_VISUAL_REVIEW'
    : 'USER_REVIEW_PENDING';
atomicWrite(resultFile, result);

process.stdout.write(`VISUAL MATRIX COMPARED\nSTATES=${comparisons.length}\nSTATUS=${result.visual_status}\nREVIEW=${result.visual_review_status}\n`);
if (failures.length > 0) {
  process.stderr.write(`${failures.map((failure) => `- ${failure}`).join('\n')}\n`);
  process.exit(1);
}
