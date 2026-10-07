// Captures du portail citoyen (aucune connexion) : accueil, FAQ, chiffres, pages d'information, dépôt, suivi.
import { lancer, aller, cliquerTexte, photo, pause, FRONT } from './capture.mjs';

const nav = await lancer();
let codeSuivi = null;
try {
    const contexte = await nav.createBrowserContext();
    const page = await contexte.newPage();
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('portail_taille_texte', '100'); } catch { /* sans effet */ } });
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    // pages entières : la barre du haut ne doit pas rester collée au milieu de l'image
    await page.evaluateOnNewDocument(() => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.navbar{position:relative !important}'; document.head.appendChild(st); }); });
    await page.goto(`${FRONT}/#/portail`, { waitUntil: 'networkidle2' });
    await pause(2500);

    // --- Accueil : le haut de page puis chaque section
    await photo(page, 'por-01-accueil-haut');
    for (const [sel, nom] of [['.chiffres', 'por-02-accueil-chiffres'], ['.avant', 'por-03-accueil-avant-de-signaler'], ['.vocal-card-wrap', 'por-04-accueil-vocal'],
        ['.how', 'por-05-accueil-comment-ca-marche'], ['.garanties', 'por-06-accueil-garanties'], ['.channels', 'por-07-accueil-canaux']]) {
        await page.evaluate(s => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel); await pause(700);
        await photo(page, nom, { selecteur: sel });
    }
    // fenêtre « Comment voulez-vous déposer ? »
    await page.evaluate(() => window.scrollTo(0, 0)); await pause(500);
    await cliquerTexte(page, 'Faire un signalement'); await pause(800);
    await photo(page, 'por-08-choix-depot');
    await page.keyboard.press('Escape'); await page.evaluate(() => { document.querySelector('.overlay')?.click(); }); await pause(500);

    // --- FAQ
    await aller(page, '#/portail/faq', 2000);
    await cliquerTexte(page, 'Tout ouvrir', 'button'); await pause(600);
    await photo(page, 'por-09-faq', { pleinePage: false });
    // --- Chiffres
    await aller(page, '#/portail/chiffres', 2500); await photo(page, 'por-10-chiffres', { pleinePage: true });
    // --- Pages d'information
    await aller(page, '#/portail/info/missions', 2000); await photo(page, 'por-11-info-missions', { pleinePage: true });
    await aller(page, '#/portail/info/confidentialite', 2000); await photo(page, 'por-12-info-confidentialite', { pleinePage: true });

    // --- Dépôt écrit : étape 1
    await aller(page, '#/portail/deposer', 2500);
    await photo(page, 'por-13-depot-etape1-vide', { pleinePage: true });
    const champs = await page.$$('input[pinputtext], input.p-inputtext, textarea');
    console.log('champs trouvés :', champs.length);
    await cliquerTexte(page, 'Dénonciation', '.type-card, .type-name, div');
    await page.type('input[pinputtext]', "Demande d'un paiement non prévu pour un acte administratif");
    await page.type('textarea', "Un agent d'un guichet demande un paiement supplémentaire, sans reçu, pour traiter un dossier. Les faits se répètent chaque semaine. (Exemple de formation : faits fictifs.)");
    const inputs = await page.$$('input[pinputtext]');
    if (inputs[1]) await inputs[1].type('Ouagadougou, service de formation');
    if (inputs[2]) await inputs[2].type('Septembre 2026');
    await pause(500);
    await photo(page, 'por-14-depot-etape1-rempli', { pleinePage: true });
    await cliquerTexte(page, 'Continuer', 'button'); await pause(1500);
    await photo(page, 'por-15-depot-etape2-identite', { pleinePage: true });
    // choisir l'anonymat
    await cliquerTexte(page, 'Je reste anonyme', '.anon-option, div'); await pause(800);
    await photo(page, 'por-16-depot-etape2-anonyme', { pleinePage: true });
    // consentement
    const cases = await page.$$('p-checkbox, .p-checkbox');
    console.log('cases à cocher :', cases.length);
    for (const c of cases) { await c.click().catch(() => {}); }
    await pause(500);
    await cliquerTexte(page, 'Continuer', 'button'); await pause(1500);
    await photo(page, 'por-17-depot-etape3-confirmation', { pleinePage: true });
    await cliquerTexte(page, 'Soumettre mon signalement', 'button'); await pause(3500);
    await photo(page, 'por-18-depot-code-suivi');
    codeSuivi = await page.evaluate(() => { const m = document.body.innerText.match(/CODE DE SUIVI[^\n]*\n+\s*([A-Z0-9]{8})/i); return m ? m[1] : null; });
    console.log('code de suivi :', codeSuivi);

    // --- Suivi
    await aller(page, '#/portail/suivi', 2000); await photo(page, 'por-19-suivi-recherche');
    if (codeSuivi) {
        await page.type('input', codeSuivi); await cliquerTexte(page, 'Rechercher', 'button'); await pause(3000);
        await photo(page, 'por-20-suivi-resultat', { pleinePage: true });
    }
    // --- Vocal
    await aller(page, '#/portail/vocal', 2500); await photo(page, 'por-21-vocal', { pleinePage: true });
} finally { await nav.close(); }
