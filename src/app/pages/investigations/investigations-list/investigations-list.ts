import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    InvestigationService,
    InvestigationResponse,
    InvestigationStatus
} from '../../../core/services/investigation.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-investigations-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, TableModule,
        SkeletonModule, ToastModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <!-- ── En-tête ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Investigations
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                {{ totalRecords }} enquête(s) au total
            </p>
        </div>
    </div>

    <!-- ── KPIs ────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let kpi of kpis"
            class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100 dark:border-surface-700 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class]="kpi.bgClass">
                <i [class]="kpi.icon + ' ' + kpi.iconClass"></i>
            </div>
            <div>
                <div class="text-xl font-bold" [class]="kpi.valueClass">
                    {{ kpi.value }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">
                    {{ kpi.label }}
                </div>
            </div>
        </div>
    </div>

    <!-- ── Filtres statut ──────────────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100 dark:border-surface-700">
        <div class="flex gap-2 flex-wrap items-center">
            <span class="text-xs text-surface-400 font-medium uppercase tracking-wide mr-2">
                Filtrer :
            </span>
            <button *ngFor="let f of statusFilters"
                (click)="filterByStatus(f.value)"
                class="px-4 py-1.5 rounded-full text-sm font-semibold border transition-all cursor-pointer"
                [style.background]="selectedStatus === f.value ? f.color : 'transparent'"
                [style.border-color]="f.color"
                [style.color]="selectedStatus === f.value ? '#fff' : f.color">
                {{ f.label }}
                <span *ngIf="f.count !== undefined"
                    class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                    [style.background]="selectedStatus === f.value ? 'rgba(255,255,255,.25)' : f.color + '22'"
                    [style.color]="selectedStatus === f.value ? '#fff' : f.color">
                    {{ f.count }}
                </span>
            </button>
        </div>
    </div>

    <!-- ── Squelettes ──────────────────────────────────────── -->
    <div *ngIf="loading" class="flex flex-col gap-3">
        <p-skeleton *ngFor="let i of skeletonRows" height="60px" borderRadius="12px" />
    </div>

    <!-- ── Tableau ─────────────────────────────────────────── -->
    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden">

        <p-table [value]="investigations"
            [paginator]="investigations.length > 0"
            [rows]="pageSize" [rowsPerPageOptions]="[10,20,50]"
            dataKey="id" styleClass="p-datatable-sm" [rowHover]="true">

            <ng-template pTemplate="header">
                <tr>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36">
                        Dossier
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">
                        Objet
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">
                        Statut
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-40">
                        Progression
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">
                        Délai
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-20">
                        Équipe
                    </th>
                    <th class="w-16"></th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-inv>
                <tr class="border-b border-surface-50 dark:border-surface-700 cursor-pointer transition-colors"
                    [routerLink]="['/app/investigations', inv.id]">

                    <!-- Dossier -->
                    <td class="px-4 py-3">
                        <span class="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                            {{ inv.dossierNumber || '—' }}
                        </span>
                    </td>

                    <!-- Objet -->
                    <td class="px-4 py-3">
                        <div class="text-sm font-medium text-surface-900 dark:text-surface-0 truncate max-w-xs">
                            {{ inv.dossierObject || 'Non renseigné' }}
                        </div>
                    </td>

                    <!-- Statut -->
                    <td class="px-4 py-3">
                        <p-tag [value]="getStatusLabel(inv.status)"
                            [severity]="getStatusSeverity(inv.status)"
                            styleClass="text-xs" />
                    </td>

                    <!-- Progression barre custom -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="flex-1 h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden" style="min-width:60px;">
                                <div class="h-full rounded-full transition-all"
                                    [style.width]="getProgress(inv) + '%'"
                                    [style.background]="getProgressColor(inv)">
                                </div>
                            </div>
                            <span class="text-xs font-semibold text-surface-500 w-8 text-right flex-shrink-0">
                                {{ getProgress(inv) }}%
                            </span>
                        </div>
                    </td>

                    <!-- Délai -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full flex-shrink-0"
                                [class.bg-red-500]="inv.overdue"
                                [class.bg-amber-400]="!inv.overdue && (inv.remainingDays || 0) <= 10"
                                [class.bg-green-500]="!inv.overdue && (inv.remainingDays || 0) > 10">
                            </div>
                            <span class="text-xs font-medium"
                                [class.text-red-600]="inv.overdue"
                                [class.text-amber-600]="!inv.overdue && (inv.remainingDays || 0) <= 10"
                                [class.text-green-600]="!inv.overdue && (inv.remainingDays || 0) > 10">
                                {{ inv.overdue ? 'En retard' : (inv.remainingDays || 0) + 'j restants' }}
                            </span>
                        </div>
                    </td>

                    <!-- Équipe -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <div class="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                                <i class="pi pi-users text-purple-600" style="font-size:.65rem;"></i>
                            </div>
                            <span class="text-sm font-semibold text-surface-700 dark:text-surface-200">
                                {{ inv.memberCount || 0 }}
                            </span>
                        </div>
                    </td>

                    <!-- Action -->
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                        <p-button icon="pi pi-eye" severity="info" text size="small"
                            [routerLink]="['/app/investigations', inv.id]"
                            pTooltip="Voir" tooltipPosition="top" />
                    </td>

                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="7">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                                <i class="pi pi-search text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">Aucune investigation trouvée</p>
                            <button *ngIf="selectedStatus"
                                (click)="filterByStatus(null)"
                                class="mt-3 text-sm text-primary-600 underline cursor-pointer bg-transparent border-none">
                                Voir toutes les investigations
                            </button>
                        </div>
                    </td>
                </tr>
            </ng-template>

        </p-table>
    </div>

</div>
    `
})
export class InvestigationsList implements OnInit {

    private investigationService = inject(InvestigationService);
    private messageService       = inject(MessageService);

    investigations: InvestigationResponse[] = [];
    allInvestigations: InvestigationResponse[] = [];
    loading       = true;
    totalRecords  = 0;
    pageSize      = 20;
    currentPage   = 0;
    selectedStatus: InvestigationStatus | null = null;

    readonly skeletonRows = [1, 2, 3, 4, 5];

    statusFilters: any[] = [
        { label: 'Toutes',     value: null,          color: '#6b7280', count: 0 },
        { label: 'Initiées',   value: 'INITIATED',   color: '#3b82f6', count: 0 },
        { label: 'En cours',   value: 'IN_PROGRESS', color: '#f59e0b', count: 0 },
        { label: 'Suspendues', value: 'SUSPENDED',   color: '#ef4444', count: 0 },
        { label: 'Terminées',  value: 'COMPLETED',   color: '#22c55e', count: 0 }
    ];

    kpis: any[] = [];

    ngOnInit(): void { this.loadInvestigations(); }

    loadInvestigations(): void {
        this.loading = true;
        this.investigationService.findAll(this.currentPage, this.pageSize).subscribe({
            next: page => {
                this.allInvestigations = page.content;
                this.applyFilter();
                this.totalRecords = page.totalElements;
                this.buildKpis(page.content);
                this.buildFilterCounts(page.content);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les investigations'
                });
            }
        });
    }

    private applyFilter(): void {
        this.investigations = this.selectedStatus
            ? this.allInvestigations.filter(i => i.status === this.selectedStatus)
            : this.allInvestigations;
    }

    private buildFilterCounts(data: InvestigationResponse[]): void {
        this.statusFilters[0].count = data.length;
        this.statusFilters[1].count = data.filter(i => i.status === 'INITIATED').length;
        this.statusFilters[2].count = data.filter(i => i.status === 'IN_PROGRESS').length;
        this.statusFilters[3].count = data.filter(i => i.status === 'SUSPENDED').length;
        this.statusFilters[4].count = data.filter(i => i.status === 'COMPLETED').length;
    }

    private buildKpis(data: InvestigationResponse[]): void {
        this.kpis = [
            {
                label:      'En cours',
                value:      data.filter(i => i.status === 'IN_PROGRESS').length,
                icon:       'pi pi-play',
                bgClass:    'bg-blue-100',
                iconClass:  'text-blue-600',
                valueClass: 'text-blue-600'
            },
            {
                label:      'En retard',
                value:      data.filter(i => i.overdue).length,
                icon:       'pi pi-exclamation-triangle',
                bgClass:    'bg-red-100',
                iconClass:  'text-red-600',
                valueClass: 'text-red-600'
            },
            {
                label:      'Terminées',
                value:      data.filter(i => i.status === 'COMPLETED').length,
                icon:       'pi pi-check-circle',
                bgClass:    'bg-green-100',
                iconClass:  'text-green-600',
                valueClass: 'text-green-600'
            },
            {
                label:      'Membres total',
                value:      data.reduce((sum, i) => sum + (i.memberCount ?? 0), 0),
                icon:       'pi pi-users',
                bgClass:    'bg-purple-100',
                iconClass:  'text-purple-600',
                valueClass: 'text-purple-600'
            }
        ];
    }

    filterByStatus(status: any): void {
        this.selectedStatus = status;
        this.applyFilter();
    }

    onLazyLoad(event: any): void {
        this.currentPage = Math.floor(
            (event.first || 0) / (event.rows || this.pageSize)
        );
        this.pageSize = event.rows || this.pageSize;
        this.loadInvestigations();
    }

    getProgress(inv: InvestigationResponse): number {
        if (!inv.startDate || !inv.plannedEndDate) return 0;
        const start    = new Date(inv.startDate).getTime();
        const end      = new Date(inv.plannedEndDate).getTime();
        const now      = Date.now();
        const progress = ((now - start) / (end - start)) * 100;
        return Math.min(Math.max(Math.round(progress), 0), 100);
    }

    getProgressColor(inv: InvestigationResponse): string {
        if (inv.overdue) return '#ef4444';
        const p = this.getProgress(inv);
        if (p >= 80) return '#f59e0b';
        return '#22c55e';
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            INITIATED:   'Initiée',
            IN_PROGRESS: 'En cours',
            SUSPENDED:   'Suspendue',
            COMPLETED:   'Terminée',
            CANCELLED:   'Annulée'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            INITIATED:   'info',
            IN_PROGRESS: 'warn',
            SUSPENDED:   'danger',
            COMPLETED:   'success',
            CANCELLED:   'secondary'
        };
        return map[status] ?? 'info';
    }
}