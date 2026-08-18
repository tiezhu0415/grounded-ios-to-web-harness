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
  return {
    version: 1,
    project: coverage.project,
    generated_at: new Date().toISOString(),
    completion_rule: 'Every source screen needs at least one matched iOS/Web state, a repeatable iOS flow, a Web behavior test, and an acceptable Pixelmatch + SSIM report.',
    quality_policy: {
      max_changed_ratio: 0.25,
      min_ssim_score: 0.65,
      refinement_round_limit: 2,
      note: 'These broad limits catch structural redesigns. The user performs the final visual acceptance.',
    },
    screens: screens.map((screen) => {
      const stateId = `${slugify(screen.declaration)}-default`;
      return {
        source_id: screen.id,
        declaration: screen.declaration,
        role: 'page',
        route: screen.route || '',
        states: [
          {
            id: stateId,
            label: 'Default meaningful state; replace or add states after source/runtime analysis.',
            required: true,
            ios_flow: `flows/ios/${stateId}.yaml`,
            ios_screenshot: `ios/${stateId}.png`,
            web_test: `tests/e2e/visual.spec.ts#${stateId}`,
            web_screenshot: `web/${stateId}.png`,
            report: `visual/${stateId}.json`,
            status: 'PENDING',
            discovered_by: ['source'],
            source_evidence: [`ALWAYS_VISIBLE:${screen.id}`],
            runtime_status: 'PENDING',
            note: '',
          },
        ],
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
