// 【UI-DOM 层】知识卡：系统 / 报文 / 管理域 三类弹层
import { T, t, ownerColor, ownerName } from '../data/i18n.js';
import { getSystem } from '../data/systems.js';
import { getMessage } from '../data/messages.js';
import { getDomain, CROSSCUTTING } from '../data/domains.js';

let mask = null;

function close() { mask?.remove(); mask = null; }

function open(html) {
  close();
  mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `<div class="modal">${html}</div>`;
  mask.addEventListener('click', e => { if (e.target === mask) close(); });
  mask.querySelector('.x')?.addEventListener('click', close);
  document.body.appendChild(mask);
  addEventListener('keydown', escClose);
}
function escClose(e) { if (e.key === 'Escape') { close(); removeEventListener('keydown', escClose); } }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function head(icon, title, sub, color) {
  return `<div class="modal-head">
    <div class="mh-ic">${icon}</div>
    <div style="min-width:0">
      <h3 style="${color ? `color:${color}` : ''}">${esc(title)}</h3>
      ${sub ? `<div class="mh-sub">${esc(sub)}</div>` : ''}
    </div>
    <button class="x" aria-label="close">×</button>
  </div>`;
}

function sec(title, body) { return body ? `<div class="mb-sec"><h4>${esc(title)}</h4>${body}</div>` : ''; }
function tags(list) { return list?.length ? `<div class="mb-tags">${list.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''; }
function list(items) { return items?.length ? `<ul>${items.map(x => `<li>${esc(T(x))}</li>`).join('')}</ul>` : ''; }

export function openSystem(id) {
  const s = getSystem(id);
  const col = ownerColor(s.owner);
  open(head('🧩', T(s.name), s.abbr, col) + `<div class="modal-body">
    ${sec(t('cardOwner'), `<span class="owner-pill" style="background:${col}22;color:${col};border:1px solid ${col}55">${esc(ownerName(s.owner))}</span>`)}
    ${sec(t('cardResp'), list(T(s.resp)))}
    ${sec(t('cardVendors'), tags(s.vendors))}
    ${sec(t('cardIfaces'), tags((s.interfaces || []).map(i => getSystem(i).abbr)))}
    ${sec(t('cardStd'), tags(s.standards))}
    ${s.note ? `<div class="mb-teach">${esc(T(s.note))}</div>` : ''}
  </div>`);
}

export function openMessage(id) {
  const m = getMessage(id);
  open(head('✉️', T(m.name), m.full) + `<div class="modal-body">
    ${sec(t('cardIfaces'), tags([getSystem(m.from).abbr + ' → ' + getSystem(m.to).abbr]))}
    ${sec(t('cardWhen'), `<p>${esc(T(m.when))}</p>`)}
    ${sec(t('cardSample'), m.sample ? `<div class="mb-sample">${esc(m.sample)}</div>` : '')}
    ${sec(t('cardStd'), tags(m.standard ? [m.standard] : []))}
    ${m.teaching ? `<div class="mb-teach">${esc(T(m.teaching))}</div>` : ''}
  </div>`);
}

export function openDomain(id) {
  const d = getDomain(id);
  if (!d) {
    const c = CROSSCUTTING.find(x => x.id === id);
    if (!c) return;
    return open(head(c.icon, T(c.name), '') + `<div class="modal-body"><div class="mb-teach">${esc(T(c.note))}</div></div>`);
  }
  open(head(d.icon, T(d.name), '', d.color) + `<div class="modal-body">
    ${sec(t('cardScope'), `<p>${esc(T(d.scope))}</p>`)}
    ${sec(t('cardSystems'), tags((d.systems || []).map(s => getSystem(s).abbr)))}
    ${sec(t('cardKpis'), list(d.kpis))}
    ${d.note ? `<div class="mb-teach">${esc(T(d.note))}</div>` : ''}
  </div>`);
}

export function openFinish(stats) {
  open(head('🎉', t('done'), '') + `<div class="modal-body finish">
    <p style="font-size:13px;line-height:1.7;color:#d5cec4">${esc(t('doneMsg'))}</p>
    <div class="mb-sec" style="margin-top:14px"><h4>${esc(t('elapsed'))}</h4>
      <p style="font-family:var(--mono);font-size:15px;color:var(--gold-lite)">${stats.min} min · ${esc(t('resource'))} ${stats.res}</p></div>
    <div class="mb-sec quiz"><h4>${esc(t('quiz'))}</h4>${list(QUIZ)}</div>
  </div>`);
}

const QUIZ = [
  { zh: '① 值机自助机是谁的设备、跑谁的系统？', en: '① Whose device is the kiosk, and whose system runs on it?' },
  { zh: '② 行李在系统里是什么时候"出生"的？靠哪条报文？', en: '② When is a bag born in the data world, and by which message?' },
  { zh: '③ 旅客没登机为什么必须卸行李？哪条报文触发？', en: '③ Why must a bag be offloaded if its passenger never boards, and what triggers it?' },
  { zh: '④ TOBT 和 TSAT 分别是谁定的？为什么关门后还要等？', en: '④ Who sets TOBT and who sets TSAT, and why do you wait after the door closes?' },
  { zh: '⑤ 除了你走过的这条线，机场还并列管着哪 7 个域？', en: '⑤ Besides the domains you passed through, which 7 others does an airport run in parallel?' },
];

export { close as closeCard };
