#!/usr/bin/env node

import fs from 'node:fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { ssim } from 'ssim.js';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }),
);

for (const required of ['ios', 'web', 'diff-mask', 'threshold']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const threshold = Number(options.threshold);
if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
  throw new Error('--threshold must be between 0 and 1');
}

const ios = PNG.sync.read(fs.readFileSync(options.ios));
const web = PNG.sync.read(fs.readFileSync(options.web));
if (ios.width !== web.width || ios.height !== web.height) {
  throw new Error(`image dimensions differ: iOS=${ios.width}x${ios.height}, Web=${web.width}x${web.height}`);
}

const diff = new PNG({ width: ios.width, height: ios.height });
const changedPixels = pixelmatch(ios.data, web.data, diff.data, ios.width, ios.height, {
  threshold,
  includeAA: false,
  diffMask: true,
});
fs.writeFileSync(options['diff-mask'], PNG.sync.write(diff));

const { mssim } = ssim(ios, web, { ssim: 'bezkrovny' });
const totalPixels = ios.width * ios.height;
process.stdout.write(
  `${JSON.stringify({
    primary: 'pixelmatch',
    threshold: Number(threshold.toFixed(6)),
    antiAliasing: 'ignored',
    changedPixels,
    changedRatio: Number((changedPixels / totalPixels).toFixed(6)),
    secondary: 'ssim.js',
    ssimScore: Number(mssim.toFixed(6)),
  })}\n`,
);
