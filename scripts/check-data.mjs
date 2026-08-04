#!/usr/bin/env node
/**
 * check-data.mjs —— 数据契约校验（G-ENG-2）
 *
 * 内容即代码（约束 C-1），所以内容腐化必须由脚本挡住而不是靠人肉走查。
 * 纯 node 运行，无浏览器：data/i18n.js 与 glossary.js 会摸 localStorage/document，
 * 这里先打桩再导入。
 *
 * 校验项：
 *   C1 全景节点 id 都能在系统字典里解析（landscape.missingIds）
 *   C2 步骤与分支里引用的 flows.from/to 都是已知系统、msg 都是已知报文
 *   C3 步骤 knowledge[] 引用的系统存在
 *   C4 管理域 systems[] 引用的系统存在
 *   C5 术语 see[] 引用可解析
 *   C6 双语完整性：系统/报文/术语/域/步骤/分支 的 zh 与 en 都非空
 *   C7 UI 词条 zh 与 en 键集合一致
 *   C8 默认路径 RECOMMENDED 覆盖全部分支步骤且分支 id 有效
 *
 * 退出码非 0 即阻断发版。
 */
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.document = { documentElement: { lang: '' } };

const errs = [];
const fail = (code, msg) => errs.push(`[${code}] ${msg}`);

const { SYSTEMS } = await import('../data/systems.js');
const { MESSAGES } = await import('../data/messages.js');
const { DOMAINS, CROSSCUTTING } = await import('../data/domains.js');
const { STEPS } = await import('../data/steps.js');
const { TERMS, resolveTerm } = await import('../data/glossary.js');
const { missingIds, LANDSCAPE } = await import('../data/landscape.js');
const { RECOMMENDED } = await import('../engine/state.js');

const hasSys = id => Object.prototype.hasOwnProperty.call(SYSTEMS, id);
const hasMsg = id => Object.prototype.hasOwnProperty.call(MESSAGES, id);
// 双语字段：{zh,en} 两者都要有内容；数组则逐项非空
const bilingualOk = v => {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0 && v.every(bilingualOk);
  if (typeof v === 'string') return v.trim().length > 0;
  const zh = v.zh, en = v.en;
  const ok = x => Array.isArray(x) ? x.length > 0 && x.every(s => String(s).trim()) : String(x ?? '').trim().length > 0;
  return ok(zh) && ok(en);
};

// C1 全景引用
for (const id of missingIds()) fail('C1', `全景节点 ${id} 在系统字典中不存在`);

// C2/C3 步骤与分支引用
for (const step of STEPS) {
  const flowSets = [['step', step.flows]];
  for (const b of step.branches || []) flowSets.push([`branch:${b.id}`, b.flows]);
  for (const [where, flows] of flowSets) {
    for (const e of flows || []) {
      if (!hasSys(e.from)) fail('C2', `${step.id}/${where} flow.from=${e.from} 不是已知系统`);
      if (!hasSys(e.to)) fail('C2', `${step.id}/${where} flow.to=${e.to} 不是已知系统`);
      if (!hasMsg(e.msg)) fail('C2', `${step.id}/${where} flow.msg=${e.msg} 不是已知报文`);
    }
  }
  for (const k of step.knowledge || []) {
    if (!hasSys(k)) fail('C3', `${step.id} knowledge 引用 ${k} 不是已知系统`);
  }
  for (const b of step.branches || []) {
    for (const s of b.systems || []) {
      if (!hasSys(s)) fail('C3', `${step.id}/${b.id} systems 引用 ${s} 不是已知系统`);
    }
  }
  // C6 步骤与分支双语
  if (!bilingualOk(step.name)) fail('C6', `步骤 ${step.id} name 双语不完整`);
  if (!bilingualOk(step.narrative)) fail('C6', `步骤 ${step.id} narrative 双语不完整`);
  for (const b of step.branches || []) {
    if (!bilingualOk(b.label)) fail('C6', `分支 ${step.id}/${b.id} label 双语不完整`);
    if (!bilingualOk(b.device)) fail('C6', `分支 ${step.id}/${b.id} device 双语不完整`);
  }
}

// C4 管理域引用
for (const d of DOMAINS) {
  for (const s of d.systems || []) {
    if (!hasSys(s)) fail('C4', `管理域 ${d.id} systems 引用 ${s} 不是已知系统`);
  }
  if (!bilingualOk(d.name)) fail('C6', `管理域 ${d.id} name 双语不完整`);
  if (!bilingualOk(d.scope)) fail('C6', `管理域 ${d.id} scope 双语不完整`);
}
for (const c of CROSSCUTTING) {
  if (!bilingualOk(c.name)) fail('C6', `贯穿层 ${c.id} name 双语不完整`);
}

// C5 术语交叉引用
for (const [id, t] of Object.entries(TERMS)) {
  for (const ref of t.see || []) {
    if (!resolveTerm(ref)) fail('C5', `术语 ${id} 的 see 引用 "${ref}" 无法解析`);
  }
  if (!bilingualOk(t.def)) fail('C6', `术语 ${id} def 双语不完整`);
  if (!t.zh || !t.en) fail('C6', `术语 ${id} 缺 zh/en 名称`);
}

// C6 系统与报文双语
for (const [id, s] of Object.entries(SYSTEMS)) {
  if (!bilingualOk(s.name)) fail('C6', `系统 ${id} name 双语不完整`);
  if (s.resp && !bilingualOk(s.resp)) fail('C6', `系统 ${id} resp 双语不完整`);
  if (s.note && !bilingualOk(s.note)) fail('C6', `系统 ${id} note 双语不完整`);
  if (!s.abbr) fail('C6', `系统 ${id} 缺 abbr`);
  for (const i of s.interfaces || []) {
    if (!hasSys(i)) fail('C3', `系统 ${id} interfaces 引用 ${i} 不是已知系统`);
  }
}
for (const [id, m] of Object.entries(MESSAGES)) {
  if (!bilingualOk(m.name)) fail('C6', `报文 ${id} name 双语不完整`);
  if (!bilingualOk(m.when)) fail('C6', `报文 ${id} when 双语不完整`);
  if (!bilingualOk(m.teaching)) fail('C6', `报文 ${id} teaching 双语不完整`);
  if (!hasSys(m.from)) fail('C2', `报文 ${id} from=${m.from} 不是已知系统`);
  if (!hasSys(m.to)) fail('C2', `报文 ${id} to=${m.to} 不是已知系统`);
}

// C7 UI 词条键集合一致（读源码取两个字典的键，避免导出内部结构）
import { readFileSync } from 'node:fs';
const i18nSrc = readFileSync(new URL('../data/i18n.js', import.meta.url), 'utf8');
const block = /const UI = \{\s*zh: \{([\s\S]*?)\n  \},\s*en: \{([\s\S]*?)\n  \},\s*\};/.exec(i18nSrc);
if (!block) {
  fail('C7', 'i18n.js 的 UI 字典结构无法解析（模板变了就更新本脚本）');
} else {
  const keysOf = s => new Set([...s.matchAll(/^\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)].map(m => m[1]));
  const zh = keysOf(block[1]), en = keysOf(block[2]);
  for (const k of zh) if (!en.has(k)) fail('C7', `UI 词条 ${k} 缺 en`);
  for (const k of en) if (!zh.has(k)) fail('C7', `UI 词条 ${k} 缺 zh`);
}

// C8 默认路径
const branchSteps = STEPS.filter(s => s.branches?.length);
for (const s of branchSteps) {
  const want = RECOMMENDED[s.id];
  if (!want) fail('C8', `RECOMMENDED 缺少分支步骤 ${s.id}`);
  else if (!s.branches.some(b => b.id === want)) fail('C8', `RECOMMENDED[${s.id}]=${want} 不是该步骤的有效分支`);
}
for (const k of Object.keys(RECOMMENDED)) {
  if (!branchSteps.some(s => s.id === k)) fail('C8', `RECOMMENDED 含未知步骤 ${k}`);
}

// ── 输出 ──────────────────────────────────────────────────────
const stats = {
  systems: Object.keys(SYSTEMS).length,
  messages: Object.keys(MESSAGES).length,
  terms: Object.keys(TERMS).length,
  domains: DOMAINS.length + CROSSCUTTING.length,
  steps: STEPS.length,
  branches: STEPS.reduce((n, s) => n + (s.branches?.length || 0), 0),
  landscapeNodes: new Set(LANDSCAPE.flatMap(g => g.ids)).size,
};
console.log('数据契约校验 —— ' + Object.entries(stats).map(([k, v]) => `${k}:${v}`).join(' '));

if (errs.length) {
  console.error(`\n✗ 发现 ${errs.length} 处契约问题：`);
  for (const e of errs.slice(0, 40)) console.error('  ' + e);
  if (errs.length > 40) console.error(`  …… 另有 ${errs.length - 40} 条`);
  process.exit(1);
}
console.log('✓ 全部契约校验通过（C1–C8）');
