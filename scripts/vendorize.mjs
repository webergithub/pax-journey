#!/usr/bin/env node
/**
 * vendorize.mjs —— Web 版去 CDN 化（G-RUN-1）
 *
 * 把 Three.js 与 OrbitControls 下载到 vendor/，并把 index.html 的 importmap
 * 从 jsdelivr 改指本地；同时移除 CDN 字体（正文字体栈里已有系统中英文兜底，
 * 与桌面版口径一致）。
 *
 * 为什么不复用 desktop/build-app.mjs：那个脚本是"复制一份改写"的产物流程，
 * Web 版要就地改，且 vendor/ 要进仓库以便静态托管。共用的是同一套 URL 常量。
 *
 * 用法：node scripts/vendorize.mjs        （幂等，vendor 已存在则跳过下载）
 */
import { mkdirSync, existsSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const THREE_VER = '0.169.0';
const CDN = `https://cdn.jsdelivr.net/npm/three@${THREE_VER}`;

const targets = [
  [`${CDN}/build/three.module.js`, join(root, 'vendor', 'three.module.js')],
  [`${CDN}/examples/jsm/controls/OrbitControls.js`, join(root, 'vendor', 'jsm', 'controls', 'OrbitControls.js')],
];

mkdirSync(join(root, 'vendor', 'jsm', 'controls'), { recursive: true });

for (const [url, dest] of targets) {
  if (existsSync(dest) && statSync(dest).size > 10_000) {
    console.log('cached    ', dest.replace(root + '/', ''));
    continue;
  }
  const res = await fetch(url);
  if (!res.ok) { console.error(`下载失败 ${res.status}: ${url}`); process.exit(1); }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log('downloaded', dest.replace(root + '/', ''));
}

// OrbitControls 内部 `import ... from 'three'` 走 importmap 的 bare specifier，
// 我们把 three 指向本地文件即可，无需改写它的源码。
const htmlPath = join(root, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
const before = html;

html = html
  .replace(/"three":\s*"[^"]+"/, '"three": "./vendor/three.module.js"')
  .replace(/"three\/addons\/":\s*"[^"]+"/, '"three/addons/": "./vendor/jsm/"')
  .replace(/^<link rel="preconnect" href="https:\/\/cdn\.jsdelivr[^\n]*\n/m, '')
  .replace(/^<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr[^\n]*\n/m, '');

if (html !== before) writeFileSync(htmlPath, html);

const remaining = (html.match(/cdn\.jsdelivr\.net/g) || []).length;
console.log(`index.html CDN 引用剩余: ${remaining}`);
if (remaining > 0) { console.error('✗ 仍有 CDN 引用未清除'); process.exit(1); }
console.log('✓ Web 版已完全本地化');
