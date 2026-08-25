#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { discoverIosViews } from './app_inventory.mjs';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }),
);

for (const required of ['coverage', 'source', 'web']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const coverage = JSON.parse(fs.readFileSync(options.coverage, 'utf8'));
const sourceDirectory = path.resolve(options.source);
const webDirectory = path.resolve(options.web);
const discovered = discoverIosViews(sourceDirectory);
const screens = Array.isArray(coverage.screens) ? coverage.screens : [];
const supportingComponents = Array.isArray(coverage.supporting_components) ? coverage.supporting_components : [];
const declared = [...screens, ...supportingComponents];
const declaredById = new Map(declared.map((item) => [item.id, item]));
const screenIds = new Set(screens.map((item) => item.id));
const errors = [];
const seenStateIds = new Set();
const seenRenderTests = new Set();

function safeWebFile(relative, label) {
  if (typeof relative !== 'string' || relative.length === 0 || path.isAbsolute(relative)) {
    errors.push(`${label} must be a relative path`);
    return null;
  }
  const resolved = path.resolve(webDirectory, relative);
  if (!resolved.startsWith(`${webDirectory}${path.sep}`)) {
    errors.push(`${label} leaves the WebApp: ${relative}`);
    return null;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    errors.push(`${label} does not exist: ${relative}`);
    return null;
  }
  return resolved;
}

function validateScreen(item, id) {
  if (item.status !== 'IMPLEMENTED') {
    errors.push(`screen is not complete: ${id} (${item.status || 'missing status'})`);
    return;
  }
  if (typeof item.web !== 'string' || item.web.length === 0) {
    errors.push(`completed item has no Web file: ${id}`);
  } else safeWebFile(item.web, `Web file for ${id}`);
  if (typeof item.route !== 'string' || !item.route.startsWith('/')) {
    errors.push(`screen has no Web route: ${id}`);
  }
  if (typeof item.test !== 'string' || item.test.length === 0) {
    errors.push(`screen has no behavior test: ${id}`);
  } else safeWebFile(item.test, `behavior test for ${id}`);

  const states = Array.isArray(item.states) ? item.states : [];
  if (states.length === 0) errors.push(`screen has no explicit states: ${id}`);
  for (const state of states) {
    const label = `${id}/${state.id || '<missing>'}`;
    if (typeof state.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(state.id)) {
      errors.push(`screen state has invalid id: ${label}`);
      continue;
    }
    if (seenStateIds.has(state.id)) errors.push(`duplicate Screen+State id: ${state.id}`);
    seenStateIds.add(state.id);
    if (state.status !== 'IMPLEMENTED') errors.push(`screen state is not implemented: ${label} (${state.status || 'missing status'})`);
    if (typeof state.web_route !== 'string' || !state.web_route.startsWith('/')) errors.push(`screen state has no Web route: ${label}`);
    if (state.web_route && item.route && state.web_route !== item.route) errors.push(`screen state route differs from screen route: ${label}`);
    if (state.render_status !== 'PASSED') errors.push(`screen state basic render did not pass: ${label}`);
    if (!Array.isArray(state.source_evidence) || state.source_evidence.length === 0) errors.push(`screen state has no source evidence: ${label}`);
    if (!['CONFIRMED', 'SUPPORTED'].includes(state.confidence)) errors.push(`screen state confidence is not sufficient: ${label}`);
    if (typeof state.render_test !== 'string' || !state.render_test.includes('#')) {
      errors.push(`screen state render_test must use relative-file#test-id: ${label}`);
      continue;
    }
    if (seenRenderTests.has(state.render_test)) errors.push(`screen states reuse the same render test: ${state.render_test}`);
    seenRenderTests.add(state.render_test);
    const separator = state.render_test.lastIndexOf('#');
    const testFile = safeWebFile(state.render_test.slice(0, separator), `basic render test for ${label}`);
    const testId = state.render_test.slice(separator + 1);
    if (!testId) errors.push(`screen state render test has no test id: ${label}`);
    if (testFile) {
      const testSource = fs.readFileSync(testFile, 'utf8');
      if (!testSource.includes(testId)) errors.push(`basic render test does not contain test id ${testId}: ${label}`);
      if (!/\b(?:goto|navigate)\s*\(/.test(testSource) || !/\bexpect\s*\(/.test(testSource)) {
        errors.push(`basic render test must open and assert the page: ${label}`);
      }
      if (!/(?:console|pageerror|naturalWidth|\.complete\b)/.test(testSource)) {
        errors.push(`basic render test must check console errors or image loading: ${label}`);
      }
    }
  }
}

for (const sourceItem of discovered) {
  const item = declaredById.get(sourceItem.id);
  if (!item) {
    errors.push(`source item missing from coverage: ${sourceItem.id}`);
    continue;
  }
  if (item.source_sha256 !== sourceItem.source_sha256) {
    errors.push(`source changed after prepare; regenerate coverage: ${sourceItem.source}`);
  }
  if (screenIds.has(sourceItem.id)) validateScreen(item, sourceItem.id);
}

const discoveredIds = new Set(discovered.map((item) => item.id));
for (const item of declared) {
  if (discoveredIds.has(item.id)) continue;
  if (screenIds.has(item.id) && item.discovery?.graph?.status === 'CONFIRMED') validateScreen(item, item.id);
  else errors.push(`coverage contains stale or unconfirmed source item: ${item.id}`);
}

if (errors.length > 0) {
  process.stderr.write(`APP COVERAGE INCOMPLETE\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`APP COVERAGE PASSED\nSCREENS=${screens.length}\nSTATES=${seenStateIds.size}\nSUPPORTING_COMPONENTS=${supportingComponents.length}\n`);
