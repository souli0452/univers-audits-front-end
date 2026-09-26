/**
 * Production : le back (/api) et Keycloak (/auth) sont servis par le même nginx que la page, sous le
 * même nom de domaine. On les adresse donc par rapport à l'origine courante (ged.asce-lc.bf,
 * denoncer.asce-lc.bf, ...) : la CSP de la page (`connect-src 'self'`) refuse toute autre origine.
 */
const origine = typeof window !== 'undefined' ? window.location.origin : '';

export const environment = {
    production: true,
    apiUrl: origine + '/api/v1',
    keycloak: {
        url: origine + '/auth',
        realm: 'asce-lc',
        clientId: 'asce-lc-frontend'
    }
};
