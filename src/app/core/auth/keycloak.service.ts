import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class KeycloakService {

    private keycloak: Keycloak;

    constructor() {
        this.keycloak = new Keycloak({
            url:      'http://localhost:8080',
            realm:    'asce-lc',
            clientId: 'asce-lc-frontend'
        });
    }

    async init(): Promise<void> {
        await this.keycloak.init({
            onLoad:   'check-sso',        
            silentCheckSsoRedirectUri:
                window.location.origin + '/silent-check-sso.html',
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