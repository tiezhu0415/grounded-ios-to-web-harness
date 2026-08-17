#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import path from 'node:path';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }),
);

for (const required of ['web-dir', 'url', 'output', 'width', 'height', 'scale']) {
  if (!options[required]) throw new Error(`missing --${required}`);
}

const webDir = path.resolve(options['web-dir']);
const playwrightEntry = path.join(webDir, 'node_modules', 'playwright', 'index.mjs');
const { chromium } = await import(pathToFileURL(playwrightEntry));
const browser = await chromium.launch({ channel: 'chrome' });

try {
  const context = await browser.newContext({
    viewport: {
      width: Number(options.width),
      height: Number(options.height),
    },
    screen: {
      width: Number(options.width),
      height: Number(options.height),
    },
    deviceScaleFactor: Number(options.scale),
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(options.url, { waitUntil: 'networkidle' });
  if (options['wait-for']) {
    await page.locator(options['wait-for']).waitFor({ state: 'visible' });
  }
  await page.screenshot({ path: path.resolve(options.output), fullPage: false });
  await context.close();
} finally {
  await browser.close();
}
