#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PNG } from 'pngjs';
import { sha256Json } from './run_contract.mjs';

function parseOptions(argv) {
  return Object.fromEntries(argv.map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }));
}

function safePath(root, relative, label) {
  if (typeof relative !== 'string' || relative.length === 0 || path.isAbsolute(relative)) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error(`${label} leaves the Run directory: ${relative}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}-${crypto.randomUUID()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

export function extractPalette(image, maximum = 8) {
  const buckets = new Map();
  const pixels = image.width * image.height;
  const stride = Math.max(1, Math.floor(pixels / 250_000));
  let sampled = 0;
  for (let pixel = 0; pixel < pixels; pixel += stride) {
    const offset = pixel * 4;
    if (image.data[offset + 3] < 128) continue;
    const red = image.data[offset];
    const green = image.data[offset + 1];
    const blue = image.data[offset + 2];
    const key = `${red >> 4},${green >> 4},${blue >> 4}`;
    const bucket = buckets.get(key) || { count: 0, red: 0, green: 0, blue: 0 };
    bucket.count += 1;
    bucket.red += red;
    bucket.green += green;
    bucket.blue += blue;
    buckets.set(key, bucket);
    sampled += 1;
  }
  return [...buckets.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, maximum)
    .map((bucket) => {
      const channels = [bucket.red, bucket.green, bucket.blue]
        .map((value) => Math.round(value / bucket.count));
      return {
        hex: `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`,
        coverage: Number((bucket.count / sampled).toFixed(4)),
      };
    });
}

function parseTsv(value) {
  const lines = value.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  return lines.slice(1).flatMap((line) => {
    const cells = line.split('\t');
    if (cells.length < 12) return [];
    const confidence = Number(cells[10]);
    const text = cells.slice(11).join('\t').trim();
    if (!text || !Number.isFinite(confidence) || confidence < 30) return [];
    return [{
      text,
      confidence: Number((confidence / 100).toFixed(3)),
      box: {
        x: Number(cells[6]), y: Number(cells[7]),
        width: Number(cells[8]), height: Number(cells[9]),
      },
    }];
  });
}

function extractTextRegions(file, language, disabled) {
  if (disabled) return { status: 'DISABLED', engine: null, regions: [], note: 'OCR disabled by caller.' };
  const binary = spawnSync('sh', ['-c', 'command -v tesseract'], { encoding: 'utf8' });
  if (binary.status !== 0 || !binary.stdout.trim()) {
    return { status: 'UNAVAILABLE', engine: null, regions: [], note: 'Install Tesseract to add OCR text boxes; dimensions and palette are still grounded.' };
  }
  const result = spawnSync(binary.stdout.trim(), [file, 'stdout', '-l', language, 'tsv'], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return { status: 'FAILED', engine: 'tesseract', regions: [], note: result.stderr.trim() || `Tesseract exited ${result.status}` };
  }
  return { status: 'COMPLETE', engine: `tesseract:${language}`, regions: parseTsv(result.stdout), note: '' };
}

function matchingAssets(truthMap, sourceId, stateId, facts) {
  const searchable = facts.map((fact) => `${fact.source} ${fact.fact} ${(fact.evidence || []).map((item) => item.ref).join(' ')}`).join('\n');
  return (truthMap.assets || []).filter((asset) => {
    if (Array.isArray(asset.screen_ids) && asset.screen_ids.includes(sourceId)) return true;
    if (Array.isArray(asset.state_ids) && asset.state_ids.includes(stateId)) return true;
    return [asset.source, asset.evidence].filter(Boolean).some((value) => searchable.includes(value));
  });
}

export function createVisualGrounding({ matrix, facts, truthMap, runDirectory, ocrLanguage = 'eng', noOcr = false }) {
  if (facts.lock?.status !== 'LOCKED' || !facts.lock.content_sha256) {
    throw new Error('source facts must be locked before visual grounding');
  }
  const outputs = [];
  for (const screen of matrix.screens || []) {
    if (screen.critical !== true) continue;
    const relevantFacts = [...(facts.facts || []), ...(facts.additional_facts || [])].filter((fact) => (
      fact.id === `screen:${screen.source_id}`
      || fact.id?.startsWith(`state:${screen.source_id}:`)
      || fact.source === screen.source
      || fact.screen_ids?.includes(screen.source_id)
    ));
    for (const state of screen.states || []) {
      if (state.required !== true) continue;
      const screenshot = safePath(runDirectory, state.ios_screenshot, `iOS screenshot for ${screen.source_id}/${state.id}`);
      if (!fs.existsSync(screenshot) || !fs.statSync(screenshot).isFile()) {
        throw new Error(`iOS screenshot is missing for ${screen.source_id}/${state.id}: ${state.ios_screenshot}`);
      }
      const image = PNG.sync.read(fs.readFileSync(screenshot));
      const ocr = extractTextRegions(screenshot, ocrLanguage, noOcr);
      const relativeOutput = `visual-grounding/${state.id}.json`;
      const output = {
        version: 1,
        source_id: screen.source_id,
        state_id: state.id,
        route: screen.route,
        facts_version: facts.version,
        facts_lock_sha256: facts.lock.content_sha256,
        screenshot: {
          path: state.ios_screenshot,
          sha256: sha256File(screenshot),
          width: image.width,
          height: image.height,
          crop: state.ios_crop || null,
        },
        target_web: {
          screenshot: state.web_screenshot,
          crop: state.web_crop || null,
          reference_canvas_pixels: { width: image.width, height: image.height },
        },
        palette: extractPalette(image),
        text: ocr,
        source_fact_ids: relevantFacts.map((fact) => fact.id),
        source_assets: matchingAssets(truthMap, screen.source_id, state.id, relevantFacts),
        generated_at: new Date().toISOString(),
      };
      atomicJson(path.join(runDirectory, relativeOutput), output);
      outputs.push({
        source_id: screen.source_id,
        state_id: state.id,
        file: relativeOutput,
        grounding_sha256: sha256Json(output),
        screenshot_sha256: output.screenshot.sha256,
      });
    }
  }
  return outputs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['matrix', 'facts', 'truth-map', 'run-dir']) {
    if (!options[required]) throw new Error(`missing --${required}`);
  }
  const runDirectory = path.resolve(options['run-dir']);
  const outputs = createVisualGrounding({
    matrix: JSON.parse(fs.readFileSync(path.resolve(options.matrix), 'utf8')),
    facts: JSON.parse(fs.readFileSync(path.resolve(options.facts), 'utf8')),
    truthMap: JSON.parse(fs.readFileSync(path.resolve(options['truth-map']), 'utf8')),
    runDirectory,
    ocrLanguage: options['ocr-language'] || 'eng',
    noOcr: options['no-ocr'] === 'true',
  });
  process.stdout.write(`VISUAL GROUNDING CREATED\nSTATES=${outputs.length}\n`);
}
