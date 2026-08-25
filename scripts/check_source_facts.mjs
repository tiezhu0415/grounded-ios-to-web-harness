#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { CONFIDENCE_LEVELS, CRITICAL_REASONS, sha256Json, sourceFactsPayload, visualPlanPayload } from './run_contract.mjs';

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

export function validateSourceFacts({ coverage, facts, matrix, requireLocked = true, allowUnresolved = false }) {
  const errors = [];
  const allFacts = [...(facts.facts || []), ...(facts.additional_facts || [])];
  const factIds = new Set();
  for (const fact of allFacts) {
    if (!fact.id || factIds.has(fact.id)) errors.push(`fact id is missing or duplicated: ${fact.id || '<missing>'}`);
    factIds.add(fact.id);
    if (!fact.type || !fact.fact || !fact.source) errors.push(`fact is incomplete: ${fact.id || '<missing>'}`);
    if (!Array.isArray(fact.evidence) || fact.evidence.length === 0) errors.push(`fact has no evidence: ${fact.id || '<missing>'}`);
    if (!CONFIDENCE_LEVELS.has(fact.confidence)) errors.push(`fact has invalid confidence: ${fact.id || '<missing>'}`);
    if (!allowUnresolved && ['INFERRED', 'BLOCKED'].includes(fact.confidence)) errors.push(`fact is unresolved: ${fact.id || '<missing>'} (${fact.confidence})`);
  }

  for (const screen of coverage.screens || []) {
    if (!factIds.has(`screen:${screen.id}`)) errors.push(`source facts are missing screen: ${screen.id}`);
    for (const state of screen.states || []) {
      if (!factIds.has(`state:${screen.id}:${state.id}`)) errors.push(`source facts are missing Screen+State: ${screen.id}/${state.id}`);
    }
  }

  for (const area of ['static', 'graph', 'runtime', 'claude_organization']) {
    const item = facts.discovery?.[area];
    if (!item || !['COMPLETE', 'PARTIAL'].includes(item.status)) errors.push(`source discovery is unresolved: ${area}`);
    if (item?.status === 'PARTIAL' && !item.note) errors.push(`partial source discovery needs a reason: ${area}`);
    if (!Array.isArray(item?.evidence) || item.evidence.length === 0) errors.push(`source discovery has no evidence: ${area}`);
  }
  for (const area of ['data', 'assets', 'navigation']) {
    const item = facts.assessments?.[area];
    if (!item || !['CONFIRMED', 'NOT_APPLICABLE', 'BLOCKED'].includes(item.status)) errors.push(`source assessment is unresolved: ${area}`);
    if (!allowUnresolved && item?.status === 'BLOCKED') errors.push(`source assessment blocks AUTO_COMPLETE: ${area}`);
    if (item?.status !== 'CONFIRMED' && !item?.note) errors.push(`source assessment needs a reason: ${area}`);
    if (item?.status === 'CONFIRMED' && (!Array.isArray(item.evidence) || item.evidence.length === 0)) {
      errors.push(`confirmed source assessment has no evidence: ${area}`);
    }
  }

  const critical = (matrix.screens || []).filter((screen) => screen.critical === true);
  const expectedMinimum = Math.min(3, new Set((coverage.screens || []).map((screen) => screen.route).filter(Boolean)).size || (coverage.screens || []).length);
  if (critical.length < expectedMinimum) errors.push(`Critical Visual Set needs at least ${expectedMinimum} screens; found ${critical.length}`);
  const criticalRoutes = new Set();
  for (const screen of critical) {
    const sourceScreen = (coverage.screens || []).find((item) => item.id === screen.source_id);
    if (!sourceScreen) errors.push(`Critical Visual Set contains an unknown source screen: ${screen.source_id}`);
    if (sourceScreen && screen.route !== sourceScreen.route) errors.push(`Critical Visual Set route differs from coverage: ${screen.source_id}`);
    if (!screen.route || criticalRoutes.has(screen.route)) errors.push(`Critical Visual Set route is missing or duplicated: ${screen.route || '<missing>'}`);
    criticalRoutes.add(screen.route);
    if (!CRITICAL_REASONS.has(screen.selection_reason)) errors.push(`Critical Visual Set has invalid selection reason: ${screen.source_id}`);
    const required = (screen.states || []).filter((state) => state.required === true);
    if (required.length === 0) errors.push(`critical screen has no required state: ${screen.source_id}`);
    const sourceStateIds = new Set((sourceScreen?.states || []).map((state) => state.id));
    for (const state of required) if (!sourceStateIds.has(state.id)) errors.push(`Critical Visual Set contains an unknown source state: ${screen.source_id}/${state.id}`);
  }

  if (requireLocked) {
    if (facts.lock?.status !== 'LOCKED') errors.push('source facts are not LOCKED');
    const factsHash = sha256Json(sourceFactsPayload(facts));
    const visualHash = sha256Json(visualPlanPayload(matrix));
    if (facts.lock?.content_sha256 !== factsHash) errors.push('source facts changed after lock');
    if (facts.lock?.visual_plan_sha256 !== visualHash) errors.push('Critical Visual Set changed after lock');
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['coverage', 'facts', 'matrix']) if (!options[required]) throw new Error(`missing --${required}`);
  const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
  const facts = JSON.parse(fs.readFileSync(path.resolve(options.facts), 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(path.resolve(options.matrix), 'utf8'));
  const errors = validateSourceFacts({
    coverage,
    facts,
    matrix,
    requireLocked: options.unlocked !== 'true',
    allowUnresolved: options['allow-unresolved'] === 'true',
  });
  if (errors.length) {
    process.stderr.write(`SOURCE FACTS INVALID\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`SOURCE FACTS VALID\nFACTS=${(facts.facts || []).length + (facts.additional_facts || []).length}\n`);
}
