import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
    changeDetection: ChangeDetectionStrategy.OnPush,  
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
                Administration des comptes et des accès
            </p>
        </div>
        <p-button
            label="Nouvel Agent"
            icon="pi pi-user-plus"
            routerLink="/app/administration/agents/nouveau"
            styleClass="shadow-md" />
    </div>

    <!-- ── Cartes statistiques ─────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-100 dark:border-surface-700 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-check-circle text-green-600 text-xl"></i>
            </div>
            <div>
                <div class="text-2xl font-bold text-green-600">{{ activeCount }}</div>
                <div class="text-xs text-surface-400 font-medium uppercase tracking-wide mt-0.5">
                    Agents actifs
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-100 dark:border-surface-700 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-ban text-red-500 text-xl"></i>
            </div>
            <div>
                <div class="text-2xl font-bold text-red-500">{{ inactiveCount }}</div>
                <div class="text-xs text-surface-400 font-medium uppercase tracking-wide mt-0.5">
                    Agents inactifs
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-100 dark:border-surface-700 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-users text-primary-600 text-xl"></i>
            </div>
            <div>
                <div class="text-2xl font-bold text-primary-600">{{ totalRecords }}</div>
                <div class="text-xs text-surface-400 font-medium uppercase tracking-wide mt-0.5">
                    Total agents
                </div>
            </div>
        </div>

    </div>

    <!-- ── Barre de recherche ──────────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100 dark:border-surface-700 flex items-center gap-3">
        <i class="pi pi-search text-surface-400 text-sm"></i>
        <input
            pInputText
            [(ngModel)]="searchText"
            placeholder="Rechercher par nom, matricule, email..."
            class="flex-1 border-none shadow-none outline-none bg-transparent text-sm"
            (input)="onSearch()" />
        <span *ngIf="searchText"
            class="text-xs text-surface-400 bg-surface-100 px-2 py-1 rounded-full cursor-pointer hover:bg-surface-200"
            (click)="clearSearch()">
            Effacer
        </span>
    </div>

    <!-- ── Contenu principal ───────────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden">

        <!-- Squelettes -->
        <div *ngIf="loading" class="p-4 flex flex-col gap-3">
            <p-skeleton *ngFor="let i of skeletonRows"
                height="56px" borderRadius="12px" />
        </div>

        <!-- Tableau -->
        <p-table
            *ngIf="!loading"
            [value]="agents"
            [paginator]="true"
            [rows]="pageSize"
            [totalRecords]="totalRecords"
            [lazy]="true"
            (onLazyLoad)="onLazyLoad($event)"
            dataKey="id"
            styleClass="p-datatable-sm"
            [rowHover]="true">

            <ng-template pTemplate="header">
                <tr class="border-b border-surface-100">
                    <th class="w-14 py-3 px-4"></th>
                    <th pSortableColumn="lastName"
                        class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">
                        Agent <p-sortIcon field="lastName" />
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">
                        Matricule
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">
                        Email
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-40">
                        Grade
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-24">
                        Statut
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-24">
                        Actions
                    </th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-agent>
                <tr class="border-b border-surface-50 dark:border-surface-700 transition-colors">

                    <td class="px-4 py-3">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            [class.bg-primary-100]="agent.actif"
                            [class.text-primary-700]="agent.actif"
                            [class.bg-surface-200]="!agent.actif"
                            [class.text-surface-400]="!agent.actif">
                            {{ getInitials(agent) }}
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                            {{ agent.firstName }} {{ agent.lastName }}
                        </div>
                        <div *ngIf="agent.departementLabel"
                            class="text-xs text-surface-400 mt-0.5">
                            {{ agent.departementLabel }}
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <span class="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-md border border-primary-100">
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
                            class="text-xs bg-surface-100 dark:bg-surface-700 text-surface-600 px-2 py-1 rounded-md">
                            {{ agent.grade }}
                        </span>
                        <span *ngIf="!agent.grade" class="text-surface-300 text-xs">—</span>
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
                            <p-button
                                icon="pi pi-pencil"
                                severity="info"
                                text
                                size="small"
                                [routerLink]="['/app/administration/agents', agent.id]"
                                pTooltip="Modifier"
                                tooltipPosition="top" />
                            <p-button
                                [icon]="agent.actif ? 'pi pi-ban' : 'pi pi-check-circle'"
                                [severity]="agent.actif ? 'danger' : 'success'"
                                text
                                size="small"
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
                        <div class="flex flex-col items-center justify-center py-16 text-surface-400">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                                <i class="pi pi-users text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">Aucun agent trouvé</p>
                            <p class="text-sm mt-1" *ngIf="searchText">
                                Aucun résultat pour "{{ searchText }}"
                            </p>
                            <p-button *ngIf="searchText"
                                label="Effacer la recherche"
                                severity="secondary" text size="small"
                                styleClass="mt-3"
                                (onClick)="clearSearch()" />
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
    private cdr                 = inject(ChangeDetectorRef);  // ← ajout

    agents:       AgentResponse[] = [];
    loading      = true;
    totalRecords = 0;
    pageSize     = 20;
    currentPage  = 0;
    searchText   = '';

    // Tableau statique pour *ngFor dans les squelettes (évite NG0100)
    readonly skeletonRows = [1, 2, 3, 4, 5];

    get activeCount():   number { return this.agents.filter(a =>  a.actif).length; }
    get inactiveCount(): number { return this.agents.filter(a => !a.actif).length; }

    ngOnInit(): void { this.loadAgents(); }

    loadAgents(): void {
        this.loading = true;
        this.cdr.markForCheck();   // ← notifier Angular immédiatement

        this.agentService.findAll(
            this.currentPage,
            this.pageSize,
            this.searchText || undefined
        ).subscribe({
            next: page => {
                this.agents       = page.content;
                this.totalRecords = page.totalElements;
                this.loading      = false;
                this.cdr.markForCheck();   // ← notifier après les données
            },
            error: () => {
                this.loading = false;
                this.cdr.markForCheck();
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   'Impossible de charger les agents'
                });
            }
        });
    }

    onSearch(): void {
        this.currentPage = 0;
        this.loadAgents();
    }

    clearSearch(): void {
        this.searchText  = '';
        this.currentPage = 0;
        this.loadAgents();
    }

    onLazyLoad(event: any): void {
        this.currentPage = Math.floor(
            (event.first || 0) / (event.rows || this.pageSize)
        );
        this.pageSize = event.rows || this.pageSize;
        this.loadAgents();
    }

    toggleAgent(agent: AgentResponse): void {
        const action = agent.actif ? 'désactiver' : 'activer';
        this.confirmationService.confirm({
            message: `Voulez-vous ${action} l'agent ${agent.firstName} ${agent.lastName} ?`,
            header:  'Confirmation',
            icon:    'pi pi-question-circle',
            accept: () => {
                const obs = agent.actif
                    ? this.agentService.deactivate(agent.id)
                    : this.agentService.activate(agent.id);

                obs.subscribe({
                    next: updated => {
                        const idx = this.agents.findIndex(a => a.id === agent.id);
                        if (idx !== -1) {
                            this.agents = [...this.agents];   // ← nouveau tableau pour OnPush
                            this.agents[idx] = updated;
                        }
                        this.cdr.markForCheck();
                        this.messageService.add({
                            severity: 'success',
                            summary:  'Mis à jour',
                            detail:   `Agent ${agent.actif ? 'désactivé' : 'activé'}`
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary:  'Erreur',
                            detail:   'Action impossible'
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