// 【UI-DOM 层】默认路径配置窗 —— 自动播放按这套配置全程走一遍
import { T, t } from '../data/i18n.js';
import * as S from '../engine/state.js';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** onRun() 由 main 提供：保存后从头自动播放 */
export function createDefaults(el, onRun) {
  const body = el.querySelector('.df-body');

  function render() {
    const steps = S.branchSteps();
    body.innerHTML = `
      <div class="panel-hint">${esc(t('defaultsHint'))}</div>
      ${steps.map(s => {
        const cur = S.state.defaults[s.id];
        return `<div class="df-row">
          <div class="df-step">${s.icon} ${esc(T(s.name))}</div>
          <div class="df-opts">${s.branches.map(b => `
            <button class="df-opt ${cur === b.id ? 'on' : ''}" data-step="${s.id}" data-b="${b.id}"
              title="${esc(T(b.device))}">${b.icon} ${esc(T(b.label))}${b.intlOnly ? ' 🌐' : ''}</button>`).join('')}
          </div>
        </div>`;
      }).join('')}
      <div class="df-foot">
        <button class="btn" id="df-reset">${esc(t('defaultsReset'))}</button>
        <button class="btn primary" id="df-run">${esc(t('defaultsSave'))}</button>
      </div>`;

    body.querySelectorAll('.df-opt').forEach(b => b.addEventListener('click', () => {
      S.setDefault(b.dataset.step, b.dataset.b);
      render();
    }));
    body.querySelector('#df-reset').addEventListener('click', () => { S.resetDefaults(); render(); });
    body.querySelector('#df-run').addEventListener('click', () => { S.saveDefaults(); onRun(); });
  }

  return { render };
}
