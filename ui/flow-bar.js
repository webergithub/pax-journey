// 【UI-DOM 层】底部系统与报文链路条 —— 把"看不见的世界"画成一条可点击的时序链
import { T, t, ownerColor, ownerName } from '../data/i18n.js';
import { getSystem } from '../data/systems.js';
import { resolveFlow } from '../engine/flow-engine.js';
import { MILESTONES } from '../data/steps.js';
import { openSystem, openMessage } from './knowledge-card.js';
import * as S from '../engine/state.js';

export function createFlowBar(el) {
  const canvas = el.querySelector('.fb-canvas');
  const msRow = el.querySelector('.fb-ms');
  let timers = [];

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function render() {
    clearTimers();
    const step = S.currentStep();
    const branch = S.currentBranch();
    const flow = resolveFlow(step, branch, { oneId: S.state.oneId });

    // 把边序列拉成 node → edge → node 的链，共享相邻节点
    const items = [];
    let lastTo = null;
    for (const e of flow.edges) {
      if (lastTo !== e.from) items.push({ type: 'node', id: e.from });
      items.push({ type: 'edge', e });
      items.push({ type: 'node', id: e.to });
      lastTo = e.to;
    }

    if (!items.length) {
      canvas.innerHTML = `<div class="fb-empty">${t('flowEmpty')}</div>`;
      renderMilestones();
      return;
    }

    canvas.innerHTML = items.map(it => {
      if (it.type === 'node') {
        const s = getSystem(it.id);
        const col = ownerColor(s.owner);
        return `<div class="fb-node" data-sys="${s.id}" style="border-color:${col}44;background:${col}12">
          <div class="abbr" style="color:${col}">${s.abbr}</div>
          <div class="nm">${T(s.name)}</div>
          <div class="ow" style="color:${col}">${ownerName(s.owner)}</div>
        </div>`;
      }
      const m = it.e.message;
      return `<div class="fb-edge">
        <div class="ln"></div><div class="ar">▶</div>
        <div class="msg ${it.e.biometric ? 'bio' : ''}" data-msg="${it.e.msg}" title="${T(m.name)}">${it.e.msg}</div>
      </div>`;
    }).join('');

    canvas.querySelectorAll('[data-sys]').forEach(n => n.addEventListener('click', () => openSystem(n.dataset.sys)));
    canvas.querySelectorAll('[data-msg]').forEach(n => n.addEventListener('click', ev => { ev.stopPropagation(); openMessage(n.dataset.msg); }));

    animateDots();
    renderMilestones();
  }

  // 报文光点依次沿各段流动
  function animateDots() {
    const edges = [...canvas.querySelectorAll('.fb-edge')];
    edges.forEach((edge, i) => {
      timers.push(setTimeout(() => {
        const dot = document.createElement('div');
        dot.className = 'fb-dot';
        dot.style.left = '0px';
        edge.appendChild(dot);
        const w = edge.clientWidth - 8;
        const t0 = performance.now();
        (function step(now) {
          const p = Math.min(1, (now - t0) / 750);
          dot.style.left = (p * w) + 'px';
          dot.style.opacity = String(1 - Math.max(0, p - 0.75) * 4);
          if (p < 1) requestAnimationFrame(step); else dot.remove();
        })(t0);
      }, 260 + i * 460));
    });
  }

  function renderMilestones() {
    msRow.innerHTML = `<span style="font-size:9.5px;color:var(--dim);margin-right:4px">${t('milestones')}</span>` +
      MILESTONES.map(m => {
        const lit = S.state.litMilestones.includes(m.id);
        return `<span class="ms ${lit ? 'lit' : ''}">${T(m.label)}</span>`;
      }).join('');
  }

  return { render, replay: animateDots };
}
