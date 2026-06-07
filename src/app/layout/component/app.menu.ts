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

        {
            label: 'Navigation',
            items: [
                {
                    label: 'Tableau de bord',
                    icon: 'pi pi-fw pi-home',
                    routerLink: ['/app']
                },
                {
                    label: 'Statistiques',
                    icon: 'pi pi-fw pi-chart-bar',
                    routerLink: ['/app/statistiques']
                }
            ]
        },

        { separator: true },

        {
            label: 'Dossiers',
            items: [
                {
                    label: 'Tous les dossiers',
                    icon: 'pi pi-fw pi-folder',
                    routerLink: ['/app/dossiers']
                },
                {
                    label: 'Nouveau dossier',
                    icon: 'pi pi-fw pi-plus-circle',
                    routerLink: ['/app/dossiers/nouveau']
                },
                {
                    label: 'Dépôt audio',
                    icon: 'pi pi-fw pi-microphone',
                    routerLink: ['/app/dossiers/audio']
                },
                {
                    label: 'Rapports',
                    icon:  'pi pi-chart-bar',
                    routerLink: ['/app/rapports']
                }
            ]
        },

        { separator: true },

        {
            label: 'Investigations',
            items: [
                {
                    label: 'Toutes les enquêtes',
                    icon: 'pi pi-fw pi-search',
                    routerLink: ['/app/investigations']
                },
                {
            label: 'Rapport investigations',
            icon:  'pi pi-fw pi-chart-bar',
            routerLink: ['/app/rapports/investigations']
        }
            ]
        },

        { separator: true },

        {
            label: 'Administration',
            visible: this.keycloakService.hasAnyRole([
                'ADMIN_DDIC', 'CGE', 'CGEA'
            ]),
            items: [
                {
                    label: 'Agents',
                    icon: 'pi pi-fw pi-users',
                    routerLink: ['/app/administration/agents']
                },
                {
                    label: 'Rôles & Permissions',
                    icon: 'pi pi-fw pi-shield',
                    routerLink: ['/app/administration/roles']
                },
                {
                    label: 'Journal d\'audit',
                    icon: 'pi pi-fw pi-history',
                    routerLink: ['/app/administration/audit']
                },
                {
                    label: 'Paramètres du portail',
                    icon: 'pi pi-fw pi-sliders-h',
                    routerLink: ['/app/administration/parametres-portail']
                }
                            ]
        },

        { separator: true },

        {
            label: 'Compte',
            items: [
                {
                    label: 'Mon profil',
                    icon: 'pi pi-fw pi-user',
                    routerLink: ['/app/profil']
                },
                {
                    label: 'Se déconnecter',
                    icon: 'pi pi-fw pi-sign-out',
                    command: () => this.keycloakService.logout()
                }
            ]
        }
    ];
}
}