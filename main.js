// 总线：把数据层 / 逻辑层 / 3D 层 / DOM 层接起来
import * as THREE from 'three';
import { createRenderer } from './scene/renderer.js';
import { buildWorld } from './scene/world.js';
import { createDirector } from './scene/director.js';
import * as S from './engine/state.js';
import { t, getLang, toggleLang, onLangChange, OWNERS, ownerName } from './data/i18n.js';
import { WindowManager } from './ui/window-manager.js';
import { createRail } from './ui/journey-rail.js';
import { createDomainMap } from './ui/domain-map.js';
import { createFlowBar } from './ui/flow-bar.js';
import { createNarrative } from './ui/narrative.js';
import { createLandscape } from './ui/landscape-window.js';
import { createDefaults } from './ui/defaults-window.js';
import { initInfoWindows, openFinish, openResolved, closeAllInfo } from './ui/info-window.js';
import { bindTermClicks, linkify } from './ui/term-link.js';

const $ = sel => document.querySelector(sel);

// ── 3D ────────────────────────────────────────────────────────
const viewport = $('#viewport');
const { scene, camera, controls, onFrame, pump } = createRenderer(viewport);
const world = buildWorld(scene);
const director = createDirector({ camera, controls, world });
onFrame((dt, dtMs) => { world.update(dt); director.update(dt, dtMs); });

// ── 浮窗：可拖动 / 最小化 / 关闭 / 拖角缩放 ───────────────────
const wm = new WindowManager();
[['rail', 'railTitle'], ['narrative', 'narrTitle'], ['branches', 'branchWinTitle'],
 ['flowbar', 'flowTitle'], ['domains', 'domainTitle'],
 ['landscape', 'landscapeTitle'], ['defaults', 'defaultsTitle']].forEach(([id, key]) => {
  wm.register($('#' + id), { id, i18n: key });
});
wm.setVisible('landscape', false);
wm.setVisible('defaults', false);
wm.onVisibility(syncDock);
initInfoWindows(wm);
bindTermClicks(hit => openResolved(hit));

function syncDock() {
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('on', wm.isVisible(b.dataset.win)));
}
document.querySelectorAll('.dock-btn').forEach(b => b.addEventListener('click', () => {
  wm.toggle(b.dataset.win);
  if (b.dataset.win === 'landscape' && wm.isVisible('landscape')) landscape.render();
  if (b.dataset.win === 'defaults' && wm.isVisible('defaults')) defaults.render();
  // 手动叫出分支窗 = 用户要它，撤销"确认后自动收起"
  if (b.dataset.win === 'branches') branchesDismissed = !wm.isVisible('branches');
  syncDock();
}));
$('#btn-layout').addEventListener('click', () => { wm.resetLayout(); wm.setVisible('landscape', false); wm.setVisible('defaults', false); syncDock(); });

// ── UI 模块 ───────────────────────────────────────────────────
const rail = createRail($('#rail'));
const domainMap = createDomainMap($('#domains'));
const flowBar = createFlowBar($('#flowbar'));
const narrative = createNarrative($('#narrative .nv-body'), $('#branches .bc-body'), onConfirmBranch, onBranchState);
const landscape = createLandscape($('#landscape'));
const defaults = createDefaults($('#defaults'), runAutoWithDefaults);

// 确认之后收起「路径选择」窗，直到下一个分支点再自己弹出来
let branchesDismissed = false;

function onBranchState(hasBranches, needsPick) {
  const show = !!hasBranches && !branchesDismissed;
  wm.setVisible('branches', show);
  if (show && needsPick) wm.get('branches')?.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 420 });
  syncDock();
}

function renderAll() {
  rail.render();
  domainMap.render();
  flowBar.render();
  narrative.render();
  if (wm.isVisible('landscape')) { landscape.render(); linkify($('#landscape .ls-body')); }
  if (wm.isVisible('defaults')) defaults.render();
}

// ── 步骤驱动 ──────────────────────────────────────────────────
function playCurrent() {
  const step = S.currentStep();
  const branch = S.currentBranch();
  const order = S.steps().map(s => s.id);
  if (!S.state.managerView) director.enter(step, branch?.id, order);
  renderAll();
  syncButtons();
}

// 每一幕的演示时长：确认后等这么久再自动进入下一步；自动播放同样用它节拍
const STEP_MS = { transit: 8500, entrance: 6500, checkin: 8500, bagdrop: 8500, bhs: 11500,
  security: 7500, border: 7000, dwell: 6500, gate: 8500, boarding: 13000 };
const stepMs = id => STEP_MS[id] || 7000;

let advanceTimer = null;
function scheduleAdvance(fromIndex) {
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    if (S.state.autoplay) return;                 // 自动播放有自己的节拍
    if (S.state.stepIndex !== fromIndex) return;  // 用户已手动跳步，别抢
    S.next();
  }, stepMs(S.currentStep().id));
}

/** 分支窗「确认并继续」：应用选择 → 演示本步 → 自动进入下一步 */
function onConfirmBranch(branchId) {
  const idx = S.state.stepIndex;
  branchesDismissed = true;          // 收起分支窗，别挡住这一步的 3D 演示
  S.chooseBranch(branchId);
  playCurrent();
  scheduleAdvance(idx);
}

S.on('step', () => { branchesDismissed = false; clearTimeout(advanceTimer); playCurrent(); });
S.on('replay', playCurrent);
S.on('toggle', () => { branchesDismissed = false; playCurrent(); });
S.on('finish', () => {
  stopAuto();
  renderAll();
  openFinish({ min: Math.round(S.state.elapsedSec / 60), res: S.state.resourceUnits });
});
// 没选就点下一步：把分支窗重新叫出来
S.on('needChoice', () => { branchesDismissed = false; onBranchState(true, true); });

// ── 自动播放：按默认路径配置全程走一遍 ────────────────────────
let autoTimer = null;

function autoTick() {
  if (!S.state.autoplay) return;
  const step = S.currentStep();
  if (S.awaitingChoice()) {
    const b = S.defaultBranchFor(step);
    if (b) { branchesDismissed = true; S.chooseBranch(b); playCurrent(); }
    autoTimer = setTimeout(autoTick, stepMs(step.id));
    return;
  }
  if (S.state.stepIndex >= S.stepCount() - 1) { S.next(); return; }  // 触发 finish
  S.next();
  autoTimer = setTimeout(autoTick, stepMs(S.currentStep().id));
}

function startAuto() {
  clearTimeout(advanceTimer);
  closeAllInfo();
  S.state.autoplay = true;
  S.restart();
  syncButtons();
  autoTimer = setTimeout(autoTick, 1400);
}

function stopAuto() {
  S.state.autoplay = false;
  clearTimeout(autoTimer);
  syncButtons();
}

function runAutoWithDefaults() { wm.setVisible('defaults', false); syncDock(); startAuto(); }

// ── 控制条与开关 ──────────────────────────────────────────────
function syncButtons() {
  $('#btn-prev').disabled = S.state.stepIndex === 0;
  const last = S.state.stepIndex >= S.stepCount() - 1;
  $('#btn-next').textContent = last ? (getLang() === 'zh' ? '完成 ✓' : 'Finish ✓') : t('btnNext');
  $('#tgl-intl').classList.toggle('on', S.state.international);
  $('#tgl-intl').textContent = S.state.international ? t('tglIntl') : t('tglDomestic');
  $('#tgl-oneid').classList.toggle('on', S.state.oneId);
  $('#tgl-oneid').textContent = S.state.oneId ? t('tglOneId') : t('tglTrad');
  $('#tgl-view').classList.toggle('on', S.state.managerView);
  $('#tgl-view').textContent = S.state.managerView ? t('tglView') : t('tglViewPax');
  $('#btn-auto').textContent = S.state.autoplay ? t('btnPause') : t('btnAuto');
  $('#btn-auto').classList.toggle('on', S.state.autoplay);
  syncDock();
}

$('#btn-next').addEventListener('click', () => { clearTimeout(advanceTimer); stopAuto(); S.next(); });
$('#btn-prev').addEventListener('click', () => { clearTimeout(advanceTimer); stopAuto(); S.prev(); });
$('#btn-replay').addEventListener('click', () => { clearTimeout(advanceTimer); playCurrent(); flowBar.replay(); });
$('#btn-restart').addEventListener('click', () => { clearTimeout(advanceTimer); stopAuto(); closeAllInfo(); S.restart(); });
$('#btn-auto').addEventListener('click', () => { if (S.state.autoplay) stopAuto(); else startAuto(); });

$('#tgl-intl').addEventListener('click', () => S.setToggle('international', !S.state.international));
$('#tgl-oneid').addEventListener('click', () => S.setToggle('oneId', !S.state.oneId));
$('#tgl-view').addEventListener('click', () => {
  S.setToggle('managerView', !S.state.managerView);
  if (S.state.managerView) director.moveCamera(new THREE.Vector3(-16, 92, 118), new THREE.Vector3(-8, 0, 8), 1800);
});

// ── i18n ──────────────────────────────────────────────────────
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
  $('#lang-btn').textContent = t('langBtn');
  document.title = t('title') + ' · OPC Studio';
  $('#legend').innerHTML = `<div class="lg" style="color:var(--gold-lite);font-weight:700">${t('legendTitle')}</div>` +
    Object.keys(OWNERS).map(k => `<div class="lg"><span class="dot" style="background:${OWNERS[k].color}"></span>${ownerName(k)}</div>`).join('');
  closeAllInfo();                        // 知识窗内容是按语言渲染的，切换语言时清掉重开
  renderAll();
  syncButtons();
}
$('#lang-btn').addEventListener('click', toggleLang);
onLangChange(applyLang);

// ── 键盘 ──────────────────────────────────────────────────────
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
  if (e.key === 'ArrowRight') { stopAuto(); S.next(); }
  if (e.key === 'ArrowLeft') { stopAuto(); S.prev(); }
});

// ── 启动 ──────────────────────────────────────────────────────
applyLang();
S.goTo(0, 'init');

// 调试钩子（沿用 airport-twin 的排障习惯）
window.__pax = { S, world, director, camera, controls, scene, wm, pump, THREE };
