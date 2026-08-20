#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const separator = argument.indexOf('=');
  if (separator === -1) throw new Error(`invalid argument: ${argument}`);
  return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
}));
for (const required of ['web', 'run-dir']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const webDirectory = path.resolve(options.web);
const runDirectory = path.resolve(options['run-dir']);
const errors = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', 'playwright-report', 'test-results'].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const iosEvidenceHashes = new Map(
  walk(runDirectory)
    .filter((file) => /(?:^|[/\\])ios[/\\].*\.png$/i.test(file) || /(?:^|[/\\])ios[-_].*\.png$/i.test(file))
    .map((file) => [sha256(file), path.relative(runDirectory, file)]),
);

for (const file of walk(webDirectory)) {
  const relative = path.relative(webDirectory, file).split(path.sep).join('/');
  if (/\.(?:png|jpe?g|webp)$/i.test(file)) {
    const copiedFrom = iosEvidenceHashes.get(sha256(file));
    if (copiedFrom) errors.push(`Web asset copies an iOS runtime screenshot: ${relative} <- ${copiedFrom}`);
    if (/(?:^|[-_.])(ios|iphone|simulator)[-_.].*(background|bg|screen|screenshot)/i.test(path.basename(file))) {
      errors.push(`Web asset is named as an iOS runtime screen/background: ${relative}`);
    }
    continue;
  }
  if (!/\.(?:[cm]?[jt]sx?|css|scss|html)$/i.test(file) || relative.includes('/tests/')) continue;
  const source = fs.readFileSync(file, 'utf8');
  const hidesDomOnlyForTests = source.split(/\r?\n/).some((line) => (
    /<(?:span|img|div)\b/.test(line)
      && /opacity\s*:\s*0\b/.test(line)
      && /pointerEvents\s*:\s*['"]none['"]/.test(line)
  ));
  if (hidesDomOnlyForTests) {
    errors.push(`source hides non-interactive content from users while leaving it in the DOM: ${relative}`);
  }
  if (/(?:ios|iphone|simulator)[-_.].*(?:background|bg|screen|screenshot)/i.test(source)) {
    errors.push(`source references an iOS runtime screen as a Web asset: ${relative}`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`WEB IMPLEMENTATION INTEGRITY FAILED\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('WEB IMPLEMENTATION INTEGRITY PASSED\n');
