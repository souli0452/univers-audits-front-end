import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAll, EXPECTED_PROCESSES } from '../validate.mjs';

const mk = (over = {}) => ({
  id: 'P02-01', title: 'Dépôt', priority: 'Majeur', type: 'nominal', role: 'PUBLIC',
  preconditions: ['x'], steps: ['a', 'b'], data: [], expected: ['Le code d’accès est affiché'], ...over
});
const proc = (id, cases) => ({ id, title: 'Titre', access: 'x', intro: 'x', cases });
const meta = { accounts: [{ role: 'CGE', login: 'x', usage: 'x' }] };
const twoCases = (extra = {}) => [mk(extra), mk({ id: 'P02-02', type: 'negatif' })];

test('accepte un jeu cohérent', () => {
  const errs = validateAll({ processes: [proc('P02', twoCases())], meta, srcText: 'Continuer', expectAll: false });
  assert.deepEqual(errs, []);
});

test('signale un libellé introuvable dans le code', () => {
  const errs = validateAll({
    processes: [proc('P02', twoCases({ ui: ['Bouton fantôme'] }))],
    meta, srcText: 'Continuer', expectAll: false
  });
  assert.match(errs.join('|'), /libellé introuvable dans le code: "Bouton fantôme"/);
});

test('trouve un libellé présent dans le code', () => {
  const errs = validateAll({
    processes: [proc('P02', twoCases({ ui: ['Continuer'] }))],
    meta, srcText: '<p-button label="Continuer" />', expectAll: false
  });
  assert.deepEqual(errs, []);
});

test('signale un rôle sans compte de test', () => {
  const errs = validateAll({
    processes: [proc('P02', twoCases({ role: 'AGENT_BRPD' }))],
    meta, srcText: '', expectAll: false
  });
  assert.match(errs.join('|'), /le rôle AGENT_BRPD n'a pas de compte dans meta.accounts/);
});

test('le rôle PUBLIC n\'exige pas de compte', () => {
  const errs = validateAll({ processes: [proc('P02', twoCases())], meta: { accounts: [] }, srcText: '', expectAll: false });
  assert.deepEqual(errs, []);
});

test('en run complet, signale les processus manquants', () => {
  const errs = validateAll({ processes: [proc('P02', twoCases())], meta, srcText: '', expectAll: true });
  assert.match(errs.join('|'), /processus manquant: P01/);
  assert.equal(EXPECTED_PROCESSES.length, 15);
});

import { loadData } from '../lib/load.mjs';
import { ROLES } from '../lib/schema.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

test('00-meta déclare un compte pour chaque rôle interne', async () => {
  const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), '../data');
  const { meta } = await loadData(dataDir, { only: [] });
  const have = new Set(meta.accounts.map((a) => a.role));
  for (const r of ROLES.filter((x) => x !== 'PUBLIC')) assert.ok(have.has(r), `compte manquant: ${r}`);
  assert.equal(meta.startDossiers.length, 3);
});
