// 【UI-3D 层】极简补间与时间轴 —— 3D 动画全部经这里推进，便于统一暂停与打断
const active = [];

export function tween({ from = 0, to = 1, ms = 800, ease = easeInOut, onUpdate, onDone, tag }) {
  const tw = { t: 0, ms, from, to, ease, onUpdate, onDone, tag, done: false };
  active.push(tw);
  return tw;
}

export function tweenObj(obj, props, ms = 800, ease = easeInOut, tag) {
  const start = {};
  for (const k in props) start[k] = obj[k];
  return tween({
    ms, ease, tag,
    onUpdate: p => { for (const k in props) obj[k] = start[k] + (props[k] - start[k]) * p; },
  });
}

export function tweenVec(vec, target, ms = 800, ease = easeInOut, tag) {
  const s = { x: vec.x, y: vec.y, z: vec.z };
  return tween({
    ms, ease, tag,
    onUpdate: p => vec.set(
      s.x + (target.x - s.x) * p,
      s.y + (target.y - s.y) * p,
      s.z + (target.z - s.z) * p,
    ),
  });
}

export function updateTweens(dtMs) {
  for (let i = active.length - 1; i >= 0; i--) {
    const tw = active[i];
    tw.t += dtMs;
    const raw = Math.min(1, tw.t / tw.ms);
    const p = tw.ease(raw);
    tw.onUpdate?.(p, tw.from + (tw.to - tw.from) * p);
    if (raw >= 1) { tw.done = true; active.splice(i, 1); tw.onDone?.(); }
  }
}

/** 取消所有（或指定 tag 的）补间，用于用户中途跳步 */
export function cancelTweens(tag) {
  for (let i = active.length - 1; i >= 0; i--) {
    if (!tag || active[i].tag === tag) active.splice(i, 1);
  }
}

export const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const linear = t => t;

/** 串行时间轴：[{at:ms, run:fn}]，可被 cancel 打断 */
export class Timeline {
  constructor() { this.items = []; this.t = 0; this.cursor = 0; this.running = false; }
  add(delayMs, run) { this.items.push({ at: (this.items.length ? this.items[this.items.length - 1].at : 0) + delayMs, run }); return this; }
  at(ms, run) { this.items.push({ at: ms, run }); return this; }
  start() { this.t = 0; this.cursor = 0; this.running = true; this.items.sort((a, b) => a.at - b.at); return this; }
  stop() { this.running = false; }
  update(dtMs) {
    if (!this.running) return;
    this.t += dtMs;
    while (this.cursor < this.items.length && this.items[this.cursor].at <= this.t) {
      try { this.items[this.cursor].run(); } catch (e) { console.error(e); }
      this.cursor++;
    }
    if (this.cursor >= this.items.length) this.running = false;
  }
}
