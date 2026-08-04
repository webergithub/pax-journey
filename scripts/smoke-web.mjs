#!/usr/bin/env node
/**
 * smoke-web.mjs —— 本地无头冒烟（G-ENG-4）
 *
 * 把此前每轮都靠人肉执行的验证固化成脚本：启动 devserver → 无头浏览器加载 →
 * 检查零 console 错误 / 启动成功 / 零 CDN 请求 / 数据计数 / 三档布局零重叠。
 *
 * 两个必须照顾的环境坑（此前多轮踩过，见项目记忆）：
 *   · 后台标签 rAF 被节流 → 用 __pax.pump(n,dt) 手动驱动帧
 *   · CSS transition 同样被节流 → getComputedStyle 前先 getAnimations().finish()
 *
 * 依赖 puppeteer（可选）：未安装时跳过并给出提示，不阻断其他校验。
 * 用法：node scripts/smoke-web.mjs [port]
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.argv[2] || '5399';
const URL_ = `http://localhost:${PORT}/`;

let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch {
  console.log('⚠ 未安装 puppeteer，跳过无头冒烟。');
  console.log('  安装：cd ' + root + ' && npm i -D puppeteer');
  console.log('  （数据契约与线上校验不依赖它，仍可单独运行）');
  process.exit(0);
}

const server = spawn('python3', [join(root, '.devserver.py'), PORT], { cwd: root, stdio: 'ignore' });
const stop = () => { try { server.kill(); } catch {} };
process.on('exit', stop);
await new Promise(r => setTimeout(r, 900));

const errs = [];
// 无头 Chrome 的默认 GL 后端不提供 WebGL2（会被我们自己的自检正确拦下），
// 必须显式走 ANGLE + 允许软件光栅，否则冒烟测的是"自检生效"而不是产品本身。
const browser = await puppeteer.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
try {
  const page = await browser.newPage();
  const consoleErrs = [], cdnReqs = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  page.on('pageerror', e => consoleErrs.push('pageerror: ' + e.message));
  page.on('request', r => { if (r.url().includes('jsdelivr')) cdnReqs.push(r.url()); });

  await page.setViewport({ width: 1600, height: 940 });
  await page.goto(URL_, { waitUntil: 'networkidle0', timeout: 30000 });
  const started = await page.waitForFunction('!!window.__pax', { timeout: 15000 }).then(() => true).catch(() => false);
  if (!started) {
    const why = await page.evaluate(() => document.querySelector('#health-fatal h1')?.textContent || '未知');
    errs.push(`__pax 未就绪：启动失败（兜底页标题：${why}）`);
    throw new Error('startup failed — 后续检查已跳过');   // 别带着 undefined 继续跑
  }

  // 零 CDN 请求（G-RUN-1 回归防线）
  if (cdnReqs.length) errs.push(`发起了 ${cdnReqs.length} 个 CDN 请求，应为 0`);

  // 兜底页不该出现
  const fatal = await page.$('#health-fatal');
  if (fatal) errs.push('出现了健康自检兜底页（正常环境不应触发）');

  // 数据计数
  const counts = await page.evaluate(() => {
    const w = window.__pax;
    return { steps: w.S.steps().length, wins: document.querySelectorAll('.win').length };
  });
  if (counts.steps !== 9) errs.push(`国内模式步骤数 ${counts.steps}，期望 9`);
  if (counts.wins !== 7) errs.push(`浮窗数 ${counts.wins}，期望 7`);

  // 三档布局零重叠（G-ENG-4：把 v0.9 的人肉验收固化）
  for (const [w, h] of [[1600, 940], [1366, 860], [1120, 800]]) {
    await page.setViewport({ width: w, height: h });
    await new Promise(r => setTimeout(r, 250));
    const overlaps = await page.evaluate(() => {
      const ids = ['rail', 'narrative', 'branches', 'flowbar', 'domains']
        .filter(id => { const e = document.getElementById(id); return e && !e.classList.contains('win-hidden'); });
      const out = [];
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = document.getElementById(ids[i]).getBoundingClientRect();
        const b = document.getElementById(ids[j]).getBoundingClientRect();
        const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (x > 1 && y > 1) out.push(`${ids[i]}×${ids[j]}`);
      }
      return out;
    });
    if (overlaps.length) errs.push(`${w}×${h} 窗口重叠: ${overlaps.join(', ')}`);
  }

  // 半透明规则（rAF/transition 节流坑：先 finish 动画再读计算值）
  const opacity = await page.evaluate(() => {
    const el = document.getElementById('rail');
    el.getAnimations().forEach(a => { try { a.finish(); } catch {} });
    return getComputedStyle(el).backgroundColor;
  });
  if (!/0\.6[0-9]|0\.66/.test(opacity)) errs.push(`空闲窗背景 alpha 异常: ${opacity}`);

  // 走一步确认状态机可用（pump 对抗 rAF 节流）
  await page.evaluate(() => {
    const w = window.__pax;
    w.S.chooseBranch('metro');
    w.S.next();
    w.pump(120, 16);
  });
  const step = await page.evaluate(() => window.__pax.S.currentStep().id);
  if (step !== 'entrance') errs.push(`推进一步后应为 entrance，实为 ${step}`);

  if (consoleErrs.length) errs.push(`console 错误 ${consoleErrs.length} 条：${consoleErrs.slice(0, 3).join(' | ')}`);
  console.log(`冒烟：步骤 ${counts.steps} · 浮窗 ${counts.wins} · CDN 请求 ${cdnReqs.length} · console 错误 ${consoleErrs.length}`);
} finally {
  await browser.close();
  stop();
}

if (errs.length) {
  console.error(`\n✗ 冒烟失败（${errs.length} 项）：`);
  for (const e of errs) console.error('  ' + e);
  process.exit(1);
}
console.log('✓ 本地冒烟通过');
