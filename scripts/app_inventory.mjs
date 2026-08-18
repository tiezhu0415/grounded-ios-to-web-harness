#!/usr/bin/env node

import crypto from 'node:crypto';
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

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (new Set(['.git', 'Pods', 'DerivedData', 'build', 'node_modules']).has(entry.name)) return [];
      return walk(fullPath);
    }
    return [fullPath];
  });
}

function withoutDebugBlocks(source) {
  return source.replace(/#if\s+DEBUG[\s\S]*?#endif/g, (block) => block.replace(/[^\n]/g, ' '));
}

export function discoverStateCandidates(sourceDirectory) {
  const candidates = [];
  const files = walk(sourceDirectory)
    .filter((file) => /\.(swift|m|mm|h)$/.test(file))
    .sort();
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const visibleSource = withoutDebugBlocks(source);
    if (!/\bView\b|ViewController|@interface|@implementation/.test(visibleSource)) continue;
    const relativePath = path.relative(sourceDirectory, file).split(path.sep).join('/');
    for (const [index, rawLine] of visibleSource.split(/\r?\n/).entries()) {
      const line = rawLine.trim();
      let kind = '';
      if (/\.(navigationDestination)\s*\(/.test(line)) kind = 'navigation';
      else if (/\.(sheet|fullScreenCover|alert|confirmationDialog|popover)\s*\(/.test(line)) kind = 'presentation';
      else if (/^(?:}\s*)?(?:else\s+)?if\b|^switch\b/.test(line)) kind = 'condition';
      if (!kind) continue;
      const expression = line.slice(0, 240);
      const key = `${relativePath}:${index + 1}:${expression}`;
      candidates.push({
        id: `state-${crypto.createHash('sha256').update(key).digest('hex').slice(0, 12)}`,
        source: relativePath,
        line: index + 1,
        kind,
        expression,
        status: 'PENDING',
        screen_ids: [],
        state_ids: [],
        note: '',
      });
    }
  }
  return candidates;
}

export function discoverIosViews(sourceDirectory) {
  const files = walk(sourceDirectory)
    .filter((file) => /\.(swift|m|mm|h|storyboard|xib)$/.test(file))
    .sort();
  const inventory = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const discoverySource = withoutDebugBlocks(source);
    const relativePath = path.relative(sourceDirectory, file).split(path.sep).join('/');
    let declarations = [];
    if (file.endsWith('.swift')) {
      declarations = [...discoverySource.matchAll(/\bstruct\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*[^\n{]*(?:\bView\b|UIViewControllerRepresentable|UIViewRepresentable)/g)]
        .map((match) => match[1])
        .filter((name) => !name.endsWith('_Previews'));
    } else if (/\.(m|mm|h)$/.test(file)) {
      declarations = [...discoverySource.matchAll(/@(implementation|interface)\s+([A-Za-z_][A-Za-z0-9_]*(?:ViewController|View))\b/g)]
        .map((match) => match[2]);
    } else {
      declarations = [path.basename(file)];
    }
    declarations = [...new Set(declarations)];

    for (const declaration of declarations) {
      const fileDeclaration = path.basename(file, '.swift');
      const isStoryboard = file.endsWith('.storyboard');
      const isScreen = isStoryboard || (!relativePath.includes('/Subviews/')
        && (declaration.endsWith('View') || declaration.endsWith('ViewController'))
        && declaration === fileDeclaration);
      inventory.push({
        id: `${relativePath}#${declaration}`,
        source: relativePath,
        declaration,
        kind: isScreen ? 'screen' : 'component',
        source_sha256: crypto.createHash('sha256').update(source).digest('hex'),
        status: 'PENDING',
        web: '',
        route: '',
        test: '',
        note: '',
        discovery: {
          source: { status: 'FOUND', evidence: `${relativePath}#${declaration}` },
          graph: { status: 'PENDING', navigation_entry: '', evidence: [], inbound: [], outbound: [] },
          runtime: { status: 'PENDING', flow_state_ids: [] },
        },
      });
    }
  }

  return inventory;
}

export function createCoverage(project, sourceDirectory) {
  const discovered = discoverIosViews(sourceDirectory);
  return {
    project,
    generated_at: new Date().toISOString(),
    source: sourceDirectory,
    completion_rule: 'Every source screen must be IMPLEMENTED with a Web route and behavior test. EXCLUDED and PENDING keep the app incomplete.',
    reconciliation_policy: 'Source declarations, codebase-memory navigation targets, source UI-state branches, and Maestro runtime visits must agree before APP_COMPLETE.',
    graph_discovery: {
      status: 'PENDING',
      entry_points: [],
      targets: [],
      evidence: [],
      note: '',
    },
    state_candidates: discoverStateCandidates(sourceDirectory),
    screens: discovered.filter((item) => item.kind === 'screen'),
    supporting_components: discovered
      .filter((item) => item.kind === 'component')
      .map(({ status, web, route, test, note, ...item }) => item),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['project', 'source', 'output']) {
    if (!options[required]) throw new Error(`missing --${required}`);
  }
  const coverage = createCoverage(options.project, path.resolve(options.source));
  fs.writeFileSync(path.resolve(options.output), `${JSON.stringify(coverage, null, 2)}\n`);
  process.stdout.write(`APP INVENTORY CREATED\nSCREENS=${coverage.screens.length}\nSUPPORTING_COMPONENTS=${coverage.supporting_components.length}\n`);
}
