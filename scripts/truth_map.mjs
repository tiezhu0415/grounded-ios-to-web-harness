#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const options = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const separator = argument.indexOf('=');
  if (separator === -1) throw new Error(`invalid argument: ${argument}`);
  return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
}));
if (!options.project || !options.output) throw new Error('truth_map requires --project and --output');
const value = {
  version: 1,
  project: options.project,
  status: 'PENDING',
  data_status: 'PENDING',
  asset_status: 'PENDING',
  data_sources: [],
  assets: [],
  external_resources: [],
  blocked: [],
  schema_help: {
    data_source: { web_path: 'src/path', source: 'relative iOS source file', kind: 'SOURCE_STATIC | SOURCE_API | SOURCE_LOCAL | TEST_ONLY', evidence: 'symbol/query/runtime ref' },
    asset: { web_path: 'public/path', source: 'relative iOS source/asset file', evidence: 'asset catalog or source symbol ref' },
    external_resource: { url: 'https://exact-url', source: 'relative iOS source file', evidence: 'symbol/line/query ref' },
  },
  note: 'Fill source data, Assets, and external resources before implementation so build contexts can use them. After implementation, add each Web path. Every production value must point back to source evidence; TEST_ONLY data may not masquerade as migrated production data.',
};
fs.writeFileSync(path.resolve(options.output), `${JSON.stringify(value, null, 2)}\n`);
process.stdout.write('TRUTH MAP CREATED\n');
