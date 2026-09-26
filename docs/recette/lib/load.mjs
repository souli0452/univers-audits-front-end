import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function loadSourceText(srcDir) {
  const parts = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|html)$/.test(name)) parts.push(readFileSync(full, 'utf8'));
    }
  };
  walk(srcDir);
  return parts.join('\n');
}

export async function loadData(dataDir, { only } = {}) {
  const files = readdirSync(dataDir).filter((f) => f.endsWith('.mjs')).sort();
  const meta = (await import(pathToFileURL(join(dataDir, '00-meta.mjs')).href)).default;
  const processes = [];
  for (const f of files) {
    if (f === '00-meta.mjs') continue;
    const p = (await import(pathToFileURL(join(dataDir, f)).href)).default;
    if (!only || only.includes(p.id)) processes.push(p);
  }
  return { meta, processes };
}
