#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const separator = argument.indexOf('=');
  if (separator === -1) throw new Error(`invalid argument: ${argument}`);
  return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
}));
for (const required of ['web', 'run-dir', 'source', 'truth-map']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const webDirectory = path.resolve(options.web);
const runDirectory = path.resolve(options['run-dir']);
const sourceDirectory = path.resolve(options.source);
const truthMapFile = path.resolve(options['truth-map']);
const errors = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', 'playwright-report', 'test-results', 'build', '.codebase-memory', 'DerivedData', '.build', 'Logs', '.git', '.swiftpm'].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function resolveInside(root, relative, label) {
  if (typeof relative !== 'string' || relative.length === 0 || path.isAbsolute(relative)) {
    errors.push(`${label} must be a non-empty relative path`);
    return null;
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${root}${path.sep}`) || !fs.existsSync(resolved)) {
    errors.push(`${label} does not exist inside its project: ${relative}`);
    return null;
  }
  return resolved;
}

let truthMap;
try {
  truthMap = JSON.parse(fs.readFileSync(truthMapFile, 'utf8'));
} catch (error) {
  errors.push(`truth-map.json is invalid: ${error.message}`);
  truthMap = {};
}
if (truthMap.status !== 'CONFIRMED') errors.push('truth-map status must be CONFIRMED');
for (const area of ['data_status', 'asset_status']) {
  if (!['CONFIRMED', 'NOT_APPLICABLE'].includes(truthMap[area])) errors.push(`truth-map ${area} must be CONFIRMED or NOT_APPLICABLE`);
}
if (Array.isArray(truthMap.blocked) && truthMap.blocked.length > 0) errors.push('truth-map contains blocked facts; AUTO_COMPLETE is not allowed');

for (const item of truthMap.data_sources || []) {
  resolveInside(webDirectory, item.web_path, 'truth data Web path');
  resolveInside(sourceDirectory, item.source, 'truth data source path');
  if (!['SOURCE_STATIC', 'SOURCE_API', 'SOURCE_LOCAL', 'TEST_ONLY'].includes(item.kind)) errors.push(`truth data source has invalid kind: ${item.web_path || '<missing>'}`);
  if (!item.evidence) errors.push(`truth data source has no evidence: ${item.web_path || '<missing>'}`);
}
if (truthMap.data_status === 'CONFIRMED' && !(truthMap.data_sources || []).length) errors.push('confirmed truth data has no source mappings');

const declaredAssets = new Map();
for (const item of truthMap.assets || []) {
  resolveInside(webDirectory, item.web_path, 'truth asset Web path');
  resolveInside(sourceDirectory, item.source, 'truth asset source path');
  if (!item.evidence) errors.push(`truth asset has no evidence: ${item.web_path || '<missing>'}`);
  declaredAssets.set(item.web_path, item);
}

const externalUrls = new Set();
for (const item of truthMap.external_resources || []) {
  if (typeof item.url !== 'string' || !/^https?:\/\//.test(item.url)) errors.push('truth external resource has an invalid URL');
  else externalUrls.add(item.url);
  if (!item.source || !item.evidence) errors.push(`truth external resource has no source/evidence: ${item.url || '<missing>'}`);
}

const sourceFiles = walk(sourceDirectory);
const sourceText = sourceFiles
  .filter((file) => /\.(?:swift|m|mm|h|c|cc|cpp|json|plist|storyboard|xib)$/i.test(file))
  .map((file) => {
    try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
  }).join('\n');
const sourceAssetHashes = new Set(sourceFiles
  .filter((file) => /\.(?:png|jpe?g|webp|gif|svg|pdf|ttf|otf)$/i.test(file))
  .map(sha256));

const iosEvidenceHashes = new Map(
  walk(runDirectory)
    .filter((file) => /(?:^|[/\\])ios[/\\].*\.png$/i.test(file) || /(?:^|[/\\])ios[-_].*\.png$/i.test(file))
    .map((file) => [sha256(file), path.relative(runDirectory, file)]),
);

const productionFiles = walk(webDirectory).filter((file) => {
  const relative = path.relative(webDirectory, file).split(path.sep).join('/');
  const basename = path.basename(file);
  return !/(?:^|\/)(?:tests?|e2e|__tests__)(?:\/|\.|$)/i.test(relative)
    && !/\.(?:spec|test)\.[cm]?[jt]sx?$/i.test(relative)
    && !/^(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(basename);
});

for (const file of productionFiles) {
  const relative = path.relative(webDirectory, file).split(path.sep).join('/');
  if (/\.(?:png|jpe?g|webp|gif|svg|pdf|ttf|otf)$/i.test(file)) {
    const copiedFrom = iosEvidenceHashes.get(sha256(file));
    if (copiedFrom) errors.push(`Web asset copies an iOS runtime screenshot: ${relative} <- ${copiedFrom}`);
    if (/(?:^|[-_.])(ios|iphone|simulator)[-_.].*(background|bg|screen|screenshot)/i.test(path.basename(file))) {
      errors.push(`Web asset is named as an iOS runtime screen/background: ${relative}`);
    }
    if (relative.startsWith('public/') && !sourceAssetHashes.has(sha256(file)) && !declaredAssets.has(relative)) {
      errors.push(`Web asset is not source-identical or declared in truth-map: ${relative}`);
    }
    continue;
  }
  if (!/\.(?:[cm]?[jt]sx?|css|scss|html|json)$/i.test(file)) continue;
  if (/(?:^|\/)(?:fixture|mock|dummy|fake)s?(?:\.|\/)/i.test(relative)) {
    errors.push(`production source uses a fixture/mock/fake file: ${relative}`);
  }
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
  if (/(?:placehold\.co|placeholder\.com|via\.placeholder\.com|dummyimage\.com|picsum\.photos)/i.test(source)) {
    errors.push(`source uses a placeholder image service: ${relative}`);
  }
  if (/(?:user|jane|john)@example\.com|\bcus_fixture\b|\b(?:dummy|fake)[-_](?:user|product|order|data)\b/i.test(source)) {
    errors.push(`source contains test-like production data: ${relative}`);
  }
  for (const match of source.matchAll(/https?:\/\/[^\s'"`)]+/g)) {
    const url = match[0];
    if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/.test(url)) continue;
    if (!sourceText.includes(url) && !Array.from(externalUrls).some((allowed) => url === allowed || url.startsWith(allowed))) errors.push(`external URL has no iOS source or truth-map evidence: ${url} (${relative})`);
  }
}

if (errors.length > 0) {
  process.stderr.write(`WEB IMPLEMENTATION INTEGRITY FAILED\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write('WEB IMPLEMENTATION INTEGRITY PASSED\n');
