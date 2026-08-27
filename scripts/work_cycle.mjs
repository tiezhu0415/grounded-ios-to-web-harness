#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage', 'playwright-report', 'test-results', '.git']);

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

export function implementationSnapshot(webDirectory) {
  const files = walk(webDirectory).sort();
  const digest = crypto.createHash('sha256');
  for (const file of files) {
    const relative = path.relative(webDirectory, file).split(path.sep).join('/');
    digest.update(relative).update('\0').update(fs.readFileSync(file)).update('\0');
  }
  return { sha256: digest.digest('hex'), files: files.length };
}

function atomicJson(file, value) {
  const temporary = `${file}.tmp-${process.pid}-${crypto.randomUUID()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

export function createWorkCycle(project, maximumRepairRounds = 2) {
  return {
    version: 1,
    project,
    method: 'GROUNDED_FIRST_PASS_THEN_BOUNDED_REPAIR',
    phase: 'DISCOVERY',
    maximum_repair_rounds: maximumRepairRounds,
    first_pass: { status: 'PENDING' },
    repairs: [],
    last_checkpoint: null,
  };
}

export function contextKey(index) {
  return [index?.facts_lock_sha256, index?.visual_plan_sha256, index?.truth_sources_sha256, index?.state_snapshots_sha256].join(':');
}

export function checkpointWorkCycle({ cycle, stage, webDirectory, contextIndex, evidenceRefs = [] }) {
  if (!['first-pass', 'repair'].includes(stage)) throw new Error('stage must be first-pass or repair');
  if (contextIndex?.status !== 'READY') throw new Error('build context is not READY');
  const snapshot = implementationSnapshot(webDirectory);
  const checkpoint = {
    stage: stage === 'first-pass' ? 'FIRST_PASS' : 'REPAIR',
    implementation_sha256: snapshot.sha256,
    files: snapshot.files,
    facts_lock_sha256: contextIndex.facts_lock_sha256,
    context_key: contextKey(contextIndex),
    recorded_at: new Date().toISOString(),
  };
  if (stage === 'first-pass') {
    if (cycle.first_pass?.status === 'COMPLETE') throw new Error('first pass is already recorded; use a repair checkpoint after changes');
    cycle.first_pass = { status: 'COMPLETE', ...checkpoint };
    cycle.phase = 'VERIFY';
  } else {
    if (cycle.first_pass?.status !== 'COMPLETE') throw new Error('record the first pass before a repair');
    if ((cycle.repairs || []).length >= Number(cycle.maximum_repair_rounds)) {
      throw new Error(`repair round limit reached (${cycle.maximum_repair_rounds}); stop and report remaining differences`);
    }
    if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
      throw new Error('repair checkpoint requires at least one failed evidence reference');
    }
    const previousHash = cycle.last_checkpoint?.implementation_sha256;
    if (previousHash === checkpoint.implementation_sha256) {
      throw new Error('repair checkpoint did not change the WebApp implementation');
    }
    cycle.repairs ||= [];
    cycle.repairs.push({ round: cycle.repairs.length + 1, evidence: evidenceRefs, ...checkpoint });
    cycle.phase = 'VERIFY';
  }
  cycle.last_checkpoint = checkpoint;
  return cycle;
}

export function validateWorkCycle({ cycle, webDirectory, contextIndex }) {
  const errors = [];
  if (cycle?.method !== 'GROUNDED_FIRST_PASS_THEN_BOUNDED_REPAIR') errors.push('work cycle method is missing or unsupported');
  if (cycle?.first_pass?.status !== 'COMPLETE') errors.push('first-pass checkpoint is missing');
  if ((cycle?.repairs || []).length > Number(cycle?.maximum_repair_rounds)) errors.push('repair round limit was exceeded');
  let previousHash = cycle?.first_pass?.implementation_sha256;
  for (const repair of cycle?.repairs || []) {
    if (!Array.isArray(repair.evidence) || repair.evidence.length === 0) errors.push(`repair round ${repair.round} has no failed evidence reference`);
    if (repair.implementation_sha256 === previousHash) errors.push(`repair round ${repair.round} did not change the WebApp implementation`);
    previousHash = repair.implementation_sha256;
  }
  if (cycle?.last_checkpoint?.facts_lock_sha256 !== contextIndex?.facts_lock_sha256) errors.push('implementation checkpoint uses stale source facts');
  if (cycle?.last_checkpoint?.context_key !== contextKey(contextIndex)) errors.push('implementation checkpoint uses stale build context');
  if (!cycle?.last_checkpoint?.implementation_sha256) {
    errors.push('implementation checkpoint has no content hash');
  } else {
    const current = implementationSnapshot(webDirectory);
    if (current.sha256 !== cycle.last_checkpoint.implementation_sha256) errors.push('WebApp changed after the last first-pass/repair checkpoint');
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['cycle', 'web', 'context-index', 'action']) if (!options[required]) throw new Error(`missing --${required}`);
  const cycleFile = path.resolve(options.cycle);
  const webDirectory = path.resolve(options.web);
  const contextIndex = JSON.parse(fs.readFileSync(path.resolve(options['context-index']), 'utf8'));
  const cycle = JSON.parse(fs.readFileSync(cycleFile, 'utf8'));
  if (options.action === 'check') {
    const errors = validateWorkCycle({ cycle, webDirectory, contextIndex });
    if (errors.length) throw new Error(`WORK CYCLE INVALID\n${errors.map((error) => `- ${error}`).join('\n')}`);
    process.stdout.write(`WORK CYCLE VALID\nREPAIRS=${cycle.repairs.length}/${cycle.maximum_repair_rounds}\n`);
  } else if (options.action === 'checkpoint') {
    const evidenceRefs = options.evidence ? options.evidence.split(',').filter(Boolean) : [];
    checkpointWorkCycle({ cycle, stage: options.stage, webDirectory, contextIndex, evidenceRefs });
    atomicJson(cycleFile, cycle);
    process.stdout.write(`WORK CHECKPOINT RECORDED\nSTAGE=${options.stage}\nREPAIRS=${cycle.repairs.length}/${cycle.maximum_repair_rounds}\n`);
  } else {
    throw new Error('action must be checkpoint or check');
  }
}
