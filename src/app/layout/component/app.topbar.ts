import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        RouterModule, CommonModule, StyleClassModule,
        AppConfigurator, Popover, ButtonModule
    ],
    template: `
<div class="layout-topbar">

    <div class="layout-topbar-logo-container">
    <button class="layout-menu-button layout-topbar-action"
            (click)="layoutService.onMenuToggle()">
        <i class="pi pi-bars"></i>
    </button>
    <a class="layout-topbar-logo" routerLink="/app"
   style="display:flex; align-items:center; gap:.5rem;">
    <img src="assets/logo-integrite.png"
         alt="Intégrité+"
         style="height:34px; width:auto; object-fit:contain;" />
    <span>INTÉGRITÉ+</span>
</a>
</div>

    <div class="layout-topbar-actions">
        <div class="layout-config-menu">
            <button type="button"
                    class="layout-topbar-action"
                    (click)="toggleDarkMode()">
                <i [ngClass]="{
                    'pi': true,
                    'pi-moon': layoutService.isDarkTheme(),
                    'pi-sun': !layoutService.isDarkTheme()
                }"></i>
            </button>
            <div class="relative">
                <button
                    class="layout-topbar-action layout-topbar-action-highlight"
                    pStyleClass="@next"
                    enterFromClass="hidden"
                    enterActiveClass="animate-scalein"
                    leaveToClass="hidden"
                    leaveActiveClass="animate-fadeout"
                    [hideOnOutsideClick]="true">
                    <i class="pi pi-palette"></i>
                </button>
                <app-configurator />
            </div>
        </div>

        <button class="layout-topbar-menu-button layout-topbar-action"
                pStyleClass="@next"
                enterFromClass="hidden"
                enterActiveClass="animate-scalein"
                leaveToClass="hidden"
                leaveActiveClass="animate-fadeout"
                [hideOnOutsideClick]="true">
            <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu hidden lg:block">
            <div class="layout-topbar-menu-content">

                <!-- Cloche notifications -->
                <div class="relative cursor-pointer"
                     style="margin-right: 12px; display:inline-block"
                     (click)="notifPanel.toggle($event)">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-bell"></i>
                        <span *ngIf="notificationService.unreadCount() > 0"
                              class="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                              style="font-size:10px; min-width:18px; min-height:18px; padding:2px;">
                            {{ notificationService.unreadCount() > 9
                                ? '9+' : notificationService.unreadCount() }}
                        </span>
                    </button>
                </div>

                <p-popover #notifPanel>
                    <div style="width:320px" class="p-3">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold">Notifications</h3>
                            <span class="text-xs text-surface-400">
                                {{ notificationService.unreadCount() }} non lue(s)
                            </span>
                        </div>
                        <div *ngIf="recentNotifs.length === 0"
                             class="text-center py-6 text-surface-400 text-sm">
                            <i class="pi pi-bell-slash text-2xl mb-2 block"></i>
                            Aucune notification
                        </div>
                        <div *ngFor="let notif of recentNotifs"
                             class="flex gap-3 p-2 rounded-lg hover:bg-surface-50 cursor-pointer border-b border-surface-100 last:border-0"
                             [routerLink]="notif.dossierId
                                ? ['/app/dossiers', notif.dossierId]
                                : null"
                             (click)="notifPanel.hide()">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                 [class]="notif.type === 'INTERNAL_ALERT'
                                    ? 'bg-red-100' : 'bg-blue-100'">
                                <i [class]="notif.type === 'INTERNAL_ALERT'
                                    ? 'pi pi-exclamation-triangle text-red-600 text-xs'
                                    : 'pi pi-bell text-blue-600 text-xs'">
                                </i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-medium truncate">
                                    {{ notif.subject }}
                                </div>
                                <div class="text-xs text-surface-400 truncate">
                                    {{ (notif.content || '').substring(0, 60) }}...
                                </div>
                            </div>
                        </div>
                        <p-button
                            label="Voir toutes"
                            severity="secondary"
                            text
                            size="small"
                            styleClass="w-full mt-2"
                            routerLink="/app/dossiers"
                            (onClick)="notifPanel.hide()" />
                    </div>
                </p-popover>

                <!-- Profil -->
                <button type="button"
                        class="layout-topbar-action"
                        [routerLink]="['/app/profil']">
                    <i class="pi pi-user"></i>
                    <span>Profil</span>
                </button>

            </div>
        </div>
    </div>

</div>
    `
})
export class AppTopbar implements OnInit, OnDestroy {

    items!: MenuItem[];
    recentNotifs: any[] = [];

    layoutService       = inject(LayoutService);
    notificationService = inject(NotificationService);

    // Stocker l'intervalle pour le nettoyer à la destruction
    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.notificationService.loadUnread();
        this.loadRecentNotifs();

        // Rafraîchir toutes les 30 secondes
        this.pollingInterval = setInterval(() => {
            this.notificationService.loadUnread();
            this.loadRecentNotifs();
        }, 30_000);
    }

    ngOnDestroy(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    private loadRecentNotifs(): void {
        this.notificationService.getMyNotifications(0, 5).subscribe({
            next:  page => { this.recentNotifs = page.content || []; },
            error: ()   => {}
        });
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update(
            state => ({ ...state, darkTheme: !state.darkTheme })
        );
    }
}