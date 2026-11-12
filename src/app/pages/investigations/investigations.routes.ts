import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export default [
    {
        path: '',
        canActivate: [roleGuard(['ADMIN_DDIC', 'CGE', 'CGEA', 'CONTROLEUR_ETAT'])],
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