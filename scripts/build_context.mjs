#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { validateSourceFacts } from './check_source_facts.mjs';
import { sha256Json } from './run_contract.mjs';
import { stateSnapshotsPayload, validateStateSnapshots } from './state_snapshots.mjs';
import { createVisualGrounding } from './visual_grounding.mjs';

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

function slug(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}-${crypto.randomUUID()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function load(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function truthSourcesPayload(truthMap) {
  const keep = (item) => {
    if (!item || typeof item !== 'object') return item;
    return Object.fromEntries(['source', 'kind', 'evidence', 'url', 'screen_ids', 'state_ids']
      .filter((key) => item[key] !== undefined).map((key) => [key, item[key]]));
  };
  return {
    data_sources: (truthMap.data_sources || []).map(keep),
    assets: (truthMap.assets || []).map(keep),
    external_resources: (truthMap.external_resources || []).map(keep),
    blocked: (truthMap.blocked || []).map(keep),
  };
}

export function validateSourceTruth(truthMap) {
  const errors = [];
  if (truthMap.status !== 'CONFIRMED') errors.push('truth-map status must be CONFIRMED before implementation');
  for (const area of ['data_status', 'asset_status']) {
    if (!['CONFIRMED', 'NOT_APPLICABLE'].includes(truthMap[area])) errors.push(`truth-map ${area} must be CONFIRMED or NOT_APPLICABLE before implementation`);
  }
  if (truthMap.data_status === 'CONFIRMED' && !(truthMap.data_sources || []).length) errors.push('confirmed source data has no mappings');
  for (const collection of ['data_sources', 'assets', 'external_resources']) {
    for (const item of truthMap[collection] || []) {
      if (!item.source || !item.evidence) errors.push(`${collection} entry has no source/evidence`);
    }
  }
  return errors;
}

function relevantFacts(facts, screen) {
  const values = [...(facts.facts || []), ...(facts.additional_facts || [])];
  const graphRefs = [
    ...(screen.discovery?.graph?.evidence || []),
    ...(screen.discovery?.graph?.inbound || []),
    ...(screen.discovery?.graph?.outbound || []),
  ].map(String);
  return values.filter((fact) => (
    fact.id === `screen:${screen.id}`
    || fact.id?.startsWith(`state:${screen.id}:`)
    || fact.source === screen.source
    || fact.screen_id === screen.id
    || fact.screen_ids?.includes(screen.id)
    || graphRefs.some((ref) => `${fact.source} ${fact.fact} ${(fact.evidence || []).map((item) => item.ref).join(' ')}`.includes(ref))
  ));
}

function relevantTruth(truthMap, screen, facts) {
  const searchable = facts.map((fact) => `${fact.source} ${fact.fact} ${(fact.evidence || []).map((item) => item.ref).join(' ')}`).join('\n');
  const matches = (item) => (
    item.screen_ids?.includes(screen.id)
    || [item.source, item.evidence].filter(Boolean).some((value) => searchable.includes(value))
  );
  return {
    data_sources: (truthMap.data_sources || []).filter(matches),
    assets: (truthMap.assets || []).filter(matches),
    external_resources: (truthMap.external_resources || []).filter(matches),
    blocked: (truthMap.blocked || []).filter(matches),
  };
}

export function validateContextIndex({ coverage, facts, matrix, truthMap, stateSnapshots, runDirectory, index }) {
  const errors = validateSourceTruth(truthMap);
  errors.push(...validateStateSnapshots({ coverage, matrix, snapshots: stateSnapshots, requireConfirmed: true }));
  if (index?.status !== 'READY') errors.push('context index is not READY');
  if (index?.facts_version !== facts.version || index?.facts_lock_sha256 !== facts.lock?.content_sha256) errors.push('context index uses stale source facts');
  if (index?.visual_plan_sha256 !== facts.lock?.visual_plan_sha256) errors.push('context index uses a stale Critical Visual Set');
  if (index?.truth_sources_sha256 !== sha256Json(truthSourcesPayload(truthMap))) errors.push('context index uses stale Data/Asset source truth');
  if (index?.state_snapshots_sha256 !== sha256Json(stateSnapshotsPayload(stateSnapshots))) errors.push('context index uses stale state snapshots');
  const entries = new Map((index?.contexts || []).map((item) => [item.source_id, item]));
  for (const screen of coverage.screens || []) {
    const entry = entries.get(screen.id);
    if (!entry) {
      errors.push(`context is missing for screen: ${screen.id}`);
      continue;
    }
    const file = path.resolve(runDirectory, entry.file || '');
    if (!file.startsWith(`${path.resolve(runDirectory)}${path.sep}`) || !fs.existsSync(file)) {
      errors.push(`context file is missing or unsafe: ${entry.file || '<missing>'}`);
      continue;
    }
    const context = load(file);
    if (context.facts_lock_sha256 !== facts.lock?.content_sha256) errors.push(`context is stale: ${screen.id}`);
    if (sha256Json(context) !== entry.sha256) errors.push(`context content changed after generation: ${screen.id}`);
  }
  const requiredStates = (matrix.screens || []).filter((screen) => screen.critical === true)
    .flatMap((screen) => (screen.states || []).filter((state) => state.required === true).map((state) => state.id));
  const grounded = new Set((index?.visual_grounding || []).map((item) => item.state_id));
  for (const stateId of requiredStates) if (!grounded.has(stateId)) errors.push(`visual grounding is missing for critical state: ${stateId}`);
  for (const item of index?.visual_grounding || []) {
    const groundingFile = path.resolve(runDirectory, item.file || '');
    if (!groundingFile.startsWith(`${path.resolve(runDirectory)}${path.sep}`) || !fs.existsSync(groundingFile)) {
      errors.push(`visual grounding file is missing or unsafe: ${item.file || '<missing>'}`);
      continue;
    }
    const grounding = load(groundingFile);
    if (sha256Json(grounding) !== item.grounding_sha256) errors.push(`visual grounding content changed: ${item.state_id}`);
    if (grounding.facts_lock_sha256 !== facts.lock?.content_sha256) errors.push(`visual grounding uses stale facts: ${item.state_id}`);
    const screenshot = path.resolve(runDirectory, grounding.screenshot?.path || '');
    if (!screenshot.startsWith(`${path.resolve(runDirectory)}${path.sep}`) || !fs.existsSync(screenshot)) {
      errors.push(`grounded iOS screenshot is missing or unsafe: ${item.state_id}`);
    } else if (sha256File(screenshot) !== grounding.screenshot.sha256 || grounding.screenshot.sha256 !== item.screenshot_sha256) {
      errors.push(`grounded iOS screenshot changed: ${item.state_id}`);
    }
  }
  return errors;
}

export function createBuildContexts({ coverage, facts, matrix, truthMap, stateSnapshots, runDirectory, ocrLanguage = 'eng', noOcr = false }) {
  const factErrors = validateSourceFacts({ coverage, facts, matrix, snapshots: stateSnapshots, requireLocked: true, allowUnresolved: false });
  if (factErrors.length) throw new Error(`cannot build contexts from invalid facts:\n${factErrors.map((error) => `- ${error}`).join('\n')}`);
  const truthErrors = validateSourceTruth(truthMap);
  if (truthErrors.length) throw new Error(`cannot build contexts from incomplete source truth:\n${truthErrors.map((error) => `- ${error}`).join('\n')}`);
  const snapshotErrors = validateStateSnapshots({ coverage, matrix, snapshots: stateSnapshots, requireConfirmed: true });
  if (snapshotErrors.length) throw new Error(`cannot build contexts from invalid state snapshots:\n${snapshotErrors.map((error) => `- ${error}`).join('\n')}`);
  const grounding = createVisualGrounding({ matrix, facts, truthMap, runDirectory, ocrLanguage, noOcr });
  const groundingBySource = new Map();
  for (const item of grounding) {
    const current = groundingBySource.get(item.source_id) || [];
    current.push(item.file);
    groundingBySource.set(item.source_id, current);
  }
  const contexts = [];
  for (const screen of coverage.screens || []) {
    const factsForScreen = relevantFacts(facts, screen);
    const context = {
      version: 1,
      purpose: 'Small, current edit context for one source screen. It constrains facts, not React implementation choices.',
      project: coverage.project,
      source_id: screen.id,
      declaration: screen.declaration,
      source: screen.source,
      route: screen.route,
      facts_version: facts.version,
      facts_lock_sha256: facts.lock.content_sha256,
      visual_plan_sha256: facts.lock.visual_plan_sha256,
      source_facts: factsForScreen,
      discovery: screen.discovery,
      states: screen.states || [],
      state_snapshots: (stateSnapshots.snapshots || []).filter((snapshot) => snapshot.screen_id === screen.id),
      truth: relevantTruth(truthMap, screen, factsForScreen),
      visual_grounding: groundingBySource.get(screen.id) || [],
      implementation_freedom: 'Choose React structure, libraries, and component boundaries freely. Do not invent source facts or copy screenshots into the Web UI.',
      generated_at: new Date().toISOString(),
    };
    const identity = crypto.createHash('sha256').update(screen.id).digest('hex').slice(0, 8);
    const relative = `contexts/${slug(screen.declaration || screen.id)}-${identity}.json`;
    atomicJson(path.join(runDirectory, relative), context);
    contexts.push({ source_id: screen.id, file: relative, sha256: sha256Json(context) });
  }
  const index = {
    version: 1,
    status: 'READY',
    project: coverage.project,
    facts_version: facts.version,
    facts_lock_sha256: facts.lock.content_sha256,
    visual_plan_sha256: facts.lock.visual_plan_sha256,
    truth_sources_sha256: sha256Json(truthSourcesPayload(truthMap)),
    state_snapshots_sha256: sha256Json(stateSnapshotsPayload(stateSnapshots)),
    contexts,
    visual_grounding: grounding,
    generated_at: new Date().toISOString(),
  };
  atomicJson(path.join(runDirectory, 'context-index.json'), index);
  return index;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['coverage', 'facts', 'matrix', 'truth-map', 'state-snapshots', 'run-dir']) if (!options[required]) throw new Error(`missing --${required}`);
  const inputs = {
    coverage: load(options.coverage), facts: load(options.facts), matrix: load(options.matrix), truthMap: load(options['truth-map']), stateSnapshots: load(options['state-snapshots']),
    runDirectory: path.resolve(options['run-dir']), ocrLanguage: options['ocr-language'] || 'eng', noOcr: options['no-ocr'] === 'true',
  };
  if (options.check === 'true') {
    const indexFile = path.join(inputs.runDirectory, 'context-index.json');
    if (!fs.existsSync(indexFile)) throw new Error('context-index.json is missing; run ./harness context before implementation');
    const errors = validateContextIndex({ ...inputs, index: load(indexFile) });
    if (errors.length) throw new Error(`BUILD CONTEXT INVALID\n${errors.map((error) => `- ${error}`).join('\n')}`);
    process.stdout.write(`BUILD CONTEXT VALID\nSCREENS=${inputs.coverage.screens?.length || 0}\n`);
  } else {
    const index = createBuildContexts(inputs);
    process.stdout.write(`BUILD CONTEXT READY\nSCREENS=${index.contexts.length}\nVISUAL_STATES=${index.visual_grounding.length}\n`);
  }
}
