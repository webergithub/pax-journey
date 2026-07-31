#!/usr/bin/env node
/**
 * gen-importmap.mjs <版本号> —— 给 index.html 盖版本戳。
 *
 * 把 importmap 重写成"每个本地 ES 模块都映射到 <path>?v=<版本>"，同时给
 * ui/style.css 与入口 main.js 的标签换 ?v=。这样一次发版里所有文件都是全新 URL，
 * 浏览器与 Cloudflare 边缘（含它强制的 4 小时浏览器 TTL）都不可能把新旧版本混装。
 *
 * 每次发版前在项目根跑：node scripts/gen-importmap.mjs 0.2
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ver = process.argv[2];
if (!ver) { console.error('usage: node scripts/gen-importmap.mjs <version>'); process.exit(1); }

const imports = {
  three: 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js',
  'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/',
  './main.js': `./main.js?v=${ver}`,
};
for (const dir of ['data', 'engine', 'scene', 'ui']) {
  for (const f of readdirSync(dir).filter(n => n.endsWith('.js')).sort()) {
    imports[`./${dir}/${f}`] = `./${dir}/${f}?v=${ver}`;
  }
}

const html = readFileSync('index.html', 'utf8');
const map = JSON.stringify({ imports }, null, 2).replace(/^/gm, '').trimStart();
const out = html
  .replace(/<script type="importmap">[\s\S]*?<\/script>/, `<script type="importmap">\n${map}\n</script>`)
  .replace(/href="ui\/style\.css(\?v=[^"]*)?"/, `href="ui/style.css?v=${ver}"`)
  .replace(/src="main\.js(\?v=[^"]*)?"/, `src="main.js?v=${ver}"`);
writeFileSync('index.html', out);
console.log(`index.html stamped: ${Object.keys(imports).length - 2} modules @ v=${ver}`);
