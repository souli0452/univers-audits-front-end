import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateProcess } from './lib/schema.mjs';
import { loadData, loadSourceText } from './lib/load.mjs';

export const EXPECTED_PROCESSES = [
  'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07',
  'P08', 'P09', 'P10', 'P11', 'P12', 'P13', 'P14', 'E2E'
];

export function validateAll({ processes, meta, srcText, expectAll }) {
  const errs = [];
  const accountRoles = new Set((meta.accounts ?? []).map((a) => a.role));
  for (const p of processes) {
    errs.push(...validateProcess(p));
    for (const c of p.cases ?? []) {
      for (const label of c.ui ?? []) {
        if (!srcText.includes(label)) errs.push(`${c.id}: libellé introuvable dans le code: "${label}"`);
      }
      if (c.role && c.role !== 'PUBLIC' && !accountRoles.has(c.role)) {
        errs.push(`${c.id}: le rôle ${c.role} n'a pas de compte dans meta.accounts`);
      }
    }
  }
  if (expectAll) {
    const have = new Set(processes.map((p) => p.id));
    for (const id of EXPECTED_PROCESSES) if (!have.has(id)) errs.push(`processus manquant: ${id}`);
  }
  return errs;
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const onlyArg = process.argv.indexOf('--only');
  const only = onlyArg > -1 ? process.argv[onlyArg + 1].split(',') : undefined;
  const { meta, processes } = await loadData(resolve(here, 'data'), { only });
  const srcText = loadSourceText(resolve(here, '../../src'));
  const errs = validateAll({ processes, meta, srcText, expectAll: !only });
  const total = processes.reduce((n, p) => n + p.cases.length, 0);
  if (errs.length) {
    console.error(errs.join('\n'));
    console.error(`\n${errs.length} erreur(s) — ${total} cas lus`);
    process.exit(1);
  }
  console.log(`OK — ${processes.length} processus, ${total} cas`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
