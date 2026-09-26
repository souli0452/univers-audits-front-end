import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCase, validateProcess } from '../lib/schema.mjs';

const goodCase = (over = {}) => ({
  id: 'P02-01',
  title: 'Dépôt nominatif complet',
  priority: 'Critique',
  type: 'nominal',
  role: 'PUBLIC',
  preconditions: ['Accès à /portail/deposer'],
  steps: ['Ouvrir /portail/deposer', 'Remplir le formulaire'],
  data: ['Objet : Test'],
  expected: ['L’écran de succès affiche un code d’accès'],
  ...over
});

test('accepte un cas valide', () => {
  assert.deepEqual(validateCase(goodCase(), 'P02'), []);
});

test('refuse un id mal formé', () => {
  assert.match(validateCase(goodCase({ id: 'P2-1' }), 'P02').join('|'), /id invalide/);
});

test('refuse un id qui ne commence pas par le processus', () => {
  assert.match(validateCase(goodCase({ id: 'P03-01' }), 'P02').join('|'), /doit commencer par P02-/);
});

test('refuse une priorité ou un type inconnus', () => {
  const errs = validateCase(goodCase({ priority: 'Haute', type: 'autre' }), 'P02').join('|');
  assert.match(errs, /priority invalide/);
  assert.match(errs, /type invalide/);
});

test('refuse un rôle inconnu', () => {
  assert.match(validateCase(goodCase({ role: 'ROOT' }), 'P02').join('|'), /role inconnu/);
});

test('exige au moins 2 étapes non vides', () => {
  assert.match(validateCase(goodCase({ steps: ['Une seule'] }), 'P02').join('|'), /au moins 2 étapes/);
  assert.match(validateCase(goodCase({ steps: ['A', '  '] }), 'P02').join('|'), /étape vide/);
});

test('exige des préconditions et un résultat attendu', () => {
  const errs = validateCase(goodCase({ preconditions: [], expected: [] }), 'P02').join('|');
  assert.match(errs, /preconditions manquantes/);
  assert.match(errs, /expected manquant/);
});

test('refuse un résultat attendu vague', () => {
  const errs = validateCase(goodCase({ expected: ['Le formulaire fonctionne correctement'] }), 'P02');
  assert.match(errs.join('|'), /résultat attendu vague/);
});

test('un cas regression doit être Critique', () => {
  const errs = validateCase(goodCase({ regression: true, priority: 'Majeur' }), 'P02');
  assert.match(errs.join('|'), /regression doit être Critique/);
});

test('validateProcess exige un cas nominal et un cas négatif ou sécurité', () => {
  const p = { id: 'P02', title: 'Dépôt', access: 'Public', intro: 'x', cases: [goodCase()] };
  assert.match(validateProcess(p).join('|'), /au moins un cas négatif ou sécurité/);
  const ok = { ...p, cases: [goodCase(), goodCase({ id: 'P02-02', type: 'negatif' })] };
  assert.deepEqual(validateProcess(ok), []);
});

test('validateProcess refuse les ids dupliqués', () => {
  const p = { id: 'P02', title: 'Dépôt', access: 'Public', intro: 'x',
    cases: [goodCase(), goodCase({ type: 'negatif' })] };
  assert.match(validateProcess(p).join('|'), /id dupliqué/);
});

test('le scénario E2E est exempté de la règle de couverture', () => {
  const p = { id: 'E2E', title: 'Bout en bout', access: 'Tous', intro: 'x',
    cases: [goodCase({ id: 'E2E-01' })] };
  assert.deepEqual(validateProcess(p), []);
});
