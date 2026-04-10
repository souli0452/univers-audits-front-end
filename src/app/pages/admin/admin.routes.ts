import { Routes } from '@angular/router';
import { AdminLayout } from './admin-layout';
import { AdminDashboard } from './admin-dashboard';

export default [
    {
        path: '',
        component: AdminLayout,
        children: [
            { path: '', component: AdminDashboard },
            { path: 'dashboard', component: AdminDashboard }
        ]
    }
] as Routes;
