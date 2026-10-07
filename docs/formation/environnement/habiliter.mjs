// Donne aux comptes de formation l'accès aux dossiers qu'ils traitent, et constitue l'équipe d'enquête.
// Usage : node habiliter.mjs  (après creer-dossiers.mjs, avancer-dossiers.mjs, completer.mjs)
import { COMPTES, jetonUtilisateur, appel, mdpDe } from './lib.mjs';

const jetons = {};
for (const c of COMPTES) jetons[c.role] = await jetonUtilisateur(c.username, mdpDe(c));
const CGE = jetons.CGE, CGEA = jetons.CGEA;

const agent = async role => {
    const r = (await appel(CGE, 'GET', `/agents/by-role/${role}`)).corps;
    return (r.content ?? r)[0]?.id;
};
const idCJ = await agent('CONSEILLER_JURIDIQUE'), idCE = await agent('CONTROLEUR_ETAT'), idCTADP = await agent('MEMBRE_CTADP');

const liste = (await appel(CGE, 'GET', '/dossiers?size=100')).corps;
const tous = liste.content ?? liste;
const trouver = f => tous.find(d => (d.object ?? '').includes(f));

async function habiliter(d, agentId, motif) {
    const r = await appel(CGE, 'POST', `/dossiers/${d.id}/habilitations`, { agentId, reason: motif });
    console.log('habilitation', (d.object ?? '').slice(13, 40), r.status);
}
for (const f of ['Délai anormal', 'Recrutement irrégulier', 'Attribution douteuse']) { const d = trouver(f); if (d) await habiliter(d, idCJ, 'Dossier confié au conseiller juridique (formation).'); }
const d6 = trouver('Refus de délivrance'), d5 = trouver('carburant');
if (d6) { await habiliter(d6, idCE, 'Enquêteur du dossier (formation).'); await habiliter(d6, idCJ, 'Avis juridique (formation).'); }
if (d5) await habiliter(d5, idCTADP, 'Membre du comité (formation).');

if (d6) {
    const inv = (await appel(CGEA, 'GET', `/investigations/dossier/${d6.id}`)).corps;
    const iid = (Array.isArray(inv) ? inv[0] : inv)?.id;
    console.log('enquête :', iid);
    // l'agent déclare lui-même l'absence de conflit d'intérêts avant d'entrer dans l'équipe
    const e = await appel(jetons.CONTROLEUR_ETAT, 'POST', `/investigations/${iid}/engagement-prealable`, { hasConflictOfInterest: false });
    console.log('engagement préalable du contrôleur :', e.status, e.status >= 300 ? JSON.stringify(e.corps).slice(0, 140) : '');
    const m1 = await appel(CGEA, 'POST', `/investigations/${iid}/members`, { agentId: idCE, teamRole: 'CHEF_MISSION' });
    console.log('chef de mission :', m1.status, m1.status >= 300 ? JSON.stringify(m1.corps).slice(0, 160) : '');
}
