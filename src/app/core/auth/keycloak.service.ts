import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {

    private keycloak: Keycloak;

    constructor() {
        this.keycloak = new Keycloak({
            url:      environment.keycloak.url,
            realm:    environment.keycloak.realm,
            clientId: environment.keycloak.clientId
        });
    }

    async init(): Promise<void> {
        // Pas de "check-sso" silencieux (iframe) : le CSP par défaut de
        // Keycloak (frame-ancestors 'self') bloque son propre contenu
        // d'être chargé dans une iframe d'une autre origine (localhost:4210).
        // La connexion se fait explicitement via authGuard -> login()
        // (redirection pleine page, pas d'iframe).
        await this.keycloak.init({
            pkceMethod:       'S256',
            checkLoginIframe: false
        });
    }

    isAuthenticated(): boolean {
        return !!this.keycloak.authenticated;
    }

    login(): void {
        this.keycloak.login({
            redirectUri: window.location.origin + '/#/app'
        });
    }

    logout(): void {
        this.keycloak.logout({
            redirectUri: window.location.origin + '/#/portail'
        });
    }

    async getValidToken(): Promise<string | undefined> {
        try {
            await this.keycloak.updateToken(30);
        } catch {
            this.login();
        }
        return this.keycloak.token;
    }

    getUserInfo() {
        const p = this.keycloak.tokenParsed;
        return {
            id:        p?.['sub']         || '',
            username:  p?.['preferred_username'] || '',
            firstName: p?.['given_name']  || '',
            lastName:  p?.['family_name'] || '',
            email:     p?.['email']       || '',
            fullName:  p?.['name']        || '',
            roles:     p?.['realm_access']?.['roles'] || []
        };
    }

    hasRole(role: string): boolean {
        return this.keycloak.hasRealmRole(role);
    }

    hasAnyRole(roles: string[]): boolean {
        return roles.some(r => this.keycloak.hasRealmRole(r));
    }
}