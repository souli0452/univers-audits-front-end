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

test('le mode d’emploi explique les adresses à routage par hash', async () => {
  const xml = await xmlOf([proc([kase()])]);
  assert.ok(xml.includes('/#/portail/deposer'));
});
