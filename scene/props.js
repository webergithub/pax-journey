// 【UI-3D 层】通用道具工厂 —— 全程序化建模，零外部资源，保证离线可跑
import * as THREE from 'three';

export const C = {
  ground:   0x121016,
  slab:     0x585661,
  slabLine: 0x7d7a86,
  column:   0x6e6a72,
  roof:     0x8a7a63,
  gold:     0xc9944a,
  goldLite: 0xe8b86d,
  blue:     0x6fb3d9,
  green:    0x8fcf7a,
  purple:   0xb58fd9,
  terra:    0xd98b6f,
  teal:     0x7fc7c2,
  yellow:   0xd9c46f,
  white:    0xf0ece6,
  metal:    0x5a5347,
  dark:     0x1d1912,
  belt:     0x565044,
  glass:    0x9fd4e8,
};

const cache = {};
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (cache[key]) return cache[key];
  const m = new THREE.MeshStandardMaterial({
    color, roughness: opts.rough ?? 0.85, metalness: opts.metal ?? 0.05,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.ei ?? 1,
    transparent: opts.opacity != null, opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
  cache[key] = m;
  return m;
}

export function box(w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = false; m.receiveShadow = false;
  return m;
}

export function cyl(rt, rb, h, color, seg = 16, opts = {}) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, opts));
}

export function plane(w, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, opts));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** 发光屏幕（航显、Kiosk 屏、指示牌） */
export function screen(w, h, color = C.blue, intensity = 0.9) {
  const g = new THREE.Group();
  const frame = box(w + 0.12, h + 0.12, 0.08, C.dark);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: intensity }),
  );
  face.position.z = 0.05;
  g.add(frame, face);
  g.userData.face = face;
  return g;
}

/** 屏幕上的"数据行"：几条横线，营造信息密度 */
export function screenLines(w, h, rows = 4, color = 0xffffff) {
  const g = new THREE.Group();
  for (let i = 0; i < rows; i++) {
    const lw = w * (0.35 + Math.random() * 0.5);
    const l = new THREE.Mesh(
      new THREE.PlaneGeometry(lw, h / (rows * 4)),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 }),
    );
    l.position.set(-w / 2 + lw / 2 + 0.06, h / 2 - (i + 1) * (h / (rows + 1)), 0.06);
    g.add(l);
  }
  return g;
}

/** 传送带：带纹理感的长条 + 侧栏 */
export function belt(len, width = 1.1, color = C.belt) {
  const g = new THREE.Group();
  const top = box(len, 0.12, width, color, { rough: 0.6 });
  top.position.y = 0.6;
  const l = box(len, 0.5, 0.08, C.metal); l.position.set(0, 0.35, width / 2);
  const r = box(len, 0.5, 0.08, C.metal); r.position.set(0, 0.35, -width / 2);
  g.add(top, l, r);
  // 滚轴条纹
  for (let x = -len / 2 + 0.4; x < len / 2; x += 0.8) {
    const rib = box(0.08, 0.14, width * 0.9, 0x4a443a);
    rib.position.set(x, 0.62, 0);
    g.add(rib);
  }
  g.userData.top = top;
  return g;
}

/** 值机/托运柜台 */
export function counter(w = 2.6, ownerColor = C.gold) {
  const g = new THREE.Group();
  const desk = box(w, 1.05, 1.2, 0x574c3c); desk.position.y = 0.52;
  const face = box(w, 0.12, 1.24, ownerColor, { emissive: ownerColor, ei: 0.25 }); face.position.y = 1.06;
  const back = box(w, 1.9, 0.14, 0x3f382c); back.position.set(0, 0.95, -0.9);
  const scr = screen(0.7, 0.45, C.blue, 0.85); scr.position.set(0, 1.5, -0.8);
  scr.add(screenLines(0.7, 0.45, 4));
  g.add(desk, face, back, scr);
  g.userData.screen = scr;
  return g;
}

/** 自助值机机 CUSS */
export function kiosk(ownerColor = C.gold) {
  const g = new THREE.Group();
  const body = box(0.75, 1.35, 0.5, 0x4e4436); body.position.y = 0.68;
  const foot = box(0.9, 0.08, 0.7, 0x3f382c); foot.position.y = 0.04;
  const scr = screen(0.6, 0.44, C.blue, 0.9);
  scr.position.set(0, 1.15, 0.28); scr.rotation.x = -0.32;
  scr.add(screenLines(0.6, 0.44, 3));
  const stripe = box(0.78, 0.06, 0.52, ownerColor, { emissive: ownerColor, ei: 0.4 });
  stripe.position.y = 1.38;
  g.add(body, foot, scr, stripe);
  g.userData.screen = scr;
  return g;
}

/** 自助托运机 SBD：柜体 + 短传送带 + 门 */
export function sbdUnit(ownerColor = C.gold) {
  const g = new THREE.Group();
  const side = box(0.35, 1.7, 2.2, 0x4e4436); side.position.set(-1.0, 0.85, 0);
  const side2 = box(0.35, 1.7, 2.2, 0x4e4436); side2.position.set(1.0, 0.85, 0);
  const top = box(2.35, 0.18, 2.2, 0x3f382c); top.position.y = 1.78;
  const b = belt(1.8, 1.0); b.rotation.y = Math.PI / 2; b.position.y = 0.05;
  const scr = screen(0.55, 0.4, C.blue, 0.9);
  scr.position.set(-1.02, 1.35, 0.75); scr.rotation.y = Math.PI / 2; scr.rotation.x = -0.2;
  const stripe = box(2.35, 0.06, 2.2, ownerColor, { emissive: ownerColor, ei: 0.35 });
  stripe.position.y = 1.88;
  g.add(side, side2, top, b, scr, stripe);
  g.userData.belt = b; g.userData.screen = scr;
  return g;
}

/** 安检 CT 机 / HBS 扫描机：一段隧道 */
export function scanner(len = 2.4, w = 1.6, h = 1.5, color = C.terra) {
  const g = new THREE.Group();
  const shell = box(len, h, w, 0x3a332a);
  shell.position.y = h / 2 + 0.55;
  const mouth = box(0.12, h * 0.6, w * 0.7, color, { emissive: color, ei: 0.6 });
  mouth.position.set(len / 2, h / 2 + 0.55, 0);
  const mouth2 = mouth.clone(); mouth2.position.x = -len / 2;
  const b = belt(len + 2.2, w * 0.65);
  g.add(shell, mouth, mouth2, b);
  g.userData.glow = mouth;
  return g;
}

/** 闸机（安检门 / e-Gate / 登机闸机） */
export function gateArch(color = C.gold, w = 1.1, h = 2.1) {
  const g = new THREE.Group();
  const l = box(0.22, h, 0.7, 0x4e4436); l.position.set(0, h / 2, w / 2);
  const r = box(0.22, h, 0.7, 0x4e4436); r.position.set(0, h / 2, -w / 2);
  const top = box(0.22, 0.16, w + 0.7, color, { emissive: color, ei: 0.5 }); top.position.y = h;
  const doorL = box(0.06, 1.1, w / 2 - 0.02, C.glass, { opacity: 0.35, emissive: C.glass, ei: 0.2 });
  doorL.position.set(0, 0.62, w / 4);
  const doorR = doorL.clone(); doorR.position.z = -w / 4;
  g.add(l, r, top, doorL, doorR);
  g.userData.doorL = doorL; g.userData.doorR = doorR; g.userData.top = top;
  return g;
}

/** 候机座椅排 */
export function seatRow(n = 4, color = 0x5e5346) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const s = box(0.62, 0.1, 0.6, color); s.position.set(i * 0.7, 0.45, 0);
    const b = box(0.62, 0.55, 0.1, color); b.position.set(i * 0.7, 0.72, -0.28);
    g.add(s, b);
  }
  const bar = box(n * 0.7, 0.08, 0.1, C.metal); bar.position.set((n - 1) * 0.35, 0.4, 0);
  g.add(bar);
  return g;
}

/** 商铺：带发光招牌的盒子 */
export function shop(w = 4, d = 3, color = C.yellow, signColor = C.yellow) {
  const g = new THREE.Group();
  const body = box(w, 3, d, 0x4a4033); body.position.y = 1.5;
  const front = box(w * 0.9, 2, 0.1, 0x2a2419, { opacity: 0.75 }); front.position.set(0, 1.1, d / 2);
  const sign = box(w * 0.8, 0.42, 0.12, signColor, { emissive: signColor, ei: 0.7 });
  sign.position.set(0, 2.6, d / 2 + 0.05);
  const glow = new THREE.PointLight(signColor, 0.5, 8);
  glow.position.set(0, 2.2, d / 2 + 1);
  g.add(body, front, sign, glow);
  return g;
}

/** 行李箱 */
export function suitcase(color = 0xb0553f) {
  const g = new THREE.Group();
  const body = box(0.42, 0.6, 0.26, color, { rough: 0.7 }); body.position.y = 0.3;
  const handle = box(0.04, 0.22, 0.04, 0x3f382c); handle.position.set(0, 0.72, 0);
  const bar = box(0.26, 0.04, 0.04, 0x3f382c); bar.position.set(0, 0.83, 0);
  const tag = box(0.16, 0.1, 0.02, C.white, { emissive: C.white, ei: 0.25 });
  tag.position.set(0.1, 0.56, 0.14); tag.visible = false;
  g.add(body, handle, bar, tag);
  g.userData.tag = tag;
  return g;
}

/** 集装箱 ULD */
export function uld() {
  const g = new THREE.Group();
  const body = box(1.9, 1.5, 1.5, 0x6a6255, { metal: 0.4, rough: 0.5 }); body.position.y = 0.85;
  const slant = box(0.5, 1.5, 1.5, 0x6a6255, { metal: 0.4, rough: 0.5 });
  slant.position.set(-1.05, 0.85, 0); slant.rotation.z = 0.35;
  const base = box(2.4, 0.16, 1.6, 0x4a443a); base.position.y = 0.08;
  g.add(body, slant, base);
  return g;
}

/** 分拣转盘 / 提取转盘 */
export function carousel(r = 3.2) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 10, 40), mat(0x565044, { rough: 0.6 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.7;
  const core = cyl(r - 0.6, r - 0.6, 0.7, 0x3f382c, 32); core.position.y = 0.35;
  g.add(ring, core);
  g.userData.ring = ring;
  return g;
}

/** 地面高亮圈：标记当前所在区域 */
export function zoneRing(r = 5, color = C.gold) {
  const g = new THREE.Mesh(
    new THREE.RingGeometry(r * 0.92, r, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  g.rotation.x = -Math.PI / 2;
  g.position.y = 0.03;
  return g;
}

/** 车辆（出租/巴士/摆渡车/牵引车通用） */
export function vehicle(len = 4.4, w = 1.9, h = 1.5, color = C.teal) {
  const g = new THREE.Group();
  const body = box(len, h * 0.6, w, color, { rough: 0.55, metal: 0.15 });
  body.position.y = h * 0.55;
  const cab = box(len * 0.55, h * 0.42, w * 0.92, 0x3e3e46, { opacity: 0.8 });
  cab.position.set(-len * 0.05, h * 0.95, 0);
  g.add(body, cab);
  for (const [x, z] of [[-len / 3, w / 2], [-len / 3, -w / 2], [len / 3, w / 2], [len / 3, -w / 2]]) {
    const wheel = cyl(0.36, 0.36, 0.24, 0x241f18, 12);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(x, 0.36, z);
    g.add(wheel);
  }
  return g;
}
