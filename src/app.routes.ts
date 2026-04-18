import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/core/guards/auth.guard';


export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            {
                path: 'pages',
                loadChildren: () =>
                    import('./app/pages/pages.routes')
            },
            // Pages proces
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
            }
        ]
    },
    { path: 'notfound', component: Notfound },
    {
        path: 'auth',
        loadChildren: () =>
            import('./app/pages/auth/auth.routes')
    },
    // Page publique suivi citoyen — sans auth
    {
        path: 'suivi',
        loadChildren: () =>
            import('./app/pages/public/public.routes')
    },

    {
    path: 'portail',
    loadChildren: () =>
        import('./app/pages/portail/portail.routes')
},
    { path: '**', redirectTo: '/notfound' }
];