import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { AdminGuard } from './app/guards/admin.guard';
import { AuthGuard } from './app/guards/auth.guard';
import { PublicHome } from './app/pages/public-home/public-home';
import { UserHome } from './app/pages/user-home/user-home';

export const appRoutes: Routes = [
    { path: '', component: PublicHome, pathMatch: 'full' },
    { path: 'user-home', canActivate: [AuthGuard], component: UserHome },
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    {
        path: 'admin',
        canActivate: [AdminGuard],
        loadChildren: () => import('./app/pages/admin/admin.routes')
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
