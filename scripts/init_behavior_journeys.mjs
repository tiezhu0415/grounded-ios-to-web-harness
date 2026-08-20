#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const separator = argument.indexOf('=');
  if (separator === -1) throw new Error(`invalid argument: ${argument}`);
  return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
}));
for (const required of ['coverage', 'output']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
const screenCount = Array.isArray(coverage.screens) ? coverage.screens.length : 0;
const value = {
  version: 1,
  project: coverage.project,
  generated_at: new Date().toISOString(),
  completion_rule: 'Define a small set of real action-to-outcome journeys after the first WebApp implementation. At least one journey must cross routes when the App has multiple screens.',
  policy: {
    minimum_core_journeys: Math.min(3, Math.max(1, screenCount)),
    repair_round_limit: 2,
    note: 'Journeys verify real behavior. Page-by-page screenshots are not behavior tests.',
  },
  journeys: [],
};
const output = path.resolve(options.output);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
process.stdout.write(`BEHAVIOR JOURNEYS INITIALIZED\nMINIMUM=${value.policy.minimum_core_journeys}\n`);
