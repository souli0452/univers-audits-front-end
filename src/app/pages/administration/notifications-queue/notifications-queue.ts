import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-notifications-queue',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, TagModule, DialogModule, TextareaModule,
        ToastModule, ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">File d'attente des notifications</h1>
        <p class="text-surface-400 text-sm mt-1">
            {{ totalElements }} notification(s) en attente d'envoi
        </p>
    </div>

    <div *ngIf="loading" class="flex justify-center py-12">
        <p-progressSpinner strokeWidth="4" />
    </div>

    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">
        <p-table [value]="notifications" dataKey="id" styleClass="p-datatable-sm" [rowHover]="true">
            <ng-template pTemplate="header">
                <tr>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">Type</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">Canal</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">Sujet</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">Dossier</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36">Prévue le</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">Statut</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36"></th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-n>
                <tr class="border-b border-surface-50" [class.bg-red-50]="n.overdue">
                    <td class="px-4 py-3"><span class="text-xs">{{ n.type }}</span></td>
                    <td class="px-4 py-3"><span class="text-xs font-mono">{{ n.channel }}</span></td>
                    <td class="px-4 py-3"><span class="text-sm">{{ n.subject }}</span></td>
                    <td class="px-4 py-3">
                        <span *ngIf="n.dossierNumber" class="text-xs font-mono">{{ n.dossierNumber }}</span>
                        <span *ngIf="!n.dossierNumber" class="text-xs text-surface-300">—</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-xs" [class.text-red-600]="n.overdue">{{ n.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <p-tag [value]="getStatusLabel(n.status)" [severity]="getStatusSeverity(n.status)" styleClass="text-xs" />
                        <span *ngIf="n.retryCount" class="text-xs text-surface-400 ml-1">({{ n.retryCount }} tentative(s))</span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex gap-1 justify-end">
                            <p-button *ngIf="n.status !== 'CANCELLED'" icon="pi pi-send" text size="small"
                                pTooltip="Envoyer maintenant" [loading]="actingId === n.id" (onClick)="executeSendNow(n)"/>
                            <p-button *ngIf="n.status === 'FAILED'" icon="pi pi-refresh" text size="small" severity="info"
                                pTooltip="Réessayer" [loading]="actingId === n.id" (onClick)="executeRetry(n)"/>
                            <p-button *ngIf="n.status !== 'CANCELLED'" icon="pi pi-times" text size="small" severity="danger"
                                pTooltip="Annuler" (onClick)="openCancelDialog(n)"/>
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="7">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                                <i class="pi pi-bell text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">Aucune notification en attente</p>
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <div *ngIf="!loading && totalPages > 1" class="flex items-center justify-center gap-2">
        <p-button icon="pi pi-chevron-left" text size="small" [disabled]="page === 0" (onClick)="goToPage(page - 1)"/>
        <span class="text-sm text-surface-500">Page {{ page + 1 }} / {{ totalPages }}</span>
        <p-button icon="pi pi-chevron-right" text size="small" [disabled]="page >= totalPages - 1" (onClick)="goToPage(page + 1)"/>
    </div>

</div>

<p-dialog [(visible)]="showCancelDialog" header="Annuler la notification"
    [modal]="true" [style]="{width:'440px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <label class="text-sm font-semibold text-surface-700 mb-1 block">
            Motif d'annulation <span class="text-red-500">*</span>
        </label>
        <textarea pTextarea [(ngModel)]="cancelReason" rows="3" class="w-full resize-none"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Fermer" severity="secondary" outlined (onClick)="showCancelDialog=false"/>
        <p-button label="Annuler la notification" icon="pi pi-times" severity="danger"
            [disabled]="!cancelReason.trim()"
            [loading]="cancelling" (onClick)="executeCancel()"/>
    </ng-template>
</p-dialog>
    `
})
export class NotificationsQueue implements OnInit {

    private notificationService = inject(NotificationService);
    private messageService = inject(MessageService);

    notifications: NotificationItem[] = [];
    loading = true;
    page = 0;
    totalPages = 0;
    totalElements = 0;
    actingId: string | null = null;

    showCancelDialog = false;
    cancelReason = '';
    cancelling = false;
    private cancelTarget: NotificationItem | null = null;

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.loading = true;
        this.notificationService.getPending(this.page, 20).subscribe({
            next: p => {
                this.notifications = p.content;
                this.totalPages = p.totalPages;
                this.totalElements = p.totalElements;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger la file de notifications'
                });
            }
        });
    }

    goToPage(p: number): void {
        this.page = p;
        this.load();
    }

    executeSendNow(n: NotificationItem): void {
        this.actingId = n.id;
        this.notificationService.sendNow(n.id).subscribe({
            next: updated => {
                this.actingId = null;
                if (updated.status === 'SENT') {
                    this.notifications = this.notifications.filter(x => x.id !== n.id);
                    this.totalElements--;
                    this.messageService.add({ severity: 'success', summary: 'Notification envoyée' });
                } else {
                    this.notifications = this.notifications.map(x => x.id === updated.id ? updated : x);
                    this.messageService.add({
                        severity: 'warn', summary: 'Échec de l\'envoi',
                        detail: 'La notification reste dans la file (statut : ' + this.getStatusLabel(updated.status) + ')'
                    });
                }
            },
            error: err => {
                this.actingId = null;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Envoi impossible'
                });
            }
        });
    }

    executeRetry(n: NotificationItem): void {
        this.actingId = n.id;
        this.notificationService.retry(n.id).subscribe({
            next: updated => {
                this.actingId = null;
                this.notifications = this.notifications.map(x => x.id === updated.id ? updated : x);
                this.messageService.add({ severity: 'success', summary: 'Nouvelle tentative lancée' });
            },
            error: err => {
                this.actingId = null;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Nouvelle tentative impossible'
                });
            }
        });
    }

    openCancelDialog(n: NotificationItem): void {
        this.cancelTarget = n;
        this.cancelReason = '';
        this.showCancelDialog = true;
    }

    executeCancel(): void {
        if (!this.cancelTarget || !this.cancelReason.trim()) return;
        this.cancelling = true;
        this.notificationService.cancel(this.cancelTarget.id, this.cancelReason.trim()).subscribe({
            next: () => {
                this.cancelling = false;
                this.showCancelDialog = false;
                this.notifications = this.notifications.filter(x => x.id !== this.cancelTarget!.id);
                this.totalElements--;
                this.messageService.add({ severity: 'success', summary: 'Notification annulée' });
            },
            error: err => {
                this.cancelling = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Annulation impossible'
                });
            }
        });
    }

    getStatusLabel(s: string): string {
        return ({ PENDING: 'En attente', SENT: 'Envoyée', FAILED: 'Échec', CANCELLED: 'Annulée' } as Record<string, string>)[s] ?? s;
    }

    getStatusSeverity(s: string): TagSeverity {
        return ({ PENDING: 'warn', SENT: 'success', FAILED: 'danger', CANCELLED: 'secondary' } as Record<string, TagSeverity>)[s] ?? 'info';
    }
}
