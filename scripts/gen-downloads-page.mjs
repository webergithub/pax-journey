#!/usr/bin/env node
/**
 * gen-downloads-page.mjs —— 扫描 desktop/dist 里的安装包，生成双语下载页
 * downloads/index.html（走站点 i18n 标准：opcstudio_lang + t() + applyLang()）。
 * 用法：node scripts/gen-downloads-page.mjs <版本号>
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ver = process.argv[2];
if (!ver) { console.error('usage: node scripts/gen-downloads-page.mjs <version>'); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'desktop', 'dist');
const outDir = join(root, 'downloads');
mkdirSync(outDir, { recursive: true });

const KINDS = [
  { re: /mac-universal\.dmg$/, icon: '', os: 'macOS', kind: { zh: '安装镜像 · Apple Silicon 与 Intel 通用', en: 'Disk image · Universal (Apple Silicon & Intel)' },
    note: { zh: '未做开发者签名：首次打开若被拦，右键 App → 打开，或到「系统设置 → 隐私与安全性」点「仍要打开」。', en: 'Unsigned test build: on first launch right-click → Open, or allow it under System Settings → Privacy & Security.' } },
  { re: /win-x64\.exe$/, icon: '🪟', os: 'Windows', kind: { zh: '一键安装包 · x64', en: 'One-click installer · x64' },
    note: { zh: '未签名：SmartScreen 弹窗时点「更多信息 → 仍要运行」。', en: 'Unsigned: if SmartScreen appears, choose "More info → Run anyway".' } },
  { re: /win-x64\.zip$/, icon: '🪟', os: 'Windows', kind: { zh: '免安装便携版 · x64（解压即用）', en: 'Portable · x64 (unzip and run)' },
    note: { zh: '解压后运行 PaxJourney.exe。', en: 'Unzip and run PaxJourney.exe.' } },
];

const files = readdirSync(dist).filter(f => KINDS.some(k => k.re.test(f)) && f.includes(`v${ver}`));
if (!files.length) { console.error('desktop/dist 里没有 v' + ver + ' 的安装包'); process.exit(1); }

const rows = files.map(f => {
  const p = join(dist, f);
  const size = statSync(p).size;
  const sha = createHash('sha256').update(readFileSync(p)).digest('hex');
  const kind = KINDS.find(k => k.re.test(f));
  return { f, sizeMB: (size / 1048576).toFixed(0), sha, ...kind };
});

const rowHtml = rows.map(r => `
    <div class="card">
      <div class="ic">${r.icon}</div>
      <div class="meta">
        <div class="os">${r.os} <span class="kind" data-kind-zh="${r.kind.zh}" data-kind-en="${r.kind.en}"></span></div>
        <div class="fn">${r.f} · ${r.sizeMB} MB</div>
        <div class="sha">SHA-256 <code>${r.sha}</code></div>
        <div class="note" data-note-zh="${r.note.zh}" data-note-en="${r.note.en}"></div>
      </div>
      <a class="dl" href="./${r.f}" download data-i18n="dl">下载</a>
    </div>`).join('');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>旅客旅程学习模拟器 · 桌面版下载</title>
<style>
  :root { --bg:#0d0a07; --gold:#c9944a; --gold-lite:#e8b86d; --txt:#e8e3dc; --muted:#9a8f83; --line:rgba(201,148,74,.2); }
  * { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--txt);
    font-family:Inter,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif; min-height:100vh; }
  .wrap { max-width:860px; margin:0 auto; padding:36px 20px 60px; }
  .nav { display:flex; gap:10px; align-items:center; margin-bottom:26px; }
  .nav a { color:var(--gold); text-decoration:none; font-size:13px; font-weight:600; padding:6px 12px;
    border:1px solid var(--line); border-radius:9px; }
  #lang-btn { margin-left:auto; background:rgba(201,148,74,.12); border:1px solid rgba(201,148,74,.18);
    color:#c9944a; font-size:12px; font-weight:600; padding:5px 12px; border-radius:8px; cursor:pointer; }
  h1 { font-size:24px; color:var(--gold-lite); margin:0 0 6px; }
  .sub { color:var(--muted); font-size:13.5px; line-height:1.7; margin-bottom:28px; }
  .card { display:flex; gap:14px; align-items:center; background:rgba(22,18,13,.92);
    border:1px solid var(--line); border-radius:14px; padding:16px 18px; margin-bottom:14px; }
  .ic { font-size:30px; } .meta { flex:1; min-width:0; }
  .os { font-size:15px; font-weight:700; } .kind { color:var(--muted); font-weight:400; font-size:12.5px; }
  .fn { font-family:ui-monospace,Menlo,monospace; font-size:12px; color:var(--gold-lite); margin:3px 0; }
  .sha { font-size:10.5px; color:#6d655c; word-break:break-all; } .sha code { font-size:10px; }
  .note { font-size:11.5px; color:var(--muted); margin-top:5px; line-height:1.55; }
  .dl { flex:none; background:var(--gold); color:#1a1309; font-weight:700; font-size:13px;
    padding:9px 22px; border-radius:10px; text-decoration:none; } .dl:hover { background:var(--gold-lite); }
  .foot { margin-top:26px; font-size:11.5px; color:#6d655c; line-height:1.7; }
</style>
</head>
<body>
<div class="wrap">
  <div class="nav">
    <a href="/" data-i18n="home">← 返回主页</a>
    <a href="/pax-journey/" data-i18n="webver">🌐 在线版</a>
    <button id="lang-btn">EN</button>
  </div>
  <h1 data-i18n="title">旅客旅程学习模拟器 · 桌面版</h1>
  <p class="sub" data-i18n="subtitle"></p>
  ${rowHtml}
  <p class="foot" data-i18n="foot"></p>
</div>
<script>
const LANG_KEY='opcstudio_lang';
let lang=localStorage.getItem(LANG_KEY)||'zh';
const dict={
  zh:{home:'← 返回主页',webver:'🌐 在线版',langBtn:'EN',dl:'下载',
    title:'旅客旅程学习模拟器 · 桌面版 v${ver}',
    subtitle:'完全离线的本地版本：Three.js 与全部教学数据已内置，无需网络即可运行整个 3D 旅程、术语库与 ICT 评估。适合内训教室、演示与离线环境部署测试。',
    foot:'测试版构建，未做代码签名。校验完整性请核对 SHA-256。反馈：weber1128@gmail.com'},
  en:{home:'← Home',webver:'🌐 Web version',langBtn:'中文',dl:'Download',
    title:'Passenger Journey Simulator · Desktop v${ver}',
    subtitle:'Fully offline local build: Three.js and all teaching data are bundled, so the 3D journey, glossary and ICT sizing run without any network. Made for classrooms, demos and offline deployment testing.',
    foot:'Test build, not code-signed. Verify integrity with the SHA-256 above. Feedback: weber1128@gmail.com'}};
function applyLang(){
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-i18n]').forEach(n=>{const k=n.dataset.i18n;if(dict[lang][k])n.textContent=dict[lang][k];});
  document.getElementById('lang-btn').textContent=dict[lang].langBtn;
  document.querySelectorAll('[data-kind-zh]').forEach(n=>n.textContent='· '+n.dataset[lang==='zh'?'kindZh':'kindEn']);
  document.querySelectorAll('[data-note-zh]').forEach(n=>n.textContent=n.dataset[lang==='zh'?'noteZh':'noteEn']);
  localStorage.setItem(LANG_KEY,lang);
}
document.getElementById('lang-btn').onclick=()=>{lang=lang==='zh'?'en':'zh';applyLang();};
applyLang();
</script>
</body>
</html>`;

writeFileSync(join(outDir, 'index.html'), html);
console.log('downloads/index.html generated:', rows.map(r => `${r.f} ${r.sizeMB}MB`).join(' | '));
for (const r of rows) console.log(`  ${r.f}  sha256=${r.sha}`);
