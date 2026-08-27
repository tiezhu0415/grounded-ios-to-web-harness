#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const CONFIRMED_LEVELS = new Set(['CONFIRMED', 'SUPPORTED']);
const PLACEHOLDER_PATTERN = /(?:refine\s+after|todo|tbd|placeholder|待填写|稍后补充|pending\s+confirmation)/i;

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

function containsPlaceholder(value) {
  if (typeof value === 'string') return PLACEHOLDER_PATTERN.test(value);
  if (Array.isArray(value)) return value.some(containsPlaceholder);
  if (value && typeof value === 'object') return Object.values(value).some(containsPlaceholder);
  return false;
}

export function stateSnapshotsPayload(value) {
  return {
    version: value.version,
    project: value.project,
    snapshots: value.snapshots || [],
  };
}

export function createStateSnapshots(coverage, matrix) {
  const matrixByScreen = new Map((matrix.screens || []).map((screen) => [screen.source_id, screen]));
  return {
    version: 1,
    project: coverage.project,
    purpose: 'Bind iOS and Web evidence to the same source-backed runtime state. Values are project data; the contract is generic.',
    generated_at: new Date().toISOString(),
    snapshots: (coverage.screens || []).flatMap((screen) => {
      const visualStates = new Map((matrixByScreen.get(screen.id)?.states || []).map((state) => [state.id, state]));
      const sourceStates = Array.isArray(screen.states) && screen.states.length > 0 ? screen.states : [...visualStates.values()];
      return sourceStates.map((state) => ({
        id: state.id,
        screen_id: screen.id,
        state_id: state.id,
        status: 'PENDING',
        confidence: 'INFERRED',
        identity: {},
        source_evidence: [],
        ios_setup: {
          flow: visualStates.get(state.id)?.ios_flow || '',
          evidence: [],
        },
        web_setup: {
          test: visualStates.get(state.id)?.web_test || '',
          seed_evidence: [],
        },
      }));
    }),
  };
}

export function validateStateSnapshots({ coverage, matrix, snapshots, requireConfirmed = true }) {
  const errors = [];
  if (snapshots?.version !== 1) errors.push('state-snapshots version must be 1');
  if (snapshots?.project !== coverage?.project) errors.push('state-snapshots project differs from coverage');

  const coverageStates = new Map();
  for (const screen of coverage.screens || []) {
    const matrixScreen = (matrix.screens || []).find((item) => item.source_id === screen.id);
    const sourceStates = Array.isArray(screen.states) && screen.states.length > 0 ? screen.states : (matrixScreen?.states || []);
    for (const state of sourceStates) coverageStates.set(state.id, { screen, state });
  }
  const entries = new Map();
  for (const snapshot of snapshots?.snapshots || []) {
    const label = snapshot.id || '<missing>';
    if (typeof snapshot.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(snapshot.id)) {
      errors.push(`state snapshot has an invalid id: ${label}`);
      continue;
    }
    if (entries.has(snapshot.id)) errors.push(`duplicate state snapshot: ${snapshot.id}`);
    entries.set(snapshot.id, snapshot);
    const source = coverageStates.get(snapshot.state_id);
    if (!source) errors.push(`state snapshot references unknown state: ${snapshot.state_id || label}`);
    if (source && source.screen.id !== snapshot.screen_id) errors.push(`state snapshot screen differs from coverage: ${label}`);
    if (!['PENDING', 'CONFIRMED', 'BLOCKED'].includes(snapshot.status)) errors.push(`state snapshot has invalid status: ${label}`);
    if (snapshot.status !== 'CONFIRMED') continue;
    if (!CONFIRMED_LEVELS.has(snapshot.confidence)) errors.push(`confirmed state snapshot has weak confidence: ${label}`);
    if (!snapshot.identity || Array.isArray(snapshot.identity) || typeof snapshot.identity !== 'object' || Object.keys(snapshot.identity).length === 0) {
      errors.push(`confirmed state snapshot has no identity values: ${label}`);
    }
    if (!Array.isArray(snapshot.source_evidence) || snapshot.source_evidence.length === 0) {
      errors.push(`confirmed state snapshot has no source evidence: ${label}`);
    }
    if (!snapshot.ios_setup?.flow || !Array.isArray(snapshot.ios_setup?.evidence) || snapshot.ios_setup.evidence.length === 0) {
      errors.push(`confirmed state snapshot has no iOS setup evidence: ${label}`);
    }
    if (typeof snapshot.web_setup?.test !== 'string' || !snapshot.web_setup.test.includes('#')) {
      errors.push(`confirmed state snapshot has no Web setup test: ${label}`);
    }
    if (!Array.isArray(snapshot.web_setup?.seed_evidence) || snapshot.web_setup.seed_evidence.length === 0) {
      errors.push(`confirmed state snapshot has no Web seed evidence: ${label}`);
    }
    if (containsPlaceholder(snapshot)) errors.push(`confirmed state snapshot still contains placeholder content: ${label}`);
  }

  for (const stateId of coverageStates.keys()) {
    if (!entries.has(stateId)) errors.push(`state snapshot is missing for Screen+State: ${stateId}`);
  }
  for (const snapshot of entries.values()) {
    if (!coverageStates.has(snapshot.state_id)) continue;
    if (snapshot.id !== snapshot.state_id) errors.push(`state snapshot id must equal state id: ${snapshot.id}/${snapshot.state_id}`);
  }

  for (const screen of (matrix.screens || []).filter((item) => item.critical === true)) {
    for (const state of (screen.states || []).filter((item) => item.required === true)) {
      const snapshotId = state.state_snapshot_id || state.id;
      if (snapshotId !== state.id) errors.push(`visual state must use its matching state snapshot: ${state.id}/${snapshotId}`);
      const snapshot = entries.get(snapshotId);
      if (!snapshot) {
        errors.push(`critical visual state has no state snapshot: ${state.id}`);
      } else if (requireConfirmed && snapshot.status !== 'CONFIRMED') {
        errors.push(`critical visual state snapshot is not CONFIRMED: ${state.id}`);
      }
    }
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['coverage', 'matrix']) if (!options[required]) throw new Error(`missing --${required}`);
  const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(path.resolve(options.matrix), 'utf8'));
  if (options.output) {
    const output = path.resolve(options.output);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(createStateSnapshots(coverage, matrix), null, 2)}\n`);
    process.stdout.write(`STATE SNAPSHOTS CREATED\nSTATES=${coverage.screens?.reduce((sum, screen) => sum + (screen.states?.length || 0), 0) || 0}\n`);
  } else {
    if (!options.snapshots) throw new Error('missing --snapshots');
    const snapshots = JSON.parse(fs.readFileSync(path.resolve(options.snapshots), 'utf8'));
    const errors = validateStateSnapshots({ coverage, matrix, snapshots, requireConfirmed: options['allow-pending'] !== 'true' });
    if (errors.length) {
      process.stderr.write(`STATE SNAPSHOTS INVALID\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
      process.exit(1);
    }
    process.stdout.write(`STATE SNAPSHOTS VALID\nSNAPSHOTS=${snapshots.snapshots?.length || 0}\n`);
  }
}
