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
import { openFinish, closeCard } from './ui/knowledge-card.js';

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
 ['flowbar', 'flowTitle'], ['domains', 'domainTitle']].forEach(([id, key]) => {
  wm.register($('#' + id), { id, i18n: key });
});
wm.onVisibility(syncDock);

function syncDock() {
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('on', wm.isVisible(b.dataset.win)));
}
document.querySelectorAll('.dock-btn').forEach(b => b.addEventListener('click', () => { wm.toggle(b.dataset.win); syncDock(); }));
$('#btn-layout').addEventListener('click', () => { wm.resetLayout(); syncDock(); });

// ── UI 模块 ───────────────────────────────────────────────────
const rail = createRail($('#rail'));
const domainMap = createDomainMap($('#domains'));
const flowBar = createFlowBar($('#flowbar'));
const narrative = createNarrative($('#narrative .nv-body'), $('#branches .bc-body'), onChooseBranch, onBranchState);

// 有分支时自动弹出「路径选择」窗；无分支时自动收起，不占屏
function onBranchState(hasBranches, needsPick) {
  wm.setVisible('branches', !!hasBranches);
  if (hasBranches && needsPick) {
    const el = wm.get('branches');
    el.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 420 });
  }
  syncDock();
}

function renderAll() {
  rail.render();
  domainMap.render();
  flowBar.render();
  narrative.render();
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

function onChooseBranch(branchId) {
  S.chooseBranch(branchId);
  playCurrent();
}

S.on('step', playCurrent);
S.on('replay', playCurrent);
S.on('toggle', playCurrent);
S.on('finish', () => {
  renderAll();
  openFinish({ min: Math.round(S.state.elapsedSec / 60), res: S.state.resourceUnits });
});
S.on('needChoice', () => { wm.setVisible('branches', true); onBranchState(true, true); });

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

$('#btn-next').addEventListener('click', () => S.next());
$('#btn-prev').addEventListener('click', () => S.prev());
$('#btn-replay').addEventListener('click', () => { playCurrent(); flowBar.replay(); });
$('#btn-restart').addEventListener('click', () => { closeCard(); S.restart(); });

$('#tgl-intl').addEventListener('click', () => S.setToggle('international', !S.state.international));
$('#tgl-oneid').addEventListener('click', () => S.setToggle('oneId', !S.state.oneId));
$('#tgl-view').addEventListener('click', () => {
  S.setToggle('managerView', !S.state.managerView);
  if (S.state.managerView) director.moveCamera(new THREE.Vector3(-16, 92, 118), new THREE.Vector3(-8, 0, 8), 1800);
});

// 自动播放：无需选择时每 9 秒推进一步
let autoTimer = null;
$('#btn-auto').addEventListener('click', () => {
  S.state.autoplay = !S.state.autoplay;
  clearInterval(autoTimer);
  if (S.state.autoplay) {
    autoTimer = setInterval(() => {
      if (S.awaitingChoice()) onChooseBranch(S.currentStep().branches[0].id);
      else if (S.state.stepIndex < S.stepCount() - 1) S.next();
      else { S.state.autoplay = false; clearInterval(autoTimer); syncButtons(); }
    }, 9000);
  }
  syncButtons();
});

// ── i18n ──────────────────────────────────────────────────────
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
  $('#lang-btn').textContent = t('langBtn');
  document.title = t('title') + ' · OPC Studio';
  $('#legend').innerHTML = `<div class="lg" style="color:var(--gold-lite);font-weight:700">${t('legendTitle')}</div>` +
    Object.keys(OWNERS).map(k => `<div class="lg"><span class="dot" style="background:${OWNERS[k].color}"></span>${ownerName(k)}</div>`).join('');
  renderAll();
  syncButtons();
}
$('#lang-btn').addEventListener('click', toggleLang);
onLangChange(applyLang);

// ── 键盘 ──────────────────────────────────────────────────────
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
  if (e.key === 'ArrowRight') S.next();
  if (e.key === 'ArrowLeft') S.prev();
});

// ── 启动 ──────────────────────────────────────────────────────
applyLang();
S.goTo(0, 'init');

// 调试钩子（沿用 airport-twin 的排障习惯）
window.__pax = { S, world, director, camera, controls, scene, wm, pump, THREE };
