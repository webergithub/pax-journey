#!/usr/bin/env node
/**
 * build-app.mjs —— 把上级目录的 Web 版复制成完全离线的桌面版 app/：
 *   ① 复制 index.html / main.js / data / engine / scene / ui
 *   ② 复制 Web 版已有的 vendor/（自 v0.11 起 Web 版本身就不依赖 CDN，无需再下载）
 *   ③ 去掉残留的 CDN 字体链接（正文字体栈里已有系统字体兜底）
 *   ④ 「← 返回主页」从 "/" 改为线上绝对地址（file:// 下 "/" 会导航到文件系统根）
 *
 * 每次发桌面版前跑：node build-app.mjs
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..');
const appDir = join(here, 'app');
const THREE_VER = '0.169.0';
const CDN = `https://cdn.jsdelivr.net/npm/three@${THREE_VER}`;

rmSync(appDir, { recursive: true, force: true });
mkdirSync(appDir, { recursive: true });

// ── ① 复制 Web 版 ────────────────────────────────────────────
for (const item of ['main.js', 'data', 'engine', 'scene', 'ui', 'vendor']) {
  cpSync(join(webRoot, item), join(appDir, item), { recursive: true });
}

// ── ② vendor 校验：Web 版自 v0.11 起已内置，这里只确认存在 ──
const threePath = join(appDir, 'vendor', 'three.module.js');
if (!existsSync(threePath) || statSync(threePath).size < 10_000) {
  console.error('✗ vendor/three.module.js 缺失。先在项目根跑 node scripts/vendorize.mjs');
  process.exit(1);
}
console.log('vendor: 复用 Web 版内置的 Three.js ✓');


// ── ③④ 改写 index.html ──────────────────────────────────────
let html = readFileSync(join(webRoot, 'index.html'), 'utf8');
html = html
  .replace(/"three": "[^"]+"/, '"three": "./vendor/three.module.js"')
  .replace(/"three\/addons\/": "[^"]+"/, '"three/addons/": "./vendor/jsm/"')
  .replace(/^<link rel="preconnect"[^\n]*\n/m, '')
  .replace(/^<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr[^\n]*\n/m, '')
  .replace('href="/"', 'href="https://opcstudio.cc/"');
writeFileSync(join(appDir, 'index.html'), html);

const ok = !html.includes('cdn.jsdelivr.net');
console.log(`app/ ready · offline=${ok}`);
if (!ok) { console.error('!! index.html 里仍有 CDN 引用'); process.exit(1); }
