// Fenêtres de saisie supplémentaires : étude d'opportunité, observation, onglets vus par le CGE, séance du comité.
import { lancer, connecter, aller, cliquerTexte, photo, photoCarteContenant, pause } from './capture.mjs';
import { ouvrirDossier } from './captures-admin2.mjs';

const nav = await lancer();
try {
    let page = await connecter(nav, 'CONSEILLER_JURIDIQUE');
    await ouvrirDossier(page, 'Délai anormal');
    await cliquerTexte(page, 'Analyse', 'button'); await pause(800);
    await cliquerTexte(page, "Créer l'étude d'opportunité", 'button'); await pause(1500);
    await photo(page, 'cj-12-etude-opportunite-dialogue', { pleinePage: true });
    await page.keyboard.press('Escape'); await pause(600);
    await cliquerTexte(page, 'Observations', 'button'); await pause(800);
    await cliquerTexte(page, 'Ajouter une observation', 'button'); await pause(1200);
    await photo(page, 'cj-13-ajouter-observation');
    await page.close();

    page = await connecter(nav, 'CGE');
    await ouvrirDossier(page, 'carburant');
    for (const [txt, nom] of [['Affectation', 'cge-06-onglet-affectation'], ['Analyse', 'cge-07-onglet-analyse'], ['Pièces jointes', 'cge-08-onglet-pieces-jointes']]) {
        await cliquerTexte(page, txt, 'button'); await pause(1200);
        await photoCarteContenant(page, 'Parties visées', nom);
    }
    await page.close();

    page = await connecter(nav, 'CGEA');
    await aller(page, '#/app/seances-ctadp', 1800);
    await page.evaluate(() => { const e = document.querySelector('tbody tr .pi-eye'); (e?.closest('button, a') ?? e)?.click(); }); await pause(2500);
    const boutons = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()).filter(Boolean));
    console.log('boutons de la séance :', boutons.join(' | '));
    await cliquerTexte(page, 'Ajouter un dossier', 'button'); await pause(1200); await photo(page, 'cgea-07-seance-ajouter-dossier');
    await page.keyboard.press('Escape'); await pause(500);
    await cliquerTexte(page, 'Tenir', 'button'); await pause(1200); await photo(page, 'cgea-08-seance-tenir');
    await page.close();
} finally { await nav.close(); }
