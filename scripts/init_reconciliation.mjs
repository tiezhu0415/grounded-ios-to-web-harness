#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { discoverIosViews, discoverStateCandidates } from './app_inventory.mjs';

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const separator = argument.indexOf('=');
  if (separator === -1) throw new Error(`invalid argument: ${argument}`);
  return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
}));
for (const required of ['coverage', 'matrix', 'source']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

function atomicWrite(file, value) {
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

const coverageFile = path.resolve(options.coverage);
const matrixFile = path.resolve(options.matrix);
const sourceDirectory = path.resolve(options.source);
const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
const matrix = JSON.parse(fs.readFileSync(matrixFile, 'utf8'));
const discovered = new Map(discoverIosViews(sourceDirectory).map((item) => [item.id, item]));

coverage.reconciliation_policy = 'Source declarations and codebase-memory navigation targets define page coverage. Runtime evidence is required for core journeys and representative visual states, not every implementation detail.';
coverage.graph_discovery ||= { status: 'PENDING', entry_points: [], targets: [], evidence: [], note: '' };
const previousCandidates = new Map((coverage.state_candidates || []).map((candidate) => [candidate.id, candidate]));
coverage.state_candidates = discoverStateCandidates(sourceDirectory).map((candidate) => ({
  ...candidate,
  ...(previousCandidates.get(candidate.id) || {}),
}));

for (const screen of coverage.screens || []) {
  const source = discovered.get(screen.id) || screen;
  screen.discovery ||= {};
  screen.discovery.source ||= { status: 'FOUND', evidence: `${screen.source}#${screen.declaration}` };
  screen.discovery.graph ||= { status: 'PENDING', navigation_entry: '', evidence: [], inbound: [], outbound: [] };
  screen.discovery.runtime ||= { status: 'PENDING', flow_state_ids: [] };
  if (!screen.source && source.source) screen.source = source.source;
}

for (const screen of matrix.screens || []) {
  for (const state of screen.states || []) {
    state.discovered_by ||= ['source'];
    state.source_evidence ||= [`ALWAYS_VISIBLE:${screen.source_id}`];
    state.runtime_status ||= 'PENDING';
  }
}

atomicWrite(coverageFile, coverage);
atomicWrite(matrixFile, matrix);
process.stdout.write(`RECONCILIATION INITIALIZED\nSCREENS=${coverage.screens?.length || 0}\nSTATE_CANDIDATES=${coverage.state_candidates.length}\n`);
