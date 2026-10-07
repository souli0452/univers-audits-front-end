// Outils de capture d'écran de la plateforme (Chrome sans interface, puppeteer-core).
// Environnement de formation uniquement : front sur http://localhost:4200, Keycloak sur http://localhost:8080.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPTES, mdpDe } from './lib.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
export const DOSSIER_CAPTURES = path.resolve(ici, '..', 'captures');
fs.mkdirSync(DOSSIER_CAPTURES, { recursive: true });
export const FRONT = 'http://localhost:4200';
export const pause = ms => new Promise(r => setTimeout(r, ms));

export async function lancer() {
    return puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new', defaultViewport: { width: 1440, height: 860, deviceScaleFactor: 1 },
        args: ['--no-sandbox', '--lang=fr-FR', '--force-color-profile=srgb']
    });
}

/** Ouvre une session isolée et connecte le compte de formation indiqué (par son rôle). */
export async function connecter(navigateur, role) {
    const compte = COMPTES.find(c => c.role === role);
    const contexte = await navigateur.createBrowserContext();
    const page = await contexte.newPage();
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('portail_taille_texte', '100'); } catch { /* sans effet */ } });
    await page.goto(`${FRONT}/#/app`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#username', { timeout: 30000 });
    await page.type('#username', compte.username);
    await page.type('#password', mdpDe(compte));
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }), page.click('#kc-login')]);
    await page.waitForSelector('app-topbar, .layout-topbar, .layout-wrapper', { timeout: 30000 });
    await pause(1500);
    return page;
}

/** Navigation interne (sans rechargement, pour garder la session) : #/app/dossiers, etc. */
export async function aller(page, hash, attente = 1800) {
    await page.evaluate(h => { location.hash = h; }, hash);
    await pause(attente);
}

export async function cliquerTexte(page, texte, selecteur = 'button, a, .p-button, li, span, div[role=button]') {
    const ok = await page.evaluate((t, sel) => {
        const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null && (e.innerText || '').trim().toLowerCase().includes(t.toLowerCase()));
        els.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
        if (!els[0]) return false; els[0].click(); return true;
    }, texte, selecteur);
    if (!ok) console.log(`  (clic introuvable : « ${texte} »)`);
    await pause(1200);
    return ok;
}

export async function photo(page, nom, options = {}) {
    const fichier = path.join(DOSSIER_CAPTURES, nom + '.png');
    if (options.selecteur) {
        const el = await page.$(options.selecteur);
        if (el) { await el.screenshot({ path: fichier }); console.log('capture', nom, '(élément)'); return fichier; }
    }
    await page.screenshot({ path: fichier, fullPage: !!options.pleinePage });
    console.log('capture', nom);
    return fichier;
}

/** Capture la carte (ancêtre « .rounded-2xl ») qui contient le texte indiqué, par exemple la carte des onglets d'une fiche. */
export async function photoCarteContenant(page, texte, nom, ancetre = '.rounded-2xl') {
    const h = await page.evaluateHandle((t, anc) => {
        const el = [...document.querySelectorAll('button, span, div')].find(e => e.children.length === 0 ? (e.innerText || '').trim().startsWith(t) : false)
            ?? [...document.querySelectorAll('button, span, div')].find(e => (e.innerText || '').trim().startsWith(t));
        return el ? (el.closest(anc) ?? el) : null;
    }, texte, ancetre);
    const el = h.asElement();
    if (!el) { console.log(`  (carte introuvable : « ${texte} »)`); return null; }
    await el.evaluate(e => e.scrollIntoView({ block: 'start' })); await pause(500);
    const fichier = path.join(DOSSIER_CAPTURES, nom + '.png');
    await el.screenshot({ path: fichier });
    console.log('capture', nom, '(carte)');
    return fichier;
}
