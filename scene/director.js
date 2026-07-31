// 【UI-3D 层】导演：相机调度 + 旅客行走 + 每一幕的 3D 动作
import * as THREE from 'three';
import { tween, tweenVec, cancelTweens, Timeline, easeInOut, easeOut } from './tween.js';
import { animateFigure } from './actors.js';
import { box, C, mat } from './props.js';

export function createDirector({ camera, controls, world }) {
  const { refs, anchors } = world;
  const pax = refs.passenger;

  // ── 行走 ────────────────────────────────────────────────────
  const walk = { target: null, speed: 6.5, onArrive: null, waypoints: [] };

  function walkTo(vec, opts = {}) {
    walk.waypoints = (opts.via || []).slice();
    walk.target = vec.clone();
    walk.speed = opts.speed || 6.5;
    walk.onArrive = opts.onArrive || null;
    pax.userData.fig.userData.walking = true;
  }

  function updateWalk(dt) {
    if (!walk.target) { pax.userData.fig.userData.walking = false; return; }
    let goal = walk.waypoints.length ? walk.waypoints[0] : walk.target;
    const d = goal.clone().sub(pax.position); d.y = 0;
    const dist = d.length();
    if (dist < 0.25) {
      if (walk.waypoints.length) { walk.waypoints.shift(); return; }
      walk.target = null;
      pax.userData.fig.userData.walking = false;
      const cb = walk.onArrive; walk.onArrive = null;
      cb?.();
      return;
    }
    d.normalize();
    const step = Math.min(dist, walk.speed * dt);
    pax.position.addScaledVector(d, step);
    // 朝向移动方向（平滑转身）
    const want = Math.atan2(d.x, d.z);
    let diff = want - pax.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    pax.rotation.y += diff * Math.min(1, dt * 7);
  }

  // ── 相机 ────────────────────────────────────────────────────
  function moveCamera(pos, target, ms = 1400) {
    cancelTweens('cam');
    tweenVec(camera.position, pos, ms, easeInOut, 'cam');
    tweenVec(controls.target, target, ms, easeInOut, 'cam');
  }

  // ── 高亮圈 ──────────────────────────────────────────────────
  function moveRing(anchor) {
    const r = refs.ring;
    cancelTweens('ring');
    tweenVec(r.position, new THREE.Vector3(anchor.look.x, anchor.under ? -8.9 : 0.04, anchor.look.z), 900, easeInOut, 'ring');
    const s = (anchor.ringR || 6) / 6;
    tween({ ms: 700, tag: 'ring', onUpdate: p => { const cur = r.scale.x; r.scale.setScalar(cur + (s - cur) * p * 0.3 + (s - cur) * 0.0); } });
    r.scale.setScalar(s);
  }

  // ── 屏幕闪烁 / 高亮 ─────────────────────────────────────────
  function flashScreen(obj, color = 0xe8b86d, ms = 900) {
    const face = obj?.userData?.face;
    if (!face) return;
    const old = face.material.color.getHex();
    face.material.color.setHex(color);
    tween({ ms, onDone: () => face.material.color.setHex(old) });
  }

  function flashMesh(mesh, color = 0xe8b86d, ms = 800) {
    if (!mesh?.material) return;
    const oldE = mesh.material.emissive ? mesh.material.emissive.getHex() : null;
    if (oldE === null) return;
    mesh.material.emissive.setHex(color);
    const oldI = mesh.material.emissiveIntensity;
    mesh.material.emissiveIntensity = 1.4;
    tween({ ms, onDone: () => { mesh.material.emissive.setHex(oldE); mesh.material.emissiveIntensity = oldI; } });
  }

  // 登机牌卡片：从设备"吐"出来后飞到旅客手里
  function popBoardingPass(fromWorldPos) {
    const card = box(0.42, 0.02, 0.28, 0xf5efe4, { emissive: 0xf5efe4, ei: 0.5 });
    card.position.copy(fromWorldPos);
    world.root.add(card);
    const end = pax.position.clone().add(new THREE.Vector3(0, 1.25, 0));
    tweenVec(card.position, end, 1100, easeOut);
    tween({ ms: 1100, onUpdate: p => { card.rotation.y = p * 6; card.rotation.x = p * 2; } });
    tween({ ms: 2400, onDone: () => world.root.remove(card) });
    return card;
  }

  // ── 闸门开合 ────────────────────────────────────────────────
  function openGate(gateObj, ms = 700) {
    const { doorL, doorR } = gateObj.userData;
    if (!doorL) return;
    const zl = doorL.position.z, zr = doorR.position.z;
    tween({ ms, onUpdate: p => { doorL.position.z = zl + p * 0.55; doorR.position.z = zr - p * 0.55; } });
    flashMesh(gateObj.userData.top, 0x8fcf7a, ms + 400);
    tween({ ms: ms + 900, onDone: () => { doorL.position.z = zl; doorR.position.z = zr; } });
  }

  // ── 楼板 X 光透视（看地下 BHS）───────────────────────────────
  function setSlabTransparency(target, ms = 900) {
    const m = refs.slab.material;
    const from = m.opacity;
    tween({ ms, onUpdate: p => { m.opacity = from + (target - from) * p; } });
  }

  // ── 每一幕的动作 ────────────────────────────────────────────
  let tl = new Timeline();

  const ACTIONS = {
    transit(branchId) {
      // 列车进站；旅客沿站台走向出站口
      refs.train.position.x = -34;
      tween({ ms: 2600, ease: easeOut, onUpdate: p => { refs.train.position.x = -34 + p * 26; } });
      refs.bus.visible = branchId !== 'metro';
      refs.taxi.visible = branchId !== 'metro';
      walkTo(new THREE.Vector3(-78, 0, 4), { speed: 3.2 });
      tl = new Timeline()
        .at(2600, () => walkTo(new THREE.Vector3(-72, 0, 2), { speed: 4 }))
        .start();
    },

    entrance() {
      walkTo(new THREE.Vector3(-60, 0, 0), { speed: 6 });
      tl = new Timeline()
        .at(600, () => refs.fidsScreens.forEach((s, i) => setTimeout(() => flashScreen(s, 0xe8b86d, 1000), i * 120)))
        .start();
    },

    checkin(branchId) {
      if (branchId === 'mobile') {
        // 站在原地用手机：头顶浮一块发光小屏
        walkTo(new THREE.Vector3(-46, 0, 5), { speed: 6 });
        const phone = box(0.26, 0.02, 0.46, C.blue, { emissive: C.blue, ei: 0.9 });
        world.root.add(phone);
        tl = new Timeline()
          .at(1200, () => { phone.position.copy(pax.position).add(new THREE.Vector3(0.3, 1.25, 0.3)); phone.rotation.x = 0.5; })
          .at(2600, () => popBoardingPass(pax.position.clone().add(new THREE.Vector3(0.3, 1.3, 0.3))))
          .at(4200, () => world.root.remove(phone))
          .start();
      } else if (branchId === 'kiosk') {
        const k = refs.kiosks[2];
        const kp = new THREE.Vector3(-40 + k.position.x, 0, k.position.z - 1.6);
        walkTo(kp, { speed: 6 });
        tl = new Timeline()
          .at(1600, () => flashScreen(k.userData.screen, 0x8fcf7a, 1400))
          .at(2800, () => popBoardingPass(k.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.0, -0.4))))
          .start();
      } else {
        const c = refs.counters[1];
        const cp = new THREE.Vector3(-40 + c.position.x, 0, c.position.z + 1.8);
        walkTo(cp, { speed: 6 });
        tl = new Timeline()
          .at(1800, () => flashScreen(c.userData.screen, 0x6fb3d9, 1600))
          .at(3400, () => popBoardingPass(c.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.3, 0.4))))
          .start();
      }
    },

    bagdrop(branchId) {
      const bag = pax.userData.bag;
      bag.visible = true;
      if (branchId === 'sbd') {
        const u = refs.sbds[1];
        const up = new THREE.Vector3(-24 + u.position.x, 0, u.position.z - 2.2);
        walkTo(up, { speed: 6 });
        tl = new Timeline()
          .at(1700, () => flashScreen(u.userData.screen, 0x8fcf7a, 1200))
          .at(2300, () => dropBagOnBelt(u.getWorldPosition(new THREE.Vector3())))
          .start();
      } else {
        const bc = refs.bagCounters[0];
        const cp = new THREE.Vector3(-24 + bc.desk.position.x, 0, bc.desk.position.z + 1.9);
        walkTo(cp, { speed: 6 });
        tl = new Timeline()
          .at(1800, () => flashScreen(bc.desk.userData.screen, 0x6fb3d9, 1500))
          .at(2900, () => dropBagOnBelt(bc.belt.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.65, 0))))
          .start();
      }
    },

    bhs() {
      // 楼板透明 + 行李在地下走完全程
      setSlabTransparency(0.10, 800);
      const b = refs.trackedBag;
      b.visible = true;
      b.position.set(-10.6, 6.5, 0);   // 从滑槽上方落下（bhs 组局部坐标）
      tween({ ms: 900, ease: easeOut, onUpdate: p => { b.position.y = 6.5 - p * 5.78; } });
      const legs = [
        { to: -5, ms: 1400, at: 1000, fx: () => flashMesh(refs.atr, 0xc9a3d9, 900) },
        { to: 1.0, ms: 1200, at: 2500 },
        { to: 5.0, ms: 1400, at: 3700, fx: () => flashMesh(refs.hbs.userData.glow, 0x8fcf7a, 1200) },
        { to: 13, ms: 1800, at: 5200 },
        { to: 17.5, ms: 1200, at: 7100 },
      ];
      tl = new Timeline();
      let cur = -10.6;
      for (const l of legs) {
        const from = cur; cur = l.to;
        tl.at(l.at, () => {
          l.fx?.();
          tween({ ms: l.ms, ease: easeInOut, onUpdate: p => { b.position.x = from + (l.to - from) * p; } });
        });
      }
      tl.at(8500, () => { tween({ ms: 900, ease: easeInOut, onUpdate: p => { b.position.z = p * 6.5; b.position.y = 0.72 + Math.sin(p * Math.PI) * 0.8; } }); });
      tl.start();
    },

    security() {
      walkTo(new THREE.Vector3(-12, 0, 0), {
        speed: 5,
        onArrive: () => {
          const lane = refs.secLanes[1];
          flashMesh(lane.scanner.userData.glow, 0xd98b6f, 1400);
          flashMesh(lane.arch.userData.top, 0x8fcf7a, 1400);
          walkTo(new THREE.Vector3(-4, 0, 0), { speed: 2.2 });
        },
      });
      tl = new Timeline().start();
    },

    border() {
      walkTo(new THREE.Vector3(2, 0, 0), {
        speed: 5,
        onArrive: () => {
          refs.eGates.forEach((g, i) => setTimeout(() => openGate(g), i * 180));
          walkTo(new THREE.Vector3(9, 0, 0), { speed: 2.4 });
        },
      });
      tl = new Timeline().start();
    },

    dwell() {
      walkTo(new THREE.Vector3(18, 0, 6), { speed: 6 });
      tl = new Timeline().start();
    },

    gate() {
      walkTo(new THREE.Vector3(32, 0, 4), {
        speed: 6,
        onArrive: () => {
          flashScreen(refs.gateSign, 0x8fcf7a, 1600);
          refs.bgrGates.forEach((g, i) => setTimeout(() => openGate(g), 400 + i * 250));
        },
      });
      tl = new Timeline().start();
    },

    boarding(branchId) {
      const jb = refs.jetbridge;
      if (branchId === 'remote') {
        refs.shuttle.visible = true;
        refs.shuttle.position.set(30, 0, 22);
        walkTo(new THREE.Vector3(34, 0, 14), {
          speed: 5,
          onArrive: () => {
            tween({ ms: 1400, ease: easeInOut, onUpdate: p => { pax.position.z = 14 + p * 7; pax.position.x = 34 - p * 3; } });
            tween({ ms: 1900, onDone: () => { pax.visible = false; } });
          },
        });
        tl = new Timeline()
          .at(3400, () => {
            tween({ ms: 3000, ease: easeInOut, onUpdate: p => { refs.shuttle.position.z = 22 + p * 16; refs.shuttle.position.x = 30 + p * 6; } });
          })
          .at(7000, () => pushback())
          .start();
      } else {
        // 廊桥伸出对接，旅客走进廊桥并消失在机舱
        tween({ ms: 1600, ease: easeInOut, onUpdate: p => { jb.move.position.z = 16 + p * 3.2; jb.head.position.z = 22.6 + p * 3.2; jb.leg.position.z = 20 + p * 3.2; } });
        walkTo(new THREE.Vector3(37.4, 0, 12), {
          speed: 5,
          onArrive: () => {
            tween({ ms: 2600, ease: easeInOut, onUpdate: p => { pax.position.z = 12 + p * 26; } });
            tween({ ms: 2600, onDone: () => { pax.visible = false; } });
          },
        });
        tl = new Timeline()
          .at(1200, () => flashScreen(refs.vdgs, 0x8fcf7a, 1600))
          .at(5200, () => { // 撤桥
            tween({ ms: 1600, ease: easeInOut, onUpdate: p => { jb.move.position.z = 19.2 - p * 3.2; jb.head.position.z = 25.8 - p * 3.2; jb.leg.position.z = 23.2 - p * 3.2; } });
          })
          .at(7000, () => pushback())
          .start();
      }
    },
  };

  function pushback() {
    // 推出：飞机沿 +Z 后退并微转
    const ac = refs.aircraft;
    const z0 = ac.position.z;
    tween({ ms: 5200, ease: easeInOut, onUpdate: p => { ac.position.z = z0 + p * 22; ac.rotation.y = p * 0.28; } });
    if (refs.tug) tween({ ms: 5200, ease: easeInOut, onUpdate: p => { refs.tug.position.z = 34 + p * 22; } });
  }

  function dropBagOnBelt(worldPos) {
    const bag = pax.userData.bag;
    // 把箱子从旅客手里转移到世界坐标，再滑进传送带
    const wp = bag.getWorldPosition(new THREE.Vector3());
    pax.remove(bag);
    world.root.add(bag);
    bag.position.copy(wp);
    bag.userData.tag.visible = true;   // 贴上行李牌 → BSM 诞生
    const mid = worldPos.clone(); mid.y = 0.75;
    tweenVec(bag.position, mid, 900, easeOut);
    tween({ ms: 2200, onDone: () => {
      tween({ ms: 1400, ease: easeInOut, onUpdate: p => { bag.position.x = mid.x + p * 2.4; bag.position.y = mid.y - p * 1.2; } });
    } });
    tween({ ms: 4000, onDone: () => { bag.visible = false; world.root.remove(bag); pax.add(bag); bag.position.set(-0.42, 0, -0.28); } });
    pax.userData.hasBag = false;
  }

  // ── 基线：按当前步骤把世界恢复到该有的样子（支持任意跳步）────
  function applyBaseline(stepId, order) {
    const idx = order.indexOf(stepId);
    const after = id => order.indexOf(id) >= 0 && idx > order.indexOf(id);

    pax.visible = true;
    const bag = pax.userData.bag;
    if (!bag.parent) pax.add(bag);
    // 托运之后就不再拖箱子
    const droppedBag = after('bagdrop') || stepId === 'bhs';
    bag.visible = !droppedBag;
    if (!droppedBag) { bag.position.set(-0.42, 0, -0.28); bag.userData.tag.visible = false; }

    // 看地下行李厅时，除了楼板透明，还必须把 600×600 的场外地面与分格线藏掉——
    // 它们在 y≈0，是不透明的，否则从上往下看只会看到一片黑。
    const inBhs = stepId === 'bhs';
    setSlabTransparency(inBhs ? 0.08 : 1, 600);
    if (refs.ground) refs.ground.visible = !inBhs;
    if (refs.gridGroup) refs.gridGroup.visible = !inBhs;
    refs.trackedBag.visible = inBhs;
    refs.shuttle.visible = false;

    // 廊桥与飞机复位（除非正在登机幕）
    if (stepId !== 'boarding') {
      const jb = refs.jetbridge;
      jb.move.position.z = 16; jb.head.position.z = 22.6; jb.leg.position.z = 20;
      refs.aircraft.position.z = 53; refs.aircraft.rotation.y = 0;
      if (refs.tug) refs.tug.position.z = 34;
    }
  }

  /** 进入某一幕：相机 + 高亮圈 + 动作 */
  function enter(step, branchId, order) {
    cancelTweens('cam');
    tl?.stop();
    const a = anchors[step.zone] || anchors.entrance;
    // 相机高过屋顶时把屋顶整组藏掉，否则俯视全被那层半透明棕色盖住
    if (refs.roofGroup) refs.roofGroup.visible = a.cam.y < 11;
    applyBaseline(step.id, order);
    // 旅客瞬移到该幕的起点（若距离过远，避免长时间穿行）
    const d = pax.position.distanceTo(a.stand);
    if (d > 26) { pax.position.copy(a.stand).add(new THREE.Vector3(-4, 0, 0)); }
    moveRing(a);
    moveCamera(a.cam, a.look, 1500);
    ACTIONS[step.id]?.(branchId);
  }

  function update(dt, dtMs) {
    updateWalk(dt);
    animateFigure(pax.userData.fig, dt);
    tl?.update(dtMs);
  }

  return { enter, update, moveCamera, walkTo, pushback };
}
