import { lancer, connecter, aller, cliquerTexte, photo, pause } from './capture.mjs';
import { ouvrirDossier } from './captures-admin2.mjs';

const nav = await lancer();
try {
    const page = await connecter(nav, 'AGENT_BRPD');
    await photo(page, 'brpd-01-tableau-de-bord');
    await aller(page, '#/app/dossiers', 2500); await photo(page, 'brpd-02-liste-dossiers');
    // filtrer par statut « Soumis » (ouvre la liste déroulante des statuts)
    await cliquerTexte(page, 'Statut', 'span, div, label'); await pause(700); await photo(page, 'brpd-03-filtre-statut');
    await page.keyboard.press('Escape'); await pause(300);

    // dossier soumis par un citoyen : à enregistrer
    await ouvrirDossier(page, "paiement non prévu");
    await photo(page, 'brpd-04-dossier-soumis', { pleinePage: true });
    await cliquerTexte(page, 'Enregistrer', 'button'); await pause(1500);
    await photo(page, 'brpd-05-enregistrer-dialogue');
    // confirmer s'il y a une boîte de confirmation
    await cliquerTexte(page, 'Confirmer', 'button'); await pause(2500);
    await cliquerTexte(page, 'Oui', 'button'); await pause(1500);
    await photo(page, 'brpd-06-dossier-enregistre', { pleinePage: true });

    // saisie d'un dossier reçu au guichet
    await aller(page, '#/app/dossiers/nouveau', 2500);
    await photo(page, 'brpd-07-nouveau-dossier-vide');
    const selects = await page.$$('p-select, p-dropdown, .p-select');
    console.log('listes déroulantes :', selects.length);
    await page.type('input[pinputtext]', "Exigence d'un pourboire pour délivrer une attestation");
    await page.type('textarea', "Le déclarant s'est présenté au guichet du BRPD pour dénoncer une demande de pourboire. (Exemple de formation : faits fictifs.)");
    await pause(500);
    await photo(page, 'brpd-08-nouveau-dossier-rempli', { pleinePage: true });
    await cliquerTexte(page, 'Suivant', 'button'); await pause(1500);
    await photo(page, 'brpd-09-nouveau-dossier-declarant', { pleinePage: true });
    await aller(page, '#/app/dossiers/audio', 2500); await photo(page, 'brpd-10-depot-audio', { pleinePage: true });
    await aller(page, '#/app/informations-preoccupantes', 2500); await photo(page, 'brpd-11-infos-preoccupantes', { pleinePage: true });
} finally { await nav.close(); }
