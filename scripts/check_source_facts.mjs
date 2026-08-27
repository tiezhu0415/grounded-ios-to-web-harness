#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  CONFIDENCE_LEVELS,
  CRITICAL_REASONS,
  FACT_TYPES,
  NAVIGATION_EFFECTS,
  PRESENTATION_MODES,
  sha256Json,
  sourceFactsPayload,
  visualPlanPayload,
} from './run_contract.mjs';
import { stateSnapshotsPayload, validateStateSnapshots } from './state_snapshots.mjs';

const PLACEHOLDER_PATTERN = /(?:refine\s+after|todo|tbd|placeholder|待填写|稍后补充|pending\s+confirmation)/i;

function containsPlaceholder(value) {
  if (typeof value === 'string') return PLACEHOLDER_PATTERN.test(value);
  if (Array.isArray(value)) return value.some(containsPlaceholder);
  if (value && typeof value === 'object') return Object.values(value).some(containsPlaceholder);
  return false;
}

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

export function validateSourceFacts({ coverage, facts, matrix, snapshots, requireLocked = true, allowUnresolved = false }) {
  const errors = [];
  const allFacts = [...(facts.facts || []), ...(facts.additional_facts || [])];
  const factIds = new Set();
  const screenIds = new Set((coverage.screens || []).map((screen) => screen.id));
  const routes = new Set((coverage.screens || []).map((screen) => screen.route).filter(Boolean));
  const navigationByScreen = new Map();
  const actionsByScreen = new Map();
  for (const fact of allFacts) {
    if (!fact.id || factIds.has(fact.id)) errors.push(`fact id is missing or duplicated: ${fact.id || '<missing>'}`);
    factIds.add(fact.id);
    if (!FACT_TYPES.has(fact.type) || !fact.fact || !fact.source) errors.push(`fact is incomplete or has unsupported type: ${fact.id || '<missing>'}`);
    if (PLACEHOLDER_PATTERN.test(String(fact.fact || ''))) errors.push(`fact still contains placeholder content: ${fact.id || '<missing>'}`);
    if (!Array.isArray(fact.evidence) || fact.evidence.length === 0) errors.push(`fact has no evidence: ${fact.id || '<missing>'}`);
    if (!CONFIDENCE_LEVELS.has(fact.confidence)) errors.push(`fact has invalid confidence: ${fact.id || '<missing>'}`);
    if (!allowUnresolved && ['INFERRED', 'BLOCKED'].includes(fact.confidence)) errors.push(`fact is unresolved: ${fact.id || '<missing>'} (${fact.confidence})`);

    if (fact.type === 'NAVIGATION') {
      if (!screenIds.has(fact.screen_id)) errors.push(`navigation fact references unknown screen: ${fact.id || '<missing>'}`);
      if (navigationByScreen.has(fact.screen_id)) errors.push(`screen has duplicate navigation facts: ${fact.screen_id}`);
      navigationByScreen.set(fact.screen_id, fact);
      if (!PRESENTATION_MODES.has(fact.presentation)) errors.push(`navigation fact has invalid presentation: ${fact.id || '<missing>'}`);
      if (typeof fact.tab_bar_visible !== 'boolean') errors.push(`navigation fact must declare tab_bar_visible: ${fact.id || '<missing>'}`);
      if (!(fact.owning_tab === null || typeof fact.owning_tab === 'string')) errors.push(`navigation fact has invalid owning_tab: ${fact.id || '<missing>'}`);
      if (!fact.entry_effect || !fact.exit_effect) errors.push(`navigation fact must declare entry and exit effects: ${fact.id || '<missing>'}`);
      if (containsPlaceholder({ presentation: fact.presentation, entry_effect: fact.entry_effect, exit_effect: fact.exit_effect })) {
        errors.push(`navigation fact still contains placeholder content: ${fact.id || '<missing>'}`);
      }
    }

    if (fact.type === 'ACTION') {
      if (!screenIds.has(fact.screen_id)) errors.push(`action fact references unknown screen: ${fact.id || '<missing>'}`);
      const current = actionsByScreen.get(fact.screen_id) || [];
      current.push(fact);
      actionsByScreen.set(fact.screen_id, current);
      if (!fact.action || PLACEHOLDER_PATTERN.test(String(fact.action))) errors.push(`action fact has no confirmed trigger: ${fact.id || '<missing>'}`);
      for (const field of ['preconditions', 'data_effects', 'visible_feedback']) {
        if (!Array.isArray(fact[field])) errors.push(`action fact ${field} must be an array: ${fact.id || '<missing>'}`);
      }
      const effect = fact.navigation_effect;
      if (!effect || !NAVIGATION_EFFECTS.has(effect.kind)) errors.push(`action fact has invalid navigation_effect: ${fact.id || '<missing>'}`);
      if (effect && ['PUSH', 'PRESENT', 'SWITCH_TAB', 'EXTERNAL'].includes(effect.kind) && !effect.target) {
        errors.push(`action navigation effect needs a target: ${fact.id || '<missing>'}`);
      }
      if (effect && ['PUSH', 'PRESENT', 'SWITCH_TAB'].includes(effect.kind) && effect.target && !routes.has(effect.target)) {
        errors.push(`action navigation target is not a covered Web route: ${fact.id || '<missing>'} -> ${effect.target}`);
      }
      if ((fact.data_effects || []).length === 0 && (fact.visible_feedback || []).length === 0 && ['NONE', 'STAY'].includes(effect?.kind)) {
        errors.push(`action fact has no observable postcondition: ${fact.id || '<missing>'}`);
      }
      if (!(fact.evidence || []).some((item) => ['SOURCE', 'STATIC_SCAN', 'GRAPH', 'RUNTIME'].includes(item.kind) && item.ref)) {
        errors.push(`action fact has no source/runtime evidence: ${fact.id || '<missing>'}`);
      }
      if (containsPlaceholder({ action: fact.action, preconditions: fact.preconditions, data_effects: fact.data_effects, navigation_effect: fact.navigation_effect, visible_feedback: fact.visible_feedback })) {
        errors.push(`action fact still contains placeholder content: ${fact.id || '<missing>'}`);
      }
    }
  }

  for (const screen of coverage.screens || []) {
    if (!factIds.has(`screen:${screen.id}`)) errors.push(`source facts are missing screen: ${screen.id}`);
    for (const state of screen.states || []) {
      if (!factIds.has(`state:${screen.id}:${state.id}`)) errors.push(`source facts are missing Screen+State: ${screen.id}/${state.id}`);
    }
    if (!navigationByScreen.has(screen.id)) errors.push(`source facts are missing navigation/presentation: ${screen.id}`);
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
    if (['CORE_FLOW', 'FORM_OR_MUTATION'].includes(screen.selection_reason) && !(actionsByScreen.get(screen.source_id) || []).length) {
      errors.push(`critical interactive screen has no ACTION fact: ${screen.source_id}`);
    }
  }

  if (!snapshots) errors.push('state-snapshots.json is missing');
  else errors.push(...validateStateSnapshots({ coverage, matrix, snapshots, requireConfirmed: !allowUnresolved }));

  if (requireLocked) {
    if (facts.lock?.status !== 'LOCKED') errors.push('source facts are not LOCKED');
    const factsHash = sha256Json(sourceFactsPayload(facts));
    const visualHash = sha256Json(visualPlanPayload(matrix));
    const snapshotsHash = snapshots ? sha256Json(stateSnapshotsPayload(snapshots)) : '';
    if (facts.lock?.content_sha256 !== factsHash) errors.push('source facts changed after lock');
    if (facts.lock?.visual_plan_sha256 !== visualHash) errors.push('Critical Visual Set changed after lock');
    if (facts.lock?.state_snapshots_sha256 !== snapshotsHash) errors.push('state snapshots changed after lock');
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['coverage', 'facts', 'matrix', 'snapshots']) if (!options[required]) throw new Error(`missing --${required}`);
  const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
  const facts = JSON.parse(fs.readFileSync(path.resolve(options.facts), 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(path.resolve(options.matrix), 'utf8'));
  const snapshots = JSON.parse(fs.readFileSync(path.resolve(options.snapshots), 'utf8'));
  const errors = validateSourceFacts({
    coverage,
    facts,
    matrix,
    snapshots,
    requireLocked: options.unlocked !== 'true',
    allowUnresolved: options['allow-unresolved'] === 'true',
  });
  if (errors.length) {
    process.stderr.write(`SOURCE FACTS INVALID\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`SOURCE FACTS VALID\nFACTS=${(facts.facts || []).length + (facts.additional_facts || []).length}\n`);
}
