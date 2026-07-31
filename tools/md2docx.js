/*
 * Markdown → Word .docx 生成器（pax-journey 版）
 *
 * 基于 0_publicfolder/skills/generatereqandplan/scripts/md2docx.js，本版新增：
 *   ① 中文字体（eastAsia）显式指定，避免 Word 用衬线回退字体渲染中文
 *   ② ``` 围栏代码块（等宽 + 浅底），报告里的 ASCII 架构图/JSON 契约靠它
 *   ③ 行内 `code` 等宽渲染
 *   ④ 有序列表按"块"分配独立 numbering reference（共用会导致跨列表连续编号）
 *
 * 用法：node md2docx.js <in.md> <out.docx>
 */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType,
  TableOfContents, PageBreak,
} = require('docx');

const CN = 'Microsoft YaHei';                 // Office 在 Win/Mac 上都带的中文字体
const SANS = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: CN, cs: 'Arial' };
const MONO = { ascii: 'Consolas', hAnsi: 'Consolas', eastAsia: CN, cs: 'Consolas' };

const src = fs.readFileSync(process.argv[2], 'utf8');
const out = process.argv[3];
const lines = src.split('\n');

// 行内 **粗体** 与 `等宽` → TextRun[]
function runs(text, base = {}) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    if (m[1] !== undefined) {
      parts.push(new TextRun({ text: m[1], bold: true, ...base }));
    } else {
      parts.push(new TextRun({ text: m[2], font: MONO, size: 19, color: 'A3383C', ...base }));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(new TextRun({ text: text.slice(last), ...base }));
  return parts.length ? parts : [new TextRun({ text: '', ...base })];
}

const border = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
const borders = { top: border, bottom: border, left: border, right: border };

const children = [];
const orderedRefs = [];        // 每遇到一个有序列表块就登记一个独立 reference
let orderedRef = null;         // 当前块用的 reference（遇到非有序行则清空）
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  const isOrdered = /^\d+\.\s+/.test(line);
  if (!isOrdered) orderedRef = null;

  // ── 围栏代码块 ────────────────────────────────────────────────
  if (/^\s*```/.test(line)) {
    i++;
    const code = [];
    while (i < lines.length && !/^\s*```/.test(lines[i])) { code.push(lines[i]); i++; }
    i++;                                   // 吃掉收尾的 ```
    code.forEach((c, ci) => {
      children.push(new Paragraph({
        shading: { fill: 'F4F5F7', type: ShadingType.CLEAR, color: 'auto' },
        spacing: { before: ci === 0 ? 120 : 0, after: ci === code.length - 1 ? 120 : 0, line: 240 },
        indent: { left: 180, right: 180 },
        children: [new TextRun({ text: c || ' ', font: MONO, size: 17, color: '243447' })],
      }));
    });
    continue;
  }

  // ── 表格块 ────────────────────────────────────────────────────
  if (/^\s*\|/.test(line)) {
    const tbl = [];
    while (i < lines.length && /^\s*\|/.test(lines[i])) { tbl.push(lines[i]); i++; }
    const rows = tbl.filter(r => !/^\s*\|[\s:\-|]+\|\s*$/.test(r))
      .map(r => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()));
    if (rows.length) {
      const TOTAL = 9360;                 // US Letter 1" 边距下的正文宽度（DXA）
      const ncol = rows[0].length;
      for (const r of rows) {
        if (r.length > ncol) r.splice(ncol - 1, r.length - ncol + 1, r.slice(ncol - 1).join(' | '));
        while (r.length < ncol) r.push('');
      }
      // 按各列最长内容成比例分宽；中文按 2 倍宽度计权，否则中文列会被英文列挤扁
      const weights = [];
      for (let c = 0; c < ncol; c++) {
        let maxLen = 1;
        for (const r of rows) {
          const t = (r[c] || '').replace(/\*\*/g, '');
          const w = [...t].reduce((a, ch) => a + (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
          maxLen = Math.max(maxLen, w);
        }
        weights.push(Math.min(maxLen, 60));
      }
      const sum = weights.reduce((a, b) => a + b, 0);
      const floorW = Math.min(Math.floor(TOTAL * 0.08), Math.floor(TOTAL / ncol));
      const colWs = weights.map(w => Math.max(Math.floor(TOTAL * w / sum), floorW));
      let diff = colWs.reduce((a, b) => a + b, 0) - TOTAL;
      if (diff > 0) {
        const spare = colWs.map(w => w - floorW);
        const spareSum = spare.reduce((a, b) => a + b, 0) || 1;
        for (let c = 0; c < ncol; c++) colWs[c] -= Math.floor(diff * spare[c] / spareSum);
        diff = colWs.reduce((a, b) => a + b, 0) - TOTAL;
      }
      colWs[colWs.indexOf(Math.max(...colWs))] -= diff;
      children.push(new Table({
        width: { size: TOTAL, type: WidthType.DXA },
        columnWidths: colWs,
        rows: rows.map((cells, ri) => new TableRow({
          tableHeader: ri === 0,
          children: cells.map((c, ci) => new TableCell({
            borders,
            width: { size: colWs[ci], type: WidthType.DXA },
            shading: ri === 0 ? { fill: 'E7D3B4', type: ShadingType.CLEAR, color: 'auto' } : undefined,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ spacing: { before: 20, after: 20 }, children: runs(c, ri === 0 ? { bold: true } : {}) })],
          })),
        })),
      }));
      children.push(new Paragraph({ text: '' }));
    }
    continue;
  }

  // ── [[TOC]] → Word 目录域 ─────────────────────────────────────
  if (/^\s*\[\[TOC\]\]\s*$/.test(line)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs('目录') }));
    children.push(new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-3' }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
    i++;
    continue;
  }

  if (/^####\s+/.test(line)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_4, children: runs(line.replace(/^####\s+/, '')) }));
  } else if (/^###\s+/.test(line)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs(line.replace(/^###\s+/, '')) }));
  } else if (/^##\s+/.test(line)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(line.replace(/^##\s+/, '')) }));
  } else if (/^#\s+/.test(line)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(line.replace(/^#\s+/, '')) }));
  } else if (/^>\s*[-*]\s+/.test(line)) {
    children.push(new Paragraph({
      numbering: { reference: 'bullets', level: 1 },
      shading: { fill: 'F2F4F7', type: ShadingType.CLEAR, color: 'auto' },
      children: runs(line.replace(/^>\s*[-*]\s+/, ''), { color: '444444' }),
    }));
  } else if (/^\s*[-*]\s+/.test(line)) {
    const indent = /^\s{2,}/.test(line) ? 1 : 0;
    children.push(new Paragraph({
      numbering: { reference: 'bullets', level: indent },
      children: runs(line.replace(/^\s*[-*]\s+/, '')),
    }));
  } else if (isOrdered) {
    if (!orderedRef) { orderedRef = `numbers${orderedRefs.length}`; orderedRefs.push(orderedRef); }
    children.push(new Paragraph({
      numbering: { reference: orderedRef, level: 0 },
      children: runs(line.replace(/^\d+\.\s+/, '')),
    }));
  } else if (/^>\s?/.test(line)) {
    children.push(new Paragraph({
      indent: { left: 360 },
      shading: { fill: 'F2F4F7', type: ShadingType.CLEAR, color: 'auto' },
      children: runs(line.replace(/^>\s?/, ''), { color: '444444' }),
    }));
  } else if (/^---+\s*$/.test(line)) {
    children.push(new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9944A', space: 1 } },
      children: [new TextRun('')],
    }));
  } else if (line.trim() === '') {
    children.push(new Paragraph({ text: '' }));
  } else {
    children.push(new Paragraph({ children: runs(line) }));
  }
  i++;
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: SANS, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: SANS, size: 34, bold: true, color: '7A4A12' }, paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: SANS, size: 27, bold: true, color: 'A9762B' }, paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: SANS, size: 23, bold: true, color: '333333' }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
      { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: SANS, size: 21, bold: true, color: '555555' }, paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 3 } },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: 'bullet', text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
          { level: 1, format: 'bullet', text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 260 } } } },
        ],
      },
      ...orderedRefs.map(ref => ({
        reference: ref,
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }],
      })),
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log('wrote', out, buf.length, 'bytes |', children.length, 'blocks |', orderedRefs.length, 'ordered lists');
});
