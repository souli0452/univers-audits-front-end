// Crée des dossiers FICTIFS à différents stades du circuit, avec les comptes de formation.
// Aucune donnée réelle : tous les objets commencent par « [FORMATION] ».
// Usage : node creer-dossiers.mjs
import { COMPTES, jetonUtilisateur, appel, mdpDe } from './lib.mjs';

const jetons = {};
for (const c of COMPTES) jetons[c.role] = await jetonUtilisateur(c.username, mdpDe(c));
const BRPD = jetons.AGENT_BRPD, CJ = jetons.CONSEILLER_JURIDIQUE, CGE = jetons.CGE, CGEA = jetons.CGEA;

const declarantAnonyme = { typeDeclarant: 'ANONYMOUS', anonymous: true, dataProcessingConsent: true, notificationsAccepted: true, protectionRequested: false, protectionAcknowledged: false };
const declarantCitoyen = (prenom, nom) => ({
    typeDeclarant: 'CITIZEN', firstName: prenom, lastName: nom, email: `${prenom}.${nom}@exemple.test`.toLowerCase(), phoneNumber: '+22670000001',
    commune: 'Ouagadougou', province: 'Kadiogo', anonymous: false, dataProcessingConsent: true, notificationsAccepted: true,
    protectionRequested: false, protectionAcknowledged: false
});

const DOSSIERS = [
    { cle: 'D1', mode: 'WEB_FORM', quality: 'TEMOIN', anon: true, objet: "[FORMATION] Demande d'un paiement non prévu pour un acte administratif", lieu: 'Ouagadougou', perte: 150000 },
    { cle: 'D2', mode: 'POSTAL_MAIL', quality: 'TEMOIN', anon: true, objet: '[FORMATION] Attribution douteuse de fournitures de bureau', lieu: 'Bobo-Dioulasso', perte: 4500000, courrier: 'COUR-2026-0412' },
    { cle: 'D3', mode: 'GREEN_NUMBER', quality: 'VICTIME', anon: false, declarant: declarantCitoyen('Test', 'Plaignant'), objet: '[FORMATION] Délai anormal et frais demandés sans reçu', lieu: 'Koudougou', perte: 75000 },
    { cle: 'D4', mode: 'IN_PERSON', quality: 'TEMOIN', anon: false, declarant: declarantCitoyen('Test', 'Temoin'), objet: '[FORMATION] Recrutement irrégulier dans un service public', lieu: 'Ouahigouya', perte: 0 },
    { cle: 'D5', mode: 'EMAIL', quality: 'TEMOIN', anon: true, objet: '[FORMATION] Détournement présumé de carburant', lieu: 'Banfora', perte: 2800000 },
    { cle: 'D6', mode: 'PHONE', quality: 'VICTIME', anon: false, declarant: declarantCitoyen('Exemple', 'Usager'), objet: '[FORMATION] Refus de délivrance sans motif', lieu: 'Ouagadougou', perte: 20000 },
    { cle: 'D7', mode: 'WEB_FORM', quality: 'TEMOIN', anon: true, objet: '[FORMATION] Surfacturation sur un chantier de voirie', lieu: 'Ouagadougou', perte: 18000000 },
    { cle: 'D8', mode: 'AUDIO_COUNTER', quality: 'TEMOIN', anon: true, objet: '[FORMATION] Témoignage vocal : pratiques à un guichet', lieu: 'Fada N Gourma', perte: 0 }
];

const etat = {};
async function creer(d) {
    const corps = {
        type: d.quality === 'VICTIME' ? 'COMPLAINT' : 'DENUNCIATION', quality: d.quality, submissionMode: d.mode, anonymous: d.anon,
        object: d.objet, description: "Donnée de formation : faits fictifs, rédigés pour illustrer le traitement d'un dossier. Aucune personne ni institution réelle n'est visée.",
        incidentLocation: d.lieu, estimatedLoss: d.perte || undefined, declarantData: d.declarant ?? declarantAnonyme
    };
    if (d.courrier) corps.numeroCourrier = d.courrier;
    const r = await appel(BRPD, 'POST', '/dossiers', corps);
    if (r.status !== 201) { console.log('KO création', d.cle, r.status, JSON.stringify(r.corps).slice(0, 200)); return; }
    etat[d.cle] = r.corps;
    console.log('créé', d.cle, r.corps.number, r.corps.status);
}
async function transition(cle, jeton, action, extra = {}) {
    const dossier = etat[cle];
    const r = await appel(jeton, 'PATCH', `/dossiers/${dossier.id}/${action}`, { version: dossier.version, reason: extra.reason ?? 'Formation', ...extra });
    if (r.status >= 300) { console.log(`  KO ${cle} ${action}`, r.status, JSON.stringify(r.corps).slice(0, 220)); return false; }
    etat[cle] = r.corps; console.log(`  ${cle} ${action} -> ${r.corps.status}`);
    return true;
}

for (const d of DOSSIERS) await creer(d);
// D2 : enregistré par le BRPD
await transition('D2', BRPD, 'register');
// D3 : en étude d'opportunité
if (await transition('D3', BRPD, 'register')) await transition('D3', CJ, 'start-study');
// D4 : complément demandé
if (await transition('D4', BRPD, 'register') && await transition('D4', CJ, 'start-study')) await transition('D4', CJ, 'request-complement', { reason: "Merci de préciser la date et le service concerné." });
// D5 : prêt pour le comité (CTADP)
if (await transition('D5', BRPD, 'register') && await transition('D5', CJ, 'start-study')) await transition('D5', CJ, 'submit-ctadp');
// D6 : recevable ; D7 : irrecevable
if (await transition('D6', BRPD, 'register') && await transition('D6', CJ, 'start-study') && await transition('D6', CJ, 'submit-ctadp')) await transition('D6', CGE, 'declare-admissible');
if (await transition('D7', BRPD, 'register') && await transition('D7', CJ, 'start-study') && await transition('D7', CJ, 'submit-ctadp')) await transition('D7', CGE, 'declare-inadmissible', { reason: 'Faits hors du champ de compétence (exercice de formation).' });
// D8 : enregistré seulement
await transition('D8', BRPD, 'register');
console.log('\nRésumé :', Object.entries(etat).map(([k, v]) => `${k}=${v.status}`).join('  '));
