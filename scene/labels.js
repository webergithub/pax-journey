// 【UI-3D 层】3D 区域标注牌 + 旅客旅程路径线
// 标注牌：每个功能区上方一块双语浮牌，颜色跟管理域一致——把窗口上的
// "显性划区分"延伸到 3D 场景本身。语言切换时重建纹理。
// 路径线：贴地光带，已走=绿、当前段=金色脉动、未走=暗——旅程感的主视觉。
import * as THREE from 'three';
import { T, getLang } from '../data/i18n.js';
import { STEPS } from '../data/steps.js';
import { getDomain } from '../data/domains.js';

function makeTextSprite(text, color) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const pad = 14, fs = 26;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  ctx.font = `700 ${fs}px Inter, "PingFang SC", "Microsoft YaHei", sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = fs + pad * 1.4;
  cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  // 圆角底板
  const r = 9;
  c.beginPath();
  c.roundRect(0.5, 0.5, w - 1, h - 1, r);
  c.fillStyle = 'rgba(16, 13, 9, 0.82)';
  c.fill();
  c.strokeStyle = color; c.globalAlpha = 0.55; c.lineWidth = 1.5; c.stroke();
  c.globalAlpha = 1;
  // 左侧色条
  c.beginPath(); c.roundRect(4, 5, 4, h - 10, 2); c.fillStyle = color; c.fill();
  // 文字
  c.font = `700 ${fs}px Inter, "PingFang SC", "Microsoft YaHei", sans-serif`;
  c.fillStyle = '#eee7db';
  c.textBaseline = 'middle';
  c.fillText(text, pad + 2, h / 2 + 1);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const scale = 0.03;                         // 世界单位/像素
  sp.scale.set(w * scale, h * scale, 1);
  sp.renderOrder = 50;
  return sp;
}

export function createLabels(scene, anchors) {
  const group = new THREE.Group();
  scene.add(group);

  function rebuild() {
    while (group.children.length) {
      const s = group.children.pop();
      s.material.map?.dispose(); s.material.dispose();
    }
    for (const step of STEPS) {
      const a = anchors[step.zone];
      if (!a) continue;
      const dom = getDomain(step.domain);
      const label = `${step.icon} ${T(step.name)}`;
      const sp = makeTextSprite(label, dom?.color || '#c9944a');
      // BHS 在地下：牌子放地下厅上沿；其余放区域上方
      const y = a.under ? -2.2 : 9.2;
      sp.position.set(a.look.x, y, a.look.z);
      sp.userData.zone = step.zone;
      group.add(sp);
    }
  }

  /** BHS 透视时只显示地下牌；相机进航站楼内视角全部显示 */
  function setMode({ bhs = false } = {}) {
    for (const sp of group.children) {
      const under = sp.position.y < 0;
      sp.visible = bhs ? under : !under;
    }
  }

  rebuild();
  setMode({});
  return { group, rebuild, setMode };
}

// ── 旅客旅程路径线 ────────────────────────────────────────────
const COL_DONE = 0x8fcf7a, COL_CUR = 0xe8b86d, COL_TODO = 0x4a4438;

export function createJourneyPath(scene, anchors) {
  const group = new THREE.Group();
  scene.add(group);
  let pulseMats = [];

  function segTube(p1, p2, color, radius) {
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(p1.x, 0.12, p1.z),
      new THREE.Vector3(p2.x, 0.12, p2.z),
    );
    const geo = new THREE.TubeGeometry(curve, 1, radius, 6, false);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    return new THREE.Mesh(geo, mat);
  }

  /** stepZones: 当前开关下的步骤 zone 序列；activeIdx: 当前步骤下标 */
  function update(stepZones, activeIdx) {
    while (group.children.length) {
      const m = group.children.pop();
      m.geometry.dispose(); m.material.dispose();
    }
    pulseMats = [];
    // 地面路径点：地下的 bhs 段沿用上一站位置（路径线只画地面）
    const pts = [];
    let last = null;
    for (const z of stepZones) {
      const a = anchors[z];
      if (!a) continue;
      const p = a.under && last ? last : a.stand;
      pts.push({ x: p.x, z: p.z });
      last = p;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const done = i < activeIdx;
      const cur = i === activeIdx;
      const mesh = segTube(pts[i], pts[i + 1], done ? COL_DONE : cur ? COL_CUR : COL_TODO, cur ? 0.22 : 0.13);
      if (!done && !cur) mesh.material.opacity = 0.35;
      if (cur) pulseMats.push(mesh.material);
      group.add(mesh);
    }
    // 站点圆点
    pts.forEach((p, i) => {
      const done = i <= activeIdx;
      const dot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16),
        new THREE.MeshBasicMaterial({ color: done ? COL_DONE : COL_TODO, transparent: true, opacity: done ? 0.9 : 0.4 }),
      );
      if (i === activeIdx) { dot.material.color.setHex(COL_CUR); pulseMats.push(dot.material); }
      dot.position.set(p.x, 0.1, p.z);
      group.add(dot);
    });
  }

  let t = 0;
  function tick(dt) {
    t += dt;
    const o = 0.65 + Math.sin(t * 4) * 0.3;
    for (const m of pulseMats) m.opacity = o;
  }

  return { group, update, tick };
}
