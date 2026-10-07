// Prépare un Keycloak JETABLE pour la formation : royaume « asce-lc », rôles, clients, compte administrateur,
// et le client « asce-lc-backend » (royaume master) que le back utilise pour créer les comptes d'agents.
// Usage : node creer-royaume.mjs   (Keycloak 26 démarré en mode dev sur http://localhost:8080)
// Les identifiants ci-dessous sont des valeurs de TEST pour cet environnement local uniquement.

const KC = 'http://localhost:8080';
const ADMIN = { user: 'admin', password: 'Formation-Kc#2026' };
const SECRET_BACK = 'dev';
export const ADMIN_SUB = '00000000-0000-0000-0000-000000000001';

const ROLES = [
    ['ADMIN_DDIC', 'ADMINISTRATEUR'],
    ['AGENT_BRPD', 'Agent du Bureau de Réception des Plaintes et Dénonciations'],
    ['CGE', 'Contrôleur Général État'],
    ['CGEA', 'Contrôleur Général État Adjoint'],
    ['CONSEILLER_JURIDIQUE', 'Conseiller juridique'],
    ['CONTROLEUR_ETAT', "Contrôleur d'État"],
    ['DCP', 'Direction de la Communication et de la Presse'],
    ['MEMBRE_CTADP', 'Membre Comité Traitement']
];

async function jeton() {
    const r = await fetch(`${KC}/realms/master/protocol/openid-connect/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli', username: ADMIN.user, password: ADMIN.password })
    });
    if (!r.ok) throw new Error('jeton admin : ' + r.status + ' ' + await r.text());
    return (await r.json()).access_token;
}

const t = await jeton();
const h = { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
async function api(methode, chemin, corps) {
    const r = await fetch(KC + '/admin' + chemin, { method: methode, headers: h, body: corps ? JSON.stringify(corps) : undefined });
    if (!r.ok && r.status !== 409) throw new Error(`${methode} ${chemin} : ${r.status} ${await r.text()}`);
    return r;
}

// 1) royaume
await api('POST', '/realms', {
    realm: 'asce-lc', enabled: true, displayName: 'ASCE-LC', sslRequired: 'none',
    registrationAllowed: false, loginWithEmailAllowed: true, internationalizationEnabled: true,
    supportedLocales: ['fr'], defaultLocale: 'fr', accessTokenLifespan: 3600, ssoSessionIdleTimeout: 36000,
    roles: { realm: ROLES.map(([name, description]) => ({ name, description })) },
    users: [{
        id: ADMIN_SUB, username: 'admin.formation', email: 'admin.formation@exemple.test', emailVerified: true,
        firstName: 'Administrateur', lastName: 'DDIC', enabled: true,
        credentials: [{ type: 'password', value: 'Formation-Admin#2026', temporary: false }],
        realmRoles: ['ADMIN_DDIC']
    }]
});
// 3) client du front (public, PKCE)
await api('POST', '/realms/asce-lc/clients', {
    clientId: 'asce-lc-frontend', publicClient: true, standardFlowEnabled: true, directAccessGrantsEnabled: true,
    redirectUris: ['http://localhost:4200/*', 'http://localhost:4300/*'], webOrigins: ['+'],
    attributes: { 'pkce.code.challenge.method': 'S256' }
});

// 5) client « asce-lc-backend » dans le royaume master, avec droits d'administration sur asce-lc
await api('POST', '/realms/master/clients', {
    clientId: 'asce-lc-backend', publicClient: false, serviceAccountsEnabled: true, standardFlowEnabled: false,
    secret: SECRET_BACK, clientAuthenticatorType: 'client-secret'
});
const clients = await (await api('GET', '/realms/master/clients?clientId=asce-lc-backend')).json();
const idBack = clients[0].id;
const sa = await (await api('GET', `/realms/master/clients/${idBack}/service-account-user`)).json();
const mgmt = (await (await api('GET', '/realms/master/clients?clientId=asce-lc-realm')).json())[0];
const rolesMgmt = await (await api('GET', `/realms/master/clients/${mgmt.id}/roles`)).json();
const voulus = ['manage-users', 'view-users', 'query-users', 'view-realm', 'manage-realm', 'query-groups', 'view-clients', 'query-clients'];
await api('POST', `/realms/master/users/${sa.id}/role-mappings/clients/${mgmt.id}`, rolesMgmt.filter(r => voulus.includes(r.name)));

console.log('Royaume asce-lc prêt : 8 rôles, client asce-lc-frontend, administrateur admin.formation, client asce-lc-backend.');
