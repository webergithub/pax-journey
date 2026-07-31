// 【UI-DOM 层】术语超链接 —— 把正文里出现的缩写/专业名词自动变成可点击的链接
import { allAliases, resolveTerm } from '../data/glossary.js';

let RE = null;

function buildRegex() {
  const parts = [];
  for (const alias of allAliases()) {
    if (alias.length < 2) continue;                     // 单字符太吵
    const esc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (/^[\x00-\x7F]+$/.test(alias)) {
      // 纯 ASCII 术语要求词边界，避免 "ET" 命中 "TICKET"
      parts.push(`(?<![A-Za-z0-9\\-])${esc}(?![A-Za-z0-9\\-])`);
    } else {
      parts.push(esc);
    }
  }
  return new RegExp(parts.join('|'), 'g');
}

const SKIP_TAGS = new Set(['A', 'CODE', 'PRE', 'BUTTON', 'INPUT', 'TEXTAREA', 'SCRIPT', 'STYLE']);

function skippable(node) {
  for (let p = node.parentElement; p; p = p.parentElement) {
    if (SKIP_TAGS.has(p.tagName)) return true;
    if (p.classList?.contains('no-link')) return true;
    if (p.classList?.contains('term-link')) return true;
  }
  return false;
}

/** 就地把 el 子树里的术语替换成 <a class="term-link" data-term="…">；幂等，可重复调用 */
export function linkify(el) {
  if (!el) return;
  RE ||= buildRegex();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const targets = [];
  let n;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue || n.nodeValue.trim().length < 2) continue;
    if (skippable(n)) continue;
    RE.lastIndex = 0;
    if (RE.test(n.nodeValue)) targets.push(n);
  }
  for (const node of targets) {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    RE.lastIndex = 0;
    const seen = new Set();                              // 同一段文字里同一个词只链一次，避免满屏下划线
    while ((m = RE.exec(text)) !== null) {
      const token = m[0];
      const hit = resolveTerm(token);
      if (!hit || seen.has(token)) continue;
      seen.add(token);
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const a = document.createElement('a');
      a.className = 'term-link';
      a.dataset.term = token;
      a.textContent = token;
      a.title = token;
      frag.appendChild(a);
      last = m.index + token.length;
    }
    if (!last) continue;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
}

/** 全局代理：任何 .term-link 被点击都交给回调（回调负责开窗） */
export function bindTermClicks(onTerm) {
  document.addEventListener('click', e => {
    const a = e.target.closest?.('.term-link');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    const hit = resolveTerm(a.dataset.term);
    if (hit) onTerm(hit, a.dataset.term);
  });
}
