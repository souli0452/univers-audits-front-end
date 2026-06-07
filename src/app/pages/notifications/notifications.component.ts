import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    NotificationService,
    NotificationItem,
    NotificationPage
} from '../../core/services/notification.service';

type FilterType = 'ALL' | 'UNREAD' | 'INVESTIGATION' | 'ALERT' | 'STATUS';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [
        CommonModule, RouterModule, ButtonModule,
        TagModule, ToastModule, SkeletonModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <!-- En-tête -->
    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Mes notifications
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                {{ totalElements }} notification(s)
                <span *ngIf="unreadCount() > 0" class="text-red-500 font-semibold">
                    · {{ unreadCount() }} non lue(s)
                </span>
            </p>
        </div>
        <p-button *ngIf="unreadCount() > 0"
            label="Tout marquer comme lu"
            icon="pi pi-check-circle"
            severity="secondary" outlined size="small"
            [loading]="markingAll"
            (onClick)="markAllRead()"/>
    </div>

    <!-- Filtres -->
    <div class="flex items-center gap-2 flex-wrap">
        <button *ngFor="let f of filters"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                   text-xs font-semibold border transition-all cursor-pointer"
            [class.bg-surface-900]="activeFilter === f.key"
            [class.text-white]="activeFilter === f.key"
            [class.border-surface-900]="activeFilter === f.key"
            [class.bg-white]="activeFilter !== f.key"
            [class.text-surface-500]="activeFilter !== f.key"
            [class.border-surface-200]="activeFilter !== f.key"
            (click)="setFilter(f.key)">
            <i [class]="'pi ' + f.icon" style="font-size:10px"></i>
            {{ f.label }}
            <span *ngIf="f.count > 0"
                class="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                [class.bg-white]="activeFilter === f.key"
                [class.text-surface-900]="activeFilter === f.key"
                [class.bg-surface-100]="activeFilter !== f.key"
                [class.text-surface-600]="activeFilter !== f.key">
                {{ f.count }}
            </span>
        </button>
    </div>

    <!-- Skeleton -->
    <div *ngIf="loading" class="flex flex-col gap-3">
        <p-skeleton *ngFor="let i of [1,2,3,4,5]"
            height="72px" borderRadius="12px"/>
    </div>

    <!-- Liste vide -->
    <div *ngIf="!loading && filtered().length === 0"
        class="bg-white dark:bg-surface-800 rounded-2xl p-16
               border border-surface-100 text-center">
        <div class="w-16 h-16 rounded-2xl bg-surface-100
                    flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-bell-slash text-2xl text-surface-300"></i>
        </div>
        <p class="font-semibold text-surface-500">Aucune notification</p>
        <p class="text-xs text-surface-400 mt-1">
            {{ activeFilter === 'UNREAD'
                ? 'Toutes vos notifications ont été lues'
                : 'Aucune notification dans cette catégorie' }}
        </p>
    </div>

    <!-- Liste notifications -->
    <div *ngIf="!loading && filtered().length > 0"
        class="bg-white dark:bg-surface-800 rounded-2xl
               border border-surface-100 dark:border-surface-700 overflow-hidden">

        <div *ngFor="let notif of filtered(); let last = last"
            class="flex items-start gap-4 px-5 py-4 cursor-pointer
                   transition-colors border-b border-surface-50 dark:border-surface-700"
            [class.bg-green-50]="!notif.readAt"
            [class.hover:bg-green-100]="!notif.readAt"
            [class.hover:bg-surface-50]="!!notif.readAt"
            (click)="open(notif)">

            <!-- Icône -->
            <div class="w-10 h-10 rounded-xl flex items-center justify-center
                        flex-shrink-0 mt-0.5"
                [class.bg-green-100]="isInvestigation(notif)"
                [class.bg-red-100]="isAlert(notif)"
                [class.bg-blue-100]="isStatus(notif)"
                [class.bg-amber-100]="isComplement(notif)"
                [class.bg-surface-100]="isOther(notif)">
                <i class="pi"
                    [class.pi-search]="isInvestigation(notif)"
                    [class.text-green-600]="isInvestigation(notif)"
                    [class.pi-exclamation-triangle]="isAlert(notif)"
                    [class.text-red-600]="isAlert(notif)"
                    [class.pi-info-circle]="isStatus(notif)"
                    [class.text-blue-600]="isStatus(notif)"
                    [class.pi-question-circle]="isComplement(notif)"
                    [class.text-amber-600]="isComplement(notif)"
                    [class.pi-bell]="isOther(notif)"
                    [class.text-surface-400]="isOther(notif)"
                    style="font-size:.875rem"></i>
            </div>

            <!-- Contenu -->
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-sm text-surface-900 dark:text-surface-0 leading-tight"
                            [class.font-bold]="!notif.readAt"
                            [class.font-medium]="!!notif.readAt">
                            {{ notif.subject }}
                        </p>
                        <p *ngIf="notif.content"
                            class="text-xs text-surface-500 mt-1 leading-relaxed line-clamp-2">
                            {{ notif.content }}
                        </p>
                    </div>
                    <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <div *ngIf="!notif.readAt"
                            class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <span class="text-xs text-surface-300 whitespace-nowrap">
                            {{ formatDate(notif.createdAt) }}
                        </span>
                    </div>
                </div>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                    <span *ngIf="notif.dossierNumber"
                        class="text-xs font-mono font-semibold text-primary-600
                               bg-primary-50 border border-primary-100 px-2 py-0.5 rounded">
                        {{ notif.dossierNumber }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium border"
                        [class]="getTypeBadgeClass(notif.type)">
                        {{ getTypeLabel(notif.type) }}
                    </span>
                    <span *ngIf="notif.readAt"
                        class="text-xs text-surface-300 flex items-center gap-1">
                        <i class="pi pi-check" style="font-size:9px"></i> Lu
                    </span>
                </div>
            </div>

            <!-- Boutons actions -->
            <div class="flex gap-1 flex-shrink-0 self-center">
                <p-button *ngIf="!notif.readAt"
                    icon="pi pi-check" severity="success" text size="small"
                    pTooltip="Marquer comme lu" tooltipPosition="left"
                    (click)="$event.stopPropagation(); markRead(notif)"/>
                <p-button *ngIf="notif.dossierId"
                    icon="pi pi-arrow-right" severity="info" text size="small"
                    pTooltip="Ouvrir le dossier" tooltipPosition="left"
                    (click)="$event.stopPropagation(); goToDossier(notif)"/>
            </div>
        </div>
    </div>

    <!-- Pagination -->
    <div *ngIf="totalPages > 1"
        class="flex items-center justify-center gap-2">
        <p-button icon="pi pi-chevron-left" severity="secondary" outlined size="small"
            [disabled]="currentPage === 0"
            (onClick)="goToPage(currentPage - 1)"/>
        <span class="text-sm text-surface-500 px-3">
            Page {{ currentPage + 1 }} / {{ totalPages }}
        </span>
        <p-button icon="pi pi-chevron-right" severity="secondary" outlined size="small"
            [disabled]="currentPage >= totalPages - 1"
            (onClick)="goToPage(currentPage + 1)"/>
    </div>

</div>
    `
})
export class NotificationsComponent implements OnInit {

    private notifService: NotificationService = inject(NotificationService);
    private router:       Router              = inject(Router);
    private msgService:   MessageService      = inject(MessageService);

    notifications = signal<NotificationItem[]>([]);
    unreadCount   = this.notifService.unreadCount;

    loading       = false;
    markingAll    = false;
    totalElements = 0;
    totalPages    = 0;
    currentPage   = 0;
    pageSize      = 20;

    activeFilter: FilterType = 'ALL';

    readonly filters: { key: FilterType; label: string; icon: string; count: number }[] = [
        { key: 'ALL',           label: 'Toutes',         icon: 'pi-list',                 count: 0 },
        { key: 'UNREAD',        label: 'Non lues',        icon: 'pi-circle-fill',          count: 0 },
        { key: 'INVESTIGATION', label: 'Investigations',  icon: 'pi-search',               count: 0 },
        { key: 'ALERT',         label: 'Alertes',         icon: 'pi-exclamation-triangle', count: 0 },
        { key: 'STATUS',        label: 'Mises à jour',    icon: 'pi-info-circle',          count: 0 },
    ];

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.notifService.getMyNotifications(this.currentPage, this.pageSize)
            .subscribe({
                next: (page: NotificationPage) => {
                    this.notifications.set(page.content ?? []);
                    this.totalElements = page.totalElements;
                    this.totalPages    = page.totalPages;
                    this.updateCounts(page.content ?? []);
                    this.loading = false;
                },
                error: () => { this.loading = false; }
            });
    }

    filtered(): NotificationItem[] {
        const all = this.notifications();
        switch (this.activeFilter) {
            case 'UNREAD':        return all.filter(n => !n.readAt);
            case 'INVESTIGATION': return all.filter(n => n.type === 'INVESTIGATION_ASSIGNMENT');
            case 'ALERT':         return all.filter(n => n.type.includes('ALERT'));
            case 'STATUS':        return all.filter(n => n.type === 'STATUS_UPDATE');
            default:              return all;
        }
    }

    setFilter(f: FilterType): void { this.activeFilter = f; }

    goToPage(p: number): void {
        this.currentPage = p;
        this.load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    open(notif: NotificationItem): void {
        if (!notif.readAt) this.markRead(notif);
        if (notif.dossierId) this.router.navigate(['/app/dossiers', notif.dossierId]);
    }

    goToDossier(notif: NotificationItem): void {
        if (notif.dossierId) this.router.navigate(['/app/dossiers', notif.dossierId]);
    }

    markRead(notif: NotificationItem): void {
        this.notifService.markAsRead(notif.id).subscribe({
            next: () => {
                notif.readAt = new Date().toISOString();
                this.notifService.loadUnread();
                this.updateCounts(this.notifications());
            },
            error: () => {}
        });
    }

    markAllRead(): void {
        this.markingAll = true;
        this.notifService.markAllAsRead().subscribe({
            next: () => {
                this.notifications.update(list =>
                    list.map(n => ({ ...n, readAt: new Date().toISOString() }))
                );
                this.notifService.unreadCount.set(0);
                this.updateCounts(this.notifications());
                this.markingAll = false;
                this.msgService.add({
                    severity: 'success',
                    summary:  'Notifications lues',
                    detail:   'Toutes les notifications ont été marquées comme lues'
                });
            },
            error: () => { this.markingAll = false; }
        });
    }

    private updateCounts(list: NotificationItem[]): void {
        this.filters[0].count = list.length;
        this.filters[1].count = list.filter(n => !n.readAt).length;
        this.filters[2].count = list.filter(n => n.type === 'INVESTIGATION_ASSIGNMENT').length;
        this.filters[3].count = list.filter(n => n.type.includes('ALERT')).length;
        this.filters[4].count = list.filter(n => n.type === 'STATUS_UPDATE').length;
    }

    isInvestigation(n: NotificationItem): boolean { return n.type === 'INVESTIGATION_ASSIGNMENT'; }
    isAlert(n: NotificationItem): boolean         { return n.type.includes('ALERT') || n.type.includes('DEADLINE'); }
    isStatus(n: NotificationItem): boolean        { return n.type === 'STATUS_UPDATE'; }
    isComplement(n: NotificationItem): boolean    { return n.type === 'COMPLEMENT_REQUEST'; }
    isOther(n: NotificationItem): boolean {
        return !this.isInvestigation(n) && !this.isAlert(n)
            && !this.isStatus(n) && !this.isComplement(n);
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            INVESTIGATION_ASSIGNMENT: 'Investigation',
            DEADLINE_ALERT:           'Alerte délai',
            INTERNAL_ALERT:           'Alerte interne',
            INVESTIGATION_ALERT:      'Alerte investigation',
            STATUS_UPDATE:            'Mise à jour',
            COMPLEMENT_REQUEST:       'Complément',
            RECEIPT_B4:               'Récépissé B4',
            ACKNOWLEDGMENT_B5:        'AR B5',
        };
        return labels[type] ?? type;
    }

    getTypeBadgeClass(type: string): string {
        if (type === 'INVESTIGATION_ASSIGNMENT') return 'bg-green-50 text-green-700 border-green-200';
        if (type.includes('ALERT'))              return 'bg-red-50 text-red-700 border-red-200';
        if (type === 'STATUS_UPDATE')            return 'bg-blue-50 text-blue-700 border-blue-200';
        if (type === 'COMPLEMENT_REQUEST')       return 'bg-amber-50 text-amber-700 border-amber-200';
        return 'bg-surface-50 text-surface-500 border-surface-200';
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '';
        const d    = new Date(dateStr);
        const diff = Math.floor((Date.now() - d.getTime()) / 60000);
        if (diff < 1)     return 'À l\'instant';
        if (diff < 60)    return `Il y a ${diff} min`;
        if (diff < 1440)  return `Il y a ${Math.floor(diff / 60)}h`;
        if (diff < 10080) return `Il y a ${Math.floor(diff / 1440)}j`;
        return d.toLocaleDateString('fr-FR');
    }
}