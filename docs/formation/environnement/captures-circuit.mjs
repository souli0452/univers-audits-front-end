// Circuit de traitement d'un dossier, rôle par rôle, avec les écrans de chaque étape.
import { lancer, connecter, aller, cliquerTexte, photo, pause } from './capture.mjs';
import { ouvrirDossier } from './captures-admin2.mjs';
import { COMPTES, jetonUtilisateur, appel, mdpDe } from './lib.mjs';

const tok = async role => { const c = COMPTES.find(x => x.role === role); return jetonUtilisateur(c.username, mdpDe(c)); };
// accès du BRPD aux dossiers déposés par les citoyens (statut « Soumis »), accordé par le CGE
const cge = await tok('CGE');
const agentsBrpd = (await appel(cge, 'GET', '/agents/by-role/AGENT_BRPD')).corps; const idBrpd = (agentsBrpd.content ?? agentsBrpd)[0].id;
const liste = (await appel(cge, 'GET', '/dossiers?size=100')).corps; const tous = liste.content ?? liste;
for (const d of tous.filter(x => x.status === 'SOUMIS')) await appel(cge, 'POST', `/dossiers/${d.id}/habilitations`, { agentId: idBrpd, reason: 'Enregistrement du dépôt en ligne (formation).' });

const nav = await lancer();
try {
    // ------- BRPD : enregistrer un dépôt en ligne
    let page = await connecter(nav, 'AGENT_BRPD');
    await aller(page, '#/app/dossiers', 2500); await photo(page, 'brpd-02-liste-dossiers');
    await ouvrirDossier(page, "paiement non prévu"); await photo(page, 'brpd-04-dossier-soumis', { pleinePage: true });
    await cliquerTexte(page, 'Enregistrer', 'button'); await pause(1500); await photo(page, 'brpd-05-enregistrer-dialogue');
    await page.close();

    // ------- Conseiller juridique : étude d'opportunité
    page = await connecter(nav, 'CONSEILLER_JURIDIQUE');
    await photo(page, 'cj-01-tableau-de-bord');
    await aller(page, '#/app/dossiers', 2500); await photo(page, 'cj-02-liste-dossiers');
    await ouvrirDossier(page, 'Délai anormal'); await photo(page, 'cj-03-dossier-en-etude', { pleinePage: true });
    await cliquerTexte(page, 'Demander complément', 'button'); await pause(1200); await photo(page, 'cj-04-demander-complement');
    await page.keyboard.press('Escape'); await pause(500);
    await cliquerTexte(page, 'Soumettre au CTADP', 'button'); await pause(1200); await photo(page, 'cj-05-soumettre-ctadp');
    await page.keyboard.press('Escape'); await pause(500);
    await page.close();

    // ------- CGEA : séances, affectation, dépassements
    page = await connecter(nav, 'CGEA');
    await photo(page, 'cgea-01-tableau-de-bord');
    await aller(page, '#/app/seances-ctadp', 2500); await photo(page, 'cgea-02-seances');
    await cliquerTexte(page, 'Nouvelle séance', 'button, a'); await pause(1200); await photo(page, 'cgea-03-nouvelle-seance');
    await page.keyboard.press('Escape'); await pause(500);
    await aller(page, '#/app/seances-ctadp', 1500);
    await page.evaluate(() => { const l = document.querySelector('tr .pi-eye, tbody tr'); (l?.closest('tr') ?? l)?.click(); }); await pause(2500);
    await photo(page, 'cgea-04-seance-detail', { pleinePage: true });
    await ouvrirDossier(page, 'carburant'); await photo(page, 'cgea-05-dossier-ctadp', { pleinePage: true });
    await aller(page, '#/app/statistiques/depassements-par-acteur', 2500); await photo(page, 'cgea-06-depassements', { pleinePage: true });
    await page.close();

    // ------- CGE : décision de recevabilité, priorité, confidentialité
    page = await connecter(nav, 'CGE');
    await photo(page, 'cge-01-tableau-de-bord');
    await ouvrirDossier(page, 'carburant'); await photo(page, 'cge-02-dossier-ctadp');
    await cliquerTexte(page, 'Déclarer recevable', 'button'); await pause(1200); await photo(page, 'cge-03-declarer-recevable');
    await page.keyboard.press('Escape'); await pause(500);
    await cliquerTexte(page, 'Normal', 'button'); await pause(1200); await photo(page, 'cge-04-priorite');
    await page.keyboard.press('Escape'); await pause(500);
    await cliquerTexte(page, 'Marquer confidentiel', 'button'); await pause(1200); await photo(page, 'cge-05-confidentiel');
    await page.keyboard.press('Escape'); await pause(500);
    await page.close();
} finally { await nav.close(); }
