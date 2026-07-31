// 【逻辑层】旅程状态机 —— 单一状态源 + 极简事件总线，与渲染无关
import { visibleSteps, visibleBranches, MILESTONES, STEPS } from '../data/steps.js';

const listeners = {};
const DEFAULTS_KEY = 'paxjourney_defaults';

// 推荐默认路径：覆盖每一个分支点，代表"当前主流机场最常见的一条线"
export const RECOMMENDED = {
  transit: 'metro',
  entrance: 'rail',
  checkin: 'kiosk',
  bagdrop: 'sbd',
  bhs: 'clear',
  security: 'smart',
  border: 'egate',
  dwell: 'dutyfree',
  gate: 'scan',
  boarding: 'contact',
};

function loadDefaults() {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    return raw ? { ...RECOMMENDED, ...JSON.parse(raw) } : { ...RECOMMENDED };
  } catch { return { ...RECOMMENDED }; }
}

export const state = {
  stepIndex: 0,
  choices: {},            // { stepId: branchId } —— 本次旅程实际选择
  defaults: loadDefaults(),
  pending: null,          // 分支窗里"已选中但未确认"的选项
  international: false,
  oneId: false,
  managerView: false,
  autoplay: false,
  elapsedSec: 0,
  resourceUnits: 0,
  litMilestones: [],
  finished: false,
};

export function on(evt, fn) { (listeners[evt] ||= []).push(fn); }
export function emit(evt, payload) { (listeners[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(evt, e); } }); }

export function steps() { return visibleSteps({ international: state.international }); }
export function currentStep() { return steps()[state.stepIndex] || steps()[0]; }
export function stepCount() { return steps().length; }

/** 当前开关下真正可选的分支（国内没有免税、One ID 关时没有刷脸通道…） */
export function branchesOf(step) {
  return visibleBranches(step, { international: state.international, oneId: state.oneId });
}

export function currentBranch() {
  const s = currentStep();
  const list = branchesOf(s);
  if (!list?.length) return null;
  return list.find(b => b.id === state.choices[s.id]) || null;
}

export function awaitingChoice() {
  const s = currentStep();
  const list = branchesOf(s);
  return !!(list?.length && !state.choices[s.id]);
}

/** 分支窗里的"选中"，还没执行 */
export function selectBranch(branchId) {
  state.pending = branchId;
  emit('select', { branchId });
}

export function chooseBranch(branchId) {
  const s = currentStep();
  const list = branchesOf(s);
  const b = list?.find(x => x.id === branchId);
  if (!b) return false;
  // 换选择时先把上一次的计量退回，避免反复点击把耗时累加成天文数字
  const prev = list.find(x => x.id === state.choices[s.id]);
  if (prev) { state.elapsedSec -= prev.durationSec || 0; state.resourceUnits -= prev.resource || 0; }
  state.choices[s.id] = branchId;
  state.pending = null;
  state.elapsedSec += b.durationSec || 0;
  state.resourceUnits += b.resource || 0;
  lightMilestonesFor(s.id);
  emit('branch', { step: s, branch: b });
  emit('change', { reason: 'branch' });
  return true;
}

function lightMilestonesFor(stepId) {
  MILESTONES.filter(m => m.atStep === stepId).forEach(m => {
    if (!state.litMilestones.includes(m.id)) state.litMilestones.push(m.id);
  });
}

export function goTo(index, reason = 'goto') {
  const list = steps();
  const i = Math.max(0, Math.min(list.length - 1, index));
  state.pending = null;
  if (i === state.stepIndex && reason !== 'init') { emit('replay', { step: list[i] }); return; }
  state.stepIndex = i;
  state.finished = false;
  const s = list[i];
  if (!branchesOf(s)?.length) lightMilestonesFor(s.id);
  emit('step', { step: s, index: i, reason });
  emit('change', { reason });
}

export function next() {
  if (awaitingChoice()) { emit('needChoice', { step: currentStep() }); return false; }
  if (state.stepIndex >= steps().length - 1) {
    state.finished = true;
    ['MS12', 'MS15', 'MS16'].forEach(id => { if (!state.litMilestones.includes(id)) state.litMilestones.push(id); });
    emit('finish', {});
    emit('change', { reason: 'finish' });
    return false;
  }
  goTo(state.stepIndex + 1, 'next');
  return true;
}

export function prev() { if (state.stepIndex > 0) goTo(state.stepIndex - 1, 'prev'); }

export function restart() {
  state.stepIndex = 0;
  state.choices = {};
  state.pending = null;
  state.elapsedSec = 0;
  state.resourceUnits = 0;
  state.litMilestones = [];
  state.finished = false;
  emit('step', { step: currentStep(), index: 0, reason: 'restart' });
  emit('change', { reason: 'restart' });
}

export function setToggle(key, value) {
  if (!(key in state)) return;
  state[key] = value;
  if (key === 'international') state.stepIndex = Math.min(state.stepIndex, steps().length - 1);
  // 开关变化可能让已选分支失效（例如关掉国际后仍选着免税）
  for (const s of steps()) {
    const list = branchesOf(s);
    if (list?.length && state.choices[s.id] && !list.some(b => b.id === state.choices[s.id])) {
      delete state.choices[s.id];
    }
  }
  emit('toggle', { key, value });
  emit('change', { reason: 'toggle:' + key });
}

// ── 默认路径配置 ──────────────────────────────────────────────
/** 所有有分支的步骤（不受开关过滤，配置窗要能配全） */
export function branchSteps() { return STEPS.filter(s => s.branches?.length); }

export function defaultBranchFor(step) {
  const list = branchesOf(step);
  if (!list?.length) return null;
  const want = state.defaults[step.id];
  return list.some(b => b.id === want) ? want : list[0].id;
}

export function setDefault(stepId, branchId) { state.defaults[stepId] = branchId; }

export function saveDefaults() {
  try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(state.defaults)); } catch {}
  emit('defaults', { defaults: state.defaults });
}

export function resetDefaults() {
  state.defaults = { ...RECOMMENDED };
  try { localStorage.removeItem(DEFAULTS_KEY); } catch {}
  emit('defaults', { defaults: state.defaults });
}
