// Onglets de la fiche dossier, enquête, comité (CTADP) et espace DCP.
import { lancer, connecter, aller, cliquerTexte, photo, pause } from './capture.mjs';
import { ouvrirDossier } from './captures-admin2.mjs';

const nav = await lancer();
try {
    // ------- Conseiller juridique : onglets de la fiche
    let page = await connecter(nav, 'CONSEILLER_JURIDIQUE');
    await ouvrirDossier(page, 'Délai anormal');
    for (const [txt, nom] of [['Témoins', 'cj-06-onglet-temoins'], ['Observations', 'cj-07-onglet-observations'], ['Pièces jointes', 'cj-08-onglet-pieces-jointes'],
        ['Affectation', 'cj-09-onglet-affectation'], ['Analyse', 'cj-10-onglet-analyse']]) {
        await cliquerTexte(page, txt, '.p-tab, [role=tab], button'); await pause(1200);
        await page.evaluate(() => document.querySelector('p-tabs, .p-tabs, [role=tablist]')?.scrollIntoView({ block: 'start' })); await pause(600);
        await photo(page, nom);
    }
    await cliquerTexte(page, 'Ajouter une observation', 'button'); await pause(1000); await photo(page, 'cj-11-ajouter-observation');
    await page.close();

    // ------- Contrôleur d'État : l'enquête
    page = await connecter(nav, 'CONTROLEUR_ETAT');
    await photo(page, 'ce-01-tableau-de-bord');
    await aller(page, '#/app/investigations', 2500); await photo(page, 'ce-02-enquetes-liste');
    await page.evaluate(() => { const e = document.querySelector('tbody tr .pi-eye'); (e?.closest('button, a') ?? e)?.click(); }); await pause(3000);
    await photo(page, 'ce-03-enquete-detail', { pleinePage: true });
    for (const [txt, nom] of [['Équipe', 'ce-04-enquete-equipe'], ['Plan', 'ce-05-enquete-plan'], ['Rapport', 'ce-06-enquete-rapport'], ['Mandat', 'ce-07-enquete-mandat']]) {
        if (await cliquerTexte(page, txt, '.p-tab, [role=tab], button')) { await pause(1000); await photo(page, nom); }
    }
    await aller(page, '#/app/lecons-a-partager', 2500); await photo(page, 'ce-08-lecons');
    await aller(page, '#/app/rapports/investigations', 2500); await photo(page, 'ce-09-rapport-enquetes', { pleinePage: true });
    await page.close();

    // ------- Membre du comité (CTADP)
    page = await connecter(nav, 'MEMBRE_CTADP');
    await photo(page, 'ctadp-01-tableau-de-bord');
    await aller(page, '#/app/seances-ctadp', 2500); await photo(page, 'ctadp-02-seances');
    await page.evaluate(() => { const e = document.querySelector('tbody tr .pi-eye'); (e?.closest('button, a') ?? e)?.click(); }); await pause(2500);
    await photo(page, 'ctadp-03-seance-detail', { pleinePage: true });
    await page.close();

    // ------- DCP : statistiques seulement
    page = await connecter(nav, 'DCP');
    await photo(page, 'dcp-01-accueil');
    await aller(page, '#/app/statistiques', 2500); await photo(page, 'dcp-02-statistiques', { pleinePage: true });
    await page.close();
} finally { await nav.close(); }
