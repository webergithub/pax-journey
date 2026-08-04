// 【UI-DOM 层】启动健康自检与失败兜底（G-RUN-2 / G-RUN-3）
//
// 原则：**任何失效都必须"有人话可读"**，绝不白屏、黑视口或静默冻结。
// 这里只依赖原生 DOM，不 import 任何可能一起挂掉的模块（i18n 也不引，
// 语言直接读 localStorage —— 自检要在最坏情况下仍能显示）。

const LANG_KEY = 'opcstudio_lang';
function lang() {
  try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
}
const pick = (zh, en) => (lang() === 'en' ? en : zh);

const DL = 'https://opcstudio.cc/pax-journey/downloads/';

/** 全屏兜底页：致命失败用（无 WebGL / 模块加载失败） */
export function fatal({ title, detail, hints = [], showDesktop = true }) {
  document.getElementById('health-fatal')?.remove();
  const el = document.createElement('div');
  el.id = 'health-fatal';
  el.className = 'health-fatal';
  el.innerHTML = `
    <div class="hf-card">
      <div class="hf-icon">⚠️</div>
      <h1>${title}</h1>
      <p class="hf-detail">${detail}</p>
      ${hints.length ? `<ul class="hf-hints">${hints.map(h => `<li>${h}</li>`).join('')}</ul>` : ''}
      <div class="hf-actions">
        <button class="hf-btn" onclick="location.reload()">${pick('重新加载', 'Reload')}</button>
        ${showDesktop ? `<a class="hf-btn hf-alt" href="${DL}" target="_blank" rel="noopener">${pick('下载离线桌面版', 'Get the offline desktop app')}</a>` : ''}
      </div>
    </div>`;
  document.body.appendChild(el);
}

/** 浮层提示：非致命但必须让用户知道（context lost） */
export function banner({ text, action }) {
  document.getElementById('health-banner')?.remove();
  const el = document.createElement('div');
  el.id = 'health-banner';
  el.className = 'health-banner';
  el.innerHTML = `<span>${text}</span>${action ? `<button class="hf-btn hf-sm" onclick="location.reload()">${action}</button>` : ''}`;
  document.body.appendChild(el);
}

export function clearBanner() { document.getElementById('health-banner')?.remove(); }

/**
 * WebGL2 可用性检测。返回 true 表示可继续启动。
 * 注意：探测用的 canvas 用完即弃，避免占用一个 WebGL context 名额。
 */
export function checkWebGL() {
  let gl = null;
  try {
    const cv = document.createElement('canvas');
    gl = cv.getContext('webgl2');
    if (!gl) {
      // 退一步看看有没有 WebGL1，好把提示写得更准确
      const gl1 = cv.getContext('webgl') || cv.getContext('experimental-webgl');
      fatal({
        title: pick('无法启动 3D 场景', 'Cannot start the 3D scene'),
        detail: gl1
          ? pick('这台设备只支持 WebGL 1，本模拟器需要 WebGL 2。',
                 'This device only supports WebGL 1, but the simulator requires WebGL 2.')
          : pick('浏览器未提供 WebGL，可能是被禁用或显卡驱动不支持。',
                 'The browser provides no WebGL — it may be disabled or unsupported by the graphics driver.'),
        hints: [
          pick('在浏览器设置里开启「使用硬件加速」后重启浏览器',
               'Enable hardware acceleration in browser settings and restart the browser'),
          pick('用较新版本的 Chrome / Edge / Safari 打开',
               'Open in a recent Chrome, Edge or Safari'),
          pick('教室或内网机器受限时，改用离线桌面版',
               'On a locked-down classroom machine, use the offline desktop app'),
        ],
      });
      return false;
    }
    return true;
  } catch (e) {
    fatal({
      title: pick('无法启动 3D 场景', 'Cannot start the 3D scene'),
      detail: pick('创建 WebGL 上下文时出错：', 'Error creating the WebGL context: ') + (e?.message || e),
    });
    return false;
  } finally {
    // 主动释放探测 context，别占用浏览器的 context 上限
    try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* 可选扩展 */ }
  }
}

/** 给渲染器挂 context lost/restored——丢失时 UI 不许再假装正常 */
export function watchContextLoss(canvas) {
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();           // 阻止默认行为才有机会 restore
    banner({
      text: pick('显卡上下文已丢失，3D 画面已停止刷新。', 'The graphics context was lost; the 3D view has stopped updating.'),
      action: pick('刷新页面', 'Reload'),
    });
  }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    banner({
      text: pick('显卡上下文已恢复，建议刷新以重建场景。', 'Graphics context restored — reload to rebuild the scene.'),
      action: pick('刷新页面', 'Reload'),
    });
  }, false);
}

/** 模块加载兜底：启动超时仍未就绪 → 说明 import 链断了 */
export function armLoadWatchdog(ms = 8000) {
  const timer = setTimeout(() => {
    if (window.__pax) return;     // 已启动，误报
    fatal({
      title: pick('资源加载失败', 'Failed to load resources'),
      detail: pick('页面脚本在 8 秒内没有完成加载，通常是网络被拦截或文件缺失。',
                   'Page scripts did not finish loading within 8 seconds — usually a blocked network or missing files.'),
      hints: [
        pick('检查网络连接或代理设置', 'Check the network connection or proxy settings'),
        pick('强制刷新（Ctrl/Cmd + Shift + R）清除半缓存', 'Hard-reload (Ctrl/Cmd + Shift + R) to clear a partial cache'),
        pick('内网无外网时，改用离线桌面版', 'On an offline intranet, use the desktop app'),
      ],
    });
  }, ms);
  return () => clearTimeout(timer);
}
