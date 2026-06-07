import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { NotificationService, NotificationItem }
    from '../../core/services/notification.service';


@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        RouterModule, CommonModule, StyleClassModule,
        AppConfigurator, Popover, ButtonModule
    ],
    template: `
<div class="layout-topbar">

    <!-- Logo -->
    <div class="layout-topbar-logo-container">
        <button class="layout-menu-button layout-topbar-action"
                (click)="layoutService.onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>
        <a class="layout-topbar-logo" routerLink="/app"
           style="display:flex;align-items:center;gap:.5rem;">
            <img src="assets/logo-integrite.png" alt="Intégrité+"
                 style="height:34px;width:auto;object-fit:contain;"/>
            <span>INTÉGRITÉ+</span>
        </a>
    </div>

    <!-- Actions -->
    <div class="layout-topbar-actions">

        <div class="layout-config-menu">
            <!-- Bouton dark/light -->
            <button type="button" class="layout-topbar-action"
                    (click)="toggleDarkMode()">
                <i [ngClass]="{
                    'pi': true,
                    'pi-moon': layoutService.isDarkTheme(),
                    'pi-sun': !layoutService.isDarkTheme()
                }"></i>
            </button>
            <!-- Configurateur thème -->
            <div class="relative">
                <button class="layout-topbar-action layout-topbar-action-highlight"
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

        <!-- Bouton menu mobile -->
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

                <!-- ── CLOCHE NOTIFICATIONS ──────────────────────── -->
                <div class="relative"
                     style="margin-right:12px;display:inline-block"
                     (click)="openPanel($event, notifPanel)">

                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-bell"></i>
                        <!-- Badge rouge non-lues -->
                        <span *ngIf="notificationService.unreadCount() > 0"
                              class="absolute top-0 right-0 flex items-center
                                     justify-center bg-red-500 text-white
                                     font-bold rounded-full"
                              style="min-width:18px;height:18px;font-size:10px;
                                     padding:0 3px;top:1px;right:1px;">
                            {{ notificationService.unreadCount() > 99
                                ? '99+' : notificationService.unreadCount() }}
                        </span>
                    </button>
                </div>

                <!-- Panel popover notifications -->
                <p-popover #notifPanel>
                    <div style="width:340px" class="flex flex-col">

                        <!-- En-tête -->
                        <div class="flex items-center justify-between px-3 py-2
                                    border-b border-surface-100">
                            <span class="font-semibold text-sm">Notifications</span>
                            <button *ngIf="notificationService.unreadCount() > 0"
                                    (click)="markAllRead()"
                                    class="text-xs text-primary-600 hover:underline
                                           cursor-pointer bg-transparent border-none">
                                Tout marquer lu
                            </button>
                        </div>

                        <!-- Chargement -->
                        <div *ngIf="loading"
                             class="flex items-center justify-center py-8">
                            <i class="pi pi-spin pi-spinner text-surface-400"></i>
                        </div>

                        <!-- Vide -->
                        <div *ngIf="!loading && recentNotifs.length === 0"
                             class="flex flex-col items-center py-8
                                    text-surface-400 text-sm gap-2">
                            <i class="pi pi-bell-slash text-2xl
                                      text-surface-300"></i>
                            Aucune notification
                        </div>

                        <!-- Liste -->
                        <div style="max-height:320px;overflow-y:auto">
                            <div *ngFor="let notif of recentNotifs"
                                 class="flex gap-3 px-3 py-2.5 cursor-pointer
                                        border-b border-surface-50 last:border-0
                                        transition-colors"
                                 [class.bg-green-50]="!notif.readAt"
                                 [class.hover:bg-green-100]="!notif.readAt"
                                 [class.hover:bg-surface-50]="!!notif.readAt"
                                 (click)="openNotif(notif, notifPanel)">

                                <!-- Icône selon type -->
                                <div class="w-8 h-8 rounded-full flex items-center
                                            justify-center flex-shrink-0 mt-0.5"
                                     [class.bg-green-100]="notif.type==='INVESTIGATION_ASSIGNMENT'"
                                     [class.bg-red-100]="notif.type.includes('ALERT')"
                                     [class.bg-blue-100]="notif.type==='STATUS_UPDATE'"
                                     [class.bg-surface-100]="isOtherType(notif.type)">
                                    <i class="text-xs"
                                       [class.pi]="true"
                                       [class.pi-search]="notif.type==='INVESTIGATION_ASSIGNMENT'"
                                       [class.text-green-600]="notif.type==='INVESTIGATION_ASSIGNMENT'"
                                       [class.pi-exclamation-triangle]="notif.type.includes('ALERT')"
                                       [class.text-red-600]="notif.type.includes('ALERT')"
                                       [class.pi-info-circle]="notif.type==='STATUS_UPDATE'"
                                       [class.text-blue-600]="notif.type==='STATUS_UPDATE'"
                                       [class.pi-bell]="isOtherType(notif.type)"
                                       [class.text-surface-400]="isOtherType(notif.type)">
                                    </i>
                                </div>

                                <!-- Texte -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-start justify-between gap-1">
                                        <div class="text-xs leading-tight text-surface-900"
                                             [class.font-semibold]="!notif.readAt"
                                             style="font-weight: {{ notif.readAt ? 400 : 600 }}">
                                            {{ notif.subject }}
                                        </div>
                                        <!-- Point non-lu -->
                                        <div *ngIf="!notif.readAt"
                                             class="w-2 h-2 rounded-full bg-green-500
                                                    flex-shrink-0 mt-1"></div>
                                    </div>
                                    <div *ngIf="notif.content"
                                         class="text-xs text-surface-400 mt-0.5 truncate">
                                        {{ notif.content | slice:0:60 }}{{ (notif.content.length) > 60 ? '…' : '' }}
                                    </div>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span *ngIf="notif.dossierNumber"
                                              class="text-xs font-mono text-primary-600
                                                     bg-primary-50 px-1 rounded">
                                            {{ notif.dossierNumber }}
                                        </span>
                                        <span class="text-xs text-surface-300">
                                            {{ formatDate(notif.createdAt) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pied -->
                        <div class="px-3 py-2 border-t border-surface-100
                                    bg-surface-50 text-center">
                            <p-button label="Voir toutes mes notifications"
                                      severity="secondary" text size="small"
                                      styleClass="w-full"
                                      (onClick)="voirTout(notifPanel)"/>
                        </div>
                    </div>
                </p-popover>

                <button type="button" class="layout-topbar-action"
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

    layoutService       = inject(LayoutService);
    notificationService = inject(NotificationService);
    private router      = inject(Router);

    recentNotifs: NotificationItem[] = [];
    loading = false;

    private pollingInterval: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.notificationService.loadUnread();
        this.loadRecentNotifs();
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

    openPanel(event: Event, panel: any): void {
        panel.toggle(event);
        this.loadRecentNotifs();
    }

    private loadRecentNotifs(): void {
        this.loading = true;
        this.notificationService.getMyNotifications(0, 5).subscribe({
            next:  page => {
                this.recentNotifs = page.content || [];
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    openNotif(notif: NotificationItem, panel: any): void {
        panel.hide();

        if (!notif.readAt) {
            this.notificationService.markAsRead(notif.id).subscribe({
                next: () => {
                    notif.readAt = new Date().toISOString();
                    this.notificationService.loadUnread();
                },
                error: () => {}
            });
        }

       
        if (notif.dossierId) {
            this.router.navigate(['/app/dossiers', notif.dossierId]);
        }
    }

    voirTout(panel: any): void {
        panel.hide();
        this.router.navigate(['/app/notifications']);
    }


    markAllRead(): void {
        this.notificationService.markAllAsRead().subscribe({
            next: () => {
                this.recentNotifs = this.recentNotifs.map(n => ({
                    ...n, readAt: new Date().toISOString()
                }));
                this.notificationService.unreadCount.set(0);
            },
            error: () => {}
        });
    }

    isOtherType(type?: string): boolean {
        if (!type) return true;
        return type !== 'INVESTIGATION_ASSIGNMENT'
            && !type.includes('ALERT')
            && type !== 'STATUS_UPDATE';
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '';
        const d    = new Date(dateStr);
        const diff = Math.floor((Date.now() - d.getTime()) / 60000);
        if (diff < 1)    return 'À l\'instant';
        if (diff < 60)   return `${diff} min`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h`;
        return d.toLocaleDateString('fr-FR');
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update(
            state => ({ ...state, darkTheme: !state.darkTheme })
        );
    }
}