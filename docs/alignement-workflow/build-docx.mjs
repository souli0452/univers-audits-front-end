import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../recette/package.json', import.meta.url));
const d = require('docx');

const src = fs.readFileSync(new URL('./decisions-a-valider.md', import.meta.url), 'utf8').split(/\r?\n/);
const kids = [];
const runs = (t, extra = {}) => t.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(s =>
  s.startsWith('**') ? new d.TextRun({ text: s.slice(2, -2), bold: true, ...extra }) : new d.TextRun({ text: s, ...extra }));
const border = { style: d.BorderStyle.SINGLE, size: 4, color: '999999' };
const borders = { top: border, bottom: border, left: border, right: border };

for (let i = 0; i < src.length; i++) {
  const l = src[i];
  if (!l.trim()) continue;
  if (l.startsWith('# ')) kids.push(new d.Paragraph({ heading: d.HeadingLevel.TITLE, children: runs(l.slice(2)) }));
  else if (l.startsWith('## ')) kids.push(new d.Paragraph({ heading: d.HeadingLevel.HEADING_1, spacing: { before: 300 }, children: runs(l.slice(3)) }));
  else if (l.startsWith('### ')) kids.push(new d.Paragraph({ heading: d.HeadingLevel.HEADING_2, spacing: { before: 240 }, children: runs(l.slice(4)) }));
  else if (l.startsWith('|')) {
    const rows = [];
    while (i < src.length && src[i].startsWith('|')) {
      if (!/^\|[-| ]+\|$/.test(src[i])) rows.push(src[i].split('|').slice(1, -1).map(c => c.trim()));
      i++;
    }
    i--;
    const n = rows[0].length, w = Math.floor(9360 / n);
    kids.push(new d.Table({
      width: { size: 9360, type: d.WidthType.DXA }, columnWidths: Array(n).fill(w),
      rows: rows.map((r, ri) => new d.TableRow({ children: r.map(c => new d.TableCell({
        borders, width: { size: w, type: d.WidthType.DXA },
        shading: ri === 0 ? { fill: 'E8EEF4', type: d.ShadingType.CLEAR } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new d.Paragraph({ children: runs(c, ri === 0 ? { bold: true } : {}) })] })) }))
    }));
    kids.push(new d.Paragraph({ children: [] }));
  } else if (l.startsWith('- [ ] ')) kids.push(new d.Paragraph({ indent: { left: 360 }, children: [new d.TextRun('☐  '), ...runs(l.slice(6))] }));
  else if (l.startsWith('- ')) kids.push(new d.Paragraph({ indent: { left: 360 }, children: [new d.TextRun('•  '), ...runs(l.slice(2))] }));
  else kids.push(new d.Paragraph({ spacing: { after: 120 }, children: runs(l) }));
}
const doc = new d.Document({
  styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } }, children: kids }]
});
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./out/Decisions-a-valider-ASCE-LC.docx', import.meta.url), await d.Packer.toBuffer(doc));
console.log('ok');
