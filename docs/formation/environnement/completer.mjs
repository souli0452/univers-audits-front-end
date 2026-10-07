// Séance du comité (CTADP) avec un dossier, et ouverture d'une enquête sur le dossier recevable.
// Usage : node completer.mjs  (après creer-dossiers.mjs et avancer-dossiers.mjs)
import { COMPTES, jetonUtilisateur, appel, mdpDe } from './lib.mjs';

const jetons = {};
for (const c of COMPTES) jetons[c.role] = await jetonUtilisateur(c.username, mdpDe(c));
const CGE = jetons.CGE, CGEA = jetons.CGEA;

const liste = (await appel(CGE, 'GET', '/dossiers?size=100')).corps;
const tous = liste.content ?? liste;
const trouver = f => tous.find(d => (d.object ?? '').includes(f));
const D5 = trouver('carburant'), D6 = trouver('Refus de délivrance');

const dans3jours = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
const s = await appel(CGEA, 'POST', '/seances-ctadp', { dateSeance: dans3jours, participants: 'Membres du comité de traitement (séance de formation)' });
console.log('séance :', s.status, s.status >= 300 ? JSON.stringify(s.corps).slice(0, 200) : s.corps.id);
if (s.status === 201) {
    const a = await appel(CGEA, 'POST', `/seances-ctadp/${s.corps.id}/dossiers`, { dossierId: D5.id });
    console.log('dossier ajouté à la séance :', a.status, a.status >= 300 ? JSON.stringify(a.corps).slice(0, 200) : '');
}
const i = await appel(CGEA, 'POST', `/investigations/dossier/${D6.id}/open`, { plannedDurationDays: 60, notes: "Enquête ouverte pour la formation : vérifier les faits décrits." });
console.log('enquête :', i.status, i.status >= 300 ? JSON.stringify(i.corps).slice(0, 240) : i.corps.status);
