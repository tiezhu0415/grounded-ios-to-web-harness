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
const errors = [];

for (const sourceItem of discovered) {
  const item = declaredById.get(sourceItem.id);
  if (!item) {
    errors.push(`source item missing from coverage: ${sourceItem.id}`);
    continue;
  }
  if (item.source_sha256 !== sourceItem.source_sha256) {
    errors.push(`source changed after prepare; regenerate coverage: ${sourceItem.source}`);
  }
  if (sourceItem.kind === 'screen') {
    if (item.status !== 'IMPLEMENTED') {
      errors.push(`screen is not complete: ${sourceItem.id} (${item.status || 'missing status'})`);
      continue;
    }
    if (typeof item.web !== 'string' || item.web.length === 0) {
      errors.push(`completed item has no Web file: ${sourceItem.id}`);
    } else if (!fs.existsSync(path.join(webDirectory, item.web))) {
      errors.push(`Web file does not exist for ${sourceItem.id}: ${item.web}`);
    }
    if (typeof item.route !== 'string' || !item.route.startsWith('/')) {
      errors.push(`screen has no Web route: ${sourceItem.id}`);
    }
    if (typeof item.test !== 'string' || item.test.length === 0) {
      errors.push(`screen has no behavior test: ${sourceItem.id}`);
    } else if (!fs.existsSync(path.join(webDirectory, item.test))) {
      errors.push(`test file does not exist for ${sourceItem.id}: ${item.test}`);
    }
  }
}

const discoveredIds = new Set(discovered.map((item) => item.id));
for (const item of declared) {
  if (!discoveredIds.has(item.id)) errors.push(`coverage contains stale source item: ${item.id}`);
}

if (errors.length > 0) {
  process.stderr.write(`APP COVERAGE INCOMPLETE\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`APP COVERAGE PASSED\nSCREENS=${screens.length}\nSUPPORTING_COMPONENTS=${supportingComponents.length}\n`);
