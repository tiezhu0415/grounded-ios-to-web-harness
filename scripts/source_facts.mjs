#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

export function createSourceFacts(coverage) {
  const facts = [];
  for (const screen of coverage.screens || []) {
    facts.push({
      id: `screen:${screen.id}`,
      type: 'SCREEN',
      fact: screen.declaration,
      source: screen.source,
      evidence: [{ kind: 'STATIC_SCAN', ref: screen.discovery?.source?.evidence || screen.id }],
      confidence: 'SUPPORTED',
    });
    facts.push({
      id: `navigation:${screen.id}`,
      type: 'NAVIGATION',
      fact: `Navigation and presentation contract for ${screen.declaration}`,
      screen_id: screen.id,
      presentation: 'UNCONFIRMED',
      tab_bar_visible: null,
      owning_tab: null,
      entry_effect: screen.discovery?.graph?.navigation_entry || '',
      exit_effect: '',
      source: screen.source,
      evidence: (screen.discovery?.graph?.evidence || []).map((ref) => ({ kind: 'GRAPH', ref })),
      confidence: 'INFERRED',
    });
    for (const state of screen.states || []) {
      facts.push({
        id: `state:${screen.id}:${state.id}`,
        type: 'STATE',
        fact: state.label,
        source: screen.source,
        evidence: (state.source_evidence || []).map((ref) => ({ kind: 'STATIC_SCAN', ref })),
        confidence: state.confidence || 'SUPPORTED',
      });
    }
  }
  return {
    version: 1,
    project: coverage.project,
    generated_at: new Date().toISOString(),
    discovery: {
      static: { status: 'COMPLETE', evidence: ['项目覆盖.json'], note: '' },
      graph: { status: 'PENDING', evidence: [], note: '' },
      runtime: { status: 'PENDING', evidence: [], note: '' },
      claude_organization: { status: 'PENDING', evidence: [], note: '' },
    },
    assessments: {
      data: { status: 'PENDING', evidence: [], note: '' },
      assets: { status: 'PENDING', evidence: [], note: '' },
      navigation: { status: 'PENDING', evidence: [], note: '' },
    },
    facts,
    additional_facts: [],
    lock: { status: 'UNLOCKED', content_sha256: '', visual_plan_sha256: '', state_snapshots_sha256: '', history: [] },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  if (!options.coverage || !options.output) throw new Error('source_facts requires --coverage and --output');
  const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
  const output = path.resolve(options.output);
  fs.writeFileSync(output, `${JSON.stringify(createSourceFacts(coverage), null, 2)}\n`);
  process.stdout.write(`SOURCE FACTS CREATED\nFACTS=${(coverage.screens || []).length}\n`);
}
