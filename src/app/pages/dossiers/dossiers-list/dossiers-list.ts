import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem, MessageService } from 'primeng/api';
import { Menu, MenuModule } from 'primeng/menu';
import { PermissionService } from '../../../core/services/permission.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { ActionId, ActionPrincipale, actionsPrincipales, phraseEtape } from '../dossier-detail/actions-dossier';
import { transitionDeLAction } from '../dossier-detail/transitions-dossier';
import { TransitionDossier } from '../transition-dossier/transition-dossier';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierStatus } from '../../../core/models/dossier.model';
import { StatistiqueService, PublicStats } from '../../../core/services/statistique.service';
import { isToday as isTodayUtil } from '../../../core/utils/date';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;
type DossierPriority = 'CRITIQUE' | 'URGENT' | 'NORMAL' | 'FAIBLE';

import { CHOIX_NATURE_AGENT, MotifCitoyen, libelleDeNature, libelleDeRegion, motifCitoyen } from '../../../core/utils/saisine-categories';
@Component({
    selector: 'app-dossiers-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, TagModule,
        InputTextModule, SelectModule, ToastModule,
        ProgressSpinnerModule, TooltipModule, MenuModule, TransitionDossier
    ],
    providers: [MessageService],
    styleUrls: ['../../../shared/styles/filter-select.scss'],
    template: `
<p-toast />
<p-menu #menuLigne [popup]="true" appendTo="body" [model]="[]" />

<div class="flex flex-col gap-6">

    <!-- ── En-tête ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Dossiers</h1>
            <p class="text-surface-400 text-sm mt-1">
                {{ filteredDossiers.length }} dossier(s)
                <span *ngIf="isFiltering()" class="text-primary-500">
                    sur {{ allDossiers.length }} au total
                </span>
            </p>
        </div>
        <div class="flex items-center gap-2">
            <!-- Indicateur nouveau dossier -->
            <span *ngIf="newDossierId"
                class="inline-flex items-center gap-1.5 text-xs bg-green-100
                       text-green-700 border border-green-300 px-3 py-1.5
                       rounded-full font-semibold animate-pulse">
                <i class="pi pi-check-circle" style="font-size:10px;"></i>
                Nouveau dossier en tête de liste
            </span>
            <p-button label="Nouveau Dossier" icon="pi pi-plus"
                routerLink="/app/dossiers/nouveau" />
        </div>
    </div>

    <!-- ── KPIs ────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border
                    border-surface-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center
                        justify-center flex-shrink-0">
                <i class="pi pi-inbox text-blue-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-blue-600">
                    {{ statsLoading ? '…' : stats.dossiersNouveaux }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">Nouveaux</div>
            </div>
        </div>
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border
                    border-surface-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center
                        justify-center flex-shrink-0">
                <i class="pi pi-clock text-amber-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-amber-600">
                    {{ statsLoading ? '…' : stats.dossiersEnCours }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">En cours</div>
            </div>
        </div>
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border
                    border-surface-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center
                        justify-center flex-shrink-0">
                <i class="pi pi-check-circle text-green-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-green-600">
                    {{ statsLoading ? '…' : stats.dossiersTraites }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">Traités</div>
            </div>
        </div>
        <div class="rounded-2xl p-4 border flex items-center gap-3 cursor-pointer transition-all"
            [class.bg-red-50]="urgentCount > 0"
            [class.border-red-200]="urgentCount > 0"
            [class.bg-white]="urgentCount === 0"
            [class.border-surface-100]="urgentCount === 0"
            (click)="filterPriority='CRITIQUE'; applyFilters()">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                [class.bg-red-100]="urgentCount > 0"
                [class.bg-surface-100]="urgentCount === 0">
                <i class="pi pi-exclamation-triangle"
                    [class.text-red-600]="urgentCount > 0"
                    [class.text-surface-400]="urgentCount === 0"></i>
            </div>
            <div>
                <div class="text-xl font-bold"
                    [class.text-red-600]="urgentCount > 0"
                    [class.text-surface-500]="urgentCount === 0">
                    {{ urgentCount }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">
                    Critique(s)
                </div>
            </div>
        </div>
    </div>

    <!-- ── Filtres ─────────────────────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100
                dark:border-surface-700 overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_160px_150px_150px_130px_130px_auto]
                    divide-y md:divide-y-0 md:divide-x
                    divide-surface-100 dark:divide-surface-700">

            <div class="flex items-center gap-2.5 px-4" style="height:48px;">
                <i class="pi pi-search text-surface-300 text-sm flex-shrink-0"></i>
                <input pInputText [(ngModel)]="searchText"
                    placeholder="Numéro, objet, déclarant..."
                    (ngModelChange)="applyFilters()"
                    class="flex-1 h-full border-none shadow-none outline-none
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

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-tag text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="selectedStatus" [options]="statusOptions"
                    optionLabel="label" optionValue="value" placeholder="Statut"
                    [showClear]="true" styleClass="w-full" appendTo="body"
                    (onChange)="applyFilters()" />
            </div>

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-file text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="selectedType" [options]="typeOptions"
                    optionLabel="label" optionValue="value" placeholder="Type"
                    [showClear]="true" styleClass="w-full" appendTo="body"
                    (onChange)="applyFilters()" />
            </div>

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-globe text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="selectedMode" [options]="modeOptions"
                    optionLabel="label" optionValue="value" placeholder="Canal"
                    [showClear]="true" styleClass="w-full" appendTo="body"
                    (onChange)="applyFilters()" />
            </div>

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-arrow-up text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="filterPriority" [options]="priorityOptions"
                    optionLabel="label" optionValue="value" placeholder="Priorité"
                    [showClear]="true" styleClass="w-full" appendTo="body"
                    (onChange)="applyFilters()" />
            </div>

            <div class="flex items-center gap-2 px-3 filter-select" style="height:48px;">
                <i class="pi pi-user text-surface-300 text-xs flex-shrink-0"></i>
                <p-select [(ngModel)]="selectedAnonymat" [options]="anonymatOptions"
                    optionLabel="label" optionValue="value" placeholder="Déclarant"
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
                {{ filteredDossiers.length }}
                résultat{{ filteredDossiers.length > 1 ? 's' : '' }}
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
                       text-amber-700 border border-amber-200 px-2 py-0.5
                       rounded-full shadow-sm">
                <i class="pi pi-tag text-amber-400" style="font-size:9px;"></i>
                {{ getStatusLabel(selectedStatus) }}
                <button (click)="clearStatus()"
                    class="ml-0.5 text-amber-400 hover:text-amber-700">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="selectedType"
                class="inline-flex items-center gap-1 text-xs bg-purple-50
                       text-purple-700 border border-purple-200
                       px-2 py-0.5 rounded-full shadow-sm">
                <i class="pi pi-file text-purple-400" style="font-size:9px;"></i>
                {{ getTypeLabel(selectedType) }}
                <button (click)="clearType()"
                    class="ml-0.5 text-purple-400 hover:text-purple-700">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="selectedMode"
                class="inline-flex items-center gap-1 text-xs bg-green-50
                       text-green-700 border border-green-200
                       px-2 py-0.5 rounded-full shadow-sm">
                <i class="pi pi-globe text-green-400" style="font-size:9px;"></i>
                {{ getModeLabel(selectedMode) }}
                <button (click)="clearMode()"
                    class="ml-0.5 text-green-400 hover:text-green-700">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="filterPriority"
                class="inline-flex items-center gap-1 text-xs px-2 py-0.5
                       rounded-full shadow-sm border"
                [ngStyle]="{background:getPriorityBg(filterPriority),
                            color:getPriorityColor(filterPriority),
                            borderColor:getPriorityBorder(filterPriority)}">
                {{ getPriorityIcon(filterPriority) }}
                {{ getPriorityLabel(filterPriority) }}
                <button (click)="filterPriority=null; applyFilters()"
                    class="ml-0.5 opacity-60 hover:opacity-100">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="selectedAnonymat"
                class="inline-flex items-center gap-1 text-xs bg-slate-50
                       text-slate-700 border border-slate-200
                       px-2 py-0.5 rounded-full shadow-sm">
                <i class="pi pi-user text-slate-400" style="font-size:9px;"></i>
                {{ getAnonymatLabel(selectedAnonymat) }}
                <button (click)="clearAnonymat()"
                    class="ml-0.5 text-slate-400 hover:text-slate-700">
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
        <p-table [value]="filteredDossiers"
            [paginator]="filteredDossiers.length > pageSize"
            [rows]="pageSize" [rowsPerPageOptions]="[10,20,50]"
            dataKey="id" styleClass="p-datatable-sm" [rowHover]="true" [expandedRowKeys]="deplies">

            <ng-template pTemplate="header">
                <tr>
                    <th class="w-10"><span class="sr-only">Détail</span></th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-28">Priorité</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-40">Numéro</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4">Dossier</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-28">Type</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-36">Statut</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-28">Canal</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-32">
                        <div class="flex items-center gap-1">
                            Date
                            <i class="pi pi-sort-down text-surface-300"
                                style="font-size:9px;"
                                pTooltip="Tri : plus récent en premier"
                                tooltipPosition="top"></i>
                        </div>
                    </th>
                    <th class="text-xs text-surface-400 font-semibold uppercase
                               tracking-wide py-3 px-4 w-32 text-right">Actions</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-d>
                <tr class="ligne-dossier border-b border-surface-50 cursor-pointer transition-colors"
                    (click)="basculer(d)"
                    [class.bg-green-50]="d.id === newDossierId"
                    [class.border-green-200]="d.id === newDossierId">

                    <!-- Badge nouveau -->
                    <td class="px-3 py-3" colspan="8"
                        *ngIf="d.id === newDossierId"
                        style="display:none">
                    </td>

                    <!-- Chevron : déplier ou replier le détail de la ligne -->
                    <td class="pl-3 pr-0 py-3" (click)="$event.stopPropagation()">
                        <button type="button" (click)="basculer(d)"
                            class="p-button p-component p-button-icon-only p-button-text p-button-secondary p-button-sm"
                            [attr.aria-expanded]="estDeplie(d)"
                            [attr.aria-label]="(estDeplie(d) ? 'Replier' : 'Afficher') + ' le détail du dossier ' + (d.number || d.object)">
                            <i class="pi" [ngClass]="estDeplie(d) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                        </button>
                    </td>

                    <!-- Priorité -->
                    <td class="px-3 py-3">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <!-- Badge NOUVEAU si c'est le dernier soumis -->
                            <span *ngIf="d.id === newDossierId"
                                class="inline-flex items-center gap-1 text-xs
                                       bg-green-500 text-white px-2 py-0.5
                                       rounded-full font-bold mb-0.5">
                                <i class="pi pi-star-fill" style="font-size:8px;"></i>
                                NOUVEAU
                            </span>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1
                                         rounded-full text-xs font-bold border whitespace-nowrap"
                                [ngStyle]="{
                                    background:  getPriorityBg(d.priority||'NORMAL'),
                                    color:       getPriorityColor(d.priority||'NORMAL'),
                                    borderColor: getPriorityBorder(d.priority||'NORMAL')
                                }">
                                {{ getPriorityIcon(d.priority || 'NORMAL') }}
                                {{ getPriorityLabel(d.priority || 'NORMAL') }}
                            </span>
                        </div>
                    </td>

                    <!-- Numéro -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-8 rounded-full flex-shrink-0"
                                [ngClass]="getStatusBarClass(d.status)"></div>
                            <span class="font-mono text-xs font-semibold text-primary-600
                                         bg-primary-50 px-2 py-1 rounded-md
                                         border border-primary-100">
                                {{ d.number || '—' }}
                            </span>
                        </div>
                    </td>

                    <!-- Objet -->
                    <td class="px-4 py-3">
                        <div class="font-medium text-sm text-surface-900
                                    dark:text-surface-0 truncate max-w-xs">
                            {{ d.object }}
                        </div>
                        <div *ngIf="d.declarant"
                            class="flex items-center gap-1 text-xs
                                   text-surface-400 mt-0.5">
                            <i [class]="d.declarant.anonymous ? 'pi pi-eye-slash' : 'pi pi-user'"
                                class="text-xs"></i>
                            {{ d.declarant.anonymous ? 'Anonyme' : d.declarant.displayName }}
                        </div>
                    </td>

                    <!-- Type -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <i [ngClass]="getTypeIcon(d.type)"
                                class="text-xs text-surface-400"></i>
                            <span class="text-xs text-surface-600">
                                {{ getTypeLabel(d.type) }}
                            </span>
                        </div>
                    </td>

                    <!-- Statut -->
                    <td class="px-4 py-3">
                        <p-tag [value]="getStatusLabel(d.status)"
                            [severity]="getStatusSeverity(d.status)"
                            styleClass="text-xs" />
                    </td>

                    <!-- Canal -->
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <i [ngClass]="getModeIcon(d.submissionMode)"
                                class="text-xs text-surface-300"></i>
                            <span class="text-xs text-surface-500">
                                {{ getModeLabel(d.submissionMode) }}
                            </span>
                        </div>
                    </td>

                    <!-- Date -->
                    <td class="px-4 py-3">
                        <span class="text-xs text-surface-400">
                            {{ d.createdAt | date:'dd/MM/yyyy' }}
                        </span>
                        <div *ngIf="isToday(d.createdAt)"
                            class="text-xs text-green-600 font-semibold mt-0.5">
                            Aujourd'hui
                        </div>
                    </td>

                    <!-- Actions : voir le dossier, puis le menu « ⋯ » (l'action du moment pour cet agent) -->
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                        <div class="flex items-center justify-end gap-1">
                            <p-button icon="pi pi-eye" severity="info" text size="small"
                                [routerLink]="['/app/dossiers', d.id]"
                                pTooltip="Voir le dossier" tooltipPosition="top" />
                            <button type="button" aria-haspopup="menu"
                                class="p-button p-component p-button-icon-only p-button-text p-button-secondary p-button-sm"
                                [attr.aria-label]="'Actions sur le dossier ' + (d.number || d.object)"
                                pTooltip="Actions" tooltipPosition="top"
                                (click)="ouvrirMenu($event, d)">
                                <i class="pi pi-ellipsis-v"></i>
                            </button>
                        </div>
                    </td>

                </tr>
            </ng-template>

            <!-- Détail déplié : l'essentiel du dossier, l'action du moment, et le lien vers la page complète -->
            <ng-template pTemplate="expandedrow" let-d>
                <tr>
                    <td colspan="9" class="p-0">
                        <div class="detail-ligne flex flex-col gap-3 px-6 py-4 bg-surface-50 border-l-4 border-primary-400">
                            <div *ngIf="d.description">
                                <div class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Les faits</div>
                                <p class="text-sm text-surface-800 whitespace-pre-line m-0">{{ d.description }}</p>
                            </div>
                            <dl class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 m-0 text-sm">
                                <div>
                                    <dt class="text-xs text-surface-500">Déclarant</dt>
                                    <dd class="m-0 font-medium">{{ d.declarant?.anonymous ? 'Anonyme' : (d.declarant?.displayName || '—') }}</dd>
                                </div>
                                <div *ngIf="d.regionOrigine">
                                    <dt class="text-xs text-surface-500">Zone d'origine</dt>
                                    <dd class="m-0 font-medium">{{ zone(d) }}</dd>
                                </div>
                                <div *ngIf="d.incidentLocation">
                                    <dt class="text-xs text-surface-500">Lieu des faits</dt>
                                    <dd class="m-0 font-medium">{{ d.incidentLocation }}</dd>
                                </div>
                                <div *ngIf="d.incidentPeriod">
                                    <dt class="text-xs text-surface-500">Période</dt>
                                    <dd class="m-0 font-medium">{{ d.incidentPeriod }}</dd>
                                </div>
                                <div *ngIf="d.estimatedLoss">
                                    <dt class="text-xs text-surface-500">Montant estimé</dt>
                                    <dd class="m-0 font-medium">{{ montant(d.estimatedLoss) }} FCFA</dd>
                                </div>
                                <div *ngIf="motifDe(d) as m">
                                    <dt class="text-xs text-surface-500">Motif indiqué</dt>
                                    <dd class="m-0 font-medium">{{ m.libelle }}<span *ngIf="m.terme" class="text-surface-500"> · {{ m.terme }}</span></dd>
                                </div>
                            </dl>
                            <p *ngIf="etapeLigne(d) as e" class="text-sm text-primary-900 m-0">
                                <i class="pi pi-arrow-right mr-2"></i>{{ e }}
                            </p>
                            <div class="flex flex-wrap items-center gap-2">
                                <p-button *ngFor="let a of actionsDe(d); trackBy: suivreAction"
                                    [label]="a.label" [icon]="a.icon" [severity]="a.severity" size="small"
                                    (onClick)="lancer(d, a.id)" />
                                <a [routerLink]="['/app/dossiers', d.id]"
                                    class="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline ml-auto">
                                    Voir le dossier complet <i class="pi pi-arrow-right text-xs"></i>
                                </a>
                            </div>
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="9">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100
                                        flex items-center justify-center mb-4">
                                <i class="pi pi-inbox text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">
                                Aucun dossier trouvé
                            </p>
                            <p class="text-xs text-surface-400 mt-1">
                                {{ isFiltering()
                                    ? 'Aucun résultat pour les filtres appliqués'
                                    : 'Aucun dossier enregistré' }}
                            </p>
                            <p-button *ngIf="isFiltering()"
                                label="Réinitialiser les filtres"
                                severity="secondary" text size="small" styleClass="mt-3"
                                (onClick)="resetFilters()" />
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Fenêtre de confirmation d'une action simple, sur la liste : chaque ouverture repart d'un motif vide -->
        @if (actionEnCours; as e) {
            <app-transition-dossier [dossier]="e.dossier" [action]="e.action"
                (termine)="apresAction($event)" (ferme)="actionEnCours = null" />
        }
    </div>

</div>
    `
})
export class DossiersList implements OnInit {

    private dossierService     = inject(DossierService);
    private messageService     = inject(MessageService);
    private statistiqueService = inject(StatistiqueService);
    private router             = inject(Router);
    private permissionService  = inject(PermissionService);
    private keycloakService    = inject(KeycloakService);

    @ViewChild('menuLigne') private menuLigne!: Menu;

    /**
     * Menu « ⋯ » d'une ligne : « Voir le dossier », puis l'action du moment pour cet agent (étape du dossier et rôle,
     * mêmes règles que le détail). Une action ouvre le dossier avec sa fenêtre de confirmation (?action=…).
     */
    actionsLigne(d: DossierResponse): MenuItem[] {
        return [
            { label: 'Voir le dossier', icon: 'pi pi-eye', command: () => { void this.router.navigate(['/app/dossiers', d.id]); } },
            ...this.actionsDe(d).map((a): MenuItem => ({
                label: a.label, icon: a.icon,
                styleClass: a.severity === 'danger' ? 'menu-danger' : undefined,
                command: () => this.lancer(d, a.id)
            }))
        ];
    }

    /** L'action du moment pour cet agent sur ce dossier (étape du dossier et rôle, mêmes règles que le détail). */
    actionsDe(d: DossierResponse): ActionPrincipale[] {
        const peutEnregistrer = d.status === 'SOUMIS' && this.permissionService.a('DOSSIER_ENREGISTRER');
        return actionsPrincipales(d.status, peutEnregistrer, roles => this.keycloakService.hasAnyRole(roles));
    }

    suivreAction = (_: number, action: ActionPrincipale): string => action.id;

    // ───────── ligne dépliable ─────────

    /** Lignes dépliées, par identifiant de dossier (format attendu par le tableau). */
    deplies: Record<string, boolean> = {};

    estDeplie(d: DossierResponse): boolean { return !!this.deplies[d.id]; }

    basculer(d: DossierResponse): void {
        const suite = { ...this.deplies };
        if (suite[d.id]) { delete suite[d.id]; } else { suite[d.id] = true; }
        this.deplies = suite;
    }

    zone(d: DossierResponse): string { return libelleDeRegion(d.regionOrigine); }
    motifDe(d: DossierResponse): MotifCitoyen | undefined { return motifCitoyen(d.motifDeclare); }
    montant(valeur: number): string { return new Intl.NumberFormat('fr-FR').format(valeur); }
    etapeLigne(d: DossierResponse): string | null { return phraseEtape(d.status, this.actionsDe(d)); }

    // ───────── action en fenêtre, sans quitter la liste ─────────

    actionEnCours: { dossier: DossierResponse; action: ActionId } | null = null;

    /**
     * Une action simple s'ouvre en fenêtre sur la liste ; « Demander un complément » demande un message au déclarant
     * et garde sa fenêtre dans la page du dossier (?action=…).
     */
    lancer(d: DossierResponse, action: ActionId): void {
        if (transitionDeLAction(action)) {
            this.actionEnCours = { dossier: d, action };
        } else {
            void this.router.navigate(['/app/dossiers', d.id], { queryParams: { action } });
        }
    }

    /** Le serveur a rendu le dossier mis à jour (ou rechargé après un conflit) : la ligne le reprend, dépliée ou non. */
    apresAction(misAJour: DossierResponse): void {
        this.allDossiers = this.allDossiers.map(d => d.id === misAJour.id ? misAJour : d);
        this.applyFilters();
        this.actionEnCours = null;
    }

    ouvrirMenu(event: Event, d: DossierResponse): void {
        this.menuLigne.model = this.actionsLigne(d);
        this.menuLigne.toggle(event);
    }

    allDossiers:      DossierResponse[] = [];
    filteredDossiers: DossierResponse[] = [];
    loading      = true;
    statsLoading = true;
    pageSize     = 20;

    searchText      = '';
    selectedStatus: DossierStatus | null   = null;
    selectedType:   string | null          = null;
    selectedMode:   string | null          = null;
    filterPriority: DossierPriority | null = null;
    selectedAnonymat: 'ANONYME' | 'NOMME' | null = null;

    newDossierId: string | null = null;

    stats: PublicStats = {
        totalDossiers: 0, dossiersNouveaux: 0,
        dossiersEnCours: 0, dossiersTraites: 0,
        confidentiel: '100%'
    };

    private readonly PRIORITY_ORDER: Record<string, number> = {
        CRITIQUE: 0, URGENT: 1, NORMAL: 2, FAIBLE: 3
    };

    readonly priorityOptions = [
        { label: '🔴 Critique', value: 'CRITIQUE' },
        { label: '🟠 Urgent',   value: 'URGENT'   },
        { label: '🔵 Normal',   value: 'NORMAL'   },
        { label: '⚪ Faible',   value: 'FAIBLE'   }
    ];

    readonly statusOptions = [
        { label: 'Soumis',                value: 'SOUMIS'                },
        { label: 'Reçu',                  value: 'RECU'                  },
        { label: 'En étude opportunité',  value: 'EN_ETUDE_OPPORTUNITE'  },
        { label: 'En attente complément', value: 'EN_ATTENTE_COMPLEMENT' },
        { label: 'En revue CTADP',        value: 'EN_REVUE_CTADP'        },
        { label: 'Recevable',             value: 'RECEVABLE'             },
        { label: 'Irrecevable',           value: 'IRRECEVABLE'           },
        { label: 'Transféré',             value: 'TRANSFERE'             },
        { label: 'En investigation',      value: 'EN_INVESTIGATION'      },
        { label: 'Rapport produit',       value: 'RAPPORT_PRODUIT'       },
        { label: 'Décision rendue',       value: 'DECISION_RENDUE'       },
        { label: 'Clôturé',               value: 'CLOS'                  },
        { label: 'Classé',               value: 'CLASSE'                }
    ];

    readonly typeOptions = [
        ...CHOIX_NATURE_AGENT,
        { label: libelleDeNature('SIGNALEMENT'), value: 'SIGNALEMENT' },
        { label: libelleDeNature('AUTO_SAISINE'), value: 'AUTO_SAISINE' }
    ];

    readonly anonymatOptions = [
        { label: 'Anonyme', value: 'ANONYME' },
        { label: 'Nommé',   value: 'NOMME'   }
    ];

    readonly modeOptions = [
        { label: 'Guichet BRPD',      value: 'IN_PERSON'     },
        { label: 'Formulaire Web',    value: 'WEB_FORM'      },
        { label: 'Email',             value: 'EMAIL'         },
        { label: 'SMS',               value: 'SMS'           },
        { label: 'Téléphone',         value: 'PHONE'         },
        { label: 'Numéro Vert',       value: 'GREEN_NUMBER'  },
        { label: 'Réseaux Sociaux',   value: 'SOCIAL_MEDIA'  },
        { label: 'Comptoir Audio',    value: 'AUDIO_COUNTER' },
        { label: 'Formulaire Papier', value: 'PAPER_FORM'    },
        { label: 'Courrier Postal',   value: 'POSTAL_MAIL'   },
        { label: 'Presse',            value: 'PRESS_MEDIA'   },
        { label: 'Rapport Audit',     value: 'AUDIT_REPORT'  }
    ];

    ngOnInit(): void {
        this.newDossierId = sessionStorage.getItem('lastSubmittedDossierId');
        this.loadAllDossiers();
        this.loadStats();
    }

    private loadAllDossiers(): void {
        this.loading = true;
        this.dossierService.findAll(0, 500).subscribe({
            next: page => {
                this.allDossiers = [...page.content].sort((a, b) => {
                    if (a.id === this.newDossierId) return -1;
                    if (b.id === this.newDossierId) return  1;

                    
                    const dateA = a.createdAt
                        ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt
                        ? new Date(b.createdAt).getTime() : 0;
                    if (dateB !== dateA) return dateB - dateA;

                   
                    const pa = this.PRIORITY_ORDER[a.priority || 'NORMAL'] ?? 2;
                    const pb = this.PRIORITY_ORDER[b.priority || 'NORMAL'] ?? 2;
                    return pa - pb;
                });
                this.applyFilters();
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les dossiers'
                });
            }
        });
    }

    private loadStats(): void {
        this.statsLoading = true;
        this.statistiqueService.getPublicStats().subscribe({
            next:  s  => { this.stats = s; this.statsLoading = false; },
            error: () => { this.statsLoading = false; }
        });
    }

    refresh(): void { this.loadAllDossiers(); this.loadStats(); }

    get urgentCount(): number {
        return this.allDossiers.filter(
            d => d.priority === 'CRITIQUE' || d.priority === 'URGENT').length;
    }

    applyFilters(): void {
        const q = this.searchText.trim().toLowerCase();
        this.filteredDossiers = this.allDossiers.filter(d => {
            if (q) {
                const hay = [
                    d.number || '', d.object || '', d.accessCode || '',
                    d.declarant?.displayName || '', d.declarant?.phoneNumber || '',
                    d.declarant?.email || ''
                ].join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (this.selectedStatus && d.status !== this.selectedStatus) return false;
            if (this.selectedType   && d.type   !== this.selectedType)   return false;
            if (this.selectedMode   && d.submissionMode !== this.selectedMode) return false;
            if (this.filterPriority && (d.priority || 'NORMAL') !== this.filterPriority)
                return false;
            if (this.selectedAnonymat === 'ANONYME' && d.declarant?.anonymous !== true)
                return false;
            if (this.selectedAnonymat === 'NOMME'
                && (!d.declarant || d.declarant.anonymous === true))
                return false;
            return true;
        });
    }

    isFiltering(): boolean {
        return !!(this.searchText || this.selectedStatus || this.selectedType
               || this.selectedMode || this.filterPriority || this.selectedAnonymat);
    }

    isToday(dateStr?: string): boolean { return isTodayUtil(dateStr); }

    clearSearch():    void { this.searchText       = '';   this.applyFilters(); }
    clearStatus():    void { this.selectedStatus   = null; this.applyFilters(); }
    clearType():      void { this.selectedType     = null; this.applyFilters(); }
    clearMode():      void { this.selectedMode     = null; this.applyFilters(); }
    clearAnonymat():  void { this.selectedAnonymat = null; this.applyFilters(); }

    resetFilters(): void {
        this.searchText = ''; this.selectedStatus = null;
        this.selectedType = null; this.selectedMode = null;
        this.filterPriority = null; this.selectedAnonymat = null;
        this.applyFilters();
    }

    getAnonymatLabel(v: string): string {
        return { ANONYME: 'Anonyme', NOMME: 'Nommé' }[v] || v;
    }


    getPriorityLabel(p: string): string {
        return { CRITIQUE:'Critique', URGENT:'Urgent',
                 NORMAL:'Normal', FAIBLE:'Faible' }[p] || p;
    }
    getPriorityIcon(p: string): string {
        return { CRITIQUE:'🔴', URGENT:'🟠', NORMAL:'🔵', FAIBLE:'⚪' }[p] || '🔵';
    }
    getPriorityBg(p: string): string {
        return { CRITIQUE:'#FEE2E2', URGENT:'#FFF7ED',
                 NORMAL:'#EFF6FF', FAIBLE:'#F8FAFC' }[p] || '#EFF6FF';
    }
    getPriorityColor(p: string): string {
        return { CRITIQUE:'#DC2626', URGENT:'#EA580C',
                 NORMAL:'#2563EB', FAIBLE:'#94A3B8' }[p] || '#2563EB';
    }
    getPriorityBorder(p: string): string {
        return { CRITIQUE:'#FCA5A5', URGENT:'#FDBA74',
                 NORMAL:'#BFDBFE', FAIBLE:'#E2E8F0' }[p] || '#BFDBFE';
    }
    getPriorityTooltip(d: DossierResponse): string {
        const parts: string[] = [];
        if (d.priorityReason)
            parts.push('Motif : ' + d.priorityReason);
        if (d.priorityDeadline)
            parts.push('Échéance : '
                + new Date(d.priorityDeadline).toLocaleDateString('fr-FR'));
        if (d.prioritySetAt)
            parts.push('Défini le : '
                + new Date(d.prioritySetAt).toLocaleDateString('fr-FR'));
        return parts.length ? parts.join('\n') : 'Priorité non définie';
    }


    getStatusLabel(status: string): string {
        const l: Record<string, string> = {
            SOUMIS:'Soumis', RECU:'Reçu', EN_ETUDE_OPPORTUNITE:'En étude',
            EN_ATTENTE_COMPLEMENT:'Complément', EN_REVUE_CTADP:'CTADP',
            RECEVABLE:'Recevable', IRRECEVABLE:'Irrecevable', TRANSFERE:'Transféré',
            EN_INVESTIGATION:'Investigation', RAPPORT_PRODUIT:'Rapport',
            DECISION_RENDUE:'Décision', CLOS:'Clôturé', CLASSE:'Classé'
        };
        return l[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const m: Record<string, TagSeverity> = {
            SOUMIS:'info', RECU:'info', EN_ETUDE_OPPORTUNITE:'warn',
            EN_ATTENTE_COMPLEMENT:'warn', EN_REVUE_CTADP:'warn',
            RECEVABLE:'success', IRRECEVABLE:'danger', TRANSFERE:'secondary',
            EN_INVESTIGATION:'warn', RAPPORT_PRODUIT:'info',
            DECISION_RENDUE:'success', CLOS:'success', CLASSE:'secondary'
        };
        return m[status] ?? 'info';
    }

    getStatusBarClass(status: string): string {
        const m: Record<string, string> = {
            SOUMIS:'bg-blue-400', RECU:'bg-blue-500',
            EN_ETUDE_OPPORTUNITE:'bg-amber-400', EN_ATTENTE_COMPLEMENT:'bg-amber-500',
            EN_REVUE_CTADP:'bg-orange-400', RECEVABLE:'bg-green-500',
            IRRECEVABLE:'bg-red-400', TRANSFERE:'bg-surface-400',
            EN_INVESTIGATION:'bg-purple-400', RAPPORT_PRODUIT:'bg-teal-400',
            DECISION_RENDUE:'bg-green-600', CLOS:'bg-green-700',
            CLASSE:'bg-surface-300'
        };
        return m[status] || 'bg-surface-200';
    }

    getTypeLabel(t: string): string {
        return libelleDeNature(t);
    }

    getTypeIcon(t: string): string {
        return { PLAINTE:'pi pi-exclamation-circle', COMPLAINT:'pi pi-exclamation-circle',
                 DENONCIATION:'pi pi-megaphone', DENUNCIATION:'pi pi-megaphone',
                 PLAINTE_DENONCIATION:'pi pi-bullseye',
                 DEMANDE_INTERVENTION:'pi pi-send',
                 SIGNALEMENT:'pi pi-building', AUTO_SAISINE:'pi pi-search', AUTO_REFERRAL:'pi pi-search',
                 ANONYMOUS:'pi pi-eye-slash' }[t] || 'pi pi-file';
    }

    getModeLabel(m: string): string {
        const l: Record<string, string> = {
            IN_PERSON:'Guichet', WEB_FORM:'Web', EMAIL:'Email', SMS:'SMS',
            PHONE:'Téléphone', GREEN_NUMBER:'N° Vert', SOCIAL_MEDIA:'Réseaux',
            AUDIO_COUNTER:'Audio', PAPER_FORM:'Formulaire', POSTAL_MAIL:'Courrier',
            PRESS_MEDIA:'Presse', AUDIT_REPORT:'Rapport'
        };
        return l[m] || m;
    }

    getModeIcon(m: string): string {
        const map: Record<string, string> = {
            IN_PERSON:'pi pi-building', WEB_FORM:'pi pi-globe',
            EMAIL:'pi pi-envelope', SMS:'pi pi-mobile',
            PHONE:'pi pi-phone', GREEN_NUMBER:'pi pi-phone',
            SOCIAL_MEDIA:'pi pi-share-alt', AUDIO_COUNTER:'pi pi-microphone',
            PAPER_FORM:'pi pi-file', POSTAL_MAIL:'pi pi-send',
            PRESS_MEDIA:'pi pi-book', AUDIT_REPORT:'pi pi-chart-bar'
        };
        return map[m] || 'pi pi-circle';
    }
}