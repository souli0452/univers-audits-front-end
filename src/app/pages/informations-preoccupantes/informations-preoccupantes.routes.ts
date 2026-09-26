import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./informations-preoccupantes-list/informations-preoccupantes-list')
            .then(m => m.InformationsPreoccupantesList)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./information-preoccupante-detail/information-preoccupante-detail')
            .then(m => m.InformationPreoccupanteDetail)
    }
] as Routes;
