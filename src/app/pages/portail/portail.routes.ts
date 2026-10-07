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
    },
    {
        path: 'chiffres',
        loadComponent: () =>
            import('./chiffres/portail-chiffres')
            .then(m => m.PortailChiffres)
    },
    {
        path: 'info/:page',
        loadComponent: () =>
            import('./info/portail-info')
            .then(m => m.PortailInfo)
    },
    {
        path: 'faq',
        loadComponent: () =>
            import('./faq/portail-faq')
            .then(m => m.PortailFaq)
    },
    {
        path: 'complement',
        loadComponent: () =>
            import('./complement/portail-complement')
            .then(m => m.PortailComplement)
    }
] as Routes;