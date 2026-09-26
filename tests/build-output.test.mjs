// Vérifie le RÉSULTAT du build de production (dist/sakai-ng/browser). À lancer après `ng build` :
//     npm run build && npm run test:build
//
// Ces contrôles existent parce que la page publiée déclare une politique de sécurité (CSP) stricte :
// `script-src 'self'` interdit les gestionnaires « onload=... » écrits dans le HTML. Or l'optimisation
// par défaut d'Angular charge la feuille de style principale avec `media="print" onload="this.media='all'"`.
// Sous cette CSP le gestionnaire ne s'exécute jamais : la feuille reste « impression », donc aucune
// icône (PrimeIcons), aucun style global n'est appliqué à l'écran.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist/sakai-ng/browser');
const lire = (fichier) => fs.readFileSync(path.join(DIST, fichier), 'utf8');
const index = () => lire('index.html');
const feuilleGlobale = () => {
    const nom = fs.readdirSync(DIST).find((f) => /^styles-.*\.css$/.test(f));
    assert.ok(nom, 'aucune feuille styles-*.css dans le build');
    return lire(nom);
};

test('le build existe (lancer « npm run build » avant ce test)', () => {
    assert.ok(fs.existsSync(path.join(DIST, 'index.html')), DIST + ' est introuvable');
});

test('index.html ne contient aucun gestionnaire d’événement en ligne (interdit par la CSP)', () => {
    const gestionnaires = index().match(/<[^>]+\son[a-z]+\s*=\s*["'][^"']*["'][^>]*>/gi) ?? [];
    assert.deepEqual(gestionnaires, [], 'gestionnaires en ligne trouvés : ' + gestionnaires.join(' | '));
});

test('la feuille de style principale n’est pas différée par media="print"', () => {
    assert.doesNotMatch(index(), /<link[^>]+media=["']print["']/i);
});

test('la page ne dépend d’aucun domaine tiers pour ses polices ou ses styles', () => {
    const html = index();
    assert.doesNotMatch(html, /cdnfonts|fonts\.googleapis|fonts\.gstatic|primefaces\.org/i);
});

test('les six graisses de Lato utilisées par l’application sont déclarées et hébergées par le site', () => {
    const css = feuilleGlobale();
    for (const graisse of [400, 500, 600, 700, 800, 900]) {
        const regle = new RegExp('@font-face\\s*{[^}]*font-family:\\s*["\']?Lato["\']?[^}]*font-weight:\\s*' + graisse + '\\b[^}]*}', 'i');
        const trouve = css.match(regle);
        assert.ok(trouve, 'graisse ' + graisse + ' non déclarée');
        const url = trouve[0].match(/url\(["']?([^"')]+)["']?\)/i)?.[1];
        assert.ok(url && url.startsWith('/assets/fonts/'), 'graisse ' + graisse + ' : url inattendue ' + url);
        assert.ok(fs.existsSync(path.join(DIST, url.replace(/^\//, ''))), 'fichier de police absent du build : ' + url);
    }
});

test('toutes les polices d’icônes PrimeIcons référencées par le CSS existent dans le build', () => {
    const css = feuilleGlobale();
    const urls = [...css.matchAll(/url\(["']?(\.\/media\/primeicons-[^"')?#]+)/g)].map((m) => m[1]);
    assert.ok(urls.length > 0, 'aucune police primeicons référencée');
    for (const url of urls) {
        assert.ok(fs.existsSync(path.join(DIST, url.replace(/^\.\//, ''))), 'police absente : ' + url);
    }
});
