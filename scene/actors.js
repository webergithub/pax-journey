// 【UI-3D 层】角色：旅客、员工、行李 —— 程序化小人 + 走路动画
import * as THREE from 'three';
import { box, cyl, mat, C, suitcase } from './props.js';

export function makeFigure(colorBody = C.gold, colorHead = 0xe8d5b8, scale = 1) {
  const g = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 4, 10), mat(colorBody, { rough: 0.75 }));
  torso.position.y = 1.02;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), mat(colorHead, { rough: 0.8 }));
  head.position.y = 1.45;

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x3d3126));
  hair.position.y = 1.47;

  const armL = box(0.09, 0.46, 0.09, colorBody); armL.position.set(0, 0.98, 0.25);
  const armR = box(0.09, 0.46, 0.09, colorBody); armR.position.set(0, 0.98, -0.25);

  const legL = box(0.12, 0.62, 0.13, 0x45403a); legL.position.set(0, 0.42, 0.10);
  const legR = box(0.12, 0.62, 0.13, 0x45403a); legR.position.set(0, 0.42, -0.10);

  g.add(torso, head, hair, armL, armR, legL, legR);
  g.scale.setScalar(scale);
  g.userData = { legL, legR, armL, armR, torso, head, phase: 0, walking: false };
  return g;
}

/** 推动小人的走路循环；walking=false 时回到站姿 */
export function animateFigure(fig, dt) {
  const u = fig.userData;
  if (!u) return;
  if (u.walking) {
    u.phase += dt * 9;
    const s = Math.sin(u.phase);
    u.legL.rotation.x = s * 0.65;
    u.legR.rotation.x = -s * 0.65;
    u.armL.rotation.x = -s * 0.5;
    u.armR.rotation.x = s * 0.5;
    u.torso.position.y = 1.02 + Math.abs(Math.cos(u.phase)) * 0.03;
  } else {
    u.phase = 0;
    for (const p of [u.legL, u.legR, u.armL, u.armR]) p.rotation.x += (0 - p.rotation.x) * Math.min(1, dt * 8);
    u.torso.position.y += (1.02 - u.torso.position.y) * Math.min(1, dt * 8);
  }
}

/** 旅客 = 小人 + 拖着的行李箱（可脱手） */
export function makePassenger() {
  const g = new THREE.Group();
  const fig = makeFigure(C.gold, 0xe8d5b8, 1);
  const bag = suitcase(0xb0553f);
  bag.position.set(-0.42, 0, -0.28);
  bag.scale.setScalar(0.95);
  g.add(fig, bag);
  g.userData = { fig, bag, hasBag: true };
  return g;
}

export function makeStaff(color = C.blue) {
  const f = makeFigure(color, 0xe8d5b8, 0.98);
  // 员工加一个识别马甲条
  const vest = box(0.42, 0.16, 0.42, C.goldLite, { emissive: C.goldLite, ei: 0.35 });
  vest.position.y = 1.16;
  f.add(vest);
  return f;
}

/** 人群：静态站姿的小人若干，让场景不空 */
export function makeCrowd(n, spread = 6, colors = [0x8a7f70, 0x6f7d8a, 0x8a6f74, 0x7a8a6f]) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const f = makeFigure(colors[i % colors.length], 0xd9c4a8, 0.94 + Math.random() * 0.1);
    f.position.set((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread);
    f.rotation.y = Math.random() * Math.PI * 2;
    g.add(f);
  }
  return g;
}
