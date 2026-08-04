#!/usr/bin/env node
/**
 * preflight.mjs —— 发版前门禁（E0 收口）
 * 串起：数据契约校验 → 本地无头冒烟。任一失败即非 0 退出，阻断发版。
 * 发版后另跑 verify-live.mjs 校验线上。
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const steps = [['数据契约校验', 'check-data.mjs'], ['本地无头冒烟', 'smoke-web.mjs']];
for (const [name, file] of steps) {
  console.log(`\n▶ ${name}`);
  const r = spawnSync('node', [join(here, file)], { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`\n✗ 门禁未通过：${name}`); process.exit(1); }
}
console.log('\n✓ 发版前门禁全部通过');
