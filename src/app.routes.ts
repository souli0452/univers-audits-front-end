import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/core/guards/auth.guard';

export const appRoutes: Routes = [

    // Portail public — page d'accueil sans auth
    {
        path: '',
        loadComponent: () =>
            import('./app/pages/portail/accueil/portail-accueil')
            .then(m => m.PortailAccueil)
    },
    {
        path: 'portail',
        loadChildren: () =>
            import('./app/pages/portail/portail.routes')
    },

    // Application interne — avec auth et layout Sakai
    {
        path: 'app',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            {
                path: 'pages',
                loadChildren: () =>
                    import('./app/pages/pages.routes')
            },
            {
                path: 'dossiers',
                loadChildren: () =>
                    import('./app/pages/dossiers/dossiers.routes')
            },
            {
                path: 'investigations',
                loadChildren: () =>
                    import('./app/pages/investigations/investigations.routes')
            },
            {
                path: 'statistiques',
                loadChildren: () =>
                    import('./app/pages/statistiques/statistiques.routes')
            },
            {
                path: 'administration',
                loadChildren: () =>
                    import('./app/pages/administration/administration.routes')
            },
            {
                path: 'profil',
                loadComponent: () =>
                    import('./app/pages/profil/profil')
                    .then(m => m.Profil)
            }
        ]
    },

    // Suivi public sans auth
    

    { path: 'notfound', component: Notfound },
    {
        path: 'auth',
        loadChildren: () =>
            import('./app/pages/auth/auth.routes')
    },
    { path: '**', redirectTo: '/notfound' }
];