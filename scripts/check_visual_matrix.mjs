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

function safePath(root, relative, label) {
  if (typeof relative !== 'string' || relative.length === 0 || path.isAbsolute(relative)) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const resolved = path.resolve(root, relative);
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (!resolved.startsWith(prefix)) throw new Error(`${label} leaves its allowed directory: ${relative}`);
  return resolved;
}

function requireFile(root, relative, label, errors) {
  try {
    const file = safePath(root, relative, label);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      errors.push(`${label} does not exist: ${relative}`);
      return null;
    }
    return file;
  } catch (error) {
    errors.push(error.message);
    return null;
  }
}

export function validateVisualMatrix({ coverage, matrix, runDirectory, webDirectory }) {
  const errors = [];
  const coverageScreens = Array.isArray(coverage.screens) ? coverage.screens : [];
  const matrixScreens = Array.isArray(matrix.screens) ? matrix.screens : [];
  const bySource = new Map(matrixScreens.map((screen) => [screen.source_id, screen]));
  const expectedIds = new Set(coverageScreens.map((screen) => screen.id));
  const seenStates = new Set();
  const seenFiles = new Set();
  const maxChangedRatio = Number(matrix.quality_policy?.max_changed_ratio);
  const minSsimScore = Number(matrix.quality_policy?.min_ssim_score);

  if (!Number.isFinite(maxChangedRatio) || maxChangedRatio <= 0 || maxChangedRatio > 0.25) {
    errors.push('quality_policy.max_changed_ratio must be greater than 0 and no looser than 0.25');
  }
  if (!Number.isFinite(minSsimScore) || minSsimScore < 0.65 || minSsimScore > 1) {
    errors.push('quality_policy.min_ssim_score must be between 0.65 and 1');
  }

  for (const source of coverageScreens) {
    const screen = bySource.get(source.id);
    if (!screen) {
      errors.push(`source screen is missing from visual matrix: ${source.id}`);
      continue;
    }
    if (screen.route !== source.route) errors.push(`visual route does not match coverage for ${source.id}`);
    const states = Array.isArray(screen.states) ? screen.states.filter((state) => state.required !== false) : [];
    if (states.length === 0) {
      errors.push(`screen has no required visual state: ${source.id}`);
      continue;
    }
    for (const state of states) {
      const label = `${source.declaration}/${state.id || 'missing-state-id'}`;
      if (typeof state.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(state.id)) {
        errors.push(`${label} has an invalid state id`);
        continue;
      }
      if (seenStates.has(state.id)) errors.push(`duplicate visual state id: ${state.id}`);
      seenStates.add(state.id);
      for (const field of ['ios_flow', 'ios_screenshot', 'web_screenshot', 'report']) {
        const value = state[field];
        if (seenFiles.has(value)) errors.push(`${label} reuses evidence path: ${value}`);
        seenFiles.add(value);
      }
      requireFile(runDirectory, state.ios_flow, `${label} iOS flow`, errors);
      requireFile(runDirectory, state.ios_screenshot, `${label} iOS screenshot`, errors);
      requireFile(runDirectory, state.web_screenshot, `${label} Web screenshot`, errors);
      const reportFile = requireFile(runDirectory, state.report, `${label} visual report`, errors);

      if (typeof state.web_test !== 'string' || !state.web_test.includes('#')) {
        errors.push(`${label} web_test must use relative-file#unique-test-id`);
      } else {
        const separator = state.web_test.lastIndexOf('#');
        const relativeTest = state.web_test.slice(0, separator);
        const testId = state.web_test.slice(separator + 1);
        const testFile = requireFile(webDirectory, relativeTest, `${label} Web test`, errors);
        if (!testId) errors.push(`${label} Web test has an empty unique test id`);
        else if (testFile && !fs.readFileSync(testFile, 'utf8').includes(testId)) {
          errors.push(`${label} Web test does not contain its unique test id: ${testId}`);
        }
      }

      if (reportFile) {
        try {
          const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
          if (report.engine?.primary !== 'pixelmatch') errors.push(`${label} report did not use Pixelmatch`);
          if (!Number.isFinite(report.ssim_score)) errors.push(`${label} report has no SSIM score`);
          if (!Number.isFinite(report.changed_ratio)) errors.push(`${label} report has no changed ratio`);
          if (Number.isFinite(maxChangedRatio) && report.changed_ratio > maxChangedRatio) {
            errors.push(`${label} changed_ratio ${report.changed_ratio} exceeds ${maxChangedRatio}`);
          }
          if (Number.isFinite(minSsimScore) && report.ssim_score < minSsimScore) {
            errors.push(`${label} SSIM ${report.ssim_score} is below ${minSsimScore}`);
          }
        } catch (error) {
          errors.push(`${label} visual report is invalid JSON: ${error.message}`);
        }
      }
    }
  }

  for (const screen of matrixScreens) {
    if (!expectedIds.has(screen.source_id)) errors.push(`visual matrix contains stale source screen: ${screen.source_id}`);
  }
  return { errors, screens: coverageScreens.length, states: seenStates.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseOptions(process.argv.slice(2));
  for (const required of ['coverage', 'matrix', 'run-dir', 'web']) {
    if (!options[required]) throw new Error(`missing --${required}`);
  }
  const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(path.resolve(options.matrix), 'utf8'));
  const result = validateVisualMatrix({
    coverage,
    matrix,
    runDirectory: path.resolve(options['run-dir']),
    webDirectory: path.resolve(options.web),
  });
  if (result.errors.length > 0) {
    process.stderr.write(`APP VISUAL COVERAGE INCOMPLETE\n${result.errors.map((error) => `- ${error}`).join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write(`APP VISUAL COVERAGE PASSED\nSCREENS=${result.screens}\nSTATES=${result.states}\n`);
}
