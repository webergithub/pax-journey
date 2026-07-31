// 【UI-3D 层】世界搭建 —— 一条连续的机场：地铁站 → 路侧 → 航站楼十个区 → 廊桥 → 飞机
// 旅程沿 +X 前进；airside 在 +Z 方向；BHS 在地下 y = -9（用 X 光透视揭示）
import * as THREE from 'three';
import {
  C, box, cyl, plane, mat, screen, screenLines, belt, counter, kiosk, sbdUnit,
  scanner, gateArch, seatRow, shop, suitcase, uld, carousel, zoneRing, vehicle,
} from './props.js';
import { makePassenger, makeStaff, makeCrowd } from './actors.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildWorld(scene) {
  const refs = {};
  const root = new THREE.Group();
  scene.add(root);

  // ══ 地面与航站楼壳体 ═════════════════════════════════════════
  const ground = plane(600, 600, C.ground, { rough: 1 });
  ground.position.y = -0.02;
  root.add(ground);
  refs.ground = ground;

  // 楼板（BHS 透视时降透明度）
  const slab = box(112, 0.5, 34, C.slab, { rough: 0.95, opacity: 1 });
  slab.position.set(-10, -0.25, 0);
  slab.material.transparent = true;
  root.add(slab);
  refs.slab = slab;

  // 地面分格线，给尺度感
  const gridGroup = new THREE.Group();
  for (let x = -64; x <= 46; x += 8) {
    const l = box(0.1, 0.02, 33, C.slabLine, { emissive: C.slabLine, ei: 0.25 });
    l.position.set(x, 0.02, 0);
    gridGroup.add(l);
  }
  root.add(gridGroup);
  refs.gridGroup = gridGroup;

  // 柱网 + 屋顶
  for (let x = -60; x <= 42; x += 12) {
    for (const z of [-13, 13]) {
      const col = cyl(0.55, 0.7, 11, C.column, 10);
      col.position.set(x, 5.5, z);
      root.add(col);
      const cap = box(2.4, 0.35, 2.4, C.column); cap.position.set(x, 11, z); root.add(cap);
    }
  }
  const roofGroup = new THREE.Group();
  const roof = box(112, 0.35, 34, C.roof, { opacity: 0.10 });
  roof.position.set(-10, 11.3, 0);
  roofGroup.add(roof);
  // 屋顶桁架
  for (let x = -62; x <= 44; x += 4) {
    const t = box(0.18, 0.18, 33, C.roof, { opacity: 0.35 });
    t.position.set(x, 11.0, 0);
    roofGroup.add(t);
  }
  root.add(roofGroup);
  refs.roofGroup = roofGroup;
  // 侧墙（矮墙 + 玻璃带）
  for (const z of [-16.5, 16.5]) {
    const w = box(112, 1.6, 0.4, 0x3f382c); w.position.set(-10, 0.8, z); root.add(w);
    const glass = box(112, 8, 0.18, C.glass, { opacity: 0.07, emissive: C.glass, ei: 0.06 });
    glass.position.set(-10, 5.6, z); root.add(glass);
  }

  // 暖色顶灯
  for (let x = -60; x <= 40; x += 14) {
    const p = new THREE.PointLight(0xffd9a0, 0.55, 34);
    p.position.set(x, 9, 0);
    root.add(p);
  }

  // ══ ① 地铁站 / 巴士站（x ≈ -84）═══════════════════════════════
  const transit = new THREE.Group();
  transit.position.set(-84, 0, 0);
  const platform = box(26, 1.1, 10, 0x4e4c56); platform.position.set(0, 0.55, 0);
  const canopy = box(28, 0.3, 12, 0x5d5a66, { opacity: 0.5 }); canopy.position.set(0, 6, 0);
  for (const z of [-5, 5]) for (const x of [-11, 0, 11]) {
    const c = cyl(0.28, 0.32, 6, C.metal, 8); c.position.set(x, 3, z); transit.add(c);
  }
  // 轨道 + 列车
  const track = box(46, 0.16, 3.2, 0x3a3227); track.position.set(6, 0.08, -8.5);
  const rail1 = box(46, 0.12, 0.16, 0x6a6255, { metal: 0.6, rough: 0.4 }); rail1.position.set(6, 0.2, -7.8);
  const rail2 = rail1.clone(); rail2.position.z = -9.2;
  const train = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const carBody = box(9.4, 3.1, 2.8, C.teal, { metal: 0.25, rough: 0.5 });
    carBody.position.set(i * 9.8, 2.1, 0);
    const win = box(8.2, 0.9, 2.9, 0x242e31, { emissive: 0x2a3d42, ei: 0.6 });
    win.position.set(i * 9.8, 2.6, 0);
    const skirt = box(9.4, 0.5, 2.6, 0x3e3e46); skirt.position.set(i * 9.8, 0.6, 0);
    train.add(carBody, win, skirt);
  }
  train.position.set(-8, 0, -8.5);
  transit.add(platform, canopy, track, rail1, rail2, train);
  transit.add(makeCrowd(6, 9));
  // 站台指示牌
  const tSign = screen(3.2, 0.8, C.teal, 0.8); tSign.position.set(0, 4.2, 4.6);
  tSign.add(screenLines(3.2, 0.8, 2)); transit.add(tSign);
  root.add(transit);
  refs.train = train;

  // ══ 路侧落客 + 停车（x ≈ -72）════════════════════════════════
  const curb = new THREE.Group();
  curb.position.set(-72, 0, 0);
  const road = box(16, 0.06, 26, 0x28262e); road.position.set(0, 0.03, 0); curb.add(road);
  for (let z = -12; z <= 12; z += 3) {
    const dash = box(0.5, 0.02, 1.4, 0x6a6255, { emissive: 0x6a6255, ei: 0.2 });
    dash.position.set(0, 0.06, z); curb.add(dash);
  }
  const kerb = box(1.2, 0.32, 26, 0x5d5a66); kerb.position.set(7.6, 0.16, 0); curb.add(kerb);
  const taxi = vehicle(4.4, 1.9, 1.5, C.yellow); taxi.position.set(4.2, 0, 2); taxi.rotation.y = Math.PI / 2;
  const bus = vehicle(9.5, 2.6, 2.6, C.teal); bus.position.set(3.6, 0, -8); bus.rotation.y = Math.PI / 2;
  const car2 = vehicle(4.2, 1.8, 1.4, 0x7a6f8a); car2.position.set(4.2, 0, 9); car2.rotation.y = Math.PI / 2;
  curb.add(taxi, bus, car2);
  // 路侧监测摄像头杆
  const pole = cyl(0.14, 0.16, 7, C.metal, 8); pole.position.set(-6, 3.5, 4);
  const cam = box(0.6, 0.35, 0.35, 0x3e3e46); cam.position.set(-5.2, 6.7, 4);
  const camLed = box(0.1, 0.1, 0.1, C.terra, { emissive: C.terra, ei: 1 }); camLed.position.set(-4.9, 6.7, 4);
  curb.add(pole, cam, camLed);
  root.add(curb);
  refs.taxi = taxi; refs.bus = bus;

  // ══ ② 航站楼入口与航显（x ≈ -58）══════════════════════════════
  const entrance = new THREE.Group();
  entrance.position.set(-58, 0, 0);
  // 入口门
  for (const z of [-3.2, 0, 3.2]) {
    const dr = box(0.3, 4.2, 2.6, C.glass, { opacity: 0.22, emissive: C.glass, ei: 0.15 });
    dr.position.set(-6, 2.1, z); entrance.add(dr);
  }
  // FIDS 航显墙：6 块屏
  const fidsWall = new THREE.Group();
  const wallBack = box(0.3, 5.2, 15, 0x2a2419); wallBack.position.set(1.4, 4.4, 0);
  fidsWall.add(wallBack);
  refs.fidsScreens = [];
  for (let i = 0; i < 6; i++) {
    const s = screen(3.9, 2.2, C.blue, 0.85);
    s.rotation.y = Math.PI / 2;
    s.position.set(1.2, i < 3 ? 5.6 : 3.1, -4.8 + (i % 3) * 4.8);
    s.add(screenLines(3.9, 2.2, 6));
    fidsWall.add(s);
    refs.fidsScreens.push(s);
  }
  entrance.add(fidsWall);
  entrance.add(makeCrowd(5, 8));
  root.add(entrance);

  // ══ ③ 值机岛（x ≈ -40）════════════════════════════════════════
  const checkin = new THREE.Group();
  checkin.position.set(-40, 0, 0);
  // 岛台底座
  const island = box(13, 0.16, 9, 0x44424c); island.position.set(0, 0.08, 0); checkin.add(island);
  // 值机柜台（机场设备 CUPPS，金色条 = 机场归属）
  refs.counters = [];
  for (let i = 0; i < 4; i++) {
    const cDesk = counter(2.6, C.gold);
    cDesk.position.set(-4.2 + i * 2.8, 0, -3.4);
    cDesk.rotation.y = Math.PI;
    checkin.add(cDesk);
    refs.counters.push(cDesk);
    const st = makeStaff(C.blue);
    st.position.set(-4.2 + i * 2.8, 0, -4.9);
    checkin.add(st);
  }
  // 自助值机机 CUSS
  refs.kiosks = [];
  for (let i = 0; i < 5; i++) {
    const k = kiosk(C.gold);
    k.position.set(-4.4 + i * 2.2, 0, 3.2);
    k.rotation.y = Math.PI;
    checkin.add(k);
    refs.kiosks.push(k);
  }
  // 岛头指示牌
  const isign = screen(2.6, 1.0, C.gold, 0.85);
  isign.position.set(-6.6, 4.2, 0); isign.rotation.y = Math.PI / 2;
  isign.add(screenLines(2.6, 1.0, 2));
  checkin.add(isign);
  checkin.add(makeCrowd(7, 10));
  root.add(checkin);

  // ══ ④ 行李托运（x ≈ -24）══════════════════════════════════════
  const bagdrop = new THREE.Group();
  bagdrop.position.set(-24, 0, 0);
  refs.sbds = [];
  for (let i = 0; i < 3; i++) {
    const u = sbdUnit(C.gold);
    u.position.set(-3 + i * 3, 0, 3.4);
    bagdrop.add(u);
    refs.sbds.push(u);
  }
  // 柜台托运（带传送带没入楼板）
  refs.bagCounters = [];
  for (let i = 0; i < 2; i++) {
    const cDesk = counter(2.6, C.gold);
    cDesk.position.set(-1.4 + i * 3.6, 0, -3.6);
    cDesk.rotation.y = Math.PI;
    const b = belt(2.2, 0.9); b.position.set(-1.4 + i * 3.6, 0.15, -4.9);
    const st = makeStaff(C.green);
    st.position.set(-1.4 + i * 3.6, 0, -5.6);
    bagdrop.add(cDesk, b, st);
    refs.bagCounters.push({ desk: cDesk, belt: b });
  }
  // 行李入口（楼板上的开口 + 下行滑槽）
  const chute = box(1.4, 0.3, 9, 0x241f18); chute.position.set(2.6, -0.1, 0); bagdrop.add(chute);
  root.add(bagdrop);

  // ══ ⑤ BHS 地下行李厅（y = -9）══════════════════════════════════
  const bhs = new THREE.Group();
  bhs.position.set(-16, -9, 0);
  const bhsFloor = box(50, 0.4, 26, 0x33313a); bhsFloor.position.set(0, -0.2, 0); bhs.add(bhsFloor);
  for (const x of [-24, 24]) { const w = box(0.4, 9, 26, 0x322b21); w.position.set(x, 4.3, 0); bhs.add(w); }
  const bhsLight = new THREE.PointLight(0xc9a3d9, 0.8, 60); bhsLight.position.set(0, 6, 0); bhs.add(bhsLight);
  const bhsLight2 = new THREE.PointLight(0x6fb3d9, 0.5, 50); bhsLight2.position.set(16, 5, 0); bhs.add(bhsLight2);

  // 主线传送带（-20 → 18）
  const mainBelt = belt(38, 1.3); mainBelt.position.set(0, 0.6, 0); bhs.add(mainBelt);
  // 下行滑槽（从 bagdrop 落下来）
  const drop = box(1.3, 9.5, 1.3, 0x3f382c, { opacity: 0.45 }); drop.position.set(-10.6, 5.2, 0); bhs.add(drop);
  // ATR 自动读码环
  const atr = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.18, 8, 24), mat(C.purple, { emissive: C.purple, ei: 0.7 }));
  atr.rotation.y = Math.PI / 2; atr.position.set(-5, 1.35, 0); bhs.add(atr);
  refs.atr = atr;
  // HBS 安检机
  const hbs = scanner(4, 1.9, 1.7, C.terra); hbs.position.set(3, 0, 0); bhs.add(hbs);
  refs.hbs = hbs;
  // 分拣口 + 转盘
  const chute1 = box(3.2, 0.3, 1.4, C.gold, { emissive: C.gold, ei: 0.25 });
  chute1.position.set(13, 0.9, 0); chute1.rotation.z = -0.2; bhs.add(chute1);
  const car = carousel(3.0); car.position.set(17.5, 0, 0); bhs.add(car);
  refs.carousel = car;
  const uldCart = uld(); uldCart.position.set(17.5, 0, 6.5); bhs.add(uldCart);
  // 行李（会沿路径移动的那件）
  const trackedBag = suitcase(0xb0553f); trackedBag.scale.setScalar(0.85);
  trackedBag.position.set(-10.6, 0.72, 0); trackedBag.visible = false;
  bhs.add(trackedBag);
  refs.trackedBag = trackedBag;
  refs.bhsGroup = bhs;
  // 几件背景行李
  for (let i = 0; i < 7; i++) {
    const b = suitcase([0x6f7d8a, 0x8a6f74, 0x7a8a6f, 0x8a7f70][i % 4]);
    b.scale.setScalar(0.8);
    b.position.set(-18 + Math.random() * 30, 0.72, (Math.random() - 0.5) * 0.6);
    b.rotation.y = Math.random() * 3;
    bhs.add(b);
  }
  root.add(bhs);

  // ══ ⑥ 安检（x ≈ -8）═══════════════════════════════════════════
  const security = new THREE.Group();
  security.position.set(-8, 0, 0);
  refs.secLanes = [];
  for (let i = 0; i < 3; i++) {
    const z = -4.5 + i * 4.5;
    const sc = scanner(2.8, 1.5, 1.4, C.terra); sc.position.set(1.5, 0, z);
    const arch = gateArch(C.terra, 1.1, 2.2); arch.position.set(-2.6, 0, z);
    const table = box(2.4, 0.1, 1.6, 0x574c3c); table.position.set(-1.0, 0.85, z);
    const tlegs = box(2.2, 0.85, 1.4, 0x3f382c); tlegs.position.set(-1.0, 0.42, z);
    security.add(sc, arch, table, tlegs);
    refs.secLanes.push({ scanner: sc, arch });
  }
  const secSign = screen(2.4, 0.9, C.terra, 0.85); secSign.position.set(-5.5, 4, 0); secSign.rotation.y = Math.PI / 2;
  secSign.add(screenLines(2.4, 0.9, 2)); security.add(secSign);
  security.add(makeCrowd(6, 9));
  root.add(security);

  // ══ ⑦ 边检（x ≈ 5）════════════════════════════════════════════
  const border = new THREE.Group();
  border.position.set(5, 0, 0);
  refs.eGates = [];
  for (let i = 0; i < 4; i++) {
    const g = gateArch(C.terra, 1.0, 2.2);
    g.position.set(0, 0, -5.4 + i * 3.6);
    border.add(g);
    refs.eGates.push(g);
  }
  const bBooth = box(2.4, 1.6, 3.2, 0x4a4033); bBooth.position.set(-4, 0.8, 7); border.add(bBooth);
  const bSign = screen(2.2, 0.85, C.terra, 0.85); bSign.position.set(-3.2, 4, 0); bSign.rotation.y = Math.PI / 2;
  bSign.add(screenLines(2.2, 0.85, 2)); border.add(bSign);
  root.add(border);
  refs.borderGroup = border;

  // ══ ⑧ 候机与商业（x ≈ 18）═════════════════════════════════════
  const dwell = new THREE.Group();
  dwell.position.set(18, 0, 0);
  const shopColors = [C.yellow, C.gold, C.green, C.teal];
  for (let i = 0; i < 4; i++) {
    const s = shop(5, 3.4, C.yellow, shopColors[i]);
    s.position.set(-6 + i * 5.4, 0, -11);
    dwell.add(s);
  }
  for (let i = 0; i < 2; i++) {
    const s = shop(5.5, 3.4, C.yellow, shopColors[(i + 2) % 4]);
    s.position.set(-3 + i * 6.4, 0, 11); s.rotation.y = Math.PI;
    dwell.add(s);
  }
  for (let i = 0; i < 3; i++) {
    const r = seatRow(5); r.position.set(-6 + i * 5.5, 0, -1.5); dwell.add(r);
    const r2 = seatRow(5); r2.position.set(-6 + i * 5.5, 0, 3.5); r2.rotation.y = Math.PI; dwell.add(r2);
  }
  dwell.add(makeCrowd(9, 14));
  root.add(dwell);

  // ══ ⑨ 登机口（x ≈ 34）═════════════════════════════════════════
  const gate = new THREE.Group();
  gate.position.set(34, 0, 0);
  const gDesk = counter(3.2, C.gold); gDesk.position.set(-2, 0, 7.5); gDesk.rotation.y = -Math.PI / 2;
  const gStaff = makeStaff(C.blue); gStaff.position.set(-3.4, 0, 7.5); gStaff.rotation.y = Math.PI / 2;
  gate.add(gDesk, gStaff);
  refs.bgrGates = [];
  for (let i = 0; i < 2; i++) {
    const bg = gateArch(C.goldLite, 1.0, 2.1);
    bg.position.set(1.5, 0, 6.2 + i * 2.6);
    bg.rotation.y = -Math.PI / 2;
    gate.add(bg);
    refs.bgrGates.push(bg);
  }
  const gSign = screen(3.0, 1.1, C.goldLite, 0.9); gSign.position.set(-2, 4.2, 4.2);
  gSign.add(screenLines(3.0, 1.1, 3)); gate.add(gSign);
  refs.gateSign = gSign;
  for (let i = 0; i < 3; i++) {
    const r = seatRow(6); r.position.set(-7 + i * 5, 0, -3); gate.add(r);
  }
  gate.add(makeCrowd(8, 11));
  root.add(gate);

  // ══ ⑩ 廊桥与飞机（airside，+Z 方向）═══════════════════════════
  const airside = new THREE.Group();
  airside.position.set(0, 0, 0);
  // 停机坪
  const apron = plane(120, 90, 0x2b2932, { rough: 1 });
  apron.position.set(30, 0.01, 62);
  airside.add(apron);
  // 机坪泛光灯：不给光的话夜间机坪一片死黑，看不出机位与保障作业
  for (const [x, z] of [[24, 40], [54, 44], [30, 66], [56, 68]]) {
    const fl = new THREE.PointLight(0xdfe6f2, 0.9, 62);
    fl.position.set(x, 16, z);
    airside.add(fl);
    const mast = cyl(0.22, 0.3, 16, C.metal, 8); mast.position.set(x, 8, z); airside.add(mast);
    const head = box(1.8, 0.4, 1.2, 0xdfe6f2, { emissive: 0xdfe6f2, ei: 0.8 }); head.position.set(x, 16.3, z); airside.add(head);
  }
  // 机位标线
  const stopLine = box(14, 0.02, 0.4, C.goldLite, { emissive: C.goldLite, ei: 0.4 });
  stopLine.position.set(38, 0.05, 35); airside.add(stopLine);
  const leadIn = box(0.4, 0.02, 40, C.goldLite, { emissive: C.goldLite, ei: 0.3 });
  leadIn.position.set(38, 0.05, 56); airside.add(leadIn);

  // 廊桥：固定段 + 伸缩段 + 转接头
  const jb = new THREE.Group();
  jb.position.set(38, 0, 17);
  const jbFixed = box(3.2, 3.0, 7, 0x4a443a, { metal: 0.2, rough: 0.6 });
  jbFixed.position.set(0, 4.2, 2.6);
  const jbMove = box(2.9, 2.8, 8, 0x5a5347, { metal: 0.25, rough: 0.55 });
  jbMove.position.set(0, 4.2, 9.4);
  const jbHead = box(3.4, 3.2, 2.2, 0x554d3c); jbHead.position.set(0, 4.2, 13.6);
  const jbLeg = cyl(0.35, 0.4, 4.2, C.metal, 8); jbLeg.position.set(0, 2.1, 11);
  jb.add(jbFixed, jbMove, jbHead, jbLeg);
  airside.add(jb);
  refs.jetbridge = { group: jb, move: jbMove, head: jbHead, leg: jbLeg };

  // VDGS 屏（机头前）
  const vdgs = screen(1.8, 1.4, C.green, 0.9); vdgs.position.set(38, 6.5, 16.2);
  vdgs.add(screenLines(1.8, 1.4, 3)); airside.add(vdgs); refs.vdgs = vdgs;

  // 飞机：机身沿 Z，机头朝 -Z（对着航站楼）
  const ac = new THREE.Group();
  ac.position.set(38, 0, 53);
  const fus = cyl(2.0, 2.0, 32, 0xe9e6e0, 20, { metal: 0.25, rough: 0.4 });
  fus.rotation.x = Math.PI / 2; fus.position.y = 4.2;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2.0, 18, 14), mat(0xe9e6e0, { metal: 0.25, rough: 0.4 }));
  nose.scale.z = 1.6; nose.position.set(0, 4.2, -16.6);
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(2.0, 6, 18), mat(0xe9e6e0, { metal: 0.25, rough: 0.4 }));
  tailCone.rotation.x = -Math.PI / 2; tailCone.position.set(0, 4.6, 18.6);
  // 机翼（左右分别建，不用 scale 镜像）
  for (const sgn of [1, -1]) {
    const wing = box(13, 0.32, 5.2, 0xdedbd5, { metal: 0.3, rough: 0.45 });
    wing.position.set(sgn * 7.2, 3.5, 3);
    wing.rotation.y = sgn * 0.42;
    wing.rotation.z = sgn * -0.04;
    const eng = cyl(1.15, 1.15, 3.4, 0xb9b6b0, 14, { metal: 0.4, rough: 0.4 });
    eng.rotation.x = Math.PI / 2;
    eng.position.set(sgn * 6.2, 2.6, 2.2);
    const pylon = box(0.4, 1.0, 1.6, 0xdedbd5); pylon.position.set(sgn * 6.2, 3.3, 2.6);
    const htail = box(5.4, 0.26, 2.4, 0xdedbd5); htail.position.set(sgn * 2.8, 5.2, 18.2); htail.rotation.y = sgn * 0.3;
    ac.add(wing, eng, pylon, htail);
  }
  const vtail = box(0.3, 6.2, 5.4, C.blue, { metal: 0.2, rough: 0.5 });
  vtail.position.set(0, 8.0, 18.6);
  const vfair = box(0.36, 2.4, 3.2, 0xdedbd5); vfair.position.set(0, 5.6, 17.6);
  // 舷窗带
  for (let i = 0; i < 26; i++) {
    for (const sgn of [1, -1]) {
      const w = box(0.02, 0.28, 0.28, 0x2a3d42, { emissive: 0x5aa0b8, ei: 0.5 });
      w.position.set(sgn * 1.98, 4.7, -13 + i * 1.05);
      ac.add(w);
    }
  }
  // 客舱门（L1，朝 -X 侧，正对廊桥）
  const door = box(0.06, 1.85, 0.95, 0xc9c6c0, { emissive: 0x8a8680, ei: 0.15 });
  door.position.set(-2.0, 4.3, -10.4);
  ac.add(fus, nose, tailCone, vtail, vfair, door);
  // 起落架
  for (const [x, z] of [[0, -12], [3, 4], [-3, 4]]) {
    const gearLeg = cyl(0.22, 0.22, 2.6, 0x554d3c, 8); gearLeg.position.set(x, 1.4, z);
    const tire = cyl(0.62, 0.62, 0.4, 0x241f18, 12); tire.rotation.z = Math.PI / 2; tire.position.set(x, 0.62, z);
    ac.add(gearLeg, tire);
  }
  airside.add(ac);
  refs.aircraft = ac;

  // 地服车辆环绕
  const tug = vehicle(3.6, 1.8, 1.2, C.green); tug.position.set(38, 0, 34); tug.rotation.y = Math.PI / 2;
  const bagCart = vehicle(3.2, 1.6, 1.2, 0x8a7f70); bagCart.position.set(45, 0, 52); bagCart.rotation.y = 0;
  const shuttle = vehicle(9, 2.6, 2.5, C.gold); shuttle.position.set(26, 0, 40); shuttle.rotation.y = 0.4;
  shuttle.visible = false;
  airside.add(tug, bagCart, shuttle);
  refs.tug = tug; refs.shuttle = shuttle;
  root.add(airside);

  // ══ 旅客与高亮圈 ══════════════════════════════════════════════
  const passenger = makePassenger();
  passenger.position.set(-84, 0, 4);
  passenger.rotation.y = Math.PI / 2;
  root.add(passenger);
  refs.passenger = passenger;

  const ring = zoneRing(6, C.gold);
  ring.position.set(-84, 0.04, 0);
  root.add(ring);
  refs.ring = ring;

  // ══ 锚点：旅客站位 + 相机预设 ═════════════════════════════════
  const anchors = {
    transit:  { stand: V(-84, 0, 4),   look: V(-79, 2, 2),  cam: V(-102, 26, 44), ringR: 9 },
    entrance: { stand: V(-60, 0, 0),   look: V(-57, 3, 0),  cam: V(-72, 15, 25),  ringR: 7 },
    checkin:  { stand: V(-40, 0, 6.2), look: V(-40, 2, 0),  cam: V(-53, 15, 23),  ringR: 9 },
    bagdrop:  { stand: V(-24, 0, 6.4), look: V(-24, 2, 0),  cam: V(-36, 13, 21),  ringR: 8 },
    bhs:      { stand: V(-24, 0, 6.4), look: V(-15, -7, 0), cam: V(-24, 24, 26),  ringR: 8, under: true },
    security: { stand: V(-12, 0, 0),   look: V(-8, 2, 0),   cam: V(-21, 14, 21),  ringR: 8 },
    border:   { stand: V(1.5, 0, 0),   look: V(5, 2, 0),    cam: V(-8, 13, 20),   ringR: 7 },
    dwell:    { stand: V(18, 0, 6),    look: V(18, 2, 0),   cam: V(5, 16, 25),    ringR: 10 },
    gate:     { stand: V(32, 0, 4),    look: V(34, 2, 5),   cam: V(21, 15, 23),   ringR: 8 },
    boarding: { stand: V(37.4, 0, 12), look: V(37, 4, 40),  cam: V(-12, 46, 24),  ringR: 7 },
  };

  // ══ 每帧更新（转盘、读码环、屏幕呼吸）════════════════════════
  let tAcc = 0;
  function update(dt) {
    tAcc += dt;
    refs.carousel.userData.ring.rotation.z += dt * 0.35;
    refs.atr.rotation.z += dt * 1.4;
    const pulse = 0.75 + Math.sin(tAcc * 2.2) * 0.12;
    for (const s of refs.fidsScreens) s.userData.face.material.opacity = pulse;
  }

  return { root, refs, anchors, update };
}
