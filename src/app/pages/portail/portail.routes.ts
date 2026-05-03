import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./accueil/portail-accueil')
            .then(m => m.PortailAccueil)
    },
    {
        path: 'deposer',
        loadComponent: () =>
            import('./depot-plainte/depot-plainte')
            .then(m => m.DepotPlainte)
    },
    {
        path: 'vocal',
        loadComponent: () =>
            import('./vocal/portail-vocal')
            .then(m => m.PortailVocal)
    },
    {
        path: 'suivi',
        loadComponent: () =>
            import('./suivi/portail-suivi')
            .then(m => m.PortailSuivi)
    }
] as Routes;