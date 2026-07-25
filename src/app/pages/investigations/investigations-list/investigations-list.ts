import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    InvestigationService,
    InvestigationResponse,
    InvestigationMemberResponse
} from '../../../core/services/investigation.service';
import { isToday as isTodayUtil } from '../../../core/utils/date';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-investigations-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, TagModule,
        InputTextModule, SelectModule, ToastModule,
        ProgressSpinnerModule, TooltipModule
    ],
    providers: [MessageService],
    styleUrls: ['../../../shared/styles/filter-select.scss'],
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
                {{ filteredInvestigations.length }} enquête(s)
                <span *ngIf="isFiltering()" class="text-primary-500">
                    sur {{ allInvestigations.length }} au total
                </span>
                <span class="ml-2 text-xs text-surface-300">
                    <i class="pi pi-sort-down" style="font-size:9px;"></i>
                    Plus récente en premier
                </span>
            </p>
        </div>
    </div>

    <!-- ── Cartes stats rapides ───────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border
                    border-surface-100 flex items-center gap-3 cursor-pointer
                    transition-colors hover:border-blue-200"
            (click)="filterByStatus('INITIATED')">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class.bg-blue-200]="selectedStatus === 'INITIATED'"
                [class.bg-blue-100]="selectedStatus !== 'INITIATED'">
                <i class="pi pi-flag text-blue-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-blue-600">{{ countByStatus('INITIATED') }}</div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">Initiées</div>
            </div>
        </div>
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border
                    border-surface-100 flex items-center gap-3 cursor-pointer
                    transition-colors hover:border-green-200"
            (click)="filterByStatus('IN_PROGRESS')">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class.bg-green-200]="selectedStatus === 'IN_PROGRESS'"
                [class.bg-green-100]="selectedStatus !== 'IN_PROGRESS'">
                <i class="pi pi-spin pi-spinner text-green-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-green-600">{{ countByStatus('IN_PROGRESS') }}</div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">En cours</div>
            </div>
        </div>
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border
                    border-surface-100 flex items-center gap-3 cursor-pointer
                    transition-colors hover:border-amber-200"
            (click)="filterByStatus('SUSPENDED')">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class.bg-amber-200]="selectedStatus === 'SUSPENDED'"
                [class.bg-amber-100]="selectedStatus !== 'SUSPENDED'">
                <i class="pi pi-pause text-amber-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-amber-600">{{ countByStatus('SUSPENDED') }}</div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">Suspendues</div>
            </div>
        </div>
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border
                    border-surface-100 flex items-center gap-3 cursor-pointer
                    transition-colors hover:border-red-200"
            (click)="filterOverdue()">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class.bg-red-200]="selectedOverdue === true"
                [class.bg-red-100]="selectedOverdue !== true">
                <i class="pi pi-exclamation-triangle text-red-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-red-600">{{ countOverdue() }}</div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">En retard</div>
            </div>
        </div>
    </div>

    <!-- ── Filtres ─────────────────────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl border
                border-surface-100 dark:border-surface-700 overflow-hidden">

        <div class="grid grid-cols-1 md:grid-cols-[1fr_160px_160px_160px_auto]
                    divide-y md:divide-y-0 md:divide-x
                    divide-surface-100 dark:divide-surface-700">

            <div class="flex items-center gap-2.5 px-4" style="height:48px;">
                <i class="pi pi-search text-surface-300 text-sm flex-shrink-0"></i>
                <input pInputText [(ngModel)]="searchText"
                    placeholder="Numéro dossier, objet, agent..."
                    (ngModelChange)="applyFilters()"
                    class="flex-1 border-none shadow-none outline-none bg-transparent text-sm min-w-0"
                    style="box-shadow:none !important; border:none !important; padding:0 !important;" />
                <button *ngIf="searchText" (click)="clearSearch()"
                    class="flex-shrink-0 w-5 h-5 flex items-center justify-center
                           text-surface-300 hover:text-surface-600 transition-colors
                           rounded-full hover:bg-surface-100">
                    <i class="pi pi-times" style="font-size:10px;"></i>
                </button>
            </div>

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-tag text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="selectedStatus" [options]="statusOptions"
                    optionLabel="label" optionValue="value" placeholder="Statut"
                    [showClear]="true" styleClass="w-full" appendTo="body"
                    (onChange)="applyFilters()" />
            </div>

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-clock text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="selectedOverdue" [options]="overdueOptions"
                    optionLabel="label" optionValue="value" placeholder="Délai"
                    [showClear]="true" styleClass="w-full" appendTo="body"
                    (onChange)="applyFilters()" />
            </div>

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-users text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="selectedRole" [options]="roleFilterOptions"
                    optionLabel="label" optionValue="value" placeholder="Rôle équipe"
                    [showClear]="true" styleClass="w-full" appendTo="body"
                    (onChange)="applyFilters()" />
            </div>

            <div class="flex items-center justify-center gap-1 px-3" style="height:48px;">
                <button *ngIf="isFiltering()" (click)="resetFilters()"
                    class="flex items-center gap-1 text-xs text-surface-400
                           hover:text-surface-700 transition-colors px-2 py-1.5
                           rounded-lg hover:bg-surface-50 whitespace-nowrap">
                    <i class="pi pi-filter-slash text-xs"></i> Effacer
                </button>
                <button (click)="refresh()" title="Actualiser"
                    class="w-8 h-8 flex items-center justify-center rounded-lg
                           text-surface-400 hover:text-surface-700
                           hover:bg-surface-50 transition-colors flex-shrink-0">
                    <i class="pi pi-refresh text-sm"></i>
                </button>
            </div>
        </div>

        <!-- Badges filtres actifs -->
        <div *ngIf="isFiltering()"
            class="flex items-center gap-2 px-4 py-2 bg-surface-50
                   dark:bg-surface-700/50 border-t border-surface-100
                   dark:border-surface-600 flex-wrap">
            <span class="text-xs font-semibold text-surface-500 flex-shrink-0">
                {{ filteredInvestigations.length }}
                résultat{{ filteredInvestigations.length > 1 ? 's' : '' }}
            </span>
            <span class="text-surface-200 text-xs">·</span>
            <span *ngIf="searchText"
                class="inline-flex items-center gap-1 text-xs bg-white
                       text-surface-600 border border-surface-200
                       px-2 py-0.5 rounded-full shadow-sm max-w-48">
                <i class="pi pi-search" style="font-size:9px;"></i>
                <span class="truncate">"{{ searchText }}"</span>
                <button (click)="clearSearch()"
                    class="ml-0.5 text-surface-300 hover:text-surface-600">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="selectedStatus"
                class="inline-flex items-center gap-1 text-xs bg-amber-50
                       text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
                <i class="pi pi-tag text-amber-400" style="font-size:9px;"></i>
                {{ getStatusLabel(selectedStatus) }}
                <button (click)="clearStatus()" class="ml-0.5 text-amber-400 hover:text-amber-700">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="selectedOverdue !== null"
                class="inline-flex items-center gap-1 text-xs bg-red-50
                       text-red-700 border border-red-200 px-2 py-0.5 rounded-full shadow-sm">
                <i class="pi pi-clock text-red-400" style="font-size:9px;"></i>
                {{ selectedOverdue ? 'En retard' : 'Dans les délais' }}
                <button (click)="clearOverdue()" class="ml-0.5 text-red-400 hover:text-red-700">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="selectedRole"
                class="inline-flex items-center gap-1 text-xs bg-purple-50
                       text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full shadow-sm">
                <i class="pi pi-users text-purple-400" style="font-size:9px;"></i>
                {{ getRoleLabel(selectedRole) }}
                <button (click)="clearRole()" class="ml-0.5 text-purple-400 hover:text-purple-700">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
        </div>
    </div>

    <!-- ── Spinner ─────────────────────────────────────────── -->
    <div *ngIf="loading" class="flex justify-center py-12">
        <p-progressSpinner strokeWidth="4" />
    </div>

    <!-- ── Tableau ─────────────────────────────────────────── -->
    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border
               border-surface-100 overflow-hidden">

        <p-table [value]="filteredInvestigations"
            [paginator]="filteredInvestigations.length > pageSize"
            [rows]="pageSize" [rowsPerPageOptions]="[10, 20, 50]"
            dataKey="id" styleClass="p-datatable-sm" [rowHover]="true">

            <ng-template pTemplate="header">
                <tr>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-40">
                        Dossier
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">
                        Objet
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">
                        Statut
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">
                        Progression
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">
                        Délai restant
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36">
                        Équipe
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">
                        <div class="flex items-center gap-1">
                            Date
                            <i class="pi pi-sort-down text-surface-300"
                                style="font-size:9px;"
                                pTooltip="Tri : plus récente en premier"
                                tooltipPosition="top"></i>
                        </div>
                    </th>
                    <th class="w-16"></th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-inv>
                <tr class="border-b border-surface-50 cursor-pointer transition-colors"
                    [routerLink]="['/app/investigations', inv.id]"
                    [class.bg-red-50]="inv.overdue">

                    <!-- Numéro dossier -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-8 rounded-full flex-shrink-0"
                                [class.bg-red-500]="inv.overdue"
                                [class.bg-green-500]="!inv.overdue && inv.status === 'IN_PROGRESS'"
                                [class.bg-blue-400]="inv.status === 'INITIATED'"
                                [class.bg-amber-400]="inv.status === 'SUSPENDED'"
                                [class.bg-surface-300]="inv.status === 'COMPLETED' || inv.status === 'ARCHIVED'">
                            </div>
                            <span class="font-mono text-xs font-semibold text-primary-600
                                         bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                                {{ inv.dossierNumber || '—' }}
                            </span>
                        </div>
                    </td>

                    <!-- Objet -->
                    <td class="px-4 py-3">
                        <div class="font-medium text-sm text-surface-900 dark:text-surface-0
                                    truncate max-w-xs">
                            {{ inv.dossierObject || '—' }}
                        </div>
                        <div *ngIf="inv.overdue"
                            class="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                            <i class="pi pi-exclamation-triangle text-xs"></i>
                            En retard
                        </div>
                    </td>

                    <!-- Statut -->
                    <td class="px-4 py-3">
                        <p-tag [value]="getStatusLabel(inv.status)"
                            [severity]="getStatusSeverity(inv.status)"
                            styleClass="text-xs" />
                    </td>

                    <!-- Progression -->
                    <td class="px-4 py-3">
                        <div *ngIf="inv.startDate; else notStarted">
                            <div class="text-xs font-semibold text-surface-700
                                        dark:text-surface-200 mb-1">
                                {{ getProgressForInv(inv) }}%
                            </div>
                            <div class="h-1.5 bg-surface-100 rounded-full overflow-hidden w-20">
                                <div class="h-full rounded-full"
                                    [style.width]="getProgressForInv(inv) + '%'"
                                    [class.bg-red-500]="inv.overdue"
                                    [class.bg-amber-400]="!inv.overdue && getProgressForInv(inv) >= 80"
                                    [class.bg-green-500]="!inv.overdue && getProgressForInv(inv) < 80">
                                </div>
                            </div>
                        </div>
                        <ng-template #notStarted>
                            <span class="text-xs text-surface-300">Non démarrée</span>
                        </ng-template>
                    </td>

                    <!-- Délai restant -->
                    <td class="px-4 py-3">
                        <span *ngIf="inv.overdue"
                            class="text-xs font-bold text-red-600 bg-red-50
                                   px-2 py-0.5 rounded-full border border-red-200">
                            Dépassé
                        </span>
                        <span *ngIf="!inv.overdue && inv.startDate"
                            class="text-xs font-semibold px-2 py-0.5 rounded-full border"
                            [class.text-amber-700]="(inv.remainingDays || 0) <= 10"
                            [class.bg-amber-50]="(inv.remainingDays || 0) <= 10"
                            [class.border-amber-200]="(inv.remainingDays || 0) <= 10"
                            [class.text-green-700]="(inv.remainingDays || 0) > 10"
                            [class.bg-green-50]="(inv.remainingDays || 0) > 10"
                            [class.border-green-200]="(inv.remainingDays || 0) > 10">
                            {{ inv.remainingDays }}j
                        </span>
                        <span *ngIf="!inv.startDate" class="text-xs text-surface-300">—</span>
                    </td>

                    <!-- Équipe -->
                    <td class="px-4 py-3">
                        <div *ngIf="getMembers(inv).length; else noTeam"
                            class="flex items-center gap-1">
                            <div *ngFor="let m of (getMembers(inv) | slice:0:3)"
                                class="w-6 h-6 rounded-full flex items-center
                                       justify-center text-xs font-bold -ml-1
                                       first:ml-0 border-2 border-white"
                                [class.bg-yellow-200]="m.teamRole === 'TEAM_LEADER'"
                                [class.text-yellow-800]="m.teamRole === 'TEAM_LEADER'"
                                [class.bg-blue-200]="m.teamRole !== 'TEAM_LEADER'"
                                [class.text-blue-800]="m.teamRole !== 'TEAM_LEADER'"
                                [pTooltip]="m.agent.firstName + ' ' + m.agent.lastName"
                                tooltipPosition="top">
                                {{ getInitials(m.agent.firstName + ' ' + m.agent.lastName) }}
                            </div>
                            <span *ngIf="getMembers(inv).length > 3"
                                class="text-xs text-surface-400 ml-1">
                                +{{ getMembers(inv).length - 3 }}
                            </span>
                        </div>
                        <ng-template #noTeam>
                            <span class="text-xs text-surface-300 italic">Aucun membre</span>
                        </ng-template>
                    </td>

                    <!-- Date ouverture -->
                    <td class="px-4 py-3">
                        <span class="text-xs text-surface-400">
                            {{ getDisplayDate(inv) | date:'dd/MM/yyyy' }}
                        </span>
                        <div *ngIf="isToday(getDisplayDate(inv))"
                            class="text-xs text-green-600 font-semibold mt-0.5">
                            Aujourd'hui
                        </div>
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                        <p-button icon="pi pi-eye" severity="info" text size="small"
                            [routerLink]="['/app/investigations', inv.id]"
                            pTooltip="Voir" tooltipPosition="top" />
                    </td>

                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="8">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100
                                        flex items-center justify-center mb-4">
                                <i class="pi pi-search text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">
                                Aucune investigation trouvée
                            </p>
                            <p class="text-xs text-surface-400 mt-1">
                                {{ isFiltering()
                                    ? 'Aucun résultat pour les filtres appliqués'
                                    : 'Aucune investigation enregistrée' }}
                            </p>
                            <p-button *ngIf="isFiltering()"
                                label="Réinitialiser les filtres"
                                severity="secondary" text size="small"
                                styleClass="mt-3" (onClick)="resetFilters()" />
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

    allInvestigations:      InvestigationResponse[] = [];
    filteredInvestigations: InvestigationResponse[] = [];

    loading  = true;
    pageSize = 20;

    searchText       = '';
    selectedStatus:  string | null  = null;
    selectedOverdue: boolean | null = null;
    selectedRole:    string | null  = null;

    readonly statusOptions = [
        { label: 'Initiée',        value: 'INITIATED'   },
        { label: 'En cours',       value: 'IN_PROGRESS' },
        { label: 'Suspendue',      value: 'SUSPENDED'   },
        { label: 'Rapport soumis', value: 'COMPLETED'   },
        { label: 'Archivée',       value: 'ARCHIVED'    }
    ];

    readonly overdueOptions = [
        { label: 'En retard',       value: true  },
        { label: 'Dans les délais', value: false }
    ];

    readonly roleFilterOptions = [
        { label: 'Chef de mission', value: 'TEAM_LEADER' },
        { label: 'Investigateur',   value: 'MEMBER'      }
    ];

    ngOnInit(): void { this.loadAll(); }

    private loadAll(): void {
        this.loading = true;
        this.investigationService.findAll(0, 500).subscribe({
            next: page => {
                this.allInvestigations = [...page.content].sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.startDate || 0).getTime();
                    const dateB = new Date(b.createdAt || b.startDate || 0).getTime();
                    if (dateB !== dateA) return dateB - dateA;   
                    const startA = new Date(a.startDate || 0).getTime();
                    const startB = new Date(b.startDate || 0).getTime();
                    return startB - startA;
                });
                this.applyFilters();
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

    refresh(): void { this.loadAll(); }

    getMembers(inv: InvestigationResponse): InvestigationMemberResponse[] {
        return (inv.members || []) as InvestigationMemberResponse[];
    }

    getDisplayDate(inv: InvestigationResponse): string | undefined {
        return inv.startDate || inv.createdAt;
    }

    isToday(dateStr?: string): boolean { return isTodayUtil(dateStr); }

    applyFilters(): void {
        const q = this.searchText.trim().toLowerCase();
        this.filteredInvestigations = this.allInvestigations.filter(inv => {
            const members = this.getMembers(inv);
            if (q) {
                const memberNames = members
                    .map(m => `${m.agent.firstName} ${m.agent.lastName} ${m.agent.matricule}`)
                    .join(' ');
                const haystack = [
                    inv.dossierNumber || '', inv.dossierObject || '', memberNames
                ].join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            if (this.selectedStatus && inv.status !== this.selectedStatus) return false;
            if (this.selectedOverdue !== null && inv.overdue !== this.selectedOverdue) return false;
            if (this.selectedRole) {
                const hasRole = members.some(m => m.teamRole === this.selectedRole);
                if (!hasRole) return false;
            }
            return true;
        });
    }

    isFiltering(): boolean {
        return !!(this.searchText || this.selectedStatus
               || this.selectedOverdue !== null || this.selectedRole);
    }

    filterByStatus(status: string): void {
        this.selectedStatus = this.selectedStatus === status ? null : status;
        this.applyFilters();
    }

    filterOverdue(): void {
        this.selectedOverdue = this.selectedOverdue === true ? null : true;
        this.applyFilters();
    }

    clearSearch():  void { this.searchText      = '';   this.applyFilters(); }
    clearStatus():  void { this.selectedStatus  = null; this.applyFilters(); }
    clearOverdue(): void { this.selectedOverdue = null; this.applyFilters(); }
    clearRole():    void { this.selectedRole    = null; this.applyFilters(); }

    resetFilters(): void {
        this.searchText = ''; this.selectedStatus = null;
        this.selectedOverdue = null; this.selectedRole = null;
        this.applyFilters();
    }

    countByStatus(status: string): number {
        return this.allInvestigations.filter(i => i.status === status).length;
    }

    countOverdue(): number {
        return this.allInvestigations.filter(i => i.overdue).length;
    }

    getProgressForInv(inv: InvestigationResponse): number {
        if (!inv.startDate || !inv.plannedEndDate) return 0;
        const start = new Date(inv.startDate).getTime();
        const end   = new Date(inv.extendedDeadline || inv.plannedEndDate).getTime();
        return Math.min(
            Math.max(Math.round(((Date.now() - start) / (end - start)) * 100), 0), 100
        );
    }

    getInitials(name: string): string {
        return (name || '').split(' ').map(n => n[0] || '').join('')
            .substring(0, 2).toUpperCase();
    }

    getRoleLabel(role: string): string {
        return role === 'TEAM_LEADER' ? 'Chef de mission' : 'Investigateur';
    }

    getStatusLabel(status: string): string {
        const l: Record<string, string> = {
            INITIATED:   'Initiée',
            IN_PROGRESS: 'En cours',
            SUSPENDED:   'Suspendue',
            COMPLETED:   'Rapport soumis',
            ARCHIVED:    'Archivée'
        };
        return l[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const m: Record<string, TagSeverity> = {
            INITIATED:   'info',
            IN_PROGRESS: 'success',
            SUSPENDED:   'warn',
            COMPLETED:   'info',
            ARCHIVED:    'secondary'
        };
        return m[status] ?? 'info';
    }
}