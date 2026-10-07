import { lancer, connecter, aller, photo } from './capture.mjs';
const nav = await lancer();
try {
    const page = await connecter(nav, 'ADMIN_DDIC');
    await photo(page, 'adm-01-tableau-de-bord', { pleinePage: true });
    await aller(page, '#/app/statistiques', 2500); await photo(page, 'adm-02-statistiques', { pleinePage: true });
    await aller(page, '#/app/dossiers', 2500); await photo(page, 'adm-03-liste-dossiers', { pleinePage: true });
    await aller(page, '#/app/dossiers/nouveau', 2500); await photo(page, 'adm-04-nouveau-dossier', { pleinePage: true });
    await aller(page, '#/app/dossiers/audio', 2500); await photo(page, 'adm-05-depot-audio', { pleinePage: true });
    await aller(page, '#/app/rapports', 2500); await photo(page, 'adm-06-rapports', { pleinePage: true });
    await aller(page, '#/app/investigations', 2500); await photo(page, 'adm-07-enquetes', { pleinePage: true });
    await aller(page, '#/app/rapports/investigations', 2500); await photo(page, 'adm-08-rapport-enquetes', { pleinePage: true });
    await aller(page, '#/app/administration/agents', 2500); await photo(page, 'adm-09-agents', { pleinePage: true });
    await aller(page, '#/app/administration/agents/nouveau', 2500); await photo(page, 'adm-10-agent-nouveau', { pleinePage: true });
    await aller(page, '#/app/administration/roles', 2500); await photo(page, 'adm-11-roles', { pleinePage: true });
    await aller(page, '#/app/administration/audit', 2500); await photo(page, 'adm-12-journal-audit', { pleinePage: true });
    await aller(page, '#/app/administration/parametres-portail', 2500); await photo(page, 'adm-13-parametres-portail', { pleinePage: true });
    await aller(page, '#/app/profil', 2500); await photo(page, 'adm-14-profil', { pleinePage: true });
} finally { await nav.close(); }
