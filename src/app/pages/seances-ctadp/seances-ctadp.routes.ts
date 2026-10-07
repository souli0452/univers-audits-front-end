import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./seances-ctadp-list/seances-ctadp-list')
            .then(m => m.SeancesCtadpList)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./seance-ctadp-detail/seance-ctadp-detail')
            .then(m => m.SeanceCtadpDetail)
    }
] as Routes;
