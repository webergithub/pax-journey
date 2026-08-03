// 【UI-DOM 层】「本步解说」窗 + 「路径选择」窗（选中 → 确认并继续）
import { T, t, ownerColor } from '../data/i18n.js';
import { getDomain } from '../data/domains.js';
import { getSystem } from '../data/systems.js';
import { openSystem } from './info-window.js';
import { linkify } from './term-link.js';
import { resolveFlow } from '../engine/flow-engine.js';
import * as S from '../engine/state.js';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function fmt(sec) {
  if (sec >= 600) return Math.round(sec / 60) + ' min';
  if (sec >= 90) return (sec / 60).toFixed(1) + ' min';
  return sec + ' ' + t('sec');
}

/** onConfirm(branchId) 由 main 提供：应用选择 → 演示本步 → 进入下一步 */
export function createNarrative(nEl, bEl, onConfirm, onBranchState) {
  function renderNarrative() {
    const step = S.currentStep();
    const branch = S.currentBranch();
    const dom = getDomain(step.domain);
    const kn = step.knowledge || [];

    nEl.innerHTML = `
      <div class="nv-head no-link">
        <span class="nv-icon">${step.icon}</span>
        <h3>${esc(T(step.name))}</h3>
        <span class="nv-dom" style="color:${dom?.color};border-color:${dom?.color}44">${dom?.icon || ''} ${esc(dom ? T(dom.name) : '')}</span>
      </div>
      <p>${rich(T(step.narrative))}</p>
      ${branch?.note ? `<p style="color:#b6ada0;font-size:12px">↳ ${rich(T(branch.note))}</p>` : ''}
      <div class="nv-meta no-link">
        ${kn.map(id => { const s = getSystem(id); const c = ownerColor(s.owner);
          return `<span class="chip" data-sys="${id}" style="border-color:${c}40;color:${c}">${s.abbr}</span>`; }).join('')}
        ${(step.kpis || []).map(k => `<span class="chip kpi">📈 ${esc(T(k))}</span>`).join('')}
        ${(step.exceptions || []).map(e => `<span class="chip exc">⚠ ${esc(T(e))}</span>`).join('')}
      </div>`;
    nEl.querySelectorAll('[data-sys]').forEach(n => n.addEventListener('click', () => openSystem(n.dataset.sys)));
    linkify(nEl);
  }

  function renderBranches() {
    const step = S.currentStep();
    const list = S.branchesOf(step);
    if (!list?.length) { bEl.innerHTML = ''; onBranchState?.(false); return; }

    const picked = S.state.choices[step.id];
    const sel = S.state.pending || picked || null;

    bEl.innerHTML = `
      <div class="branch-title no-link">${esc(T(step.branchTitle || { zh: t('branchTitle'), en: t('branchTitle') }))}</div>
      <div class="branch-cards">${list.map(b => {
        const flow = resolveFlow(step, b, { oneId: S.state.oneId });
        const isSel = sel === b.id;
        return `<div class="branch-card ${isSel ? 'sel' : ''} ${picked === b.id ? 'picked' : ''}" data-b="${b.id}">
          <div class="bc-head"><span class="ic">${b.icon}</span><span class="lb">${esc(T(b.label))}</span>
            ${b.intlOnly ? `<span class="bc-flag">${esc(t('tglIntl'))}</span>` : ''}
            ${picked === b.id ? '<span class="bc-tick">✓</span>' : ''}</div>
          <div class="bc-dev">${esc(T(b.device))}</div>
          <div class="bc-stats">
            <div class="bc-stat"><div class="k">${esc(t('elapsed'))}</div><div class="v">${fmt(b.durationSec)}</div></div>
            <div class="bc-stat"><div class="k">${esc(t('resource'))}</div><div class="v">${b.resource}</div></div>
          </div>
          <div class="bc-sys">${flow.nodes.slice(0, 6).map(s => { const c = ownerColor(s.owner);
            return `<span class="term-link" data-term="${s.abbr}" style="background:${c}1e;color:${c};border:1px solid ${c}3a">${s.abbr}</span>`; }).join('')}</div>
        </div>`;
      }).join('')}</div>
      <div class="branch-foot no-link">
        <span class="branch-hint">${esc(t('branchPickHint'))}</span>
        <button class="btn primary" id="btn-confirm" ${sel ? '' : 'disabled'}>${esc(t('btnConfirm'))}</button>
      </div>`;

    bEl.querySelectorAll('[data-b]').forEach(n => n.addEventListener('click', ev => {
      // 点卡里的系统芯片是看术语解释，不是选路径——别触发选中导致整窗重渲染
      if (ev.target.closest('.term-link')) return;
      S.selectBranch(n.dataset.b);
      renderBranches();
    }));
    bEl.querySelector('#btn-confirm')?.addEventListener('click', () => {
      const id = S.state.pending || S.state.choices[step.id];
      if (!id) return;
      const foot = bEl.querySelector('.branch-hint');
      if (foot) { foot.textContent = t('branchConfirmed'); foot.classList.add('ok'); }
      bEl.querySelector('#btn-confirm').disabled = true;
      onConfirm(id);
    });

    onBranchState?.(true, !picked);
  }

  return { render() { renderNarrative(); renderBranches(); } };
}
