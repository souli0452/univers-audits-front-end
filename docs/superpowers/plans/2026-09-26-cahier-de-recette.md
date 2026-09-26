# Cahier de recette ASCE-LC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produire `Cahier-de-recette-ASCE-LC.docx`, un cahier de recette manuel d'environ 143 cas couvrant les processus P01 à P14 et un scénario de bout en bout.

**Architecture:** Le contenu vit dans des fichiers de données `.mjs` (un par processus). Un validateur Node refuse tout cas mal formé, tout libellé d'écran introuvable dans le code du front et tout rôle sans compte de test. Un générateur `build.mjs` assemble le `.docx` (bibliothèque `docx`) à partir de ces données. Le validateur et le générateur ont des tests `node:test` ; le contenu est contrôlé par le validateur.

**Tech Stack:** Node 22 (`node:test`), npm package `docx` ^9.7.2, `jszip` (tests uniquement). Outillage isolé dans `docs/recette/` avec son propre `package.json` : aucune dépendance ajoutée à l'application Angular.

**Spec:** `docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md`

## Global Constraints

Valeurs copiées du spec :
- Livrable : un fichier Word `.docx`. Test **manuel** uniquement, pas d'automatisation E2E ou unitaire.
- Environnement testé : front `amandement_cge` sur la VM Ubuntu, back `feature/workflow-denociation-asce-fix`.
- Rôles : `ADMIN_DDIC`, `CGE`, `CGEA`, `CONTROLEUR_ETAT`, `TEAM_LEADER`, `CONSEILLER_JURIDIQUE`, `AGENT_CJ`, `AGENT_BRPD`, et le citoyen anonyme du portail (`PUBLIC`).
- Statuts d'un cas : `OK / KO / Bloqué / Non testé`. Gravité d'une anomalie : `Critique / Majeur / Mineur`.
- ID d'un cas : `P07-03` (ou `E2E-01`). Colonnes : ID, priorité, rôle, préconditions, étapes, données saisies, résultat attendu, puis Statut, Date, Testeur, Observation (vides).
- Trois types de cas par processus : nominal, négatif, sécurité.
- Toujours **Critique** : dépôt public de plainte et flag `anonymous`, les 4 points d'entrée de création de dossier (`NatureSaisineResolver`), soumission du rapport final d'investigation, appels API et CSP en production (`denoncer.asce-lc.bf`, `/api/`, `/auth/`).
- Volume : environ 143 cas (le spec disait 100 à 130 ; corrigé à la Task 13).
- Quand une règle métier n'est pas lisible dans le front, le cas porte `aConfirmer` et le texte « à confirmer ». **On n'invente aucun comportement métier.**
- Les libellés d'écran, boutons et statuts cités viennent du code réel du front.

## Review Focus

Les cinq échecs les plus probables que les tests de tâche n'exerceraient pas d'eux-mêmes :
1. Un cas cite un libellé d'écran qui n'existe pas (ou plus) dans le code → le testeur cherche un bouton fantôme. Test : Task 2.
2. Un cas exige un rôle pour lequel aucun compte de test n'est listé → le cas est « Bloqué » d'office. Test : Task 2.
3. Un résultat attendu vague (« fonctionne correctement ») rend le cas invérifiable. Test : Task 1.
4. Accents, `’`, `«»` ou `☐` corrompus dans le `.docx`. Test : Task 4.
5. Les points « à confirmer » se perdent dans 143 cas. Test : annexe générée, Task 4.

## Case authoring guide

À suivre pour **toutes** les tâches de contenu (Tasks 5 à 12).

**Forme d'un fichier processus** `docs/recette/data/pNN-slug.mjs` :

```js
export default {
  id: 'P02',
  title: 'Dépôt de plainte public',
  access: 'Public (sans connexion)',
  intro: 'Formulaire du portail /portail/deposer, nominatif ou anonyme.',
  cases: [
    {
      id: 'P02-02',
      title: 'Dépôt anonyme : aucune donnée d’identité demandée ni envoyée',
      priority: 'Critique',
      type: 'nominal',
      role: 'PUBLIC',
      regression: true,
      preconditions: ['Navigateur en navigation privée', 'Onglet Réseau (F12) ouvert'],
      steps: [
        'Ouvrir /portail/deposer',
        'Choisir le mode anonyme',
        'Renseigner l’objet et la description des faits',
        'Cliquer sur « Continuer » puis valider le dépôt',
        'Dans l’onglet Réseau, ouvrir la requête POST de création du dossier'
      ],
      data: ['Objet : Test recette anonyme', 'Description : Faits fictifs de test'],
      expected: [
        'L’écran de succès affiche un code d’accès',
        'La requête POST contient anonymous: true à la racine du corps',
        'Aucun nom, e-mail ou téléphone n’est présent dans le corps de la requête'
      ],
      ui: ['Continuer']
    }
  ]
};
```

**Règles de rédaction**
- `role` = le rôle qui exécute le cas. Confirmer dans le code (`roleGuard`, `hasRole`, `canEditDossier`, méthodes `can*`). En cas de doute, mettre `ADMIN_DDIC` **et** renseigner `aConfirmer`.
- `steps` : une action par ligne, verbe à l'infinitif, écran ou URL nommé. Un testeur qui ne connaît pas le code doit pouvoir suivre.
- `expected` : observable et vérifiable (texte affiché, statut, code HTTP, valeur d'un champ). Interdits : « fonctionne correctement », « comme prévu », « s’affiche bien », « tout est ok », « sans problème ».
- `ui` : libellés **exacts** cités entre « » dans les étapes ou le résultat (boutons, onglets). Le validateur vérifie qu'ils existent dans `src/`. Copier depuis le code, ne pas retaper de mémoire.
- `aConfirmer` (chaîne) : la règle métier non lisible dans le front, par exemple `'Délai de réponse calculé par l’API'`.
- `regression: true` impose `priority: 'Critique'`.
- Typographie : apostrophe `’`, guillemets « ».
- Un cas de type `securite` décrit un accès non autorisé (autre rôle, URL directe, contenu piégé) et son refus attendu.

**Commande de contrôle d'un fichier** (depuis `docs/recette`) : `node validate.mjs --only P02`

## File Structure

| Fichier | Rôle |
|---|---|
| `docs/recette/package.json` | dépendances et scripts de l'outillage, isolé de l'app |
| `docs/recette/lib/schema.mjs` | constantes et validation d'un cas / d'un processus |
| `docs/recette/lib/load.mjs` | charge `data/*.mjs` et le texte source de `src/` |
| `docs/recette/validate.mjs` | validations croisées + CLI (`--only`) |
| `docs/recette/build.mjs` | génère le `.docx` (`buildDocument`) + CLI |
| `docs/recette/data/00-meta.mjs` | environnement, comptes de test, jeux de données |
| `docs/recette/data/pNN-*.mjs`, `e2e.mjs` | un fichier par processus |
| `docs/recette/tests/*.test.mjs` | tests du validateur et du générateur |
| `.gitignore` | ignore `docs/recette/node_modules/` et `docs/recette/out/` |

---

### Task 1: Outillage et validation d'un cas

**Files:**
- Create: `docs/recette/package.json`, `docs/recette/lib/schema.mjs`
- Test: `docs/recette/tests/schema.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: rien.
- Produces: `lib/schema.mjs` exporte `PRIORITIES`, `TYPES`, `ROLES`, `validateCase(c, processId): string[]`, `validateProcess(p): string[]`. Chaque fonction renvoie la liste des messages d'erreur (vide = valide).

- [ ] **Step 1: Créer la branche et l'outillage**

```bash
git checkout -b docs/cahier-recette
mkdir -p docs/recette/lib docs/recette/tests docs/recette/data
printf '\n# Cahier de recette (outillage)\ndocs/recette/node_modules/\ndocs/recette/out/\n' >> .gitignore
```

Créer `docs/recette/package.json` :

```json
{
  "name": "recette-asce-lc",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/",
    "validate": "node validate.mjs",
    "build": "node build.mjs"
  },
  "dependencies": {
    "docx": "^9.7.2"
  },
  "devDependencies": {
    "jszip": "^3.10.1"
  }
}
```

```bash
cd docs/recette && npm install
```

Expected : installation sans erreur, dossier `docs/recette/node_modules/docx` présent.

- [ ] **Step 2: Écrire les tests qui échouent**

Créer `docs/recette/tests/schema.test.mjs` :

```js
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
```

- [ ] **Step 3: Vérifier que les tests échouent**

Run: `cd docs/recette && npm test`
Expected: FAIL avec `Cannot find module '../lib/schema.mjs'`

- [ ] **Step 4: Implémenter `lib/schema.mjs`**

```js
export const PRIORITIES = ['Critique', 'Majeur', 'Mineur'];
export const TYPES = ['nominal', 'negatif', 'securite'];
export const ROLES = [
  'PUBLIC', 'ADMIN_DDIC', 'CGE', 'CGEA', 'CONTROLEUR_ETAT',
  'TEAM_LEADER', 'CONSEILLER_JURIDIQUE', 'AGENT_CJ', 'AGENT_BRPD'
];
const VAGUE = ['fonctionne correctement', 'comme prévu', 's’affiche bien', "s'affiche bien", 'tout est ok', 'sans problème'];
const CASE_ID = /^(P\d{2}|E2E)-\d{2}$/;
const PROCESS_ID = /^(P\d{2}|E2E)$/;

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export function validateCase(c, processId) {
  const errs = [];
  const at = c.id ?? '(sans id)';
  if (!CASE_ID.test(c.id ?? '')) errs.push(`${at}: id invalide (attendu P07-03 ou E2E-01)`);
  else if (!c.id.startsWith(`${processId}-`)) errs.push(`${at}: l'id doit commencer par ${processId}-`);
  if (!c.title?.trim()) errs.push(`${at}: title manquant`);
  if (!PRIORITIES.includes(c.priority)) errs.push(`${at}: priority invalide (${c.priority})`);
  if (!TYPES.includes(c.type)) errs.push(`${at}: type invalide (${c.type})`);
  if (!ROLES.includes(c.role)) errs.push(`${at}: role inconnu (${c.role})`);
  if (asList(c.preconditions).length === 0) errs.push(`${at}: preconditions manquantes`);
  const steps = asList(c.steps);
  if (steps.length < 2) errs.push(`${at}: au moins 2 étapes`);
  if (steps.some((s) => !String(s).trim())) errs.push(`${at}: étape vide`);
  const expected = asList(c.expected);
  if (expected.length === 0) errs.push(`${at}: expected manquant`);
  for (const e of expected) {
    const bad = VAGUE.find((v) => String(e).toLowerCase().includes(v));
    if (bad) errs.push(`${at}: résultat attendu vague ("${bad}")`);
  }
  if (c.regression && c.priority !== 'Critique') errs.push(`${at}: un cas regression doit être Critique`);
  return errs;
}

export function validateProcess(p) {
  const errs = [];
  if (!PROCESS_ID.test(p.id ?? '')) errs.push(`${p.id ?? '(sans id)'}: id de processus invalide`);
  if (!p.title?.trim()) errs.push(`${p.id}: title manquant`);
  if (!Array.isArray(p.cases) || p.cases.length === 0) {
    errs.push(`${p.id}: aucun cas`);
    return errs;
  }
  const seen = new Set();
  for (const c of p.cases) {
    if (seen.has(c.id)) errs.push(`${c.id}: id dupliqué`);
    seen.add(c.id);
    errs.push(...validateCase(c, p.id));
  }
  if (p.id !== 'E2E') {
    if (!p.cases.some((c) => c.type === 'nominal')) errs.push(`${p.id}: au moins un cas nominal`);
    if (!p.cases.some((c) => c.type === 'negatif' || c.type === 'securite'))
      errs.push(`${p.id}: au moins un cas négatif ou sécurité`);
  }
  return errs;
}
```

- [ ] **Step 5: Vérifier que les tests passent**

Run: `cd docs/recette && npm test`
Expected: PASS, 12 tests.

- [ ] **Step 6: Commit**

```bash
git add .gitignore docs/recette/package.json docs/recette/package-lock.json docs/recette/lib/schema.mjs docs/recette/tests/schema.test.mjs
git add docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md docs/superpowers/plans/2026-09-26-cahier-de-recette.md
git commit -m "feat(recette): outillage et validation des cas du cahier de recette"
```

---

### Task 2: Validations croisées et chargement

**Files:**
- Create: `docs/recette/lib/load.mjs`, `docs/recette/validate.mjs`
- Test: `docs/recette/tests/validate.test.mjs`

**Interfaces:**
- Consumes: `validateProcess` de `lib/schema.mjs`.
- Produces:
  - `validate.mjs` exporte `EXPECTED_PROCESSES` (`['P01',…,'P14','E2E']`) et `validateAll({ processes, meta, srcText, expectAll }): string[]`.
  - `lib/load.mjs` exporte `loadSourceText(srcDir): string`, `loadData(dataDir, { only? }): Promise<{ meta, processes }>`.
  - `meta` a la forme `{ accounts: [{ role, login, usage }], … }`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `docs/recette/tests/validate.test.mjs` :

```js
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
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `cd docs/recette && node --test tests/validate.test.mjs`
Expected: FAIL avec `Cannot find module '../validate.mjs'`

- [ ] **Step 3: Implémenter `lib/load.mjs`**

```js
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
```

- [ ] **Step 4: Implémenter `validate.mjs`**

```js
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
```

- [ ] **Step 5: Vérifier que les tests passent**

Run: `cd docs/recette && npm test`
Expected: PASS (schema 12 tests + validate 6 tests).

- [ ] **Step 6: Commit**

```bash
git add docs/recette/lib/load.mjs docs/recette/validate.mjs docs/recette/tests/validate.test.mjs
git commit -m "feat(recette): validations croisées (libellés, rôles, processus) et chargement des données"
```

---

### Task 3: Métadonnées, comptes et données de test

**Files:**
- Create: `docs/recette/data/00-meta.mjs`

**Interfaces:**
- Consumes: liste `ROLES` de `lib/schema.mjs`.
- Produces: `meta = { title, environment, accounts, datasets, startDossiers }`. `accounts[].role` couvre les 8 rôles internes, exigé par le validateur.

- [ ] **Step 1: Écrire un test qui échoue**

Ajouter à `docs/recette/tests/validate.test.mjs` :

```js
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
```

Run: `cd docs/recette && node --test tests/validate.test.mjs`
Expected: FAIL (`00-meta.mjs` introuvable).

- [ ] **Step 2: Créer `docs/recette/data/00-meta.mjs`**

```js
export default {
  title: 'Cahier de recette — Plateforme de dénonciation ASCE-LC',
  environment: {
    url: 'https://denoncer.asce-lc.bf',
    front: 'Branche amandement_cge',
    back: 'Branche feature/workflow-denociation-asce-fix',
    commit: 'À renseigner (git rev-parse --short HEAD)',
    date: 'À renseigner',
    testeur: 'À renseigner'
  },
  accounts: [
    { role: 'ADMIN_DDIC', login: 'À renseigner', usage: 'Administration, accès à toutes les entrées de menu' },
    { role: 'CGE', login: 'À renseigner', usage: 'Décisions, recevabilité, administration' },
    { role: 'CGEA', login: 'À renseigner', usage: 'Affectations, registre des auditions, administration' },
    { role: 'CONTROLEUR_ETAT', login: 'À renseigner', usage: 'Investigations, auditions' },
    { role: 'TEAM_LEADER', login: 'À renseigner', usage: 'Chef d’équipe d’investigation' },
    { role: 'CONSEILLER_JURIDIQUE', login: 'À renseigner', usage: 'Avis juridiques, suites judiciaires' },
    { role: 'AGENT_CJ', login: 'À renseigner', usage: 'Agent du conseil juridique' },
    { role: 'AGENT_BRPD', login: 'À renseigner', usage: 'Informations préoccupantes' }
  ],
  datasets: [
    { name: 'document.pdf', usage: 'Pièce jointe valide, moins de 5 Mo' },
    { name: 'photo.jpg', usage: 'Image valide pour pièce jointe et photo du dépôt vocal' },
    { name: 'audio.webm ou audio.mp3', usage: 'Enregistrement audio de test' },
    { name: 'gros-fichier.pdf', usage: 'Fichier au-dessus de la limite autorisée (cas négatif)' },
    { name: 'script.html', usage: 'Fichier de type interdit (cas négatif)' }
  ],
  startDossiers: [
    { ref: 'D-A', statut: 'SOUMIS', usage: 'Dossier neuf pour le traitement (P07)' },
    { ref: 'D-B', statut: 'EN_INVESTIGATION', usage: 'Dossier pour l’investigation (P08)' },
    { ref: 'D-C', statut: 'DECISION_RENDUE', usage: 'Dossier pour la clôture (P09)' }
  ]
};
```

- [ ] **Step 3: Vérifier**

Run: `cd docs/recette && npm test`
Expected: PASS (19 tests).

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/00-meta.mjs docs/recette/tests/validate.test.mjs
git commit -m "feat(recette): environnement, comptes de test et jeux de données"
```

---

### Task 4: Générateur du document Word

**Files:**
- Create: `docs/recette/build.mjs`
- Test: `docs/recette/tests/build.test.mjs`

**Interfaces:**
- Consumes: la forme `meta` et `process` définies plus haut ; `loadData`, `loadSourceText`, `validateAll`.
- Produces: `build.mjs` exporte `buildDocument({ meta, processes }): Document` (objet `docx`). Le CLI écrit `docs/recette/out/Cahier-de-recette-ASCE-LC.docx` et refuse de générer si le validateur signale une erreur.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `docs/recette/tests/build.test.mjs` :

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { buildDocument } from '../build.mjs';

const meta = {
  title: 'Cahier de recette — Plateforme de dénonciation ASCE-LC',
  environment: { url: 'https://denoncer.asce-lc.bf', front: 'amandement_cge', back: 'fix', commit: 'x', date: 'x', testeur: 'x' },
  accounts: [{ role: 'CGE', login: 'x', usage: 'Décisions' }],
  datasets: [{ name: 'document.pdf', usage: 'Pièce jointe' }],
  startDossiers: [{ ref: 'D-A', statut: 'SOUMIS', usage: 'x' }]
};
const kase = (over = {}) => ({
  id: 'P02-01', title: 'Dépôt anonyme', priority: 'Critique', type: 'nominal', role: 'PUBLIC',
  preconditions: ['Navigation privée'], steps: ['Ouvrir la page', 'Cliquer sur « Continuer »'],
  data: ['Objet : Test'], expected: ['Le code d’accès est affiché'], ...over
});
const proc = (cases) => ({ id: 'P02', title: 'Dépôt de plainte public', access: 'Public', intro: 'Intro du processus', cases });

async function xmlOf(processes) {
  const buf = await Packer.toBuffer(buildDocument({ meta, processes }));
  const zip = await JSZip.loadAsync(buf);
  return zip.file('word/document.xml').async('string');
}

test('conserve accents, guillemets et cases à cocher', async () => {
  const xml = await xmlOf([proc([kase()])]);
  for (const t of ['Résultat attendu', 'Dépôt de plainte public', '«', '»', '☐', 'P02-01']) {
    assert.ok(xml.includes(t), `absent du document: ${t}`);
  }
});

test('page en paysage', async () => {
  const xml = await xmlOf([proc([kase()])]);
  assert.ok(xml.includes('w:orient="landscape"'));
});

test('annexe : liste les points à confirmer', async () => {
  const xml = await xmlOf([proc([kase({ id: 'P02-05', aConfirmer: 'Durée maximale calculée par l’API' })])]);
  assert.ok(xml.includes('Points à confirmer'));
  assert.ok(xml.includes('Durée maximale calculée par l’API'));
});

test('annexe : mentionne l\'absence de point à confirmer', async () => {
  const xml = await xmlOf([proc([kase()])]);
  assert.ok(xml.includes('Aucun point à confirmer'));
});

test('contient le registre des anomalies et le PV', async () => {
  const xml = await xmlOf([proc([kase()])]);
  assert.ok(xml.includes('Registre des anomalies'));
  assert.ok(xml.includes('PV de recette'));
  assert.ok(xml.includes('Validé avec réserves'));
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `cd docs/recette && node --test tests/build.test.mjs`
Expected: FAIL avec `Cannot find module '../build.mjs'`

- [ ] **Step 3: Implémenter `build.mjs`**

```js
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  AlignmentType, Document, Footer, HeadingLevel, PageBreak, PageNumber, PageOrientation,
  Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType
} from 'docx';
import { loadData, loadSourceText } from './lib/load.mjs';
import { validateAll } from './validate.mjs';

const TOTAL = 15438; // A4 paysage (16838) moins 2 x 700 de marge
const CASE_COLS = [850, 850, 1150, 1900, 3300, 1700, 2300, 700, 800, 800, 1000]; // = 15350
const FILL = { head: 'D9E2F3', Critique: 'F8CBAD', Majeur: 'FFE699', Mineur: 'E2EFDA' };
const TYPE_LABEL = { nominal: 'Nominal', negatif: 'Négatif', securite: 'Sécurité' };

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 40 },
  alignment: opts.align,
  children: [new TextRun({ text: String(text), bold: opts.bold, size: opts.size ?? 16, color: opts.color })]
});
const lines = (items, numbered = false) =>
  asList(items).length ? asList(items).map((t, i) => p(numbered ? `${i + 1}. ${t}` : `• ${t}`)) : [p('—')];

const cell = (children, width, fill) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  margins: { top: 50, bottom: 50, left: 80, right: 80 },
  shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
  children
});
const row = (cells, header = false) => new TableRow({ tableHeader: header, cantSplit: true, children: cells });
const table = (cols, rows) => new Table({
  width: { size: cols.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: cols,
  rows
});
const headRow = (cols, labels) =>
  row(labels.map((l, i) => cell([p(l, { bold: true })], cols[i], FILL.head)), true);

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 }, children: [new TextRun({ text, size: 30, bold: true })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 }, children: [new TextRun({ text, size: 24, bold: true })] });
const body = (text) => p(text, { size: 20 });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function caseRow(c) {
  const c0 = CASE_COLS;
  const cellsText = [
    [p(c.id, { bold: true }), p(TYPE_LABEL[c.type])],
    [p(c.priority, { bold: true })],
    [p(c.role)],
    [...lines(c.preconditions)],
    [p(c.title, { bold: true }), ...lines(c.steps, true)],
    [...lines(c.data)],
    [...lines(c.expected), ...(c.aConfirmer ? [p('À confirmer : ' + c.aConfirmer, { bold: true, color: 'C00000' })] : [])],
    [p('☐ OK'), p('☐ KO'), p('☐ Bloqué'), p('☐ Non testé')],
    [p('')], [p('')], [p('')]
  ];
  return row(cellsText.map((kids, i) => cell(kids, c0[i], i === 1 ? FILL[c.priority] : undefined)));
}

function processSection(proc) {
  const labels = ['ID / Type', 'Priorité', 'Rôle', 'Préconditions', 'Étapes', 'Données saisies',
    'Résultat attendu', 'Statut', 'Date', 'Testeur', 'Observation'];
  return [
    h1(`${proc.id} — ${proc.title}`),
    body(`Accès : ${proc.access}`),
    body(proc.intro),
    table(CASE_COLS, [headRow(CASE_COLS, labels), ...proc.cases.map(caseRow)]),
    pageBreak()
  ];
}

function coverSection(meta) {
  const e = meta.environment;
  const cols = [3000, 12000];
  const kv = (k, v) => row([cell([p(k, { bold: true, size: 20 })], cols[0], FILL.head), cell([p(v, { size: 20 })], cols[1])]);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 300 }, children: [new TextRun({ text: meta.title, bold: true, size: 44 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Recette utilisateur avant mise en production', size: 26 })] }),
    table(cols, [kv('URL testée', e.url), kv('Front', e.front), kv('Back', e.back), kv('Version (commit)', e.commit), kv('Date de la recette', e.date), kv('Testeur', e.testeur)]),
    pageBreak()
  ];
}

function modeEmploi() {
  return [
    h1('Mode d’emploi'),
    body('Pour chaque cas, suivre les étapes dans l’ordre avec le rôle indiqué, comparer au résultat attendu, puis cocher un statut.'),
    h2('Statuts d’un cas'),
    ...['OK : le résultat observé correspond au résultat attendu.',
      'KO : le résultat observé diffère. Consigner l’anomalie dans le registre.',
      'Bloqué : le cas ne peut pas être exécuté (compte, donnée ou dépendance manquante). Préciser la raison.',
      'Non testé : cas pas encore déroulé.'].map((t) => body('• ' + t)),
    h2('Gravité d’une anomalie'),
    ...['Critique : bloque un processus ou expose des données. Mise en production refusée.',
      'Majeur : fonctionnalité dégradée avec contournement.',
      'Mineur : défaut d’affichage ou de confort.'].map((t) => body('• ' + t)),
    h2('Types de cas'),
    body('Nominal : le parcours qui doit fonctionner. Négatif : saisie invalide ou action interdite. Sécurité : accès non autorisé, refus attendu.'),
    body('Un résultat marqué « À confirmer » dépend d’une règle métier non visible côté écran : à valider avec le responsable métier.'),
    pageBreak()
  ];
}

function comptesSection(meta) {
  const cols = [3000, 3500, 8850];
  return [
    h1('Comptes et données de test'),
    h2('Comptes Keycloak à créer sur la VM'),
    table(cols, [headRow(cols, ['Rôle', 'Identifiant', 'Usage']),
      ...meta.accounts.map((a) => row([cell([p(a.role, { size: 18 })], cols[0]), cell([p(a.login, { size: 18 })], cols[1]), cell([p(a.usage, { size: 18 })], cols[2])]))]),
    h2('Jeux de pièces jointes'),
    table([5000, 10350], [headRow([5000, 10350], ['Fichier', 'Usage']),
      ...meta.datasets.map((d) => row([cell([p(d.name, { size: 18 })], 5000), cell([p(d.usage, { size: 18 })], 10350)]))]),
    h2('Dossiers de départ'),
    table([2000, 3500, 9850], [headRow([2000, 3500, 9850], ['Référence', 'Statut', 'Usage']),
      ...meta.startDossiers.map((d) => row([cell([p(d.ref, { size: 18 })], 2000), cell([p(d.statut, { size: 18 })], 3500), cell([p(d.usage, { size: 18 })], 9850)]))]),
    pageBreak()
  ];
}

function annexeAConfirmer(processes) {
  const items = processes.flatMap((pr) => pr.cases.filter((c) => c.aConfirmer).map((c) => ({ id: c.id, text: c.aConfirmer })));
  if (!items.length) return [h1('Points à confirmer'), body('Aucun point à confirmer.'), pageBreak()];
  const cols = [1500, 13850];
  return [
    h1('Points à confirmer'),
    body('Règles métier non lisibles côté écran, à valider avec le responsable métier avant de conclure sur les cas concernés.'),
    table(cols, [headRow(cols, ['Cas', 'Règle à confirmer']),
      ...items.map((i) => row([cell([p(i.id, { size: 18, bold: true })], cols[0]), cell([p(i.text, { size: 18 })], cols[1])]))]),
    pageBreak()
  ];
}

function anomalies() {
  const labels = ['N°', 'Cas', 'Description de l’anomalie', 'Gravité', 'Date', 'Responsable', 'Correction'];
  const cols = [700, 1300, 6500, 1300, 1300, 2200, 2138];
  const empty = Array.from({ length: 12 }, () => row(cols.map((w) => cell([p('')], w))));
  return [h1('Registre des anomalies'), table(cols, [headRow(cols, labels), ...empty]), pageBreak()];
}

function pv() {
  const cols = [5000, 10350];
  return [
    h1('PV de recette'),
    body('Décision (cocher une case) :'),
    body('☐ Validé     ☐ Validé avec réserves     ☐ Refusé'),
    body('Réserves ou motifs :'),
    table(cols, [
      row([cell([p('', { size: 40 })], cols[0]), cell([p('')], cols[1])]),
      row([cell([p('Testeur (nom, date, signature)', { size: 18 })], cols[0], FILL.head), cell([p('')], cols[1])]),
      row([cell([p('Responsable métier (nom, date, signature)', { size: 18 })], cols[0], FILL.head), cell([p('')], cols[1])]),
      row([cell([p('Responsable technique (nom, date, signature)', { size: 18 })], cols[0], FILL.head), cell([p('')], cols[1])])
    ])
  ];
}

export function buildDocument({ meta, processes }) {
  return new Document({
    creator: 'ASCE-LC',
    title: meta.title,
    styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 700, right: 700, bottom: 700, left: 700 }
        }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ size: 16, children: ['Cahier de recette ASCE-LC — page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES] })]
          })]
        })
      },
      children: [
        ...coverSection(meta), ...modeEmploi(), ...comptesSection(meta),
        ...processes.flatMap(processSection),
        ...annexeAConfirmer(processes), ...anomalies(), ...pv()
      ]
    }]
  });
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const { meta, processes } = await loadData(resolve(here, 'data'));
  const errs = validateAll({ processes, meta, srcText: loadSourceText(resolve(here, '../../src')), expectAll: true });
  if (errs.length) {
    console.error(errs.join('\n'));
    console.error(`\n${errs.length} erreur(s) : génération refusée`);
    process.exit(1);
  }
  const outDir = resolve(here, 'out');
  mkdirSync(outDir, { recursive: true });
  const file = resolve(outDir, 'Cahier-de-recette-ASCE-LC.docx');
  writeFileSync(file, await Packer.toBuffer(buildDocument({ meta, processes })));
  console.log(`Généré : ${file} (${processes.reduce((n, x) => n + x.cases.length, 0)} cas)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `cd docs/recette && npm test`
Expected: PASS (24 tests). Si `w:orient="landscape"` est absent, vérifier que `orientation: PageOrientation.LANDSCAPE` est bien dans `page.size` et que largeur/hauteur restent en valeurs portrait (11906 / 16838) : `docx` les permute lui-même.

- [ ] **Step 5: Commit**

```bash
git add docs/recette/build.mjs docs/recette/tests/build.test.mjs
git commit -m "feat(recette): générateur du cahier de recette au format Word"
```

---

### Task 5: Processus publics P01 à P04

**Files:**
- Create: `docs/recette/data/p01-accueil.mjs`, `p02-depot-plainte.mjs`, `p03-depot-vocal.mjs`, `p04-suivi.mjs`

**Interfaces:**
- Consumes: Case authoring guide (schéma), comptes de `00-meta.mjs`.
- Produces: 4 fichiers `export default { id, title, access, intro, cases }`.

**Sources à lire avant d'écrire** : `src/app/pages/portail/accueil/portail-accueil.ts`, `portail/depot-plainte/depot-plainte.ts`, `portail/vocal/portail-vocal.ts`, `portail/suivi/portail-suivi.ts`, `src/app/pages/notfound/notfound.ts`. Commits de contexte : `git show ab4d542 --stat`, `git show af6bf51`.

**Cas à écrire** (Prio : C=Critique, M=Majeur, m=Mineur ; ★ = `regression: true` ; ? = `aConfirmer`). Rôle : `PUBLIC` partout.

P01 — *Accueil du portail* (8)

| ID | Prio | Type | Point de contrôle |
|---|---|---|---|
| P01-01 | C★ | nominal | La page `/` se charge sans erreur en console |
| P01-02 | C★ | nominal | Les cercles « FAIRE UN SIGNALEMENT » et « SUIVRE MON DOSSIER » affichent leur icône (mégaphone, loupe) |
| P01-03 | C★ | nominal | Police PrimeIcons chargée : onglet Réseau, `primeicons.woff2` en 200 avec type `font/woff2` |
| P01-04 | M | nominal | Icônes du footer (Facebook, Twitter…) et flèches des liens rapides visibles |
| P01-05 | M | nominal | Le bouton « Faire un signalement » ouvre le choix de dépôt |
| P01-06 | M | nominal | « Suivre mon dossier » mène à `/portail/suivi` |
| P01-07 | m | negatif | Une URL inexistante redirige vers `/notfound` |
| P01-08 | m | nominal | E-mail, site web, adresse du footer reflètent les paramètres du portail (`?`) |

P02 — *Dépôt de plainte public* (14)

| ID | Prio | Type | Point de contrôle |
|---|---|---|---|
| P02-01 | C★ | nominal | Dépôt nominatif complet (citoyen) : écran de succès avec code d'accès |
| P02-02 | C★ | nominal | Dépôt anonyme : `anonymous: true` à la racine, aucune donnée d'identité (exemple complet dans le guide) |
| P02-03 | C | nominal | Dépôt entreprise ou association (raison sociale) |
| P02-04 | M | nominal | Dépôt avec pièces jointes (PDF, image) |
| P02-05 | M | nominal | Dépôt avec enregistrement audio intégré |
| P02-06 | M | nominal | Depuis l'écran de succès, « Suivre mon dossier » ouvre le suivi |
| P02-07 | M | negatif | Champs obligatoires vides : « Continuer » bloqué, messages visibles |
| P02-08 | M | negatif | E-mail invalide refusé |
| P02-09 | M | negatif | Téléphone invalide refusé |
| P02-10 | M | negatif | Fichier trop gros ou type interdit refusé avec message |
| P02-11 | m | negatif | Retour arrière conserve les données saisies |
| P02-12 | M | negatif | API indisponible : message d'erreur, pas de blocage silencieux |
| P02-13 | C | securite | Double clic sur la validation : un seul dossier créé |
| P02-14 | M | securite | Un contenu `<script>` dans la description n'est pas exécuté ni affiché brut à l'agent |

P03 — *Dépôt vocal* (9)

| ID | Prio | Type | Point de contrôle |
|---|---|---|---|
| P03-01 | C | nominal | Parcours complet : « COMMENCER À PARLER », « ARRÊTER », « Continuer », dépôt, code d'accès |
| P03-02 | M | nominal | « Recommencer » efface l'audio et relance |
| P03-03 | M | nominal | Ajout de photo (caméra ou galerie), suppression par « × » |
| P03-04 | M | nominal | Coordonnées facultatives : « Passer » |
| P03-05 | M | nominal | Confirmation « Je confirme sur l'honneur » puis dépôt final |
| P03-06 | M | negatif | Micro refusé par le navigateur : message clair |
| P03-07 | M | negatif | Envoi sans audio impossible |
| P03-08 | m | negatif | Durée maximale d'enregistrement (`?`) |
| P03-09 | M | securite | Un fichier non image ajouté comme photo est refusé |

P04 — *Suivi de dossier* (9)

| ID | Prio | Type | Point de contrôle |
|---|---|---|---|
| P04-01 | C | nominal | Code valide : statut et historique affichés |
| P04-02 | M | nominal | Téléchargement du récépissé PDF |
| P04-03 | M | nominal | Code saisi en minuscules accepté |
| P04-04 | M | nominal | Dossier en attente de complément : demande visible (`?`) |
| P04-05 | M | negatif | Code inexistant : message d'erreur |
| P04-06 | m | negatif | Code vide : recherche bloquée |
| P04-07 | M | securite | Un dossier confidentiel n'expose aucune donnée sensible au portail (`?`) |
| P04-08 | M | securite | Essais répétés de codes : limitation ou alerte (`?`) |
| P04-09 | m | nominal | « Nouvelle recherche » réinitialise le formulaire |

- [ ] **Step 1: Lire les sources listées** et relever les libellés exacts (boutons, messages, étapes).

- [ ] **Step 2: Écrire les 4 fichiers** avec tous les cas du tableau, selon le Case authoring guide. P02-02 : reprendre l'exemple du guide en ajustant `ui` aux libellés réels.

- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P01,P02,P03,P04`
Expected: `OK — 4 processus, 40 cas`. Toute erreur `libellé introuvable` se corrige en recopiant le libellé exact du code.

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p01-accueil.mjs docs/recette/data/p02-depot-plainte.mjs docs/recette/data/p03-depot-vocal.mjs docs/recette/data/p04-suivi.mjs
git commit -m "docs(recette): cas de recette des processus publics P01 à P04"
```

---

### Task 6: Accès et transverse P05 et P14

**Files:**
- Create: `docs/recette/data/p05-authentification.mjs`, `docs/recette/data/p14-transverse.mjs`

**Interfaces:** identiques à la Task 5.

**Sources à lire** : `src/app/core/guards/auth.guard.ts`, `src/app/core/auth/keycloak.service.ts`, `src/app/core/interceptors/auth.interceptor.ts`, `error.interceptor.ts`, `src/app.routes.ts`, `src/app/pages/auth/*.ts`, `src/app/pages/notfound/notfound.ts`, le menu dans `src/app/layout/component/`, `src/index.html` (CSP). Contexte : `git show 1d2baa9`.

P05 — *Authentification et contrôle d'accès* (10)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P05-01 | C | nominal | ADMIN_DDIC | Connexion Keycloak : arrivée sur le tableau de bord `/app` |
| P05-02 | M | nominal | ADMIN_DDIC | Déconnexion : retour à l'accueil, session fermée |
| P05-03 | C | securite | PUBLIC | `/app` sans session redirige vers la connexion |
| P05-04 | C | securite | AGENT_BRPD | `/app/administration` refusé (garde `ADMIN_DDIC`, `CGE`, `CGEA`) |
| P05-05 | C | securite | CGE | `/app/informations-preoccupantes` refusé (garde `AGENT_BRPD`, `ADMIN_DDIC`) |
| P05-06 | M | securite | CONTROLEUR_ETAT | `/app/registre-auditions` refusé (garde `CGEA`, `ADMIN_DDIC`) |
| P05-07 | M | securite | CONTROLEUR_ETAT | `/app/statistiques/depassements-par-acteur` refusé |
| P05-08 | M | negatif | ADMIN_DDIC | Mot de passe erroné : message, pas de connexion |
| P05-09 | M | negatif | ADMIN_DDIC | Session expirée en cours d'usage : reconnexion sans perte de saisie (`?`) |
| P05-10 | M | nominal | AGENT_BRPD | Le menu latéral n'affiche que les entrées autorisées pour le rôle |

P14 — *Transverse* (7)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P14-01 | M | nominal | PUBLIC | Page 404 lisible avec lien de retour |
| P14-02 | M | negatif | ADMIN_DDIC | Erreur 500 de l'API : message clair, pas d'écran blanc |
| P14-03 | M | negatif | ADMIN_DDIC | API injoignable (réseau coupé) : message d'erreur |
| P14-04 | M | negatif | ADMIN_DDIC | Erreur 401 (jeton expiré) : reconnexion proposée |
| P14-05 | M | securite | AGENT_BRPD | Erreur 403 : page « accès refusé » |
| P14-06 | C★ | nominal | PUBLIC | Aucune violation CSP en console sur `/`, `/portail/deposer`, `/app` ; appels `/api/` et `/auth/` en 200 |
| P14-07 | m | nominal | PUBLIC | Affichage mobile de l'accueil et du dépôt (largeur 375 px) |

- [ ] **Step 1: Lire les sources listées**, en particulier les gardes de `src/app.routes.ts` pour confirmer les rôles de P05-04 à P05-07.
- [ ] **Step 2: Écrire les 2 fichiers** selon le Case authoring guide.
- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P05,P14`
Expected: `OK — 2 processus, 17 cas`

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p05-authentification.mjs docs/recette/data/p14-transverse.mjs
git commit -m "docs(recette): cas de recette d'accès et transverse P05 et P14"
```

---

### Task 7: Création interne d'un dossier P06

**Files:**
- Create: `docs/recette/data/p06-creation-dossier.mjs`

**Sources à lire** : `src/app/pages/dossiers/dossier-form/`, `dossier-audio/`, `dossiers-list/`, `src/app/pages/dashboard/dashboard.ts`, le menu `src/app/layout/component/`, `src/app/core/services/dossier.service.ts`. Contexte : `git show 56a7d46 --stat` **liste les 4 points d'entrée** de création cassés par `NatureSaisineResolver` ; P06-03 couvre chacun d'eux.

P06 — *Création interne d'un dossier* (11)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P06-01 | C★ | nominal | ADMIN_DDIC | Création par formulaire `/app/dossiers/nouveau` |
| P06-02 | C★ | nominal | ADMIN_DDIC | Création par saisie audio `/app/dossiers/audio` |
| P06-03 | C★ | nominal | ADMIN_DDIC | Création depuis **chacun** des points d'entrée listés par le commit `56a7d46` (un cas par point d'entrée dans les étapes) |
| P06-04 | M | nominal | ADMIN_DDIC | Types de saisine : `COMPLAINT`, `DENUNCIATION`, `AUTO_REFERRAL`, `ANONYMOUS` |
| P06-05 | M | nominal | ADMIN_DDIC | Modes de réception (en personne, courrier, e-mail, téléphone, etc.) |
| P06-06 | M | nominal | ADMIN_DDIC | Dossier confidentiel : visible seulement des rôles autorisés (`canSeeConfidential`) |
| P06-07 | M | negatif | ADMIN_DDIC | Champs obligatoires vides : validation bloquante |
| P06-08 | M | negatif | ADMIN_DDIC | Nature de saisine non résolue ou absente : message clair, pas de blocage silencieux |
| P06-09 | m | nominal | ADMIN_DDIC | Numéro de dossier et code d'accès générés, affichés au détail |
| P06-10 | M | securite | CONTROLEUR_ETAT | Création par un rôle sans droit : bouton absent ou refus API (`?`) |
| P06-11 | m | nominal | ADMIN_DDIC | Liste des dossiers : recherche, filtres, pagination |

- [ ] **Step 1: Lire les sources**, exécuter `git show 56a7d46 --stat` et noter les 4 points d'entrée.
- [ ] **Step 2: Écrire le fichier** selon le Case authoring guide.
- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P06`
Expected: `OK — 1 processus, 11 cas`

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p06-creation-dossier.mjs
git commit -m "docs(recette): cas de recette de création de dossier P06"
```

---

### Task 8: Traitement du dossier P07

**Files:**
- Create: `docs/recette/data/p07-traitement.mjs`

**Sources à lire** : `src/app/pages/dossiers/dossier-detail/dossier-detail.ts` et `.html` (méthodes de transition, `canEditDossier`, dialogue de raison), `src/app/pages/seances-ctadp/**`, `src/app/core/models/dossier.model.ts`, `seance-ctadp.model.ts`, `fiche-affectation.model.ts`, `etude-opportunite.model.ts`, et services associés (`dossier.service.ts`, `etude-opportunite.service.ts`, `seance-ctadp.service.ts`, `fiche-affectation.service.ts`, `targeted-party.service.ts`, `witness.service.ts`, `observation.service.ts`, `attachment.service.ts`). Le cycle `SOUMIS → RECU → EN_ETUDE_OPPORTUNITE → …` vient du type `DossierStatus`. Rôles : les confirmer dans le code (`canEditDossier`, `hasRole`).

P07 — *Traitement du dossier* (15)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P07-01 | C | nominal | CGE | `SOUMIS` → `RECU` : accusé de réception (`?` délai) |
| P07-02 | C | nominal | CGE | Passage en étude d'opportunité et renseignement de l'étude |
| P07-03 | M | nominal | CGE | Demande de complément → `EN_ATTENTE_COMPLEMENT` avec échéance |
| P07-04 | M | nominal | CGE | Réception du complément : retour en étude |
| P07-05 | C | nominal | CGE | Envoi en revue → `EN_REVUE_CTADP` |
| P07-06 | C | nominal | CGE | Déclarer recevable → `RECEVABLE` |
| P07-07 | C | nominal | CGE | Déclarer irrecevable avec motif → `IRRECEVABLE` |
| P07-08 | M | nominal | CGE | Transférer le dossier → `TRANSFERE` avec note de transfert |
| P07-09 | M | nominal | CGE | Séance CTADP : planifier, tenir, annuler |
| P07-10 | M | nominal | CGE | Parties visées, témoins, observations, pièces jointes : ajout, modification, suppression |
| P07-11 | M | nominal | CGEA | Fiche d'affectation : affectation directe CGEA et échange préalable |
| P07-12 | M | negatif | CGE | Transition non autorisée : action absente ou refus API |
| P07-13 | M | negatif | CGE | Conflit de version 409 : deux utilisateurs modifient le même dossier |
| P07-14 | M | negatif | CGE | Transition sans motif : dialogue de raison vide refusé |
| P07-15 | M | securite | CONTROLEUR_ETAT | Rôle sans droit d'édition : aucune action de transition visible (`canEditDossier`) |

- [ ] **Step 1: Lire les sources** et confirmer pour chaque transition le bouton exact, le statut résultant et le rôle autorisé.
- [ ] **Step 2: Écrire le fichier** selon le Case authoring guide.
- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P07`
Expected: `OK — 1 processus, 15 cas`

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p07-traitement.mjs
git commit -m "docs(recette): cas de recette du traitement de dossier P07"
```

---

### Task 9: Investigation P08

**Files:**
- Create: `docs/recette/data/p08-investigation.mjs`

**Sources à lire** : `src/app/pages/investigations/investigations-list/`, `investigation-detail/investigation-detail.ts` (4 877 lignes : chercher par mots-clés `cadrage`, `visite`, `audition`, `rapport`, `prolong`, `validation`, `rejet`), services `investigation.service.ts`, `investigation-cadrage.service.ts`, `visite-terrain.service.ts`, `demande-documents.service.ts`, `inventaire-pieces.service.ts`, `audition.service.ts`, `checklist-dossier-travail.service.ts`, `section-dossier-travail.service.ts`, `rapport-enquete.service.ts`. Contexte : `git show d6aabb0` (blocage silencieux de la soumission du rapport final).

P08 — *Investigation* (15)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P08-01 | C | nominal | CGEA | Création et affectation d'une investigation depuis un dossier `RECEVABLE` → `EN_INVESTIGATION` |
| P08-02 | M | nominal | TEAM_LEADER | Constitution de l'équipe : chef d'équipe et membres |
| P08-03 | M | nominal | TEAM_LEADER | Cadrage de l'investigation |
| P08-04 | M | nominal | CONTROLEUR_ETAT | Visite de terrain : planification et compte rendu |
| P08-05 | M | nominal | CONTROLEUR_ETAT | Demande de documents |
| P08-06 | M | nominal | CONTROLEUR_ETAT | Inventaire des pièces |
| P08-07 | M | nominal | CONTROLEUR_ETAT | Auditions de témoins et de parties |
| P08-08 | M | nominal | CONTROLEUR_ETAT | Dossier de travail : sections et checklist |
| P08-09 | C★ | nominal | TEAM_LEADER | Soumission du rapport final réussie → `RAPPORT_PRODUIT` |
| P08-10 | C★ | negatif | TEAM_LEADER | Rapport final incomplet : message d'erreur explicite, jamais de blocage silencieux |
| P08-11 | M | nominal | CGEA | Prolongation de délai (`extendedDeadline`) |
| P08-12 | M | nominal | CGE | Validation du rapport |
| P08-13 | M | negatif | CGE | Rejet du rapport avec motif obligatoire |
| P08-14 | M | nominal | CGEA | Alerte de dépassement : jours restants, indicateur `overdue` |
| P08-15 | M | securite | CONTROLEUR_ETAT | Un agent non membre de l'équipe ne peut pas modifier l'investigation (`?`) |

- [ ] **Step 1: Lire les sources**, exécuter `git show d6aabb0` pour comprendre les conditions d'échec de P08-10.
- [ ] **Step 2: Écrire le fichier** selon le Case authoring guide.
- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P08`
Expected: `OK — 1 processus, 15 cas`

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p08-investigation.mjs
git commit -m "docs(recette): cas de recette d'investigation P08"
```

---

### Task 10: Décision, clôture et scénario de bout en bout P09 + E2E

**Files:**
- Create: `docs/recette/data/p09-decision-cloture.mjs`, `docs/recette/data/e2e.mjs`

**Sources à lire** : `dossier-detail.ts` (décision, clôture, classement), `src/app/core/services/suites-judiciaires.service.ts`, `suivi-sanctions.service.ts`, `transmission-autorite.service.ts`, `fiche-retex.service.ts`, `pdf.service.ts`, modèles `suites-judiciaires.model.ts`, `suivi-sanctions.model.ts`, `transmission-autorite.model.ts`.

P09 — *Décision et clôture* (8)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P09-01 | C | nominal | CGE | Rapport produit → dossier `RAPPORT_PRODUIT` |
| P09-02 | C | nominal | CGE | Décision rendue → `DECISION_RENDUE` |
| P09-03 | M | nominal | CONSEILLER_JURIDIQUE | Suites judiciaires : saisine du procureur |
| P09-04 | M | nominal | CGE | Suivi des sanctions administratives |
| P09-05 | M | nominal | CGE | Transmission à l'autorité ou institution partenaire |
| P09-06 | C | nominal | CGE | Clôture → `CLOS` |
| P09-07 | M | nominal | CGE | Classement → `CLASSE` (classé sans suite) |
| P09-08 | M | nominal | CGE | PDF de résumé de clôture et réponse motivée (`?` back `-fix`) |

E2E — *Scénario de bout en bout* (2). Les étapes d'`E2E-01` enchaînent au moins 12 actions et citent les statuts successifs.

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| E2E-01 | C | nominal | PUBLIC | Cycle complet : dépôt public nominatif, réception, étude, CTADP, recevabilité, investigation, rapport, décision, `CLOS`, puis suivi par le code d'accès (chaque étape précise le rôle qui agit dans le texte) |
| E2E-02 | C | nominal | PUBLIC | Cycle anonyme : dépôt anonyme, traitement jusqu'à la décision, suivi anonyme sans fuite d'identité |

- [ ] **Step 1: Lire les sources.**
- [ ] **Step 2: Écrire les 2 fichiers** selon le Case authoring guide. Pour E2E, le champ `role` du cas est `PUBLIC` (point de départ) ; les rôles suivants sont nommés dans les étapes, donc tous doivent avoir un compte dans `meta.accounts`.
- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P09,E2E`
Expected: `OK — 2 processus, 10 cas`

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p09-decision-cloture.mjs docs/recette/data/e2e.mjs
git commit -m "docs(recette): cas de décision, clôture et scénario de bout en bout"
```

---

### Task 11: Informations préoccupantes et rapports P10 + P11

**Files:**
- Create: `docs/recette/data/p10-informations-preoccupantes.mjs`, `docs/recette/data/p11-rapports-statistiques.mjs`

**Sources à lire** : `src/app/pages/informations-preoccupantes/**`, `information-preoccupante.service.ts`, `information-preoccupante.model.ts` (statuts `NOUVELLE`, `RATTACHEE`, `AUTO_SAISINE_DECLENCHEE`, `CLASSEE_SANS_SUITE`), `src/app/pages/rapports/**`, `src/app/pages/statistiques/**`, `src/app/pages/lecons-a-partager/lecons-a-partager-list.ts`, `src/app/pages/registre-auditions/**`, `src/app/core/utils/xlsx-safe.ts`, `statistique.service.ts`, `fiche-retex.service.ts`, `registre-auditions.service.ts`.

P10 — *Informations préoccupantes* (8) — accès `AGENT_BRPD`, `ADMIN_DDIC`

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P10-01 | C | nominal | AGENT_BRPD | Création : objet, description, source, date de réception |
| P10-02 | M | nominal | AGENT_BRPD | Rattachement à un dossier existant → `RATTACHEE` |
| P10-03 | M | nominal | AGENT_BRPD | Déclenchement d'une auto-saisine → `AUTO_SAISINE_DECLENCHEE` et dossier créé |
| P10-04 | M | nominal | AGENT_BRPD | Classement sans suite → `CLASSEE_SANS_SUITE` |
| P10-05 | M | negatif | AGENT_BRPD | Champs obligatoires vides refusés |
| P10-06 | M | negatif | AGENT_BRPD | Rattachement à un dossier inexistant ou déjà rattaché refusé |
| P10-07 | m | nominal | AGENT_BRPD | Filtres par statut et par source |
| P10-08 | M | nominal | ADMIN_DDIC | La création et le rattachement apparaissent dans le journal d'audit |

P11 — *Rapports, statistiques, leçons, registre* (9)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P11-01 | M | nominal | CGE | Rapport d'état `/app/rapports` : filtres et export |
| P11-02 | M | nominal | CGE | Rapport des investigations `/app/rapports/investigations` |
| P11-03 | M | nominal | CGE | Tableau de bord statistiques |
| P11-04 | M | nominal | CGEA | Dépassements par acteur (accès `ADMIN_DDIC`, `CGE`, `CGEA`) |
| P11-05 | M | nominal | CGE | Leçons à partager : consultation des fiches RETEX |
| P11-06 | M | nominal | CGEA | Registre des auditions : consultation et export (accès `CGEA`, `ADMIN_DDIC`) |
| P11-07 | M | securite | CGE | Export Excel : une cellule commençant par `=`, `+`, `-` ou `@` n'est pas interprétée comme formule |
| P11-08 | M | negatif | CGE | Période sans donnée : état vide propre, pas d'erreur |
| P11-09 | M | securite | CONTROLEUR_ETAT | Périmètre des statistiques visibles selon le rôle (`?`) |

- [ ] **Step 1: Lire les sources.**
- [ ] **Step 2: Écrire les 2 fichiers** selon le Case authoring guide.
- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P10,P11`
Expected: `OK — 2 processus, 17 cas`

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p10-informations-preoccupantes.mjs docs/recette/data/p11-rapports-statistiques.mjs
git commit -m "docs(recette): cas de recette des informations préoccupantes et rapports P10 et P11"
```

---

### Task 12: Administration, notifications et profil P12 + P13

**Files:**
- Create: `docs/recette/data/p12-administration.mjs`, `docs/recette/data/p13-notifications-profil.mjs`

**Sources à lire** : `src/app/pages/administration/**` (agents, agent-form, roles, audit, portal-settings, parametres-metier, notifications-queue), `agent.service.ts`, `role-management.service.ts`, `audit.service.ts`, `portal-config.service.ts`, `parametres-metier.service.ts`, `notification.service.ts`, `src/app/pages/notifications/notifications.component.ts`, `src/app/pages/profil/profil.ts`, `profile.service.ts`, `role.model.ts` (champ `isProtected`). Contexte : PR n°1 (libellés de notifications d'escalade et J-3), `git log --oneline --grep=notification -n 10`.

P12 — *Administration* (12) — accès `ADMIN_DDIC`, `CGE`, `CGEA`

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P12-01 | C | nominal | ADMIN_DDIC | Création d'un agent |
| P12-02 | M | nominal | ADMIN_DDIC | Modification et désactivation d'un agent |
| P12-03 | M | nominal | ADMIN_DDIC | Gestion des rôles et des permissions |
| P12-04 | M | nominal | ADMIN_DDIC | Création d'un rôle personnalisé |
| P12-05 | M | nominal | ADMIN_DDIC | Un rôle protégé (`isProtected`) ne peut pas être supprimé |
| P12-06 | M | nominal | ADMIN_DDIC | Paramètres du portail : contacts et réseaux sociaux repris sur l'accueil |
| P12-07 | M | nominal | ADMIN_DDIC | Paramètres métier (délais) |
| P12-08 | M | nominal | ADMIN_DDIC | Journal d'audit : consultation et filtres |
| P12-09 | M | nominal | ADMIN_DDIC | File des notifications : relance d'un envoi en échec |
| P12-10 | M | negatif | ADMIN_DDIC | Agent en doublon (e-mail ou matricule) refusé |
| P12-11 | M | negatif | ADMIN_DDIC | Champs obligatoires de l'agent vides refusés |
| P12-12 | C | securite | CONTROLEUR_ETAT | Un agent non administrateur ne peut pas modifier les rôles par URL directe `/app/administration/roles` |

P13 — *Notifications et profil* (6)

| ID | Prio | Type | Rôle | Point de contrôle |
|---|---|---|---|---|
| P13-01 | M | nominal | CGE | Notification reçue lors d'un changement de statut, compteur mis à jour |
| P13-02 | M | nominal | CGE | Marquer une notification lue, puis toutes |
| P13-03 | M | nominal | CGE | Notifications d'escalade et de rappel J-3 : libellés corrects |
| P13-04 | M | nominal | CGE | Profil : consultation des informations |
| P13-05 | M | nominal | CGE | Profil : modification des informations et du mot de passe (`?` via Keycloak) |
| P13-06 | M | negatif | CGE | Profil : e-mail invalide refusé |

- [ ] **Step 1: Lire les sources.**
- [ ] **Step 2: Écrire les 2 fichiers** selon le Case authoring guide.
- [ ] **Step 3: Contrôler**

Run: `cd docs/recette && node validate.mjs --only P12,P13`
Expected: `OK — 2 processus, 18 cas`

- [ ] **Step 4: Commit**

```bash
git add docs/recette/data/p12-administration.mjs docs/recette/data/p13-notifications-profil.mjs
git commit -m "docs(recette): cas d'administration, notifications et profil P12 et P13"
```

---

### Task 13: Assemblage, vérification finale et livraison

**Files:**
- Modify: `docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md` (§6, volume)
- Output (ignoré par git) : `docs/recette/out/Cahier-de-recette-ASCE-LC.docx`

- [ ] **Step 1: Validation complète**

Run: `cd docs/recette && npm run validate`
Expected: `OK — 15 processus, 143 cas`. Si le total diffère, un fichier a perdu ou gagné un cas par rapport aux tableaux : corriger le fichier concerné.

- [ ] **Step 2: Tous les tests**

Run: `cd docs/recette && npm test`
Expected: PASS (24 tests).

- [ ] **Step 3: Générer le document**

Run: `cd docs/recette && npm run build`
Expected: `Généré : …/docs/recette/out/Cahier-de-recette-ASCE-LC.docx (143 cas)`

- [ ] **Step 4: Contrôler le contenu du .docx**

Run:
```bash
cd docs/recette && node -e "
import('jszip').then(async ({default: JSZip}) => {
  const fs = await import('node:fs');
  const zip = await JSZip.loadAsync(fs.readFileSync('out/Cahier-de-recette-ASCE-LC.docx'));
  const xml = await zip.file('word/document.xml').async('string');
  const ids = new Set(xml.match(/(P\d{2}|E2E)-\d{2}/g));
  console.log('ids distincts:', ids.size, '| taille xml:', xml.length);
  for (const t of ['Registre des anomalies','PV de recette','Points à confirmer','w:orient=\"landscape\"']) console.log(t, xml.includes(t));
});"
```
Expected: `ids distincts: 143`, et `true` pour les 4 contrôles. Pas de conversion PDF automatique disponible : demander à l'utilisateur d'ouvrir le fichier dans Word et de vérifier la lisibilité du tableau (paysage, 11 colonnes).

- [ ] **Step 5: Mettre à jour le volume dans le spec**

Dans `docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md`, section 6, remplacer « Environ 100 à 130 cas » par « Environ 143 cas (15 fichiers : P01 à P14 et un scénario de bout en bout) ».

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md
git commit -m "docs(recette): volume final de 143 cas dans le spec"
```

- [ ] **Step 7: Livraison**

Indiquer à l'utilisateur le chemin du `.docx`, le nombre de cas par processus, la liste des points « à confirmer » (annexe du document) et les comptes Keycloak à créer avant de dérouler les cas P05 à P13. Rappeler que P01-02 et P01-03 échoueront tant que le problème nginx de la VM n'est pas corrigé.
