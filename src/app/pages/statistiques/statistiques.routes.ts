import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./statistiques-dashboard/statistiques-dashboard')
            .then(m => m.StatistiquesDashboard)
    },
    {
        path: 'depassements-par-acteur',
        canActivate: [roleGuard(['ADMIN_DDIC', 'CGE', 'CGEA'])],
        loadComponent: () =>
            import('./depassements-par-acteur/depassements-par-acteur')
            .then(m => m.DepassementsParActeur)
    }
] as Routes;