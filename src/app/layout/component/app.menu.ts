import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { KeycloakService } from '../../core/auth/keycloak.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
    <ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem
                *ngIf="!item.separator"
                [item]="item"
                [index]="i"
                [root]="true">
            </li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul>
    `
})
export class AppMenu {

    private keycloakService = inject(KeycloakService);

    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [

            // ── Accueil ────────────────────────────────────────
            {
                label: 'Accueil',
                items: [
                    {
                        label: 'Tableau de Bord',
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/app']
                    }
                ]
            },

            { separator: true },

            // ── Gestion des Dossiers ───────────────────────────
            {
                label: 'Dossiers',
                items: [
                    {
                        label: 'Tous les Dossiers',
                        icon: 'pi pi-fw pi-folder',
                        routerLink: ['/app/dossiers']
                    },
                    {
                        label: 'Nouveau Dossier',
                        icon: 'pi pi-fw pi-plus-circle',
                        routerLink: ['/app/dossiers/nouveau']
                    },
{
    label: 'Denonciation Audio',
    icon: 'pi pi-fw pi-microphone',
    routerLink: ['/app/dossiers/audio']
},
                ]
            },

            { separator: true },

            // ── Investigations ─────────────────────────────────
            {
                label: 'Investigations',
                items: [
                    {
                        label: 'Toutes les Enquêtes',
                        icon: 'pi pi-fw pi-search',
                        routerLink: ['/app/investigations']
                    },
                    {
                        label: 'En Cours',
                        icon: 'pi pi-fw pi-spin pi-spinner',
                        routerLink: ['/app/investigations'],
                        queryParams: { status: 'IN_PROGRESS' }
                    }
                ]
            },

            { separator: true },

            // ── Statistiques ───────────────────────────────────
            {
                label: 'Statistiques',
                items: [
                    {
                        label: 'Tableau de Bord Stats',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/app/statistiques']
                    },
                  
                ]
            },

            { separator: true },

            // ── Administration ─────────────────────────────────
            {
                label: 'Administration',
                visible: this.keycloakService.hasAnyRole([
                    'ADMIN_DDIC', 'CGE', 'CGEA'
                ]),
                items: [
                    {
                        label: 'Gestion Agents',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/app/administration/agents']
                    },
                    {
                        label: 'Configuration',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/app/administration/config']
                    }
                ]
            },

            { separator: true },

            // ── Compte ────────────────────────────────────────
            {
                label: 'Compte',
                items: [
                    {
                        label: 'Mon Profil',
                        icon: 'pi pi-fw pi-user',
                        routerLink: ['/app/profil']  
                    },
                    {
                        label: 'Se Déconnecter',
                        icon: 'pi pi-fw pi-sign-out',
                        command: () => this.keycloakService.logout()
                    }
                ]
            }

        ];
    }
}