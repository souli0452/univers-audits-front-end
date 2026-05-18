import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AgentService, AgentResponse } from '../../../core/services/agent.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-agents-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, TableModule,
        InputTextModule, ToastModule, ConfirmDialogModule,
        AvatarModule, SkeletonModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast />
<p-confirmDialog />

<div class="flex flex-col gap-6">

    <!-- ── En-tête ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Gestion des Agents
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                {{ filteredAgents.length }} agent(s)
                <span *ngIf="searchText || selectedStatus !== null"
                    class="text-primary-500">
                    sur {{ allAgents.length }} au total
                </span>
            </p>
        </div>
        <p-button label="Nouvel Agent" icon="pi pi-user-plus"
            routerLink="/app/administration/agents/nouveau" />
    </div>

    <!-- ── Cartes statistiques ─────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border
                    border-surface-100 dark:border-surface-700
                    flex items-center gap-4 cursor-pointer hover:border-green-200
                    transition-colors"
            (click)="filterByActive(true)">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                [class.bg-green-200]="selectedStatus === true"
                [class.bg-green-100]="selectedStatus !== true">
                <i class="pi pi-check-circle text-green-600 text-xl"></i>
            </div>
            <div>
                <div class="text-2xl font-bold text-green-600">{{ activeCount }}</div>
                <div class="text-xs text-surface-400 font-medium uppercase
                            tracking-wide mt-0.5">Agents actifs</div>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border
                    border-surface-100 dark:border-surface-700
                    flex items-center gap-4 cursor-pointer hover:border-red-200
                    transition-colors"
            (click)="filterByActive(false)">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                [class.bg-red-200]="selectedStatus === false"
                [class.bg-red-100]="selectedStatus !== false">
                <i class="pi pi-ban text-red-500 text-xl"></i>
            </div>
            <div>
                <div class="text-2xl font-bold text-red-500">{{ inactiveCount }}</div>
                <div class="text-xs text-surface-400 font-medium uppercase
                            tracking-wide mt-0.5">Agents inactifs</div>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border
                    border-surface-100 dark:border-surface-700
                    flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center
                        justify-center flex-shrink-0">
                <i class="pi pi-users text-primary-600 text-xl"></i>
            </div>
            <div>
                <div class="text-2xl font-bold text-primary-600">
                    {{ allAgents.length }}
                </div>
                <div class="text-xs text-surface-400 font-medium uppercase
                            tracking-wide mt-0.5">Total agents</div>
            </div>
        </div>
    </div>

    <!-- ══ FILTRES — même pattern que dossiers-list ══════════ -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl border
                border-surface-100 dark:border-surface-700 overflow-hidden">

        <div class="grid grid-cols-1 md:grid-cols-[1fr_auto]
                    divide-y md:divide-y-0 md:divide-x
                    divide-surface-100 dark:divide-surface-700">

            <!-- Recherche texte -->
            <div class="flex items-center gap-2.5 px-4" style="height:48px;">
                <i class="pi pi-search text-surface-300 text-sm flex-shrink-0"></i>
                <input pInputText [(ngModel)]="searchText"
                    placeholder="Nom, matricule, email, département..."
                    (ngModelChange)="applyFilters()"
                    class="flex-1 border-none shadow-none outline-none
                           bg-transparent text-sm min-w-0"
                    style="box-shadow:none !important; border:none !important;
                           padding:0 !important;" />
                <button *ngIf="searchText" (click)="clearSearch()"
                    class="flex-shrink-0 w-5 h-5 flex items-center justify-center
                           text-surface-300 hover:text-surface-600 transition-colors
                           rounded-full hover:bg-surface-100">
                    <i class="pi pi-times" style="font-size:10px;"></i>
                </button>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-center gap-1 px-3" style="height:48px;">
                <button *ngIf="isFiltering()" (click)="resetFilters()"
                    class="flex items-center gap-1 text-xs text-surface-400
                           hover:text-surface-700 transition-colors px-2 py-1.5
                           rounded-lg hover:bg-surface-50 whitespace-nowrap">
                    <i class="pi pi-filter-slash text-xs"></i>
                    Effacer
                </button>
                <button (click)="refresh()" title="Actualiser"
                    class="w-8 h-8 flex items-center justify-center rounded-lg
                           text-surface-400 hover:text-surface-700
                           hover:bg-surface-50 transition-colors">
                    <i class="pi pi-refresh text-sm"></i>
                </button>
            </div>
        </div>

        <!-- Bande filtres actifs -->
        <div *ngIf="isFiltering()"
            class="flex items-center gap-2 px-4 py-2 bg-surface-50
                   dark:bg-surface-700/50 border-t border-surface-100
                   dark:border-surface-600 flex-wrap">
            <span class="text-xs font-semibold text-surface-500 flex-shrink-0">
                {{ filteredAgents.length }}
                résultat{{ filteredAgents.length > 1 ? 's' : '' }}
            </span>
            <span class="text-surface-200 text-xs">·</span>

            <span *ngIf="searchText"
                class="inline-flex items-center gap-1 text-xs bg-white
                       dark:bg-surface-800 text-surface-600 border border-surface-200
                       px-2 py-0.5 rounded-full shadow-sm max-w-48">
                <i class="pi pi-search flex-shrink-0" style="font-size:9px;"></i>
                <span class="truncate">"{{ searchText }}"</span>
                <button (click)="clearSearch()"
                    class="flex-shrink-0 ml-0.5 text-surface-300
                           hover:text-surface-600 transition-colors">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>

            <span *ngIf="selectedStatus === true"
                class="inline-flex items-center gap-1 text-xs bg-green-50
                       text-green-700 border border-green-200 px-2 py-0.5
                       rounded-full shadow-sm">
                <i class="pi pi-check-circle text-green-400 flex-shrink-0"
                    style="font-size:9px;"></i>
                Actifs uniquement
                <button (click)="clearStatus()"
                    class="flex-shrink-0 ml-0.5 text-green-400
                           hover:text-green-700 transition-colors">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>

            <span *ngIf="selectedStatus === false"
                class="inline-flex items-center gap-1 text-xs bg-red-50
                       text-red-700 border border-red-200 px-2 py-0.5
                       rounded-full shadow-sm">
                <i class="pi pi-ban text-red-400 flex-shrink-0"
                    style="font-size:9px;"></i>
                Inactifs uniquement
                <button (click)="clearStatus()"
                    class="flex-shrink-0 ml-0.5 text-red-400
                           hover:text-red-700 transition-colors">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
        </div>
    </div>

    <!-- ── Spinner ─────────────────────────────────────────── -->
    <div *ngIf="loading" class="p-4 flex flex-col gap-3">
        <div *ngFor="let i of [1,2,3,4,5]"
            class="h-14 bg-surface-100 dark:bg-surface-700 rounded-xl
                   animate-pulse"></div>
    </div>

    <!-- ── Tableau ─────────────────────────────────────────── -->
    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border
               border-surface-100 dark:border-surface-700 overflow-hidden">

        <p-table [value]="filteredAgents"
            [paginator]="filteredAgents.length > pageSize"
            [rows]="pageSize" [rowsPerPageOptions]="[10, 20, 50]"
            dataKey="id" styleClass="p-datatable-sm" [rowHover]="true">

            <ng-template pTemplate="header">
                <tr class="border-b border-surface-100">
                    <th class="w-14 py-3 px-4"></th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4">Agent</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-32">Matricule</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4">Email</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-40">Grade</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-24">Statut</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-24">Actions</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-agent>
                <tr class="border-b border-surface-50 dark:border-surface-700
                           transition-colors">

                    <td class="px-4 py-3">
                        <div class="w-9 h-9 rounded-full flex items-center
                                    justify-center text-sm font-bold flex-shrink-0"
                            [class.bg-primary-100]="agent.actif"
                            [class.text-primary-700]="agent.actif"
                            [class.bg-surface-200]="!agent.actif"
                            [class.text-surface-400]="!agent.actif">
                            {{ getInitials(agent) }}
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <div class="font-semibold text-sm text-surface-900
                                    dark:text-surface-0">
                            {{ agent.firstName }} {{ agent.lastName }}
                        </div>
                        <div *ngIf="agent.departementLabel"
                            class="text-xs text-surface-400 mt-0.5">
                            {{ agent.departementLabel }}
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <span class="font-mono text-xs bg-primary-50 text-primary-700
                                     px-2 py-1 rounded-md border border-primary-100">
                            {{ agent.matricule }}
                        </span>
                    </td>

                    <td class="px-4 py-3">
                        <span class="text-sm text-surface-600 dark:text-surface-300">
                            {{ agent.email }}
                        </span>
                    </td>

                    <td class="px-4 py-3">
                        <span *ngIf="agent.grade"
                            class="text-xs bg-surface-100 dark:bg-surface-700
                                   text-surface-600 px-2 py-1 rounded-md">
                            {{ agent.grade }}
                        </span>
                        <span *ngIf="!agent.grade"
                            class="text-surface-300 text-xs">—</span>
                    </td>

                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <div class="w-1.5 h-1.5 rounded-full"
                                [class.bg-green-500]="agent.actif"
                                [class.bg-red-400]="!agent.actif"></div>
                            <span class="text-xs font-medium"
                                [class.text-green-600]="agent.actif"
                                [class.text-red-500]="!agent.actif">
                                {{ agent.actif ? 'Actif' : 'Inactif' }}
                            </span>
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1">
                            <p-button icon="pi pi-pencil" severity="info" text
                                size="small"
                                [routerLink]="['/app/administration/agents', agent.id]"
                                pTooltip="Modifier" tooltipPosition="top" />
                            <p-button
                                [icon]="agent.actif ? 'pi pi-ban' : 'pi pi-check-circle'"
                                [severity]="agent.actif ? 'danger' : 'success'"
                                text size="small"
                                [pTooltip]="agent.actif ? 'Désactiver' : 'Activer'"
                                tooltipPosition="top"
                                (onClick)="toggleAgent(agent)" />
                        </div>
                    </td>

                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="7">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100
                                        flex items-center justify-center mb-4">
                                <i class="pi pi-users text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">
                                Aucun agent trouvé
                            </p>
                            <p class="text-xs text-surface-400 mt-1">
                                {{ isFiltering()
                                    ? 'Aucun résultat pour les filtres appliqués'
                                    : 'Aucun agent enregistré' }}
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
export class AgentsList implements OnInit {

    private agentService        = inject(AgentService);
    private messageService      = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    allAgents:      AgentResponse[] = [];
    filteredAgents: AgentResponse[] = [];

    loading  = true;
    pageSize = 20;

    searchText:     string          = '';
    selectedStatus: boolean | null  = null;

    get activeCount():   number { return this.allAgents.filter(a =>  a.actif).length; }
    get inactiveCount(): number { return this.allAgents.filter(a => !a.actif).length; }

    ngOnInit(): void { this.loadAll(); }

    private loadAll(): void {
        this.loading = true;
        this.agentService.findAll(0, 500).subscribe({
            next: page => {
                this.allAgents = [...page.content].sort((a, b) =>
                    `${a.lastName} ${a.firstName}`
                        .localeCompare(`${b.lastName} ${b.firstName}`)
                );
                this.applyFilters();
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les agents'
                });
            }
        });
    }

    refresh(): void { this.loadAll(); }

    applyFilters(): void {
        const q = this.searchText.trim().toLowerCase();

        this.filteredAgents = this.allAgents.filter(agent => {

            if (q) {
                const haystack = [
                    agent.firstName       || '',
                    agent.lastName        || '',
                    agent.matricule       || '',
                    agent.email           || '',
                    agent.departementLabel || '',
                    agent.grade           || ''
                ].join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }

            if (this.selectedStatus !== null && agent.actif !== this.selectedStatus)
                return false;

            return true;
        });
    }

    isFiltering(): boolean {
        return !!(this.searchText || this.selectedStatus !== null);
    }

    filterByActive(status: boolean): void {
        this.selectedStatus = this.selectedStatus === status ? null : status;
        this.applyFilters();
    }

    
    clearSearch(): void {
        this.searchText = '';
        this.applyFilters();
    }

    clearStatus(): void {
        this.selectedStatus = null;
        this.applyFilters();
    }

    resetFilters(): void {
        this.searchText     = '';
        this.selectedStatus = null;
        this.applyFilters();
    }

    
    toggleAgent(agent: AgentResponse): void {
        const action = agent.actif ? 'désactiver' : 'activer';
        this.confirmationService.confirm({
            message: `Voulez-vous ${action} l'agent
                      ${agent.firstName} ${agent.lastName} ?`,
            header:  'Confirmation',
            icon:    'pi pi-question-circle',
            accept: () => {
                const obs = agent.actif
                    ? this.agentService.deactivate(agent.id)
                    : this.agentService.activate(agent.id);

                obs.subscribe({
                    next: updated => {
                        
                        const idxAll = this.allAgents.findIndex(a => a.id === agent.id);
                        if (idxAll !== -1) this.allAgents[idxAll] = updated;

                        const idxFiltered = this.filteredAgents
                            .findIndex(a => a.id === agent.id);
                        if (idxFiltered !== -1)
                            this.filteredAgents[idxFiltered] = updated;

                        this.allAgents      = [...this.allAgents];
                        this.filteredAgents = [...this.filteredAgents];

                        this.messageService.add({
                            severity: 'success', summary: 'Mis à jour',
                            detail: `Agent ${agent.actif ? 'désactivé' : 'activé'}`
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error', summary: 'Erreur',
                            detail: 'Action impossible'
                        });
                    }
                });
            }
        });
    }

    getInitials(agent: AgentResponse): string {
        return (
            (agent.firstName?.[0] || '') +
            (agent.lastName?.[0]  || '')
        ).toUpperCase();
    }
}