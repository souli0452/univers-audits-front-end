import { Routes } from '@angular/router';

export default [
    {
        path: '',                        
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