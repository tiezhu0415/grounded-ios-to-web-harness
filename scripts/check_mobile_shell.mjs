#!/usr/bin/env node

import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const separator = argument.indexOf('=');
    if (separator === -1) throw new Error(`invalid argument: ${argument}`);
    return [argument.slice(0, separator).replace(/^--/, ''), argument.slice(separator + 1)];
  }),
);

if (!options['web-dir']) throw new Error('missing --web-dir');
const webDirectory = path.resolve(options['web-dir']);
async function findFreePort() {
  return await new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.unref();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const address = listener.address();
      if (!address || typeof address === 'string') {
        listener.close();
        reject(new Error('failed to allocate a local port'));
        return;
      }
      const port = address.port;
      listener.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

const port = options.port ? Number(options.port) : await findFreePort();
const url = `http://127.0.0.1:${port}${options.route || '/home'}`;
const maxWidth = Number(options['max-width'] || 430);

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: webDirectory,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false,
});

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Web server exited before validation (code ${server.exitCode})`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError || new Error(`Web server did not start: ${url}`);
}

try {
  await waitForServer();
  const playwrightEntry = path.join(webDirectory, 'node_modules', 'playwright', 'index.mjs');
  const { chromium } = await import(pathToFileURL(playwrightEntry));
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    const shell = page.locator('[data-harness-app-shell]');
    await shell.waitFor({ state: 'visible' });
    const box = await shell.boundingBox();
    if (!box) throw new Error('mobile App Shell has no visible bounds');
    if (box.width > maxWidth + 1) throw new Error(`mobile App Shell is ${box.width}px wide; maximum is ${maxWidth}px`);
    const leftMargin = box.x;
    const rightMargin = 1440 - box.x - box.width;
    if (Math.abs(leftMargin - rightMargin) > 2) throw new Error('mobile App Shell is not centered on a desktop viewport');

    const surfaces = page.locator('.page:visible, .auth-page:visible, .tab-bar:visible');
    const surfaceCount = await surfaces.count();
    if (surfaceCount === 0) throw new Error('no visible App surface was found inside the mobile shell');
    for (let index = 0; index < surfaceCount; index += 1) {
      const surface = await surfaces.nth(index).boundingBox();
      if (!surface) throw new Error(`App surface ${index + 1} has no visible bounds`);
      const tolerance = 1;
      if (surface.x < box.x - tolerance || surface.x + surface.width > box.x + box.width + tolerance) {
        throw new Error(`App surface ${index + 1} escapes the mobile shell (${surface.width}px at x=${surface.x})`);
      }
    }

    const tabs = page.locator('[data-harness-tab]');
    const count = await tabs.count();
    if (count < 2) throw new Error('integrated primary navigation is missing');
    for (let index = 0; index < count; index += 1) {
      const href = await tabs.nth(index).getAttribute('href');
      if (!href?.startsWith('/')) throw new Error(`navigation tab ${index + 1} has no internal route`);
    }
    process.stdout.write(`MOBILE APP SHELL PASSED\nWIDTH=${box.width}\nTABS=${count}\n`);
  } finally {
    await browser.close();
  }
} finally {
  server.kill('SIGTERM');
  await new Promise((resolve) => {
    if (server.exitCode !== null) resolve();
    else server.once('exit', resolve);
  });
}
