import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export default [
    {
        path: '',
        canActivate: [roleGuard(['ADMIN_DDIC', 'CGE', 'CGEA', 'DCP'])],
        loadComponent: () =>
            import('./rapport-etat/rapport-etat.component')
            .then(m => m.RapportEtatComponent)
    },
    {
        path: 'investigations',          
        loadComponent: () =>
            import('./rapport-investigation/rapport-investigation.component')
            .then(m => m.RapportInvestigationComponent)
    }
] as Routes;