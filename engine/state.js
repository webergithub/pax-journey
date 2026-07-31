// 【逻辑层】旅程状态机 —— 单一状态源 + 极简事件总线，与渲染无关
import { visibleSteps, MILESTONES } from '../data/steps.js';

const listeners = {};

export const state = {
  stepIndex: 0,
  choices: {},            // { stepId: branchId }
  international: false,
  oneId: false,
  managerView: false,
  autoplay: false,
  elapsedSec: 0,          // 旅程累计耗时（模拟）
  resourceUnits: 0,       // 累计占用的机场资源当量
  litMilestones: [],
  finished: false,
};

export function on(evt, fn) { (listeners[evt] ||= []).push(fn); }
export function emit(evt, payload) { (listeners[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(evt, e); } }); }

export function steps() { return visibleSteps({ international: state.international }); }
export function currentStep() { return steps()[state.stepIndex] || steps()[0]; }
export function stepCount() { return steps().length; }

export function currentBranch() {
  const s = currentStep();
  if (!s?.branches) return null;
  const id = state.choices[s.id];
  return s.branches.find(b => b.id === id) || null;
}

// 当前步骤是否还在等待用户做选择
export function awaitingChoice() {
  const s = currentStep();
  return !!(s?.branches && !state.choices[s.id]);
}

export function chooseBranch(branchId) {
  const s = currentStep();
  if (!s?.branches) return;
  const b = s.branches.find(x => x.id === branchId);
  if (!b) return;
  state.choices[s.id] = branchId;
  state.elapsedSec += b.durationSec || 0;
  state.resourceUnits += b.resource || 0;
  lightMilestonesFor(s.id);
  emit('branch', { step: s, branch: b });
  emit('change', { reason: 'branch' });
}

function lightMilestonesFor(stepId) {
  MILESTONES.filter(m => m.atStep === stepId).forEach(m => {
    if (!state.litMilestones.includes(m.id)) state.litMilestones.push(m.id);
  });
}

export function goTo(index, reason = 'goto') {
  const list = steps();
  const i = Math.max(0, Math.min(list.length - 1, index));
  if (i === state.stepIndex && reason !== 'init') { emit('replay', { step: list[i] }); return; }
  state.stepIndex = i;
  state.finished = false;
  const s = list[i];
  if (!s.branches) lightMilestonesFor(s.id);
  emit('step', { step: s, index: i, reason });
  emit('change', { reason });
}

export function next() {
  if (awaitingChoice()) { emit('needChoice', { step: currentStep() }); return; }
  if (state.stepIndex >= steps().length - 1) {
    state.finished = true;
    // 最后一步走完，补亮起飞里程碑
    ['MS12', 'MS15', 'MS16'].forEach(id => { if (!state.litMilestones.includes(id)) state.litMilestones.push(id); });
    emit('finish', {});
    emit('change', { reason: 'finish' });
    return;
  }
  goTo(state.stepIndex + 1, 'next');
}

export function prev() { if (state.stepIndex > 0) goTo(state.stepIndex - 1, 'prev'); }

export function restart() {
  state.stepIndex = 0;
  state.choices = {};
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
  // 切换国内/国际会改变步骤集合，需要把索引夹回有效范围
  if (key === 'international') state.stepIndex = Math.min(state.stepIndex, steps().length - 1);
  emit('toggle', { key, value });
  emit('change', { reason: 'toggle:' + key });
}
