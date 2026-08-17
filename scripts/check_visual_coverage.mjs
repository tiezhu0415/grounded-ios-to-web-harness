#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }),
);

for (const required of ['mapping', 'result', 'run-dir']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const mapping = fs.readFileSync(options.mapping, 'utf8').split(/\r?\n/);
const heading = mapping.findIndex((line) => /^##\s+对比状态\s*$/.test(line.trim()));
if (heading === -1) throw new Error('组件映射.md 缺少“对比状态”表');

const states = [];
for (const line of mapping.slice(heading + 1)) {
  if (/^##\s+/.test(line.trim())) break;
  if (!line.trim().startsWith('|')) continue;
  const cells = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim().replace(/^`|`$/g, ''));
  const state = cells[0] ?? '';
  if (/^[a-z0-9][a-z0-9-]*$/.test(state)) states.push(state);
}

if (states.length === 0) throw new Error('“对比状态”表至少要声明一个状态 ID');
if (new Set(states).size !== states.length) throw new Error('“对比状态”表包含重复状态 ID');

const result = JSON.parse(fs.readFileSync(options.result, 'utf8'));
const comparisons = Array.isArray(result.visual_comparisons) ? result.visual_comparisons : [];
const byState = new Map(comparisons.map((comparison) => [comparison.state, comparison]));

for (const state of states) {
  const comparison = byState.get(state);
  if (!comparison) throw new Error(`状态 ${state} 缺少视觉比较；请运行 ./harness compare`);
  if (typeof comparison.report !== 'string') throw new Error(`状态 ${state} 缺少比较报告路径`);
  const reportPath = path.join(options['run-dir'], comparison.report);
  if (!fs.existsSync(reportPath)) throw new Error(`状态 ${state} 的比较报告不存在: ${comparison.report}`);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  if (report.engine?.primary !== 'pixelmatch' || typeof report.ssim_score !== 'number') {
    throw new Error(`状态 ${state} 尚未使用 Pixelmatch + SSIM；请重新运行 ./harness compare`);
  }
}

process.stdout.write(`VISUAL COVERAGE PASSED\nSTATES=${states.join(',')}\n`);
