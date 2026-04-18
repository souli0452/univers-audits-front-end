import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {

    private _keycloak: Keycloak | undefined;

    get keycloak() {
        if (!this._keycloak) {
            this._keycloak = new Keycloak({
                url: environment.keycloak.url,
                realm: environment.keycloak.realm,
                clientId: environment.keycloak.clientId
            });
        }
        return this._keycloak;
    }

    async init(): Promise<void> {
        const authenticated = await this.keycloak.init({
            onLoad: 'login-required',
            silentCheckSsoRedirectUri:
                window.location.origin + '/silent-check-sso.html',
            pkceMethod: 'S256',
            checkLoginIframe: false
        });

        if (!authenticated) {
            await this.keycloak.login();
        }
    }

    async getToken(): Promise<string> {
        try {
            await this.keycloak.updateToken(30);
        } catch {
            await this.keycloak.login();
        }
        return this.keycloak.token ?? '';
    }

    getUserInfo() {
        const t = this.keycloak.tokenParsed;
        return {
            id: t?.['sub'] ?? '',
            username: t?.['preferred_username'] ?? '',
            firstName: t?.['given_name'] ?? '',
            lastName: t?.['family_name'] ?? '',
            email: t?.['email'] ?? '',
            fullName: ((t?.['given_name'] ?? '') + ' ' +
                       (t?.['family_name'] ?? '')).trim(),
            roles: this.getRoles()
        };
    }

    getRoles(): string[] {
        return this.keycloak.tokenParsed
            ?.['realm_access']?.['roles'] ?? [];
    }

    hasRole(role: string): boolean {
        return this.getRoles().includes(role);
    }

    hasAnyRole(roles: string[]): boolean {
        return roles.some(r => this.hasRole(r));
    }

    isAuthenticated(): boolean {
        return !!this.keycloak.authenticated;
    }

    login(): void {
        this.keycloak.login();
    }

    logout(): void {
        this.keycloak.logout({
            redirectUri: window.location.origin
        });
    }
}