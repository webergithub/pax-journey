// 【UI-DOM 层】左侧旅程轨道
import { T, t } from '../data/i18n.js';
import { getDomain } from '../data/domains.js';
import * as S from '../engine/state.js';

export function createRail(el) {
  const body = el.querySelector('.panel-body');
  const stats = el.querySelector('.stat-row');

  function render() {
    const list = S.steps();
    body.innerHTML = list.map((s, i) => {
      const dom = getDomain(s.domain);
      const pick = S.state.choices[s.id];
      const picked = pick && S.branchesOf(s)?.find(b => b.id === pick);
      const cls = ['rail-item'];
      if (i === S.state.stepIndex) cls.push('active');
      else if (i < S.state.stepIndex) cls.push('done');
      return `<div class="${cls.join(' ')}" data-i="${i}">
        <div class="rail-line"></div>
        <div class="rail-num">${i + 1}</div>
        <div class="rail-txt">
          <div class="rail-title">${s.icon} ${T(s.name)}</div>
          <div class="rail-dom">${dom ? T(dom.name) : ''}</div>
          ${picked ? `<span class="rail-pick">${picked.icon} ${T(picked.label)}</span>` : ''}
        </div>
      </div>`;
    }).join('');
    body.querySelectorAll('.rail-item').forEach(n => {
      n.addEventListener('click', () => S.goTo(+n.dataset.i, 'rail'));
    });

    const min = Math.round(S.state.elapsedSec / 60);
    stats.innerHTML = `
      <div class="stat"><div class="k">${t('elapsed')}</div><div class="v">${min}<span style="font-size:10px"> min</span></div></div>
      <div class="stat"><div class="k">${t('resource')}</div><div class="v">${S.state.resourceUnits}</div></div>`;
  }

  return { render };
}
