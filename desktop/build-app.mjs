#!/usr/bin/env node
/**
 * build-app.mjs —— 把上级目录的 Web 版复制成完全离线的桌面版 app/：
 *   ① 复制 index.html / main.js / data / engine / scene / ui
 *   ② 把 Three.js 从 CDN 换成本地 vendor/（three.module.js + examples/jsm/）
 *   ③ 去掉 CDN 字体链接（正文字体栈里已有系统字体兜底）
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
mkdirSync(join(appDir, 'vendor', 'jsm', 'controls'), { recursive: true });

// ── ① 复制 Web 版 ────────────────────────────────────────────
for (const item of ['main.js', 'data', 'engine', 'scene', 'ui']) {
  cpSync(join(webRoot, item), join(appDir, item), { recursive: true });
}

// ── ② 下载 vendor（若已存在且非空则复用，避免每次都拉 1.2MB）──
async function vendor(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 10_000) return 'cached';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return 'downloaded';
}
// vendor 缓存放 desktop/ 下（app/ 每次重建），再拷进 app/
const cache = join(here, '.vendor-cache');
mkdirSync(join(cache, 'jsm', 'controls'), { recursive: true });
const jobs = [
  [`${CDN}/build/three.module.js`, join(cache, 'three.module.js')],
  [`${CDN}/examples/jsm/controls/OrbitControls.js`, join(cache, 'jsm', 'controls', 'OrbitControls.js')],
];
for (const [url, dest] of jobs) console.log(await vendor(url, dest), '→', dest.split('/').slice(-1)[0]);
cpSync(join(cache, 'three.module.js'), join(appDir, 'vendor', 'three.module.js'));
cpSync(join(cache, 'jsm'), join(appDir, 'vendor', 'jsm'), { recursive: true });

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
