import { Routes } from '@angular/router';
import { Access } from './access';
import { Error } from './error';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    // Pas de formulaire de connexion propre : /app est protégé par Keycloak.
    { path: 'login', redirectTo: '/app', pathMatch: 'full' }
] as Routes;
