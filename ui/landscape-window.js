// 【UI-DOM 层】管理节点全景 —— 旅客旅程之外的全部机场/航司/空管/政府节点
import { T, t, ownerColor, ownerName } from '../data/i18n.js';
import { LANDSCAPE, landscapeStats, inJourney } from '../data/landscape.js';
import { getSystem } from '../data/systems.js';
import { openSystem } from './info-window.js';

export function createLandscape(el) {
  const body = el.querySelector('.ls-body');
  let filter = 'all';   // all / journey / off

  function render() {
    const st = landscapeStats();
    const stat = t('landscapeStat').replace('{total}', st.total).replace('{touched}', st.touched);

    body.innerHTML = `
      <div class="panel-hint">${t('landscapeHint')}</div>
      <div class="ls-stat">${stat}</div>
      <div class="ls-filter">
        <button class="ls-fb ${filter === 'all' ? 'on' : ''}" data-f="all">${T({ zh: '全部', en: 'All' })}</button>
        <button class="ls-fb ${filter === 'journey' ? 'on' : ''}" data-f="journey">${t('inJourney')}</button>
        <button class="ls-fb ${filter === 'off' ? 'on' : ''}" data-f="off">${t('offJourney')}</button>
      </div>
      ${LANDSCAPE.map(g => {
        const ids = g.ids.filter(id => filter === 'all' || (filter === 'journey') === inJourney(id));
        if (!ids.length) return '';
        const col = ownerColor(g.owner);
        return `<div class="ls-group">
          <div class="ls-head" style="border-left-color:${col}">
            <span class="ls-ic">${g.icon}</span>
            <span class="ls-name">${T(g.name)}</span>
            <span class="ls-owner" style="color:${col}">${ownerName(g.owner)}</span>
            <span class="ls-count">${ids.length}</span>
          </div>
          <div class="ls-note">${T(g.note)}</div>
          <div class="ls-nodes">${ids.map(id => {
            const s = getSystem(id);
            const c = ownerColor(s.owner);
            return `<button class="ls-node ${inJourney(id) ? 'on-journey' : ''}" data-sys="${id}"
              style="border-color:${c}44" title="${T(s.name)}">
              <span class="ls-abbr" style="color:${c}">${s.abbr}</span>
              <span class="ls-nm">${T(s.name)}</span>
            </button>`;
          }).join('')}</div>
        </div>`;
      }).join('')}`;

    body.querySelectorAll('.ls-fb').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; render(); }));
    body.querySelectorAll('[data-sys]').forEach(b => b.addEventListener('click', () => openSystem(b.dataset.sys)));
  }

  return { render };
}
