import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./statistiques-dashboard/statistiques-dashboard')
            .then(m => m.StatistiquesDashboard)
    }
] as Routes;