#!/usr/bin/env node
/**
 * verify-live.mjs —— 发布后线上校验（G-DIST-3）
 *
 * 防的是两类真实事故：
 *   ① 忘盖版本戳 → 文件传了但线上仍跑旧模块（Cloudflare 强制 4h 浏览器 TTL）
 *   ② 半发布 → index.html 更新了但某些模块 404 / 仍是旧内容
 *
 * 做法：抓线上 index.html，解析出它自己声明的版本戳，逐个抽查 importmap 里的
 * 模块是否 200，并与本地 index.html 的版本比对。一律带 cache-bust 查询串——
 * 裸 URL 的返回不可信。
 *
 * 用法：node scripts/verify-live.mjs [期望版本]
 *      不传版本则以本地 index.html 的版本为期望值。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://opcstudio.cc/pax-journey/';
const cb = () => `cb=${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

const localHtml = readFileSync(join(root, 'index.html'), 'utf8');
const localVer = /src="main\.js\?v=([^"]+)"/.exec(localHtml)?.[1];
const want = process.argv[2] || localVer;

if (!want) { console.error('无法确定期望版本（本地 index.html 未盖戳？）'); process.exit(1); }
console.log(`期望版本: v=${want}${process.argv[2] ? '（命令行指定）' : '（取自本地 index.html）'}`);

const errs = [];
const note = m => errs.push(m);

// ① 线上 index.html
const idxRes = await fetch(`${BASE}?${cb()}`);
if (!idxRes.ok) { console.error(`✗ 线上首页 HTTP ${idxRes.status}`); process.exit(1); }
const liveHtml = await idxRes.text();

const liveVer = /src="main\.js\?v=([^"]+)"/.exec(liveHtml)?.[1];
if (liveVer !== want) note(`版本戳不符：线上 v=${liveVer ?? '无'}，期望 v=${want}（忘跑 gen-importmap 或未上传 index.html）`);

// ② CDN 残留检查（G-RUN-1 的回归防线）
const cdnHits = (liveHtml.match(/cdn\.jsdelivr\.net/g) || []).length;
if (cdnHits > 0) note(`线上 index.html 仍有 ${cdnHits} 处 CDN 引用（应已 vendor 化）`);

// ③ importmap 里的模块逐个抽查
const mapBlock = /<script type="importmap">([\s\S]*?)<\/script>/.exec(liveHtml)?.[1];
if (!mapBlock) {
  note('线上 index.html 未找到 importmap');
} else {
  let imports = {};
  try { imports = JSON.parse(mapBlock).imports || {}; } catch (e) { note('importmap JSON 解析失败: ' + e.message); }
  // importmap 里以 / 结尾的是"目录前缀映射"（如 three/addons/），本身不是可请求的模块，
  // 直接 GET 会得到目录 403/404。只抽查真正的文件项。
  const urls = Object.values(imports).filter(u => u.startsWith('./') && !u.endsWith('/'));
  // 全量检查（30 个左右，成本可接受；半发布往往只坏其中一两个）
  let bad = 0;
  await Promise.all(urls.map(async rel => {
    const u = BASE + rel.replace(/^\.\//, '') + (rel.includes('?') ? '&' : '?') + cb();
    try {
      const r = await fetch(u, { method: 'GET' });
      if (!r.ok) { note(`模块 ${rel} HTTP ${r.status}`); bad++; return; }
      const body = await r.text();
      if (body.length < 40) { note(`模块 ${rel} 内容异常短（${body.length} 字节）`); bad++; }
    } catch (e) { note(`模块 ${rel} 请求失败: ${e.message}`); bad++; }
  }));
  // 前缀映射跳过后 addons 就没人查了，显式探一下实际用到的那个文件
  const addonsPrefix = imports['three/addons/'];
  if (addonsPrefix?.startsWith('./')) {
    const oc = BASE + addonsPrefix.replace(/^\.\//, '') + 'controls/OrbitControls.js?' + cb();
    const r = await fetch(oc);
    if (!r.ok) { note(`OrbitControls.js HTTP ${r.status}`); bad++; }
    else console.log('vendor: OrbitControls 可达 ✓');
  }

  console.log(`模块抽查: ${urls.length} 个（含 addons 探测），异常 ${bad} 个`);
  if (urls.some(u => u.includes('vendor/three.module.js'))) console.log('vendor: Three.js 走本地 ✓');
  else note('importmap 中 three 未指向本地 vendor');
}

// ④ 样式表
const cssRel = /href="(ui\/style\.css\?v=[^"]+)"/.exec(liveHtml)?.[1];
if (!cssRel) note('未找到 style.css 引用');
else {
  const r = await fetch(`${BASE}${cssRel}&${cb()}`);
  if (!r.ok) note(`style.css HTTP ${r.status}`);
}

if (errs.length) {
  console.error(`\n✗ 线上校验失败（${errs.length} 项）：`);
  for (const e of errs) console.error('  ' + e);
  process.exit(1);
}
console.log('\n✓ 线上校验通过：版本戳一致、模块全部可达、无 CDN 残留');
