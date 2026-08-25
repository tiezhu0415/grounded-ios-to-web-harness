#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function parseOptions(argv) {
  return Object.fromEntries(
    argv.map((argument) => {
      const separator = argument.indexOf('=');
      if (separator === -1) throw new Error(`invalid argument: ${argument}`);
      return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
    }),
  );
}

export function slugify(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function createVisualMatrix(coverage) {
  const screens = Array.isArray(coverage.screens) ? coverage.screens : [];
  const minimumCriticalScreens = Math.min(3, screens.length);
  return {
    version: 3,
    project: coverage.project,
    generated_at: new Date().toISOString(),
    completion_rule: 'Measure the locked Critical Visual Set only. Metrics expose visual risk; they do not prove coverage, behavior, or user acceptance.',
    quality_policy: {
      mode: 'METRICS_EXPERIMENTAL',
      metrics_are_experimental: true,
      minimum_critical_screens: minimumCriticalScreens,
      allowed_selection_reasons: ['TOP_LEVEL_NAV', 'CORE_FLOW', 'DATA_DENSE', 'STATEFUL', 'FORM_OR_MUTATION', 'UNIQUE_LAYOUT', 'HIGH_INITIAL_DIFF'],
      refinement_round_limit: 2,
      review_triage: {
        provisional: true,
        changed_ratio_at_or_above: 0.35,
        ssim_at_or_below: 0.45,
      },
      note: 'These values only flag large differences for review; they are not visual acceptance thresholds. The user still accepts the result.',
    },
    screens: screens.map((screen) => {
      const coverageStates = Array.isArray(screen.states) && screen.states.length > 0
        ? screen.states
        : [{ id: `${slugify(screen.declaration)}-default`, label: 'Default state', source_evidence: [`SOURCE:${screen.id}`] }];
      return {
        source_id: screen.id,
        declaration: screen.declaration,
        role: 'page',
        route: screen.route || '',
        critical: false,
        selection_reason: '',
        states: coverageStates.map((coverageState) => ({
            id: coverageState.id,
            label: coverageState.label,
            required: false,
            ios_flow: `flows/ios/${coverageState.id}.yaml`,
            ios_screenshot: `ios/${coverageState.id}.png`,
            web_test: `tests/e2e/visual.spec.ts#${coverageState.id}`,
            web_screenshot: `web/${coverageState.id}.png`,
            report: `visual/${coverageState.id}.json`,
            status: 'PENDING',
            review_status: 'NOT_MEASURED',
            discovered_by: ['source'],
            source_evidence: coverageState.source_evidence || [`SOURCE:${screen.id}`],
            runtime_status: 'PENDING',
            note: '',
          })),
      };
    }),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['coverage', 'output']) {
    if (!options[required]) throw new Error(`missing --${required}`);
  }
  const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
  const output = path.resolve(options.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const matrix = createVisualMatrix(coverage);
  fs.writeFileSync(output, `${JSON.stringify(matrix, null, 2)}\n`);
  process.stdout.write(`VISUAL MATRIX CREATED\nSCREENS=${matrix.screens.length}\nSTATES=${matrix.screens.reduce((sum, screen) => sum + screen.states.length, 0)}\n`);
}
