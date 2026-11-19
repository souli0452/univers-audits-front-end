// La politique de sécurité de la page doit autoriser la lecture des enregistrements audio chargés depuis le
// serveur (adresses blob:). Sans « media-src … blob: », le navigateur refuse de les lire (« Media load rejected
// by URL safety check ») et le lecteur reste figé sur 0:00 / 0:00, pour l'agent comme pour le citoyen.
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const index = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]*)"/.exec(index)?.[1] ?? '';
const directive = nom => csp.split(';').map(d => d.trim()).find(d => d.startsWith(nom + ' '));

test('la page déclare une politique de sécurité', () => {
    assert.ok(csp.length > 0);
});

test('les enregistrements audio en blob: peuvent être lus', () => {
    const media = directive('media-src');
    assert.ok(media, 'media-src est absent : le navigateur retombe sur default-src et bloque blob:');
    assert.match(media, /\bblob:/);
    assert.match(media, /'self'/);
});

test('la politique reste restrictive : pas de media-src générique ni de script en ligne', () => {
    assert.doesNotMatch(directive('media-src') ?? '', /\*|https?:\/\/(?!localhost)/);
    assert.equal(directive('script-src'), "script-src 'self'");
});
