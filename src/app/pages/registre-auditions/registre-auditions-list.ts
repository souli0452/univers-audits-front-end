import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import {
    RegistreAuditionsService, RegistreAuditionEntryResponse,
    IntervieweeType, AuditionStatus, PvStatus
} from '../../core/services/registre-auditions.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-registre-auditions-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, ToastModule, ProgressSpinnerModule],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Registre des auditions</h1>
        <p class="text-surface-400 text-sm mt-1">
            {{ totalElements }} audition(s) — Toutes investigations confondues
        </p>
    </div>

    <div *ngIf="loading" class="flex justify-center py-12">
        <p-progressSpinner strokeWidth="4" />
    </div>

    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">
        <p-table [value]="entries" dataKey="auditionId" styleClass="p-datatable-sm" [rowHover]="true">
            <ng-template pTemplate="header">
                <tr>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">Dossier</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">Personne entendue</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36">Date prévue</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">Statut</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">PV</th>
                    <th class="w-16"></th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-e>
                <tr class="border-b border-surface-50">
                    <td class="px-4 py-3">
                        <span class="text-sm font-mono">{{ e.dossierNumber }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-sm font-medium">{{ e.intervieweeDisplayName }}</span>
                        <span class="text-xs text-surface-400 ml-1">({{ getIntervieweeTypeLabel(e.intervieweeType) }})</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-sm text-surface-600">{{ e.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <p-tag [value]="getAuditionStatusLabel(e.status)" [severity]="getAuditionStatusSeverity(e.status)" styleClass="text-xs" />
                    </td>
                    <td class="px-4 py-3">
                        <p-tag [value]="getPvStatusLabel(e.pvStatus)" [severity]="getPvStatusSeverity(e.pvStatus)" styleClass="text-xs" />
                    </td>
                    <td class="px-4 py-3">
                        <p-button icon="pi pi-external-link" text size="small"
                            [routerLink]="['/app/investigations', e.investigationId]"/>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="6">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                                <i class="pi pi-users text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">Aucune audition enregistrée</p>
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
    `
})
export class RegistreAuditionsList implements OnInit {

    private registreAuditionsService = inject(RegistreAuditionsService);
    private messageService = inject(MessageService);

    entries: RegistreAuditionEntryResponse[] = [];
    loading = true;
    page = 0;
    totalPages = 0;
    totalElements = 0;

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.loading = true;
        this.registreAuditionsService.findAll(this.page, 20).subscribe({
            next: p => {
                this.entries = p.content;
                this.totalPages = p.totalPages;
                this.totalElements = p.totalElements;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger le registre des auditions'
                });
            }
        });
    }

    goToPage(p: number): void {
        this.page = p;
        this.load();
    }

    getIntervieweeTypeLabel(t: IntervieweeType): string {
        return ({
            TARGETED_PARTY: 'Partie visée',
            WITNESS: 'Témoin',
            DECLARANT: 'Dénonciateur'
        } as Record<string, string>)[t] ?? t;
    }

    getAuditionStatusLabel(s: AuditionStatus): string {
        return ({
            SCHEDULED: 'Planifiée', CONDUCTED: 'Tenue',
            CANCELLED: 'Annulée', NO_SHOW: 'Absence'
        } as Record<string, string>)[s] ?? s;
    }

    getAuditionStatusSeverity(s: AuditionStatus): TagSeverity {
        return ({
            SCHEDULED: 'info', CONDUCTED: 'success',
            CANCELLED: 'secondary', NO_SHOW: 'danger'
        } as Record<string, TagSeverity>)[s] ?? 'info';
    }

    getPvStatusLabel(s: PvStatus): string {
        return ({
            AUCUN_PV: 'Aucun', BROUILLON: 'Brouillon', FINALISE: 'Finalisé'
        } as Record<string, string>)[s] ?? s;
    }

    getPvStatusSeverity(s: PvStatus): TagSeverity {
        return ({
            AUCUN_PV: 'secondary', BROUILLON: 'warn', FINALISE: 'success'
        } as Record<string, TagSeverity>)[s] ?? 'secondary';
    }
}
