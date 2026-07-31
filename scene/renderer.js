// 【UI-3D 层】渲染器：场景 / 相机 / 灯光 / OrbitControls / 帧循环
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { updateTweens } from './tween.js';

export function createRenderer(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0a07);
  scene.fog = new THREE.Fog(0x0d0a07, 55, 190);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 600);
  camera.position.set(-70, 14, 22);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 6;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(-70, 2, 0);

  // 灯光：冷环境光 + 暖主光，营造"夜航站楼"的金色调
  scene.add(new THREE.AmbientLight(0xb9c6d8, 0.34));
  scene.add(new THREE.HemisphereLight(0x9fb6d4, 0x2a2318, 1.0));
  const key = new THREE.DirectionalLight(0xffe6c0, 1.9);
  key.position.set(-40, 60, 40);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8fc4e8, 0.7);
  fill.position.set(60, 30, -40);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffd9a0, 0.5);
  rim.position.set(-10, 20, -60);
  scene.add(rim);

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // 必须让 renderer 同步 canvas 的 CSS 尺寸（第三参默认 true）：
    // 传 false 会让画布以 drawingBuffer 像素尺寸铺开，容器 overflow:hidden 只露出左上角。
    renderer.setSize(w, h);
  }
  resize();
  addEventListener('resize', resize);
  // 容器尺寸随面板折叠变化时也要跟上
  if (window.ResizeObserver) new ResizeObserver(resize).observe(container);

  const frameFns = [];
  const onFrame = fn => frameFns.push(fn);

  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dtMs = Math.min(64, now - last);
    last = now;
    const dt = dtMs / 1000;
    updateTweens(dtMs);
    for (const fn of frameFns) { try { fn(dt, dtMs); } catch (e) { console.error(e); } }
    controls.update();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);

  // 手动驱动 n 帧并强制渲染一次。后台标签页 rAF 会被节流到 ~1fps，
  // 截图验证时动画看起来"冻住"，用它锁步快进（与 airport-twin 的 __pump 同一套排障习惯）。
  function pump(n = 60, dtMs = 16) {
    for (let i = 0; i < n; i++) {
      updateTweens(dtMs);
      for (const fn of frameFns) { try { fn(dtMs / 1000, dtMs); } catch (e) { console.error(e); } }
    }
    controls.update();
    renderer.render(scene, camera);
  }

  return { scene, camera, renderer, controls, onFrame, resize, pump };
}

/** 屏幕坐标 → 场景对象拾取 */
export function makePicker(camera, domElement) {
  const ray = new THREE.Raycaster();
  const v = new THREE.Vector2();
  return function pick(event, targets) {
    const r = domElement.getBoundingClientRect();
    v.x = ((event.clientX - r.left) / r.width) * 2 - 1;
    v.y = -((event.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(v, camera);
    return ray.intersectObjects(targets, true);
  };
}
