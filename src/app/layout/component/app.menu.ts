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
                        routerLink: ['/']
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
                        routerLink: ['/dossiers']
                    },
                    {
                        label: 'Nouveau Dossier',
                        icon: 'pi pi-fw pi-plus-circle',
                        routerLink: ['/dossiers/nouveau']
                    },
                    {
                        label: 'En Attente',
                        icon: 'pi pi-fw pi-clock',
                        routerLink: ['/dossiers'],
                        queryParams: { status: 'SOUMIS' }
                    },
                    {
                        label: 'En Investigation',
                        icon: 'pi pi-fw pi-eye',
                        routerLink: ['/dossiers'],
                        queryParams: { status: 'EN_INVESTIGATION' }
                    }
                ]
            },

            { separator: true },

            // ── Investigations ────────────────────────────────
            {
                label: 'Investigations',
                items: [
                    {
                        label: 'Toutes les Enquêtes',
                        icon: 'pi pi-fw pi-search',
                        routerLink: ['/investigations']
                    },
                    {
                        label: 'En Cours',
                        icon: 'pi pi-fw pi-spin pi-spinner',
                        routerLink: ['/investigations'],
                        queryParams: { status: 'IN_PROGRESS' }
                    }
                ]
            },

            { separator: true },

            // ── Statistiques ──────────────────────────────────
            {
                label: 'Statistiques',
                items: [
                    {
                        label: 'Tableau de Bord Stats',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/statistiques']
                    },
                    {
                        label: 'Rapport Trimestriel',
                        icon: 'pi pi-fw pi-chart-pie',
                        routerLink: ['/statistiques'],
                        queryParams: { type: 'quarterly' }
                    },
                    {
                        label: 'Rapport Annuel',
                        icon: 'pi pi-fw pi-calendar',
                        routerLink: ['/statistiques'],
                        queryParams: { type: 'annual' }
                    }
                ]
            },

            { separator: true },

            // ── Services Publics ──────────────────────────────
            {
                label: 'Services Publics',
                items: [
                    {
                        label: 'Suivi Citoyen',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: ['/suivi']
                    }
                ]
            },

            { separator: true },

            // ── Administration ────────────────────────────────
            {
                label: 'Administration',
                visible: this.keycloakService.hasAnyRole([
                    'ADMIN_DDIC', 'CGE', 'CGEA'
                ]),
                items: [
                    {
                        label: 'Gestion Agents',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/administration/agents']
                    },
                    {
                        label: 'Configuration',
                        icon: 'pi pi-fw pi-cog',
                        routerLink: ['/administration/config']
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
                        routerLink: ['/pages/profile']
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