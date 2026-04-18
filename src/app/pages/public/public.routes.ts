import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () =>
            import('./suivi-citoyen/suivi-citoyen')
            .then(m => m.SuiviCitoyen)
    }
] as Routes;