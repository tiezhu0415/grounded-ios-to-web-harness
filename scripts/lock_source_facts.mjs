#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { validateSourceFacts } from './check_source_facts.mjs';
import { sha256Json, sourceFactsPayload, visualPlanPayload } from './run_contract.mjs';

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const separator = argument.indexOf('=');
  if (separator === -1) throw new Error(`invalid argument: ${argument}`);
  return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
}));
for (const required of ['coverage', 'facts', 'matrix']) if (!options[required]) throw new Error(`missing --${required}`);

const coverage = JSON.parse(fs.readFileSync(path.resolve(options.coverage), 'utf8'));
const factsFile = path.resolve(options.facts);
const matrixFile = path.resolve(options.matrix);
const facts = JSON.parse(fs.readFileSync(factsFile, 'utf8'));
const matrix = JSON.parse(fs.readFileSync(matrixFile, 'utf8'));
const revising = options.revise === 'true';
if (facts.lock?.status === 'LOCKED' && !revising) throw new Error('source facts are already locked; use --revise only when new evidence requires a recorded revision');

const errors = validateSourceFacts({ coverage, facts, matrix, requireLocked: false, allowUnresolved: true });
if (errors.length) throw new Error(`cannot lock invalid source facts:\n${errors.map((error) => `- ${error}`).join('\n')}`);

const previous = facts.lock?.status === 'LOCKED' ? {
  version: facts.version,
  content_sha256: facts.lock.content_sha256,
  visual_plan_sha256: facts.lock.visual_plan_sha256,
  superseded_at: new Date().toISOString(),
} : null;
if (previous) facts.version = Number(facts.version || 1) + 1;
facts.lock ||= { history: [] };
facts.lock.history ||= [];
if (previous) facts.lock.history.push(previous);
facts.lock.status = 'LOCKED';
facts.lock.locked_at = new Date().toISOString();
facts.lock.content_sha256 = sha256Json(sourceFactsPayload(facts));
facts.lock.visual_plan_sha256 = sha256Json(visualPlanPayload(matrix));

const temporary = `${factsFile}.tmp-${process.pid}`;
fs.writeFileSync(temporary, `${JSON.stringify(facts, null, 2)}\n`);
fs.renameSync(temporary, factsFile);
process.stdout.write(`SOURCE FACTS LOCKED\nVERSION=${facts.version}\nCONTENT_SHA256=${facts.lock.content_sha256}\nVISUAL_PLAN_SHA256=${facts.lock.visual_plan_sha256}\n`);
