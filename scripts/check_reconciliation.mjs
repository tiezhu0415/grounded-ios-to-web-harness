#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const separator = argument.indexOf('=');
  if (separator === -1) throw new Error(`invalid argument: ${argument}`);
  return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
}));
for (const required of ['coverage', 'matrix', 'run-dir']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
const matrix = JSON.parse(fs.readFileSync(path.resolve(options.matrix), 'utf8'));
const runDirectory = path.resolve(options['run-dir']);
if (!fs.existsSync(runDirectory) || !fs.statSync(runDirectory).isDirectory()) throw new Error('run directory does not exist');
const errors = [];
const screens = Array.isArray(coverage.screens) ? coverage.screens : [];
const screenIds = new Set(screens.map((screen) => screen.id));
const matrixScreens = new Map((matrix.screens || []).map((screen) => [screen.source_id, screen]));
const stateIds = new Set((matrix.screens || []).flatMap((screen) => (screen.states || []).map((state) => state.id)));
const candidates = new Map((coverage.state_candidates || []).map((candidate) => [candidate.id, candidate]));

if (coverage.graph_discovery?.status !== 'COMPLETE') errors.push('codebase-memory graph discovery is not COMPLETE');
if (!Array.isArray(coverage.graph_discovery?.entry_points) || coverage.graph_discovery.entry_points.length === 0) {
  errors.push('codebase-memory graph discovery has no App entry point');
}
if (!Array.isArray(coverage.graph_discovery?.evidence) || coverage.graph_discovery.evidence.length === 0) {
  errors.push('codebase-memory graph discovery has no query/evidence record');
}
const graphTargets = Array.isArray(coverage.graph_discovery?.targets) ? coverage.graph_discovery.targets : [];
const graphTargetIds = new Set(graphTargets.map((target) => target.source_id));
for (const target of graphTargets) {
  if (!screenIds.has(target.source_id)) errors.push(`graph navigation target is missing from screen coverage: ${target.source_id}`);
  if (!target.evidence) errors.push(`graph navigation target has no evidence: ${target.source_id}`);
}

for (const screen of screens) {
  const label = screen.declaration || screen.id;
  if (screen.discovery?.source?.status !== 'FOUND' || !screen.discovery.source.evidence) {
    errors.push(`${label} has no source discovery evidence`);
  }
  if (screen.discovery?.graph?.status !== 'CONFIRMED') errors.push(`${label} is not confirmed by codebase-memory`);
  if (!screen.discovery?.graph?.navigation_entry) errors.push(`${label} has no navigation entry or APP_ENTRY marker`);
  if (!Array.isArray(screen.discovery?.graph?.evidence) || screen.discovery.graph.evidence.length === 0) {
    errors.push(`${label} has no codebase-memory navigation evidence`);
  }
  if (!graphTargetIds.has(screen.id)) errors.push(`${label} is absent from graph_discovery.targets`);
  if (screen.discovery?.runtime?.status !== 'VISITED') errors.push(`${label} was not visited by Maestro`);
  const flows = Array.isArray(screen.discovery?.runtime?.flow_state_ids) ? screen.discovery.runtime.flow_state_ids : [];
  if (flows.length === 0) errors.push(`${label} has no runtime state flow`);
  for (const stateId of flows) if (!stateIds.has(stateId)) errors.push(`${label} references unknown runtime state: ${stateId}`);
  if (!matrixScreens.has(screen.id)) errors.push(`${label} is missing from visual-matrix.json`);
}

for (const candidate of candidates.values()) {
  const label = `${candidate.source}:${candidate.line}`;
  if (!['MAPPED', 'NOT_USER_VISIBLE'].includes(candidate.status)) {
    errors.push(`source state candidate is unresolved: ${label} (${candidate.expression})`);
    continue;
  }
  if (candidate.status === 'NOT_USER_VISIBLE' && !candidate.note) errors.push(`non-visible state candidate needs a reason: ${label}`);
  if (candidate.status === 'MAPPED') {
    if (!Array.isArray(candidate.screen_ids) || candidate.screen_ids.length === 0) errors.push(`mapped state candidate has no screen: ${label}`);
    if (!Array.isArray(candidate.state_ids) || candidate.state_ids.length === 0) errors.push(`mapped state candidate has no visual state: ${label}`);
    for (const id of candidate.screen_ids || []) if (!screenIds.has(id)) errors.push(`state candidate references unknown screen: ${id}`);
    for (const id of candidate.state_ids || []) if (!stateIds.has(id)) errors.push(`state candidate references unknown visual state: ${id}`);
  }
}

for (const screen of matrix.screens || []) {
  for (const state of (screen.states || []).filter((item) => item.required !== false)) {
    const label = `${screen.declaration}/${state.id}`;
    if (!Array.isArray(state.discovered_by) || !state.discovered_by.includes('source') || !state.discovered_by.includes('runtime')) {
      errors.push(`${label} must be discovered by both source and runtime`);
    }
    if (!Array.isArray(state.source_evidence) || state.source_evidence.length === 0) errors.push(`${label} has no source condition evidence`);
    for (const evidence of state.source_evidence || []) {
      if (evidence.startsWith('ALWAYS_VISIBLE:')) {
        if (evidence.slice('ALWAYS_VISIBLE:'.length) !== screen.source_id) errors.push(`${label} has mismatched ALWAYS_VISIBLE evidence`);
      } else if (!candidates.has(evidence)) errors.push(`${label} references unknown source state candidate: ${evidence}`);
    }
    if (state.runtime_status !== 'CAPTURED') errors.push(`${label} was not captured in the iOS runtime`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`THREE-WAY RECONCILIATION INCOMPLETE\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`THREE-WAY RECONCILIATION PASSED\nSCREENS=${screens.length}\nSTATE_CANDIDATES=${candidates.size}\nVISUAL_STATES=${stateIds.size}\n`);
