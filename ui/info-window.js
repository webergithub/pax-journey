// 【UI-DOM 层】知识浮窗 —— 系统 / 报文 / 管理域 / 术语，全部以可拖动小窗呈现
// 系统窗按模块划分：归属·职责 → 主流厂商 → 部署方式 → 工作人员访问方式 → ICT 设备需求 → ICT 需求评估
import { T, t, ownerColor, ownerName } from '../data/i18n.js';
import { getSystem } from '../data/systems.js';
import { getMessage } from '../data/messages.js';
import { getDomain, CROSSCUTTING } from '../data/domains.js';
import { getTerm, resolveTerm } from '../data/glossary.js';
import { getIct, SIZING_UNIT } from '../data/ict.js';
import { groupOf, inJourney } from '../data/landscape.js';
import { linkify } from './term-link.js';

let wm = null;
const open = [];                 // 打开中的知识窗（key + el），最多 MAX 个
const MAX = 5;
let seq = 0;

export function initInfoWindows(manager) { wm = manager; }

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function sec(title, body) { return body ? `<div class="iw-sec"><h4>${esc(title)}</h4>${body}</div>` : ''; }
function tags(list) { return list?.length ? `<div class="mb-tags">${list.map(x => `<span>${esc(T(x))}</span>`).join('')}</div>` : ''; }
function ul(items) { return items?.length ? `<ul>${items.map(x => `<li>${rich(T(x))}</li>`).join('')}</ul>` : ''; }

/** 造一个知识浮窗；同 key 已开则前置，不重复开 */
function spawn(key, { icon, title, sub, color, html }) {
  const exist = open.find(o => o.key === key);
  if (exist) { wm?.setVisible(exist.el, true); exist.el.style.zIndex = String(2000 + (++seq)); return exist.el; }

  while (open.length >= MAX) { const old = open.shift(); old.el.remove(); }

  const el = document.createElement('section');
  el.className = 'panel info-win';
  el.id = 'iw-' + (++seq);
  const idx = open.length;
  el.style.left = Math.min(innerWidth - 400, 300 + idx * 26) + 'px';
  el.style.top = Math.min(innerHeight - 260, 110 + idx * 24) + 'px';
  el.style.width = '430px';
  el.style.height = '440px';
  el.innerHTML = `<div class="panel-head"><h2>${icon || '📘'} ${esc(title)}</h2></div>
    <div class="panel-body iw-body">
      ${sub ? `<div class="iw-sub no-link">${esc(sub)}</div>` : ''}
      ${html}
    </div>`;
  document.body.appendChild(el);
  wm?.register(el, { id: key, title: `${icon || '📘'} ${esc(title)}` });
  if (color) el.querySelector('.win-title').style.color = color;
  linkify(el.querySelector('.iw-body'));
  open.push({ key, el });
  return el;
}

export function closeAllInfo() { while (open.length) open.pop().el.remove(); }

// ── 系统 ───────────────────────────────────────────────────────
export function openSystem(id) {
  const s = getSystem(id);
  const col = ownerColor(s.owner);
  const ict = getIct(s);
  const grp = groupOf(id);

  const sizing = ict.sizing ? `
    <div class="iw-basis">${rich(T(ict.sizing.basis))}</div>
    <table class="iw-table"><thead><tr>
      <th>${esc(t('ictItem'))}</th><th>${esc(t('ictBase'))}</th><th>${esc(t('ictPer5m'))}</th>
    </tr></thead><tbody>
      ${ict.sizing.rows.map(r => `<tr><td>${esc(T(r.item))}</td><td>${esc(r.base)}</td><td>${esc(r.per5m)}</td></tr>`).join('')}
    </tbody></table>
    ${ict.sizing.note ? `<div class="mb-teach" style="margin-top:8px">${rich(T(ict.sizing.note))}</div>` : ''}`
    : `<div class="iw-basis">${esc(t('ictNoSizing'))}</div>`;

  spawn('sys:' + id, {
    icon: '🧩', title: T(s.name), sub: s.abbr, color: col,
    html: `
      ${sec(t('cardOwner'), `<span class="owner-pill no-link" style="background:${col}22;color:${col};border:1px solid ${col}55">${esc(ownerName(s.owner))}</span>
        ${grp ? `<span class="iw-chip">${grp.icon} ${esc(T(grp.name))}</span>` : ''}
        <span class="iw-chip ${inJourney(id) ? 'on' : ''}">${esc(inJourney(id) ? t('inJourney') : t('offJourney'))}</span>`)}
      ${sec(t('cardResp'), ul(T(s.resp)))}
      ${sec(t('cardIfaces'), tags((s.interfaces || []).map(i => getSystem(i).abbr)))}
      ${sec(t('cardStd'), tags(s.standards))}
      ${s.note ? `<div class="mb-teach">${rich(T(s.note))}</div>` : ''}
      <div class="iw-divider">${esc(t('ictBlock'))}</div>
      ${sec(t('ictVendors'), tags(ict.vendors) || `<p class="iw-dim">${esc(t('ictNoVendor'))}</p>`)}
      ${sec(t('ictDeploy'), `<p>${rich(T(ict.deployment))}</p>`)}
      ${sec(t('ictAccess'), ul(T(ict.access)))}
      ${sec(t('ictNeed'), ul(T(ict.ict)))}
      ${ict.availability ? sec(t('ictAvail'), `<p>${esc(T(ict.availability))}</p>`) : ''}
      ${sec(t('ictSizing'), sizing)}
      <div class="iw-unit no-link">${esc(T(SIZING_UNIT))}</div>
      ${ict.generic ? `<div class="iw-dim">${esc(t('ictGeneric'))}</div>` : ''}`,
  });
}

// ── 报文 ───────────────────────────────────────────────────────
export function openMessage(id) {
  const m = getMessage(id);
  spawn('msg:' + id, {
    icon: '✉️', title: T(m.name), sub: m.full,
    html: `
      ${sec(t('cardIfaces'), tags([getSystem(m.from).abbr + ' → ' + getSystem(m.to).abbr]))}
      ${sec(t('cardWhen'), `<p>${rich(T(m.when))}</p>`)}
      ${sec(t('cardSample'), m.sample ? `<div class="mb-sample no-link">${esc(m.sample)}</div>` : '')}
      ${sec(t('cardStd'), tags(m.standard ? [m.standard] : []))}
      ${m.teaching ? `<div class="mb-teach">${rich(T(m.teaching))}</div>` : ''}`,
  });
}

// ── 管理域 ─────────────────────────────────────────────────────
export function openDomain(id) {
  const d = getDomain(id);
  if (!d) {
    const c = CROSSCUTTING.find(x => x.id === id);
    if (!c) return;
    return spawn('dom:' + id, { icon: c.icon, title: T(c.name), html: `<div class="mb-teach">${rich(T(c.note))}</div>` });
  }
  spawn('dom:' + id, {
    icon: d.icon, title: T(d.name), color: d.color,
    html: `
      ${sec(t('cardScope'), `<p>${rich(T(d.scope))}</p>`)}
      ${sec(t('cardSystems'), tags((d.systems || []).map(s => getSystem(s).abbr)))}
      ${sec(t('cardKpis'), ul(d.kpis))}
      ${d.note ? `<div class="mb-teach">${rich(T(d.note))}</div>` : ''}`,
  });
}

// ── 术语 ───────────────────────────────────────────────────────
export function openTerm(id) {
  const term = getTerm(id);
  if (!term) return;
  spawn('term:' + id, {
    icon: '📘', title: `${term.zh}`, sub: `${id} · ${term.en}`,
    html: `
      ${sec(t('termDef'), `<p>${rich(T(term.def))}</p>`)}
      ${term.see?.length ? sec(t('termSee'), `<div class="mb-tags">${term.see.map(x => `<span class="term-link" data-term="${esc(x)}">${esc(x)}</span>`).join('')}</div>`) : ''}
      <div class="iw-dim no-link">${esc(t('termCat'))}: ${esc(t('cat_' + term.cat) || term.cat)}</div>`,
  });
}

/** 术语链接统一入口：按解析结果分派到对应的窗 */
export function openResolved(hit) {
  if (!hit) return;
  if (hit.kind === 'system') return openSystem(hit.id);
  if (hit.kind === 'message') return openMessage(hit.id);
  if (hit.kind === 'domain') return openDomain(hit.id);
  return openTerm(hit.id);
}

export function openByToken(token) { openResolved(resolveTerm(token)); }

// ── 完成卡 ─────────────────────────────────────────────────────
export function openFinish(stats) {
  spawn('finish', {
    icon: '🎉', title: t('done'),
    html: `<p>${esc(t('doneMsg'))}</p>
      ${sec(t('elapsed'), `<p class="no-link" style="font-family:var(--mono);font-size:15px;color:var(--gold-lite)">${stats.min} min · ${esc(t('resource'))} ${stats.res}</p>`)}
      ${sec(t('quiz'), ul(QUIZ))}`,
  });
}

const QUIZ = [
  { zh: '① 值机自助机是谁的设备、跑谁的系统？', en: '① Whose device is the kiosk, and whose system runs on it?' },
  { zh: '② 行李在系统里是什么时候"出生"的？靠哪条报文？', en: '② When is a bag born in the data world, and by which message?' },
  { zh: '③ 旅客没登机为什么必须卸行李？哪条报文触发？', en: '③ Why must a bag be offloaded if its passenger never boards?' },
  { zh: '④ TOBT 和 TSAT 分别是谁定的？为什么关门后还要等？', en: '④ Who sets TOBT and who sets TSAT, and why do you wait after the door closes?' },
  { zh: '⑤ 除了你走过的这条线，机场还并列管着哪些域与节点？', en: '⑤ Beyond the line you walked, which other domains and nodes does an airport run?' },
];
