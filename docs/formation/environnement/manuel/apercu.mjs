// Aperçu visuel du manuel : rendu du .docx dans Chrome (bibliothèque docx-preview) puis capture de pages choisies.
// Usage : node manuel/apercu.mjs 1 4 6 ...   (numéros de pages ; sans argument : une sélection)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancer } from '../capture.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const env = path.resolve(ici, '..');
const docx = path.resolve(env, '..', 'Manuel-de-formation-INTEGRITE-plus.docx');
const sortie = path.resolve(env, '..', 'captures', 'apercu');
fs.mkdirSync(sortie, { recursive: true });
const pages = process.argv.slice(2).map(Number).filter(Boolean);
const choix = pages.length ? pages : [1, 2, 4, 6, 8, 11, 14, 19, 26, 32, 38, 45, 52, 60, 63];

const nav = await lancer();
try {
    const page = await nav.newPage();
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1 });
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#888}</style></head><body><div id="c"></div></body></html>');
    await page.addScriptTag({ path: path.join(env, 'node_modules', 'jszip', 'dist', 'jszip.min.js') });
    await page.addScriptTag({ path: path.join(env, 'node_modules', 'docx-preview', 'dist', 'docx-preview.min.js') });
    const base64 = fs.readFileSync(docx).toString('base64');
    const total = await page.evaluate(async b64 => {
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        await docx.renderAsync(bin.buffer, document.getElementById('c'), null, { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: false });
        return document.querySelectorAll('section.docx').length;
    }, base64);
    console.log('pages rendues :', total);
    for (const n of choix) {
        const h = await page.$$('section.docx');
        if (!h[n - 1]) { console.log('page absente', n); continue; }
        await h[n - 1].screenshot({ path: path.join(sortie, `p${String(n).padStart(2, '0')}.png`) });
        console.log('page', n);
    }
} finally { await nav.close(); }
