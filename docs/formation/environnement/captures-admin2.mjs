import { lancer, connecter, aller, cliquerTexte, photo, pause } from './capture.mjs';

/** Ouvre la fiche d'un dossier depuis la liste (clic sur la ligne qui contient le texte). */
export async function ouvrirDossier(page, fragment) {
    await aller(page, '#/app/dossiers', 2200);
    const ok = await page.evaluate(f => {
        const ligne = [...document.querySelectorAll('tr')].find(tr => (tr.innerText || '').includes(f));
        if (!ligne) return false; (ligne.querySelector('a, button, .pi-eye') || ligne).click(); return true;
    }, fragment);
    if (!ok) console.log('  (dossier introuvable :', fragment, ')');
    await pause(2500);
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    const nav = await lancer();
    try {
        const page = await connecter(nav, 'ADMIN_DDIC');
        await aller(page, '#/app/statistiques/depassements-par-acteur', 2500); await photo(page, 'adm-15-depassements', { pleinePage: true });
        await aller(page, '#/app/seances-ctadp', 2500); await photo(page, 'adm-16-seances-liste', { pleinePage: true });
        await aller(page, '#/app/informations-preoccupantes', 2500); await photo(page, 'adm-17-infos-preoccupantes', { pleinePage: true });
        await aller(page, '#/app/lecons-a-partager', 2500); await photo(page, 'adm-18-lecons', { pleinePage: true });
        await aller(page, '#/app/registre-auditions', 2500); await photo(page, 'adm-19-registre-auditions', { pleinePage: true });
        await aller(page, '#/app/administration/parametres-metier', 2500); await photo(page, 'adm-20-parametres-metier', { pleinePage: true });
        await aller(page, '#/app/administration/notifications-queue', 2500); await photo(page, 'adm-21-file-notifications', { pleinePage: true });
        await aller(page, '#/app/notifications', 2500); await photo(page, 'adm-22-notifications', { pleinePage: true });
        await ouvrirDossier(page, 'Refus de délivrance'); await photo(page, 'adm-23-dossier-recevable', { pleinePage: true });
        await ouvrirDossier(page, 'carburant'); await photo(page, 'adm-24-dossier-ctadp', { pleinePage: true });
        await aller(page, '#/app/investigations', 2500); await photo(page, 'adm-25-enquetes-liste', { pleinePage: true });
    } finally { await nav.close(); }
}
