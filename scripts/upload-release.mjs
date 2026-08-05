#!/usr/bin/env node
/**
 * upload-release.mjs —— 安装包上传 + 完整性校验（一步到位）
 *
 * 由一次真实事故催生（2026-08-04）：rsync 传 133MB 的 zip 时连接被对端重置，
 * 服务器留下 98.6MB 的截断文件，而 exit code 看不出问题——用户会下到坏包。
 *
 * 做法：逐个文件传（大文件单连接约 4 分钟会被重置，分开传更稳）→ 回读服务器
 * sha256 → 不一致就删掉重传，最多重试 3 次 → 全部一致才算成功。
 *
 * 用法：node scripts/upload-release.mjs 0.12.0
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ver = process.argv[2];
if (!ver) { console.error('usage: node scripts/upload-release.mjs <版本，如 0.12.0>'); process.exit(1); }

const HOST = 'oracle-vm';
const REMOTE = '/home/ubuntu/website/pax-journey/downloads';
const MAX_RETRY = 3;

const files = [
  `PaxJourney-v${ver}-mac-universal.dmg`,
  `PaxJourney-v${ver}-win-x64.exe`,
  `PaxJourney-v${ver}-win-x64.zip`,
].map(n => join(root, 'desktop', 'dist', n)).filter(p => {
  if (existsSync(p)) return true;
  console.warn(`跳过（本地不存在）: ${basename(p)}`);
  return false;
});

if (!files.length) { console.error(`desktop/dist 里没有 v${ver} 的安装包`); process.exit(1); }

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
const localSha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const remoteSha = name => {
  try { return sh('ssh', [HOST, `sha256sum ${REMOTE}/${name} 2>/dev/null | cut -d' ' -f1`]); }
  catch { return ''; }
};

let failed = 0;
for (const p of files) {
  const name = basename(p);
  const want = localSha(p);
  let ok = false;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    // 已在服务器且哈希一致 → 跳过，省一次大文件传输
    if (remoteSha(name) === want) { ok = true; break; }

    process.stdout.write(`${name} 上传中（第 ${attempt} 次）… `);
    try {
      // --partial 保留半截文件供续传；--inplace 避免临时文件占双倍空间
      sh('rsync', ['-az', '--partial', '--inplace', p, `${HOST}:${REMOTE}/`]);
    } catch (e) {
      console.log('传输中断');
      continue;                       // 下一轮 --partial 会续传
    }

    const got = remoteSha(name);
    if (got === want) { console.log('✓ 校验一致'); ok = true; break; }
    console.log(`✗ 哈希不符（服务器 ${got.slice(0, 16) || '缺失'}）→ 删除重传`);
    try { sh('ssh', [HOST, `rm -f ${REMOTE}/${name}`]); } catch { /* 已不存在 */ }
  }

  if (!ok) { console.error(`✗ ${name} 上传 ${MAX_RETRY} 次仍未通过校验`); failed++; }
  else console.log(`  ${name}  sha256=${want.slice(0, 16)}…`);
}

// 下载页跟着传（小文件，一次成）
const page = join(root, 'downloads', 'index.html');
if (existsSync(page)) {
  sh('rsync', ['-az', page, `${HOST}:${REMOTE}/`]);
  console.log('下载页已同步');
}

if (failed) { console.error(`\n✗ ${failed} 个文件未通过完整性校验`); process.exit(1); }
console.log('\n✓ 全部安装包上传完成且 sha256 与本地一致');
