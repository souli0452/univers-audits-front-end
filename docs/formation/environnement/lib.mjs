// Outils communs des scripts de l'environnement de formation (valeurs de TEST, base locale jetable).
export const KC = 'http://localhost:8080';
export const API = 'http://localhost:8081/api/v1';
export const MDP_ADMIN_KC = 'Formation-Kc#2026';
export const MDP_AGENTS = 'Formation-2026!';

/** Comptes de formation : un par rôle métier (le compte administrateur est créé avec le royaume). */
export const COMPTES = [
    { username: 'admin.formation', role: 'ADMIN_DDIC', libelle: 'Administrateur DDIC', mdp: 'Formation-Admin#2026' },
    { username: 'form-brpd', matricule: 'FORM-BRPD', prenom: 'Agent BRPD', nom: 'Formation', role: 'AGENT_BRPD', libelle: 'Agent du BRPD' },
    { username: 'form-cj', matricule: 'FORM-CJ', prenom: 'Conseiller juridique', nom: 'Formation', role: 'CONSEILLER_JURIDIQUE', libelle: 'Conseiller juridique' },
    { username: 'form-cgea', matricule: 'FORM-CGEA', prenom: 'CGEA', nom: 'Formation', role: 'CGEA', libelle: "Contrôleur Général d'État Adjoint" },
    { username: 'form-cge', matricule: 'FORM-CGE', prenom: 'CGE', nom: 'Formation', role: 'CGE', libelle: "Contrôleur Général d'État" },
    { username: 'form-ctadp', matricule: 'FORM-CTADP', prenom: 'Membre CTADP', nom: 'Formation', role: 'MEMBRE_CTADP', libelle: 'Membre du comité de traitement (CTADP)' },
    { username: 'form-ce', matricule: 'FORM-CE', prenom: "Contrôleur d'État", nom: 'Formation', role: 'CONTROLEUR_ETAT', libelle: "Contrôleur d'État (enquêteur)" },
    { username: 'form-dcp', matricule: 'FORM-DCP', prenom: 'Agent DCP', nom: 'Formation', role: 'DCP', libelle: 'Direction de la Communication et de la Presse' }
];

export async function jetonKeycloakAdmin() {
    const r = await fetch(`${KC}/realms/master/protocol/openid-connect/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli', username: 'admin', password: MDP_ADMIN_KC })
    });
    return (await r.json()).access_token;
}

export async function jetonUtilisateur(username, mdp) {
    const r = await fetch(`${KC}/realms/asce-lc/protocol/openid-connect/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'password', client_id: 'asce-lc-frontend', username, password: mdp })
    });
    const j = await r.json();
    if (!j.access_token) throw new Error(`connexion ${username} : ${JSON.stringify(j)}`);
    return j.access_token;
}

/** Appel de l'API de la plateforme avec le jeton d'un compte ; renvoie { status, corps }. */
export async function appel(jeton, methode, chemin, corps) {
    const r = await fetch(API + chemin, {
        method: methode,
        headers: { Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json' },
        body: corps === undefined ? undefined : JSON.stringify(corps)
    });
    const texte = await r.text();
    let json; try { json = JSON.parse(texte); } catch { json = texte; }
    return { status: r.status, corps: json };
}

export const mdpDe = c => c.mdp ?? MDP_AGENTS;
