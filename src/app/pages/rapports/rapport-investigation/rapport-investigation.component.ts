import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

import { InvestigationService } from '../../../core/services/investigation.service';

export interface InvestigationRow {
    id:              string;
    dossierNumber:   string;
    dossierObject:   string;
    status:          string;
    outcome:         string | null;
    startDate:       string | null;
    plannedEndDate:  string | null;
    actualEndDate:   string | null;
    durationDays:    number | null;   
    remainingDays:   number | null;   
    isOverdue:       boolean;
    cgeName:         string | null;
    cgea:            string | null;
}

@Component({
    selector: 'app-rapport-investigation',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule,
        ButtonModule, DatePickerModule, SelectModule,
        TagModule, SkeletonModule, ToastModule, DividerModule
    ],
    providers: [MessageService],
    styles: [`
        .period-btn {
            padding: 7px 18px; border-radius: 20px; font-size: .82rem;
            font-weight: 600; cursor: pointer; border: 1.5px solid #e5e7eb;
            background: #fff; color: #6b7280; transition: all .15s;
            white-space: nowrap;
        }
        .period-btn:hover  { border-color: #16a34a; color: #16a34a; }
        .period-btn.active { border-color: #16a34a; background: #f0fdf4; color: #15803d; }

        :host ::ng-deep .filter-sel .p-select {
            border: none !important; box-shadow: none !important;
            background: transparent !important;
        }
    `],
    template: `
<p-toast />

<div class="flex flex-col gap-5 pb-10 max-w-6xl mx-auto">

    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                Rapport d'état — Investigations
            </h1>
            <p class="text-surface-400 text-sm mt-0.5">ASCE-LC — Département d'Enquête et d'Investigation</p>
        </div>
        <div class="flex gap-2">
            <p-button label="PDF" icon="pi pi-file-pdf"
                severity="danger" outlined size="small"
                [loading]="exportingPdf" [disabled]="!dataLoaded"
                (onClick)="exportPdf()" />
            <p-button label="Excel" icon="pi pi-file-excel"
                severity="success" outlined size="small"
                [loading]="exportingExcel" [disabled]="!dataLoaded"
                (onClick)="exportExcel()" />
        </div>
    </div>

    <div class="bg-white dark:bg-surface-800 rounded-2xl border
                border-surface-100 dark:border-surface-700 p-5">

        <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3">
            Choisir la période
        </p>

        <div class="flex gap-2 flex-wrap">
            <button *ngFor="let p of shortcuts" class="period-btn"
                [class.active]="activePeriod === p.key"
                (click)="applyShortcut(p)">
                {{ p.label }}
            </button>
            <button class="period-btn"
                [class.active]="activePeriod === 'custom'"
                (click)="activePeriod='custom'">
                Personnalisée
            </button>
        </div>

        <div *ngIf="activePeriod === 'custom'"
            class="flex items-center gap-3 flex-wrap mt-3 pt-3
                   border-t border-surface-100">
            <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-surface-600 w-6">Du</label>
                <p-datepicker [(ngModel)]="dateDebut" dateFormat="dd/mm/yy"
                    [showIcon]="true" placeholder="Début" styleClass="text-sm"/>
            </div>
            <div class="flex items-center gap-2">
                <label class="text-sm font-medium text-surface-600 w-6">Au</label>
                <p-datepicker [(ngModel)]="dateFin" dateFormat="dd/mm/yy"
                    [showIcon]="true" placeholder="Fin" styleClass="text-sm"/>
            </div>
            <p-button label="Charger" icon="pi pi-refresh" severity="info"
                [disabled]="!dateDebut || !dateFin" (onClick)="generateCustom()"/>
        </div>

        <div *ngIf="periodLabel"
            class="flex items-center justify-between mt-3 pt-3
                   border-t border-surface-100">
            <span class="text-sm text-green-700 font-semibold flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                {{ periodLabel }}
            </span>
            <span class="text-xs text-surface-400">
                {{ allRows.length }} investigation(s) en mémoire
            </span>
        </div>
    </div>

    <div *ngIf="allRows.length > 0"
        class="bg-white dark:bg-surface-800 rounded-2xl border
               border-surface-100 dark:border-surface-700 p-5">

        <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3">
            Filtrer les résultats
            <span class="normal-case font-normal tracking-normal text-surface-300 ml-2">
                (filtrage local — aucun appel réseau)
            </span>
        </p>

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">

            <div class="filter-sel">
                <label class="text-xs text-surface-400 mb-1 block">Statut</label>
                <p-select [(ngModel)]="filterStatut"
                    [options]="statutOptions" optionLabel="label" optionValue="value"
                    placeholder="Tous" [showClear]="true"
                    styleClass="w-full" appendTo="body"/>
            </div>

            <div class="filter-sel">
                <label class="text-xs text-surface-400 mb-1 block">Outcome (résultat)</label>
                <p-select [(ngModel)]="filterOutcome"
                    [options]="outcomeOptions" optionLabel="label" optionValue="value"
                    placeholder="Tous" [showClear]="true"
                    styleClass="w-full" appendTo="body"/>
            </div>

            <div class="filter-sel">
                <label class="text-xs text-surface-400 mb-1 block">Délai</label>
                <p-select [(ngModel)]="filterDelai"
                    [options]="delaiOptions" optionLabel="label" optionValue="value"
                    placeholder="Tous" [showClear]="true"
                    styleClass="w-full" appendTo="body"/>
            </div>
        </div>

        <div class="flex items-center justify-between gap-3 pt-3 border-t border-surface-100">
            <p-button *ngIf="filtresAppliques" label="Réinitialiser"
                icon="pi pi-filter-slash" severity="secondary" outlined size="small"
                (onClick)="resetFiltres()"/>
            <span *ngIf="!filtresAppliques" class="text-xs text-surface-300">
                Aucun filtre actif
            </span>
            <p-button label="Appliquer" icon="pi pi-check"
                severity="info" size="small" (onClick)="appliquerFiltres()"/>
        </div>

        <div *ngIf="filtresAppliques"
            class="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 flex-wrap">
            <span class="text-xs text-blue-700 font-semibold">
                <i class="pi pi-filter-fill mr-1"></i>
                {{ rowsFiltered.length }} résultat(s) sur {{ allRows.length }}
            </span>
            <span *ngIf="filtresAppliquesData.statut"
                class="inline-flex items-center gap-1 text-xs bg-green-50
                       text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                {{ getStatusLabel(filtresAppliquesData.statut) }}
                <button (click)="filterStatut=null; appliquerFiltres()">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="filtresAppliquesData.outcome"
                class="inline-flex items-center gap-1 text-xs bg-indigo-50
                       text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                {{ getOutcomeLabel(filtresAppliquesData.outcome) }}
                <button (click)="filterOutcome=null; appliquerFiltres()">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="filtresAppliquesData.delai"
                class="inline-flex items-center gap-1 text-xs bg-red-50
                       text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                {{ filtresAppliquesData.delai === 'OVERDUE' ? 'En retard' : 'Dans les délais' }}
                <button (click)="filterDelai=null; appliquerFiltres()">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
        </div>
    </div>

    <!-- Skeleton -->
    <div *ngIf="loading" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <p-skeleton *ngFor="let i of [1,2,3,4]" height="88px" borderRadius="14px"/>
        </div>
        <p-skeleton height="300px" borderRadius="16px"/>
    </div>

    <ng-container *ngIf="!loading && dataLoaded">

        <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-6">

            <!-- Entête -->
            <div class="flex items-start justify-between mb-1">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center
                                justify-center flex-shrink-0">
                        <i class="pi pi-search text-green-700"></i>
                    </div>
                    <div>
                        <div class="font-black text-surface-900 dark:text-surface-0">
                            ASCE-LC — Rapport Investigations
                        </div>
                        <div class="text-xs text-surface-400 mt-0.5">
                            {{ periodLabel }}
                            <span *ngIf="filtresAppliques" class="ml-2 text-blue-600 font-semibold">
                                ({{ rowsFiltered.length }} filtrée(s))
                            </span>
                        </div>
                    </div>
                </div>
                <div class="text-xs text-surface-400 text-right">
                    <div>{{ today | date:'dd/MM/yyyy HH:mm' }}</div>
                    <div class="font-mono">INV-{{ today | date:'yyyyMMdd' }}</div>
                </div>
            </div>

            <p-divider/>

            <!-- KPIs principaux -->
            <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">
                Indicateurs clés
            </p>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

                <div class="p-4 rounded-xl bg-green-50 border border-green-100">
                    <div class="text-xs text-surface-400 mb-1">Total investigations</div>
                    <div class="text-3xl font-black text-green-600">
                        {{ filtresAppliques ? rowsFiltered.length : allRows.length }}
                    </div>
                    <div class="text-xs text-surface-300 mt-1">{{ periodLabel }}</div>
                </div>

                <div class="p-4 rounded-xl border"
                    [class.bg-red-50]="overdueCount > 0"
                    [class.border-red-100]="overdueCount > 0"
                    [class.bg-surface-50]="overdueCount === 0"
                    [class.border-surface-100]="overdueCount === 0">
                    <div class="text-xs text-surface-400 mb-1">En retard</div>
                    <div class="text-3xl font-black"
                        [class.text-red-600]="overdueCount > 0"
                        [class.text-green-600]="overdueCount === 0">
                        {{ overdueCount }}
                    </div>
                    <div class="text-xs text-surface-300 mt-1">
                        Délai 90j dépassé
                    </div>
                </div>

                <div class="p-4 rounded-xl bg-surface-50 border border-surface-100">
                    <div class="text-xs text-surface-400 mb-1">Durée moyenne</div>
                    <div class="text-3xl font-black text-amber-600">
                        {{ avgDuration | number:'1.0-0' }}j
                    </div>
                    <div class="text-xs mt-1"
                        [class.text-red-500]="avgDuration > 90"
                        [class.text-green-600]="avgDuration <= 90">
                        Objectif : 90j
                    </div>
                </div>

                <div class="p-4 rounded-xl bg-surface-50 border border-surface-100">
                    <div class="text-xs text-surface-400 mb-1">Taux respect délai</div>
                    <div class="text-3xl font-black"
                        [class.text-green-600]="tauxRespectDelai >= 80"
                        [class.text-amber-600]="tauxRespectDelai >= 50 && tauxRespectDelai < 80"
                        [class.text-red-600]="tauxRespectDelai < 50">
                        {{ tauxRespectDelai | number:'1.0-0' }}%
                    </div>
                    <div class="text-xs text-surface-300 mt-1">Dans les 90j</div>
                </div>
            </div>

            <!-- KPIs outcomes -->
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                <div *ngFor="let o of outcomeStats"
                    class="p-3 rounded-xl border text-center"
                    [ngStyle]="{background:o.bg, borderColor:o.border}">
                    <div class="text-2xl font-black mb-0.5"
                        [ngStyle]="{color:o.color}">
                        {{ o.count }}
                    </div>
                    <div class="text-xs text-surface-500 font-medium">{{ o.label }}</div>
                </div>
            </div>

            <p-divider/>

            <!-- Barres délai -->
            <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">
                Analyse des délais §D.2
            </p>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
                <div class="flex flex-col gap-3">

                    <!-- Durée moy investigation -->
                    <div>
                        <div class="flex justify-between text-sm mb-1.5">
                            <span class="text-surface-600 font-medium">Durée moy. investigation</span>
                            <span class="font-bold text-xs"
                                [class.text-red-600]="avgDuration > 90"
                                [class.text-amber-600]="avgDuration > 72 && avgDuration <= 90"
                                [class.text-green-600]="avgDuration <= 72">
                                {{ avgDuration|number:'1.0-1' }}j / 90j
                            </span>
                        </div>
                        <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-700"
                                [style.width]="getBarWidth(avgDuration, 90)"
                                [class.bg-red-500]="avgDuration > 90"
                                [class.bg-amber-400]="avgDuration > 72 && avgDuration <= 90"
                                [class.bg-green-500]="avgDuration <= 72">
                            </div>
                        </div>
                    </div>

                    <!-- Durée moy DEI -->
                    <div *ngIf="avgDeiDays > 0">
                        <div class="flex justify-between text-sm mb-1.5">
                            <span class="text-surface-600 font-medium">Approbation DEI</span>
                            <span class="font-bold text-xs"
                                [class.text-red-600]="avgDeiDays > 15"
                                [class.text-amber-600]="avgDeiDays > 12 && avgDeiDays <= 15"
                                [class.text-green-600]="avgDeiDays <= 12">
                                {{ avgDeiDays|number:'1.0-1' }}j / 15j
                            </span>
                        </div>
                        <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-700"
                                [style.width]="getBarWidth(avgDeiDays, 15)"
                                [class.bg-red-500]="avgDeiDays > 15"
                                [class.bg-amber-400]="avgDeiDays > 12 && avgDeiDays <= 15"
                                [class.bg-green-500]="avgDeiDays <= 12">
                            </div>
                        </div>
                    </div>

                    <!-- Durée moy CGE -->
                    <div *ngIf="avgCgeDays > 0">
                        <div class="flex justify-between text-sm mb-1.5">
                            <span class="text-surface-600 font-medium">Approbation CGE</span>
                            <span class="font-bold text-xs"
                                [class.text-red-600]="avgCgeDays > 20"
                                [class.text-amber-600]="avgCgeDays > 16 && avgCgeDays <= 20"
                                [class.text-green-600]="avgCgeDays <= 16">
                                {{ avgCgeDays|number:'1.0-1' }}j / 20j
                            </span>
                        </div>
                        <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-700"
                                [style.width]="getBarWidth(avgCgeDays, 20)"
                                [class.bg-red-500]="avgCgeDays > 20"
                                [class.bg-amber-400]="avgCgeDays > 16 && avgCgeDays <= 20"
                                [class.bg-green-500]="avgCgeDays <= 16">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Résumé statuts -->
                <div class="flex flex-col gap-2">
                    <div *ngFor="let s of statusStats"
                        class="flex items-center justify-between p-3 rounded-xl
                               bg-surface-50 border border-surface-100">
                        <div class="flex items-center gap-2">
                            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                [ngStyle]="{background: s.color}"></div>
                            <span class="text-sm font-medium text-surface-700">
                                {{ s.label }}
                            </span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="font-black text-surface-900">{{ s.count }}</span>
                            <span class="text-xs text-surface-400 w-10 text-right">
                                {{ s.pct|number:'1.0-0' }}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <p-divider/>

            <!-- Liste détaillée -->
            <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">
                Liste des investigations
                <span class="font-black text-green-600 ml-2 normal-case
                             tracking-normal text-sm">
                    {{ rowsFiltered.length }}
                </span>
                <span *ngIf="filtresAppliques"
                    class="normal-case font-normal tracking-normal text-blue-500 ml-1">
                    — filtrées
                </span>
            </p>

            <div *ngIf="rowsFiltered.length === 0"
                class="py-10 text-center text-surface-400">
                <i class="pi pi-inbox text-3xl mb-3 block text-surface-300"></i>
                <p class="font-medium">Aucune investigation pour cette sélection</p>
                <p-button label="Réinitialiser" severity="secondary"
                    text size="small" styleClass="mt-2" (onClick)="resetFiltres()"/>
            </div>

            <div *ngIf="rowsFiltered.length > 0" class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b-2 border-surface-100">
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">N° Dossier</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Objet</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Statut</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Outcome</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Début</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Fin prévue</th>
                            <th class="text-right py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Durée</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Délai</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let row of rowsFiltered; let odd=odd"
                            class="border-b border-surface-50"
                            [class.bg-surface-50]="odd"
                            [class.bg-red-50]="row.isOverdue && !odd"
                            [class.bg-red-50]="row.isOverdue && odd">
                            <td class="py-2.5 px-2 font-mono text-xs font-bold
                                       text-primary-600 whitespace-nowrap">
                                {{ row.dossierNumber || '—' }}
                            </td>
                            <td class="py-2.5 px-2 text-sm text-surface-700">
                                <div class="truncate" style="max-width:200px">
                                    {{ row.dossierObject }}
                                </div>
                            </td>
                            <td class="py-2.5 px-2">
                                <span class="inline-block px-2 py-0.5 rounded-full
                                             text-xs font-semibold whitespace-nowrap"
                                    [ngStyle]="{background:getStatusBg(row.status),
                                                color:getStatusColor(row.status)}">
                                    {{ getStatusLabel(row.status) }}
                                </span>
                            </td>
                            <td class="py-2.5 px-2">
                                <span *ngIf="row.outcome"
                                    class="inline-block px-2 py-0.5 rounded-full
                                           text-xs font-semibold whitespace-nowrap"
                                    [ngStyle]="{background:getOutcomeBg(row.outcome),
                                                color:getOutcomeColor(row.outcome)}">
                                    {{ getOutcomeLabel(row.outcome) }}
                                </span>
                                <span *ngIf="!row.outcome"
                                    class="text-xs text-surface-300">—</span>
                            </td>
                            <td class="py-2.5 px-2 text-xs text-surface-400 whitespace-nowrap">
                                {{ row.startDate | date:'dd/MM/yyyy' }}
                            </td>
                            <td class="py-2.5 px-2 text-xs text-surface-400 whitespace-nowrap">
                                {{ row.plannedEndDate | date:'dd/MM/yyyy' }}
                            </td>
                            <td class="py-2.5 px-2 text-right text-xs font-bold whitespace-nowrap"
                                [class.text-red-600]="row.durationDays && row.durationDays > 90"
                                [class.text-green-600]="row.durationDays && row.durationDays <= 90"
                                [class.text-surface-400]="!row.durationDays">
                                {{ row.durationDays ? row.durationDays + 'j' : '—' }}
                            </td>
                            <td class="py-2.5 px-2">
                                <span *ngIf="row.isOverdue"
                                    class="inline-flex items-center gap-1 text-xs
                                           bg-red-100 text-red-700 px-2 py-0.5 rounded-full
                                           font-semibold whitespace-nowrap">
                                    <i class="pi pi-exclamation-triangle" style="font-size:9px;"></i>
                                    En retard
                                </span>
                                <span *ngIf="!row.isOverdue && row.remainingDays !== null"
                                    class="text-xs text-green-600 font-semibold whitespace-nowrap">
                                    {{ row.remainingDays }}j restants
                                </span>
                                <span *ngIf="!row.isOverdue && row.remainingDays === null"
                                    class="text-xs bg-green-100 text-green-700 px-2 py-0.5
                                           rounded-full font-semibold whitespace-nowrap">
                                    Terminée
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pied -->
            <div class="mt-6 pt-4 border-t border-surface-100 flex justify-between
                        text-xs text-surface-300">
                <span>ASCE-LC — Confidentiel — Manuel §D.2</span>
                <span>{{ today | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
        </div>

    </ng-container>

    <!-- État vide -->
    <div *ngIf="!loading && !dataLoaded"
        class="bg-white rounded-2xl border border-surface-100 p-16 text-center">
        <div class="w-16 h-16 rounded-2xl bg-green-50 flex items-center
                    justify-center mx-auto mb-4">
            <i class="pi pi-search text-green-600 text-2xl"></i>
        </div>
        <p class="font-medium text-surface-500">
            Sélectionnez une période pour générer le rapport
        </p>
    </div>

</div>
    `
})
export class RapportInvestigationComponent implements OnInit {

    private invService = inject(InvestigationService);
    private msgService = inject(MessageService);

    loading        = false;
    exportingPdf   = false;
    exportingExcel = false;
    dataLoaded     = false;

    allRows:  InvestigationRow[] = [];
    rowsFiltered: InvestigationRow[] = [];
    today     = new Date();

    activePeriod = '';
    periodLabel  = '';
    dateDebut:   Date | null = null;
    dateFin:     Date | null = null;

    avgDuration     = 0;
    avgDeiDays      = 0;
    avgCgeDays      = 0;
    overdueCount    = 0;
    tauxRespectDelai = 0;
    outcomeStats:   any[] = [];
    statusStats:    any[] = [];

    filterStatut:  string | null = null;
    filterOutcome: string | null = null;
    filterDelai:   string | null = null;

    filtresAppliques     = false;
    filtresAppliquesData = {
        statut: null as string|null,
        outcome: null as string|null,
        delai: null as string|null
    };

    readonly shortcuts = [
        { key:'month',    label:'Ce mois'         },
        { key:'quarter',  label:'Ce trimestre'     },
        { key:'semester', label:'Ce semestre'      },
        { key:'year',     label:'Cette année'      },
        { key:'last12',   label:'12 derniers mois' },
    ];

    readonly statutOptions = [
        { label:'Initiée',        value:'INITIATED'   },
        { label:'En cours',       value:'IN_PROGRESS' },
        { label:'Suspendue',      value:'SUSPENDED'   },
        { label:'Terminée',       value:'COMPLETED'   },
        { label:'Archivée',       value:'ARCHIVED'    },
    ];

    readonly outcomeOptions = [
        { label:'Sanctions administratives', value:'ADMINISTRATIVE_SANCTIONS' },
        { label:'Renvoi en justice',         value:'JUDICIAL_REFERRAL'        },
        { label:'Classé sans suite',         value:'ARCHIVED'                 },
        { label:'Rapport annuel',            value:'ANNUAL_REPORT'            },
        { label:'Non défini',                value:'NULL'                     },
    ];

    readonly delaiOptions = [
        { label:'En retard (> 90j)',    value:'OVERDUE'   },
        { label:'Dans les délais',      value:'ON_TIME'   },
    ];

    ngOnInit(): void {
        this.applyShortcut({ key:'year', label:'Cette année' });
    }

    applyShortcut(p: { key: string; label: string }): void {
        this.activePeriod = p.key;
        const now = new Date();
        let start: Date;
        switch (p.key) {
            case 'month':    start = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'quarter':  start = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1); break;
            case 'semester': start = new Date(now.getFullYear(), now.getMonth()<6?0:6, 1); break;
            case 'last12':   start = new Date(now.getTime()-365*24*60*60*1000); break;
            default:         start = new Date(now.getFullYear(), 0, 1);
        }
        this.dateDebut   = start;
        this.dateFin     = now;
        this.periodLabel = p.label + ' ('
            + start.toLocaleDateString('fr-FR')
            + ' – ' + now.toLocaleDateString('fr-FR') + ')';
        this.resetFiltresSilent();
        this.load(start, now);
    }

    generateCustom(): void {
        if (!this.dateDebut || !this.dateFin) return;
        if (this.dateFin < this.dateDebut) {
            this.msgService.add({ severity:'warn', summary:'Période invalide',
                detail:'La date de fin doit être après la date de début' });
            return;
        }
        this.periodLabel = this.dateDebut.toLocaleDateString('fr-FR')
            + ' – ' + this.dateFin.toLocaleDateString('fr-FR');
        this.resetFiltresSilent();
        this.load(this.dateDebut, this.dateFin);
    }

    private load(start: Date, end: Date): void {
        this.loading   = true;
        this.dataLoaded = false;
        this.allRows   = [];
        this.rowsFiltered = [];

        const s = start.toISOString();
        const e = end.toISOString();

        this.invService.findByPeriod(s, e).subscribe({
            next: list => {
                this.allRows      = list.map(inv => this.toRow(inv));
                this.rowsFiltered = [...this.allRows];
                this.computeStats(this.allRows);
                this.dataLoaded = true;
                this.loading    = false;
            },
            error: () => {
                this.loading = false;
                this.msgService.add({ severity:'error', summary:'Erreur',
                    detail:'Impossible de charger les investigations' });
            }
        });
    }

    private toRow(inv: any): InvestigationRow {
        const startDate    = inv.startDate ? new Date(inv.startDate) : null;
        const endDate      = inv.actualEndDate ? new Date(inv.actualEndDate) : null;
        const plannedEnd   = inv.extendedDeadline
            ? new Date(inv.extendedDeadline)
            : inv.plannedEndDate ? new Date(inv.plannedEndDate) : null;
        const now          = new Date();

        const durationDays = startDate && endDate
            ? Math.floor((endDate.getTime() - startDate.getTime()) / 86400000)
            : startDate && !endDate
            ? Math.floor((now.getTime() - startDate.getTime()) / 86400000)
            : null;

        const isOverdue = !endDate
            && plannedEnd !== null
            && now > plannedEnd;

        const remainingDays = !endDate && plannedEnd
            ? Math.floor((plannedEnd.getTime() - now.getTime()) / 86400000)
            : null;

        return {
            id:             inv.id,
            dossierNumber:  inv.dossier?.number || inv.caseNumber || '—',
            dossierObject:  inv.dossier?.object || inv.caseObject || '—',
            status:         inv.status,
            outcome:        inv.outcome || null,
            startDate:      inv.startDate,
            plannedEndDate: inv.extendedDeadline || inv.plannedEndDate,
            actualEndDate:  inv.actualEndDate,
            durationDays,
            remainingDays:  remainingDays !== null ? Math.max(0, remainingDays) : null,
            isOverdue,
            cgeName:        inv.dei?.lastName || null,
            cgea:           inv.cgea?.lastName || null
        };
    }

    private computeStats(rows: InvestigationRow[]): void {
        const total = rows.length || 1;

        const withDuration = rows.filter(r =>
            r.actualEndDate && r.startDate && r.durationDays !== null);
        this.avgDuration = withDuration.length
            ? withDuration.reduce((s, r) => s + (r.durationDays||0), 0) / withDuration.length
            : 0;

        this.overdueCount = rows.filter(r => r.isOverdue).length;

        const terminated = rows.filter(r => r.actualEndDate);
        const inTime     = terminated.filter(r => (r.durationDays||0) <= 90);
        this.tauxRespectDelai = terminated.length
            ? (inTime.length / terminated.length) * 100 : 100;

        const outcomeCounts: Record<string, number> = {};
        rows.forEach(r => {
            const k = r.outcome || 'NULL';
            outcomeCounts[k] = (outcomeCounts[k] || 0) + 1;
        });
        const outcomeCfg: Record<string, any> = {
            ADMINISTRATIVE_SANCTIONS: { label:'Sanctions admin.',  bg:'#fef3c7', border:'#fde68a', color:'#b45309' },
            JUDICIAL_REFERRAL:        { label:'Renvoi justice',    bg:'#dcfce7', border:'#ddd6fe', color:'#15803d' },
            ARCHIVED:                 { label:'Classé s.s.',       bg:'#f1f5f9', border:'#e2e8f0', color:'#475569' },
            ANNUAL_REPORT:            { label:'Rapport annuel',    bg:'#dbeafe', border:'#bfdbfe', color:'#1d4ed8' },
            NULL:                     { label:'Non défini',        bg:'#f9fafb', border:'#e5e7eb', color:'#9ca3af' },
        };
        this.outcomeStats = Object.entries(outcomeCounts)
            .map(([k, count]) => ({ count, ...(outcomeCfg[k] || outcomeCfg['NULL']) }))
            .sort((a, b) => b.count - a.count);

        const statusCounts: Record<string, number> = {};
        rows.forEach(r => { statusCounts[r.status] = (statusCounts[r.status]||0)+1; });
        const statusCfg: Record<string, any> = {
            INITIATED:   { label:'Initiée',    color:'#3b82f6' },
            IN_PROGRESS: { label:'En cours',   color:'#8b5cf6' },
            SUSPENDED:   { label:'Suspendue',  color:'#f59e0b' },
            COMPLETED:   { label:'Terminée',   color:'#10b981' },
            ARCHIVED:    { label:'Archivée',   color:'#94a3b8' },
        };
        this.statusStats = Object.entries(statusCounts)
            .map(([s, count]) => ({
                count, pct: (count/total)*100,
                ...(statusCfg[s] || { label:s, color:'#94a3b8' })
            }))
            .sort((a, b) => b.count - a.count);

        this.avgDeiDays = 0;
        this.avgCgeDays = 0;
    }

    appliquerFiltres(): void {
        this.rowsFiltered = this.allRows.filter(r => {
            if (this.filterStatut  && r.status !== this.filterStatut)  return false;
            if (this.filterOutcome) {
                if (this.filterOutcome === 'NULL' && r.outcome)         return false;
                if (this.filterOutcome !== 'NULL' && r.outcome !== this.filterOutcome) return false;
            }
            if (this.filterDelai === 'OVERDUE'  && !r.isOverdue)       return false;
            if (this.filterDelai === 'ON_TIME'  &&  r.isOverdue)       return false;
            return true;
        });
        this.filtresAppliquesData = {
            statut:  this.filterStatut,
            outcome: this.filterOutcome,
            delai:   this.filterDelai
        };
        this.filtresAppliques = !!(this.filterStatut||this.filterOutcome||this.filterDelai);
        this.computeStats(this.rowsFiltered);
    }

    resetFiltres(): void {
        this.filterStatut = null; this.filterOutcome = null; this.filterDelai = null;
        this.filtresAppliques = false;
        this.filtresAppliquesData = { statut:null, outcome:null, delai:null };
        this.rowsFiltered = [...this.allRows];
        this.computeStats(this.allRows);
    }

    private resetFiltresSilent(): void {
        this.filterStatut=null; this.filterOutcome=null; this.filterDelai=null;
        this.filtresAppliques=false;
        this.filtresAppliquesData={statut:null,outcome:null,delai:null};
    }

   
    async exportPdf(): Promise<void> {
        this.exportingPdf = true;
        try {
            const { default: jsPDF }     = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
            const W   = doc.internal.pageSize.getWidth();
            let y = 0;

            doc.setFillColor(22, 163, 74);
            doc.rect(0, 0, W, 26, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(13); doc.setFont('helvetica','bold');
            doc.text('ASCE-LC — Rapport Investigations', 14, 10);
            doc.setFontSize(9); doc.setFont('helvetica','normal');
            doc.text('Département d\'Enquête et d\'Investigation — ' + this.periodLabel, 14, 16);
            doc.setTextColor(0,0,0);
            doc.setFontSize(7); doc.setTextColor(150,150,150);
            doc.text('Généré le : ' + this.today.toLocaleDateString('fr-FR')
                + ' à ' + this.today.toLocaleTimeString('fr-FR'), W-14, 24, {align:'right'});
            doc.setTextColor(0,0,0);
            y = 33;

            autoTable(doc, {
                startY: y,
                head:   [['Indicateur', 'Valeur']],
                body:   [
                    ['Total investigations', String(this.rowsFiltered.length)],
                    ['En retard',           String(this.overdueCount)],
                    ['Durée moyenne',       this.avgDuration.toFixed(1)+'j (objectif 90j)'],
                    ['Taux respect délai',  this.tauxRespectDelai.toFixed(1)+'%'],
                    ...this.outcomeStats.map(o => [o.label, String(o.count)])
                ],
                theme:'striped',
                headStyles:{ fillColor:[22,163,74], fontSize:9 },
                bodyStyles:{ fontSize:9 },
                columnStyles:{ 1:{ fontStyle:'bold', halign:'right' } },
                margin:{ left:14, right:14 }
            });
            y = (doc as any).lastAutoTable.finalY + 8;

            autoTable(doc, {
                startY: y,
                head:   [['Statut', 'Nombre', '%']],
                body:   this.statusStats.map(s => [s.label, s.count, s.pct.toFixed(1)+'%']),
                foot:   [['TOTAL', this.rowsFiltered.length, '100%']],
                theme:'striped',
                headStyles:{ fillColor:[22,163,74], fontSize:9 },
                bodyStyles:{ fontSize:9 },
                footStyles:{ fontStyle:'bold', fillColor:[240,253,244] },
                columnStyles:{ 1:{halign:'right',fontStyle:'bold'}, 2:{halign:'right'} },
                margin:{ left:14, right:14 }
            });

            if (this.rowsFiltered.length > 0) {
                doc.addPage(); y = 14;
                doc.setFontSize(10); doc.setFont('helvetica','bold');
                doc.text('Liste des investigations ('+this.rowsFiltered.length+')', 14, y);
                y+=3; doc.setDrawColor(200,200,200); doc.line(14,y,W-14,y); y+=2;
                autoTable(doc, {
                    startY: y,
                    head:   [['N° Dossier','Objet','Statut','Outcome','Début','Fin prévue','Durée','Délai']],
                    body:   this.rowsFiltered.map(r => [
                        r.dossierNumber,
                        (r.dossierObject||'').substring(0,30)+((r.dossierObject||'').length>30?'…':''),
                        this.getStatusLabel(r.status),
                        r.outcome ? this.getOutcomeLabel(r.outcome) : '—',
                        r.startDate ? new Date(r.startDate).toLocaleDateString('fr-FR') : '—',
                        r.plannedEndDate ? new Date(r.plannedEndDate).toLocaleDateString('fr-FR') : '—',
                        r.durationDays ? r.durationDays+'j' : '—',
                        r.isOverdue ? 'EN RETARD' : (r.remainingDays!==null ? r.remainingDays+'j restants' : 'Terminée')
                    ]),
                    theme:'striped',
                    headStyles:{ fillColor:[22,163,74], fontSize:8 },
                    bodyStyles:{ fontSize:7.5 },
                    columnStyles:{
                        0:{cellWidth:18}, 1:{cellWidth:42}, 2:{cellWidth:18},
                        3:{cellWidth:22}, 4:{cellWidth:18}, 5:{cellWidth:18},
                        6:{cellWidth:12,halign:'right'}, 7:{cellWidth:22}
                    },
                    margin:{ left:8, right:8 }                });
            }

            const pages = (doc as any).internal.getNumberOfPages();
            for (let i=1; i<=pages; i++) {
                doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150,150,150);
                doc.text('ASCE-LC — Confidentiel — Manuel §D.2',
                    14, doc.internal.pageSize.getHeight()-8);
                doc.text('Page '+i+'/'+pages,
                    W-14, doc.internal.pageSize.getHeight()-8, {align:'right'});
            }

            const fn = 'rapport_investigations_'
                + this.today.toISOString().split('T')[0]+'.pdf';
            doc.save(fn);
            this.msgService.add({severity:'success', summary:'PDF exporté', detail:fn});

        } catch(err) {
            console.error(err);
            this.msgService.add({severity:'error', summary:'Erreur PDF',
                detail:'Vérifiez que jspdf est installé.'});
        } finally { this.exportingPdf = false; }
    }
    async exportExcel(): Promise<void> {
        this.exportingExcel = true;
        try {
            const XLSX = await import('xlsx');
            const wb   = XLSX.utils.book_new();

            const wsR = XLSX.utils.aoa_to_sheet([
                ['ASCE-LC — Rapport Investigations'],
                ['Période : ' + this.periodLabel],
                ['Généré le : ' + this.today.toLocaleDateString('fr-FR')],
                [],
                ['Indicateur', 'Valeur'],
                ['Total investigations', this.rowsFiltered.length],
                ['En retard',            this.overdueCount],
                ['Durée moyenne (j)',     +this.avgDuration.toFixed(1)],
                ['Taux respect délai (%)',+this.tauxRespectDelai.toFixed(1)],
                [],
                ['OUTCOMES', ''],
                ...this.outcomeStats.map(o => [o.label, o.count]),
                [],
                ['STATUTS', ''],
                ...this.statusStats.map(s => [s.label, s.count, +s.pct.toFixed(1)])
            ]);
            wsR['!cols'] = [{wch:35},{wch:15}];
            XLSX.utils.book_append_sheet(wb, wsR, 'Résumé');

            const wsD = XLSX.utils.aoa_to_sheet([
                ['N° Dossier','Objet','Statut','Outcome','Début','Fin prévue',
                 'Fin réelle','Durée (j)','Délai restant (j)','En retard'],
                ...this.rowsFiltered.map(r => [
                    r.dossierNumber, r.dossierObject,
                    this.getStatusLabel(r.status),
                    r.outcome ? this.getOutcomeLabel(r.outcome) : '',
                    r.startDate ? new Date(r.startDate).toLocaleDateString('fr-FR') : '',
                    r.plannedEndDate ? new Date(r.plannedEndDate).toLocaleDateString('fr-FR') : '',
                    r.actualEndDate ? new Date(r.actualEndDate).toLocaleDateString('fr-FR') : '',
                    r.durationDays || '',
                    r.remainingDays !== null ? r.remainingDays : '',
                    r.isOverdue ? 'OUI' : 'NON'
                ])
            ]);
            wsD['!cols'] = [
                {wch:16},{wch:40},{wch:15},{wch:22},{wch:12},
                {wch:12},{wch:12},{wch:12},{wch:18},{wch:10}
            ];
            XLSX.utils.book_append_sheet(wb, wsD, 'Liste investigations');

            const fn = 'rapport_investigations_'
                + this.today.toISOString().split('T')[0]+'.xlsx';
            XLSX.writeFile(wb, fn);
            this.msgService.add({severity:'success', summary:'Excel exporté', detail:fn});

        } catch(err) {
            console.error(err);
            this.msgService.add({severity:'error', summary:'Erreur Excel',
                detail:'Vérifiez que xlsx est installé.'});
        } finally { this.exportingExcel = false; }
    }

    getBarWidth(v: number, max: number): string {
        return Math.min(v, max) / max * 100 + '%';
    }

    getStatusLabel(s: string): string {
        return { INITIATED:'Initiée', IN_PROGRESS:'En cours',
                 SUSPENDED:'Suspendue', COMPLETED:'Terminée',
                 ARCHIVED:'Archivée' }[s] || s;
    }
    getStatusBg(s: string): string {
        return { INITIATED:'#dbeafe', IN_PROGRESS:'#dcfce7',
                 SUSPENDED:'#fef3c7', COMPLETED:'#dcfce7',
                 ARCHIVED:'#f1f5f9' }[s] || '#f1f5f9';
    }
    getStatusColor(s: string): string {
        return { INITIATED:'#1d4ed8', IN_PROGRESS:'#15803d',
                 SUSPENDED:'#b45309', COMPLETED:'#15803d',
                 ARCHIVED:'#475569' }[s] || '#475569';
    }

    getOutcomeLabel(o: string): string {
        return { ADMINISTRATIVE_SANCTIONS:'Sanctions admin.',
                 JUDICIAL_REFERRAL:'Renvoi justice',
                 ARCHIVED:'Classé s.s.', ANNUAL_REPORT:'Rapport annuel',
                 NULL:'Non défini' }[o] || o;
    }
    getOutcomeBg(o: string): string {
        return { ADMINISTRATIVE_SANCTIONS:'#fef3c7', JUDICIAL_REFERRAL:'#dcfce7',
                 ARCHIVED:'#f1f5f9', ANNUAL_REPORT:'#dbeafe' }[o] || '#f9fafb';
    }
    getOutcomeColor(o: string): string {
        return { ADMINISTRATIVE_SANCTIONS:'#b45309', JUDICIAL_REFERRAL:'#15803d',
                 ARCHIVED:'#475569', ANNUAL_REPORT:'#1d4ed8' }[o] || '#9ca3af';
    }
}