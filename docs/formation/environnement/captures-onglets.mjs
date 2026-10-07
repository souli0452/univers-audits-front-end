// Onglets de la fiche dossier (carte entière) : parties visées, témoins, observations, pièces jointes, affectation, analyse.
import { lancer, connecter, cliquerTexte, photoCarteContenant, pause } from './capture.mjs';
import { ouvrirDossier } from './captures-admin2.mjs';
const nav = await lancer();
try {
    const page = await connecter(nav, 'CONSEILLER_JURIDIQUE');
    await ouvrirDossier(page, 'Délai anormal');
    await photoCarteContenant(page, 'Parties visées', 'cj-06-onglet-parties');
    for (const [txt, nom] of [['Témoins', 'cj-07-onglet-temoins'], ['Observations', 'cj-08-onglet-observations'], ['Pièces jointes', 'cj-09-onglet-pieces-jointes'],
        ['Affectation', 'cj-10-onglet-affectation'], ['Analyse', 'cj-11-onglet-analyse']]) {
        await cliquerTexte(page, txt, 'button'); await pause(1200);
        await photoCarteContenant(page, 'Parties visées', nom);
    }
} finally { await nav.close(); }
