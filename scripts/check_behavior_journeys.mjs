#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { sha256Json } from './run_contract.mjs';
import { stateSnapshotsPayload, validateStateSnapshots } from './state_snapshots.mjs';

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

function safePath(root, relative, label) {
  if (typeof relative !== 'string' || relative.length === 0 || path.isAbsolute(relative)) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`${label} leaves the WebApp: ${relative}`);
  return resolved;
}

function actionEffects(fact) {
  return {
    data_effects: fact.data_effects || [],
    navigation_effect: fact.navigation_effect,
    visible_feedback: fact.visible_feedback || [],
  };
}

export function validateBehaviorJourneys({ coverage, manifest, facts, stateSnapshots, matrix, webDirectory }) {
  const errors = [];
  const journeys = Array.isArray(manifest.journeys) ? manifest.journeys : [];
  const screenCount = Array.isArray(coverage.screens) ? coverage.screens.length : 0;
  const minimum = Math.min(3, Math.max(1, screenCount));
  const declaredMinimum = Number(manifest.policy?.minimum_core_journeys);
  const ids = new Set();
  const testReferences = new Set();
  let crossRouteJourneys = 0;
  const allFacts = [...(facts?.facts || []), ...(facts?.additional_facts || [])];
  const factsById = new Map(allFacts.map((fact) => [fact.id, fact]));
  const snapshotsById = new Map((stateSnapshots?.snapshots || []).map((snapshot) => [snapshot.id, snapshot]));

  if (manifest.facts_lock_sha256 !== facts?.lock?.content_sha256) errors.push('behavior journeys use stale source facts');
  if (manifest.state_snapshots_sha256 !== facts?.lock?.state_snapshots_sha256) errors.push('behavior journeys use stale state snapshots');
  if (stateSnapshots && matrix) errors.push(...validateStateSnapshots({ coverage, matrix, snapshots: stateSnapshots, requireConfirmed: true }));

  if (!Number.isInteger(declaredMinimum) || declaredMinimum < minimum) {
    errors.push(`policy.minimum_core_journeys must be at least ${minimum}`);
  }
  if (journeys.length < declaredMinimum) errors.push(`define at least ${declaredMinimum} core journeys; found ${journeys.length}`);
  if (manifest.policy?.repair_round_limit !== 2) errors.push('policy.repair_round_limit must remain 2');

  for (const journey of journeys) {
    const id = journey.id;
    const label = id || 'missing-journey-id';
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push(`${label} has an invalid id`);
    else if (ids.has(id)) errors.push(`duplicate journey id: ${id}`);
    else ids.add(id);

    if (!Array.isArray(journey.source_evidence) || journey.source_evidence.length === 0) {
      errors.push(`${label} has no iOS source evidence`);
    }
    const routes = Array.isArray(journey.routes) ? [...new Set(journey.routes)] : [];
    if (routes.length === 0 || routes.some((route) => typeof route !== 'string' || !route.startsWith('/'))) {
      errors.push(`${label} must list valid Web routes`);
    }
    if (routes.length >= 2) crossRouteJourneys += 1;

    const steps = Array.isArray(journey.steps) ? journey.steps : [];
    const interactiveActions = new Set(['click', 'fill', 'select', 'submit', 'toggle', 'drag', 'press']);
    if (!steps.some((step) => interactiveActions.has(step.action))) {
      errors.push(`${label} has no real user interaction`);
    }
    for (const step of steps.filter((item) => interactiveActions.has(item.action))) {
      if (!step.source_fact_id) {
        errors.push(`${label} interactive step has no source_fact_id`);
        continue;
      }
      const sourceFact = factsById.get(step.source_fact_id);
      if (!sourceFact || sourceFact.type !== 'ACTION') {
        errors.push(`${label} interactive step references a missing/non-ACTION fact: ${step.source_fact_id}`);
        continue;
      }
      if (sha256Json(step.expected_effects) !== sha256Json(actionEffects(sourceFact))) {
        errors.push(`${label} expected effects differ from locked ACTION fact: ${step.source_fact_id}`);
      }
    }
    if (!Array.isArray(journey.state_snapshot_ids) || journey.state_snapshot_ids.length === 0) {
      errors.push(`${label} has no state snapshot`);
    } else {
      for (const snapshotId of journey.state_snapshot_ids) {
        const snapshot = snapshotsById.get(snapshotId);
        if (!snapshot || snapshot.status !== 'CONFIRMED') errors.push(`${label} references an unconfirmed state snapshot: ${snapshotId}`);
      }
    }
    if (!Array.isArray(journey.expected_outcomes) || journey.expected_outcomes.length === 0) {
      errors.push(`${label} has no expected outcome`);
    }
    if (journey.status !== 'PASSED') errors.push(`${label} is not PASSED`);

    if (typeof journey.web_test !== 'string' || !journey.web_test.includes('#')) {
      errors.push(`${label} web_test must use relative-file#unique-test-id`);
      continue;
    }
    if (testReferences.has(journey.web_test)) errors.push(`duplicate journey test reference: ${journey.web_test}`);
    testReferences.add(journey.web_test);
    const separator = journey.web_test.lastIndexOf('#');
    const relative = journey.web_test.slice(0, separator);
    const testId = journey.web_test.slice(separator + 1);
    try {
      const testFile = safePath(webDirectory, relative, `${label} Web test`);
      if (!fs.existsSync(testFile) || !fs.statSync(testFile).isFile()) {
        errors.push(`${label} Web test does not exist: ${relative}`);
        continue;
      }
      const source = fs.readFileSync(testFile, 'utf8');
      if (!source.includes(testId)) errors.push(`${label} Web test does not contain id: ${testId}`);
      if (!/\.(?:click|fill|check|uncheck|selectOption|press|dragTo)\s*\(/.test(source)) {
        errors.push(`${label} Web test contains no Playwright interaction`);
      }
      if (!/expect\s*\([^)]*(?:page|locator|getBy|url|text|value|count)/s.test(source)) {
        errors.push(`${label} Web test contains no observable Playwright assertion`);
      }
      if (/expect\s*\(\s*(?:true|1|['"][^'"]*['"])\s*\)/.test(source)) {
        errors.push(`${label} Web test uses a trivial assertion`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (screenCount > 1 && crossRouteJourneys === 0) errors.push('at least one core journey must cross Web routes');
  return { errors, journeys: journeys.length, crossRouteJourneys };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['coverage', 'journeys', 'facts', 'snapshots', 'matrix', 'web']) {
    if (!options[required]) throw new Error(`missing --${required}`);
  }
  const result = validateBehaviorJourneys({
    coverage: JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8')),
    manifest: JSON.parse(fs.readFileSync(path.resolve(options.journeys), 'utf8')),
    facts: JSON.parse(fs.readFileSync(path.resolve(options.facts), 'utf8')),
    stateSnapshots: JSON.parse(fs.readFileSync(path.resolve(options.snapshots), 'utf8')),
    matrix: JSON.parse(fs.readFileSync(path.resolve(options.matrix), 'utf8')),
    webDirectory: path.resolve(options.web),
  });
  if (result.errors.length > 0) {
    process.stderr.write(`CORE BEHAVIOR INCOMPLETE\n${result.errors.map((error) => `- ${error}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`CORE BEHAVIOR PASSED\nJOURNEYS=${result.journeys}\nCROSS_ROUTE=${result.crossRouteJourneys}\n`);
}
