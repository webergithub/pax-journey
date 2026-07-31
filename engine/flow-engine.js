// 【逻辑层】链路解析 —— 把「步骤 + 分支 + 开关」解析成底部链路条要画的节点与报文序列
import { getSystem } from '../data/systems.js';
import { getMessage } from '../data/messages.js';

// One ID 模式下，各触点的"证件核验"改由生物识别完成：在链路里插入 oneid 节点
function applyOneId(edges, step, oneId) {
  if (!oneId) return edges;
  const biometricSteps = ['checkin', 'bagdrop', 'security', 'border', 'gate'];
  if (!biometricSteps.includes(step.id)) return edges;
  const out = [];
  let inserted = false;
  for (const e of edges) {
    // 把"旅客出示证件"替换成"旅客刷脸 → One ID 平台 → 原目标"
    if (e.from === 'pax' && !inserted) {
      out.push({ from: 'pax', to: 'oneid', msg: e.msg, biometric: true });
      out.push({ from: 'oneid', to: e.to, msg: e.msg, biometric: true });
      inserted = true;
    } else {
      out.push(e);
    }
  }
  if (!inserted) out.unshift({ from: 'pax', to: 'oneid', msg: 'DOCS', biometric: true });
  return out;
}

/** 解析当前链路：返回 { nodes:[{id,系统字段...}], edges:[{from,to,msg,message}] } */
export function resolveFlow(step, branch, opts = {}) {
  let edges = (branch?.flows || step.flows || []).map(e => ({ ...e }));
  edges = applyOneId(edges, step, opts.oneId);

  const order = [];
  const seen = new Set();
  const push = id => { if (id && !seen.has(id)) { seen.add(id); order.push(id); } };
  for (const e of edges) { push(e.from); push(e.to); }

  return {
    nodes: order.map(id => getSystem(id)),
    edges: edges.map(e => ({ ...e, message: getMessage(e.msg) })),
  };
}

/** 当前步骤涉及的"设备 / 系统"摘要，用于叙事面板 */
export function summarize(step, branch) {
  const flow = resolveFlow(step, branch, {});
  const owners = {};
  flow.nodes.forEach(n => { (owners[n.owner] ||= []).push(n); });
  return { owners, nodes: flow.nodes, edges: flow.edges };
}

/** 分支对比表：把同一步骤下所有分支的关键差异拉平，供教学对比 */
export function compareBranches(step, opts = {}) {
  if (!step.branches) return null;
  return step.branches.map(b => {
    const flow = resolveFlow(step, b, opts);
    return {
      id: b.id,
      label: b.label,
      icon: b.icon,
      device: b.device,
      durationSec: b.durationSec,
      resource: b.resource,
      note: b.note,
      systems: flow.nodes.map(n => n.abbr),
      messages: [...new Set(flow.edges.map(e => e.msg))],
    };
  });
}
