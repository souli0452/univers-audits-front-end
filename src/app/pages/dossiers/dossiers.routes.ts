import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./dossiers-list/dossiers-list')
            .then(m => m.DossiersList)
    },
    {
        path: 'nouveau',
        loadComponent: () =>
            import('./dossier-form/dossier-form')
            .then(m => m.DossierForm)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./dossier-detail/dossier-detail')
            .then(m => m.DossierDetail)
    }
] as Routes;