import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./investigations-list/investigations-list')
            .then(m => m.InvestigationsList)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./investigation-detail/investigation-detail')
            .then(m => m.InvestigationDetail)
    }
] as Routes;