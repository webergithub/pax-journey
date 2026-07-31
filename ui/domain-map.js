// 【UI-DOM 层】右侧管理域地图 —— 始终回答"我在哪个域，旁边还有哪些域"
import { T, t } from '../data/i18n.js';
import { DOMAINS, CROSSCUTTING } from '../data/domains.js';
import { openDomain } from './knowledge-card.js';
import * as S from '../engine/state.js';

export function createDomainMap(el) {
  const body = el.querySelector('.dom-list');

  function render() {
    const cur = S.currentStep()?.domain;
    const items = DOMAINS.map(d => {
      const active = d.id === cur;
      const touch = (d.touchpoints || []).length;
      return `<div class="dom-item ${active ? 'active' : ''}" data-id="${d.id}">
        <div class="dom-bar" style="background:${d.color}"></div>
        <div class="dom-ic">${d.icon}</div>
        <div style="min-width:0">
          <div class="dom-name">${T(d.name)}</div>
          <div class="dom-sub">${(d.systems || []).slice(0, 4).map(x => x.toUpperCase()).join(' · ')} · ${touch} ${T({ zh: '个接触点', en: 'touchpoints' })}</div>
        </div>
      </div>`;
    }).join('');

    const cross = CROSSCUTTING.map(c => `<div class="cross-item" data-id="${c.id}">
      <div class="dom-ic">${c.icon}</div>
      <div style="min-width:0"><div class="cross-name">${T(c.name)}</div><div class="cross-note">${T(c.note)}</div></div>
    </div>`).join('');

    body.innerHTML = items + `<div class="cross-head">${t('crossTitle')}</div>` + cross;
    body.querySelectorAll('[data-id]').forEach(n => n.addEventListener('click', () => openDomain(n.dataset.id)));
  }

  return { render };
}
