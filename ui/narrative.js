// 【UI-DOM 层】「本步解说」窗 + 「路径选择」窗
import { T, t, ownerColor } from '../data/i18n.js';
import { getDomain } from '../data/domains.js';
import { getSystem } from '../data/systems.js';
import { openSystem } from './knowledge-card.js';
import { resolveFlow } from '../engine/flow-engine.js';
import * as S from '../engine/state.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function fmt(sec) {
  if (sec >= 600) return Math.round(sec / 60) + ' min';
  if (sec >= 90) return (sec / 60).toFixed(1) + ' min';
  return sec + ' ' + t('sec');
}

/** nEl = #narrative .nv-body ; bEl = #branches .bc-body ; onBranchState(hasBranches) 供 dock 同步 */
export function createNarrative(nEl, bEl, onChoose, onBranchState) {
  function renderNarrative() {
    const step = S.currentStep();
    const branch = S.currentBranch();
    const dom = getDomain(step.domain);
    const kn = step.knowledge || [];

    nEl.innerHTML = `
      <div class="nv-head">
        <span class="nv-icon">${step.icon}</span>
        <h3>${esc(T(step.name))}</h3>
        <span class="nv-dom" style="color:${dom?.color};border-color:${dom?.color}44">${dom?.icon || ''} ${esc(dom ? T(dom.name) : '')}</span>
      </div>
      <p>${rich(T(step.narrative))}</p>
      ${branch?.note ? `<p style="color:#b6ada0;font-size:12px">↳ ${rich(T(branch.note))}</p>` : ''}
      <div class="nv-meta">
        ${kn.map(id => { const s = getSystem(id); const c = ownerColor(s.owner);
          return `<span class="chip" data-sys="${id}" style="border-color:${c}40;color:${c}">${s.abbr}</span>`; }).join('')}
        ${(step.kpis || []).map(k => `<span class="chip kpi">📈 ${esc(T(k))}</span>`).join('')}
        ${(step.exceptions || []).map(e => `<span class="chip exc">⚠ ${esc(T(e))}</span>`).join('')}
      </div>`;
    nEl.querySelectorAll('[data-sys]').forEach(n => n.addEventListener('click', () => openSystem(n.dataset.sys)));
  }

  function renderBranches() {
    const step = S.currentStep();
    if (!step.branches) { bEl.innerHTML = ''; onBranchState?.(false); return; }
    const picked = S.state.choices[step.id];

    bEl.innerHTML = `<div class="branch-title">${esc(T(step.branchTitle || { zh: t('branchTitle'), en: t('branchTitle') }))}</div>
      <div class="branch-cards">${step.branches.map(b => {
        const flow = resolveFlow(step, b, { oneId: S.state.oneId });
        return `<div class="branch-card ${picked === b.id ? 'picked' : ''}" data-b="${b.id}">
          <div class="bc-head"><span class="ic">${b.icon}</span><span class="lb">${esc(T(b.label))}</span></div>
          <div class="bc-dev">${esc(T(b.device))}</div>
          <div class="bc-stats">
            <div class="bc-stat"><div class="k">${esc(t('elapsed'))}</div><div class="v">${fmt(b.durationSec)}</div></div>
            <div class="bc-stat"><div class="k">${esc(t('resource'))}</div><div class="v">${b.resource}</div></div>
          </div>
          <div class="bc-sys">${flow.nodes.slice(0, 6).map(s => { const c = ownerColor(s.owner);
            return `<span style="background:${c}1e;color:${c};border:1px solid ${c}3a">${s.abbr}</span>`; }).join('')}</div>
        </div>`;
      }).join('')}</div>`;

    bEl.querySelectorAll('[data-b]').forEach(n => n.addEventListener('click', () => onChoose(n.dataset.b)));
    onBranchState?.(true, !picked);
  }

  return { render() { renderNarrative(); renderBranches(); } };
}
