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

export function discoverIosViews(sourceDirectory) {
  const files = walk(sourceDirectory)
    .filter((file) => /\.(swift|m|mm|h|storyboard|xib)$/.test(file))
    .sort();
  const inventory = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const discoverySource = source.replace(/#if\s+DEBUG[\s\S]*?#endif/g, '');
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
