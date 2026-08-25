#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function getBootedSimulatorUdid() {
  const result = spawnSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error('Unable to list booted simulators');
  const data = JSON.parse(result.stdout);
  for (const runtime of Object.keys(data.devices || {})) {
    for (const device of data.devices[runtime]) {
      if (device.state === 'Booted' && device.udid) return device.udid;
    }
  }
  throw new Error('No booted iOS simulator found');
}

function parseOptions(argv) {
  const options = { dryRun: false };
  for (const argument of argv) {
    if (argument === '--dry-run') options.dryRun = true;
    else {
      const separator = argument.indexOf('=');
      if (separator === -1) throw new Error(`invalid argument: ${argument}`);
      options[argument.slice(0, separator).replace(/^--/, '')] = argument.slice(separator + 1);
    }
  }
  return options;
}

function safePath(root, relative) {
  if (typeof relative !== 'string' || relative.length === 0 || path.isAbsolute(relative)) {
    throw new Error('ios_flow must be a non-empty relative path');
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`ios_flow leaves run directory: ${relative}`);
  return resolved;
}

const options = parseOptions(process.argv.slice(2));
for (const required of ['matrix', 'coverage', 'run-dir']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}
const runDirectory = path.resolve(options['run-dir']);
const matrixFile = path.resolve(options.matrix);
const coverageFile = path.resolve(options.coverage);
const matrix = JSON.parse(fs.readFileSync(matrixFile, 'utf8'));
const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
const flows = [];
for (const screen of matrix.screens || []) {
  if (screen.critical !== true) continue;
  for (const state of screen.states || []) {
    if (state.required !== true) continue;
    const flow = safePath(runDirectory, state.ios_flow);
    if (!fs.existsSync(flow)) throw new Error(`iOS flow does not exist for ${state.id}: ${state.ios_flow}`);
    flows.push({ sourceId: screen.source_id, state, flow });
  }
}
if (flows.length === 0) throw new Error('visual matrix contains no Critical Visual Set iOS flows');

for (const item of flows) {
  process.stdout.write(`${options.dryRun ? 'WOULD RUN' : 'RUNNING'} IOS FLOW state=${item.state.id} file=${path.relative(runDirectory, item.flow)}\n`);
  if (options.dryRun) continue;
  const executed = spawnSync('maestro', ['test', item.flow], { cwd: runDirectory, encoding: 'utf8', stdio: 'inherit' });
  if (executed.error) throw executed.error;
  if (executed.status !== 0) process.exit(executed.status || 1);
  const screenshot = safePath(runDirectory, item.state.ios_screenshot);
  const screenshotResult = spawnSync('xcrun', ['simctl', 'io', getBootedSimulatorUdid(), 'screenshot', screenshot], { encoding: 'utf8' });
  if (screenshotResult.error || screenshotResult.status !== 0) {
    throw new Error(`Failed to capture iOS screenshot for ${item.state.id}: ${screenshotResult.stderr || screenshotResult.stdout}`);
  }
  item.state.runtime_status = 'CAPTURED';
  item.state.discovered_by = [...new Set([...(item.state.discovered_by || []), 'runtime'])];
  const screen = (coverage.screens || []).find((entry) => entry.id === item.sourceId);
  if (!screen) throw new Error(`visual state references unknown source screen: ${item.sourceId}`);
  screen.discovery ||= {};
  screen.discovery.runtime ||= { status: 'PENDING', flow_state_ids: [] };
  screen.discovery.runtime.status = 'VISITED';
  screen.discovery.runtime.flow_state_ids = [...new Set([...(screen.discovery.runtime.flow_state_ids || []), item.state.id])];
}
if (!options.dryRun) {
  const write = (file, value) => {
    const temporary = `${file}.tmp-${process.pid}`;
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
    fs.renameSync(temporary, file);
  };
  write(matrixFile, matrix);
  write(coverageFile, coverage);
}
process.stdout.write(`IOS VISUAL FLOWS PASSED\nSTATES=${flows.length}\n`);
