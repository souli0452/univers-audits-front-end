// Crée les comptes de formation (agents) dans la plateforme ET dans Keycloak, puis fixe leur mot de passe.
// Usage : node creer-agents.mjs   (royaume déjà créé par creer-royaume.mjs, back démarré)
import { API, KC, COMPTES, jetonKeycloakAdmin, jetonUtilisateur, appel, mdpDe } from './lib.mjs';

const admin = COMPTES[0];
const jetonAdmin = await jetonUtilisateur(admin.username, mdpDe(admin));
const kc = await jetonKeycloakAdmin();

for (const c of COMPTES.slice(1)) {
    const res = await appel(jetonAdmin, 'POST', '/agents', {
        matricule: c.matricule, firstName: c.prenom, lastName: c.nom,
        email: `${c.username}@exemple.test`, phoneNumber: '+22670000000', grade: c.libelle, keycloakRoles: [c.role]
    });
    if (res.status === 201) console.log('agent créé    :', c.username, c.role);
    else console.log('agent (déjà ?) :', c.username, res.status, String(JSON.stringify(res.corps)).slice(0, 120));

    // mot de passe définitif, aucune action requise à la connexion
    const liste = await (await fetch(`${KC}/admin/realms/asce-lc/users?username=${c.username}&exact=true`, { headers: { Authorization: 'Bearer ' + kc } })).json();
    if (!liste[0]) { console.log('  ! compte Keycloak introuvable pour', c.username); continue; }
    const id = liste[0].id;
    await fetch(`${KC}/admin/realms/asce-lc/users/${id}/reset-password`, {
        method: 'PUT', headers: { Authorization: 'Bearer ' + kc, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password', value: mdpDe(c), temporary: false })
    });
    await fetch(`${KC}/admin/realms/asce-lc/users/${id}`, {
        method: 'PUT', headers: { Authorization: 'Bearer ' + kc, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiredActions: [], emailVerified: true, enabled: true })
    });
}
// vérification : chaque compte obtient un jeton avec le bon rôle
for (const c of COMPTES) {
    const t = await jetonUtilisateur(c.username, mdpDe(c));
    const p = JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString());
    const ok = (p.realm_access?.roles ?? []).includes(c.role);
    console.log(ok ? 'OK ' : 'KO ', c.username.padEnd(16), c.role);
}
