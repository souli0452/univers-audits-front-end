// Suite de creer-dossiers.mjs : remplit l'étude d'opportunité, soumet au comité (CTADP), déclare la recevabilité.
// Usage : node avancer-dossiers.mjs
import { COMPTES, jetonUtilisateur, appel, mdpDe } from './lib.mjs';

const jetons = {};
for (const c of COMPTES) jetons[c.role] = await jetonUtilisateur(c.username, mdpDe(c));
const CJ = jetons.CONSEILLER_JURIDIQUE, CGE = jetons.CGE, CGEA = jetons.CGEA;

const liste = (await appel(CGE, 'GET', '/dossiers?size=100')).corps;
const tous = liste.content ?? liste;
const parObjet = fragment => tous.find(d => (d.object ?? '').includes(fragment));
const D = {
    D5: parObjet('carburant'), D6: parObjet('Refus de délivrance'), D7: parObjet('Surfacturation')
};
console.log('trouvés :', Object.entries(D).map(([k, v]) => `${k}=${v?.status}`).join(' '));

// affectation : le CGE décide, le CGEA désigne le conseiller juridique (fiche d'affectation)
const agentsCJ = (await appel(CGE, 'GET', '/agents/by-role/CONSEILLER_JURIDIQUE')).corps;
const idCJ = (agentsCJ.content ?? agentsCJ)[0]?.id;
console.log('conseiller juridique :', idCJ);
for (const [cle, d] of Object.entries(D)) {
    if (!d) continue;
    const a = await appel(CGE, 'POST', `/dossiers/${d.id}/fiche-affectation`, { decisionCge: 'AFFECTATION_DIRECTE_CGEA', observationsCge: 'Dossier à examiner par le conseiller juridique (formation).' });
    const b = await appel(CGEA, 'PATCH', `/dossiers/${d.id}/fiche-affectation/affectation`, { typeDesignation: 'AGENT_CJ', agentDesigneId: idCJ, observationsCgea: 'Affecté pour étude (formation).' });
    console.log(cle, "fiche d'affectation :", a.status, '| affectation :', b.status, b.status >= 300 ? JSON.stringify(b.corps).slice(0, 160) : '');
    const h = await appel(CGE, 'POST', `/dossiers/${d.id}/habilitations`, { agentId: idCJ, reason: "Affectation du dossier au conseiller juridique (formation)." });
    console.log('   habilitation :', h.status, h.status >= 300 ? JSON.stringify(h.corps).slice(0, 140) : '');
}

const etude = {
    preoccupationReelle: true, preoccupationReelleCommentaire: "Les faits décrits sont précis et plausibles (exercice de formation).",
    competenceAsceLc: true, competenceAsceLcCommentaire: "Les faits visent un service public : compétence de l'ASCE-LC.",
    preuvesSuffisantes: true, preuvesSuffisantesCommentaire: "Des éléments de départ existent ; une enquête complètera.",
    enqueteComplementaireNecessaire: true, urgenceSecurisationPreuves: false, opportuniteSaisirProcureur: false,
    secteurSensible: false, soliditeAllegation: true, soliditeAllegationCommentaire: "Allégation étayée par des détails vérifiables.",
    avisGeneral: "Avis favorable à l'examen par le comité de traitement (dossier de formation)."
};
for (const [cle, d] of Object.entries(D)) {
    if (!d) continue;
    const r = await appel(CJ, 'PUT', `/dossiers/${d.id}/etude-opportunite`, etude);
    console.log(cle, 'étude d\'opportunité :', r.status, r.status >= 300 ? JSON.stringify(r.corps).slice(0, 200) : '');
}
async function transition(cle, jeton, action, extra = {}) {
    const frais = (await appel(CGE, 'GET', `/dossiers/${D[cle].id}`)).corps;
    const r = await appel(jeton, 'PATCH', `/dossiers/${frais.id}/${action}`, { version: frais.version, reason: extra.reason ?? 'Formation' });
    console.log(`  ${cle} ${action} ->`, r.status < 300 ? r.corps.status : r.status + ' ' + JSON.stringify(r.corps).slice(0, 200));
    return r.status < 300;
}
for (const k of ['D5', 'D6', 'D7']) await transition(k, CJ, 'submit-ctadp');
await transition('D6', CGE, 'declare-admissible');
await transition('D7', CGE, 'declare-inadmissible', { reason: 'Faits hors du champ de compétence (exercice de formation).' });
const apres = (await appel(CGE, 'GET', '/dossiers?size=100')).corps;
console.log('\nRésumé :', (apres.content ?? apres).map(d => `${(d.object ?? '').slice(13, 33)}…=${d.status}`).join(' | '));
