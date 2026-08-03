// 【UI-DOM 层】控制台悬浮球 —— 可拖到任意位置，单击展开/收起流程控制条
// 拖动与单击的区分：按下后位移超过 5px 记为拖动，抬起时不触发展开
const KEY = 'paxjourney_ctrlpos';

export function createCtrlDock(dock, fab, menu, onPrimary) {
  let open = false;
  let pos = load();

  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* 忽略坏值 */ }
    return null;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch { /* 无痕模式等 */ } }

  const SIZE = 48;   // 球是固定尺寸，别读 offsetWidth——样式未就绪时它是整行宽，会把初始位置算飞

  function place() {
    if (!pos) pos = { left: Math.round(innerWidth / 2 - SIZE / 2), top: innerHeight - SIZE - 22 };
    pos.left = Math.max(6, Math.min(pos.left, innerWidth - SIZE - 6));
    pos.top = Math.max(62, Math.min(pos.top, innerHeight - SIZE - 6));
    dock.style.left = pos.left + 'px';
    dock.style.top = pos.top + 'px';
    flip();
  }

  // 菜单往哪边弹：上方放不下就往下，水平贴边就改左/右对齐
  function flip() {
    const r = fab.getBoundingClientRect();
    const mh = menu.offsetHeight || 44;
    const mw = menu.offsetWidth || 480;
    dock.classList.toggle('menu-down', r.top - mh - 14 < 60);
    dock.classList.remove('menu-left', 'menu-right', 'menu-center');
    const cx = r.left + r.width / 2;
    if (cx - mw / 2 < 8) dock.classList.add('menu-left');
    else if (cx + mw / 2 > innerWidth - 8) dock.classList.add('menu-right');
    else dock.classList.add('menu-center');
  }

  function setOpen(v) {
    open = !!v;
    dock.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', String(open));
    if (open) requestAnimationFrame(flip);   // 展开后菜单才有真实尺寸，此时再判方向
  }

  let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, dragging = false;
  let pressTimer = null;    // 长按（≥550ms 未移动）→ 展开菜单
  let clickTimer = null;    // 单击去抖：260ms 内没有第二击才执行主操作
  let longFired = false;

  fab.addEventListener('pointerdown', e => {
    e.preventDefault();
    dragging = true; moved = false; longFired = false;
    sx = e.clientX; sy = e.clientY;
    ox = pos.left; oy = pos.top;
    try { fab.setPointerCapture(e.pointerId); } catch { /* 合成事件的 pointerId 会抛 NotFound */ }
    dock.classList.add('dragging');
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      if (dragging && !moved) { longFired = true; setOpen(true); }
    }, 550);
  });

  fab.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && Math.hypot(dx, dy) > 5) { moved = true; clearTimeout(pressTimer); }
    if (!moved) return;
    pos = { left: ox + dx, top: oy + dy };
    place();
  });

  function end(e) {
    if (!dragging) return;
    dragging = false;
    clearTimeout(pressTimer);
    dock.classList.remove('dragging');
    try { fab.releasePointerCapture(e.pointerId); } catch { /* 同上 */ }
    if (moved) { save(); return; }
    if (longFired) return;                       // 长按已开菜单，这次抬起不再算点击
    if (clickTimer) {                            // 260ms 内的第二击 = 双击 → 菜单
      clearTimeout(clickTimer); clickTimer = null;
      setOpen(!open);
    } else {
      clickTimer = setTimeout(() => {            // 单击 → 主操作（下一步）
        clickTimer = null;
        if (open) setOpen(false);
        onPrimary?.();
      }, 260);
    }
  }
  fab.addEventListener('pointerup', end);
  fab.addEventListener('pointercancel', end);

  addEventListener('resize', place);
  place();
  setOpen(false);

  return { setOpen, place, isOpen: () => open };
}
