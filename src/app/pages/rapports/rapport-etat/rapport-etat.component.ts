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

import { StatistiqueService, StatistiqueResponse } from '../../../core/services/statistique.service';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse } from '../../../core/models/dossier.model';

@Component({
    selector: 'app-rapport-etat',
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
                Rapport d'état — Plaintes &amp; Dénonciations
            </h1>
            <p class="text-surface-400 text-sm mt-0.5">ASCE-LC Intégrité+</p>
        </div>
        <div class="flex gap-2">
            <p-button label="PDF" icon="pi pi-file-pdf"
                severity="danger" outlined size="small"
                [loading]="exportingPdf" [disabled]="!stats"
                (onClick)="exportPdf()" />
            <p-button label="Excel" icon="pi pi-file-excel"
                severity="success" outlined size="small"
                [loading]="exportingExcel" [disabled]="!stats"
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

        <!-- Dates libres -->
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

        <!-- Période chargée -->
        <div *ngIf="periodLabel"
            class="flex items-center justify-between mt-3 pt-3
                   border-t border-surface-100">
            <span class="text-sm text-green-700 font-semibold flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                {{ periodLabel }}
            </span>
            <span class="text-xs text-surface-400">
                {{ allDossiers.length }} dossier(s) en mémoire
            </span>
        </div>
    </div>

    <div *ngIf="allDossiers.length > 0"
        class="bg-white dark:bg-surface-800 rounded-2xl border
               border-surface-100 dark:border-surface-700 p-5">

        <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-3">
            Filtrer les résultats
            <span class="normal-case font-normal tracking-normal text-surface-300 ml-2">
                (les filtres s'appliquent localement — aucun appel réseau)
            </span>
        </p>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

            <!-- Statut -->
            <div class="filter-sel">
                <label class="text-xs text-surface-400 mb-1 block">Statut</label>
                <p-select [(ngModel)]="filterStatut"
                    [options]="statutOptions" optionLabel="label" optionValue="value"
                    placeholder="Tous les statuts" [showClear]="true"
                    styleClass="w-full" appendTo="body"/>
            </div>

            <!-- Type -->
            <div class="filter-sel">
                <label class="text-xs text-surface-400 mb-1 block">Type</label>
                <p-select [(ngModel)]="filterType"
                    [options]="typeOptions" optionLabel="label" optionValue="value"
                    placeholder="Tous les types" [showClear]="true"
                    styleClass="w-full" appendTo="body"/>
            </div>

            <!-- Canal -->
            <div class="filter-sel">
                <label class="text-xs text-surface-400 mb-1 block">Canal</label>
                <p-select [(ngModel)]="filterCanal"
                    [options]="canalOptions" optionLabel="label" optionValue="value"
                    placeholder="Tous les canaux" [showClear]="true"
                    styleClass="w-full" appendTo="body"/>
            </div>

            <!-- Priorité -->
            <div class="filter-sel">
                <label class="text-xs text-surface-400 mb-1 block">Priorité</label>
                <p-select [(ngModel)]="filterPriorite"
                    [options]="prioriteOptions" optionLabel="label" optionValue="value"
                    placeholder="Toutes" [showClear]="true"
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
                severity="info" size="small"
                (onClick)="appliquerFiltres()"/>
        </div>

        <!-- Résultat du filtre -->
        <div *ngIf="filtresAppliques"
            class="mt-3 pt-3 border-t border-blue-100 flex items-center
                   gap-2 flex-wrap">
            <span class="text-xs text-blue-700 font-semibold">
                <i class="pi pi-filter-fill mr-1"></i>
                {{ dossiersFiltered.length }} dossier(s) sur {{ allDossiers.length }}
            </span>
            <span *ngIf="filtresAppliquesData.statut"
                class="inline-flex items-center gap-1 text-xs bg-amber-50
                       text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {{ getStatusLabel(filtresAppliquesData.statut) }}
                <button (click)="filterStatut=null; appliquerFiltres()">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="filtresAppliquesData.type"
                class="inline-flex items-center gap-1 text-xs bg-purple-50
                       text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                {{ getTypeLabel(filtresAppliquesData.type) }}
                <button (click)="filterType=null; appliquerFiltres()">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="filtresAppliquesData.canal"
                class="inline-flex items-center gap-1 text-xs bg-green-50
                       text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                {{ getModeLabel(filtresAppliquesData.canal) }}
                <button (click)="filterCanal=null; appliquerFiltres()">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
            <span *ngIf="filtresAppliquesData.priorite"
                class="inline-flex items-center gap-1 text-xs px-2 py-0.5
                       rounded-full border"
                [ngStyle]="{
                    background:  getPriorityBg(filtresAppliquesData.priorite),
                    color:       getPriorityColor(filtresAppliquesData.priorite)
                }">
                {{ getPriorityIcon(filtresAppliquesData.priorite) }}
                {{ getPriorityLabel(filtresAppliquesData.priorite) }}
                <button (click)="filterPriorite=null; appliquerFiltres()"
                    class="ml-0.5 opacity-60 hover:opacity-100">
                    <i class="pi pi-times" style="font-size:8px;"></i>
                </button>
            </span>
        </div>
    </div>

    <!-- ── Skeleton chargement ────────────────────────────── -->
    <div *ngIf="loading" class="flex flex-col gap-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <p-skeleton *ngFor="let i of [1,2,3,4]" height="88px" borderRadius="14px"/>
        </div>
        <p-skeleton height="200px" borderRadius="16px"/>
        <p-skeleton height="300px" borderRadius="16px"/>
    </div>


    <ng-container *ngIf="!loading && stats">

        <!-- ── Entête rapport ─────────────────────────────── -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl border
                    border-surface-100 p-6">

            <div class="flex items-start justify-between mb-1">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center
                                justify-center flex-shrink-0">
                        <i class="pi pi-shield text-green-700"></i>
                    </div>
                    <div>
                        <div class="font-black text-surface-900 dark:text-surface-0">
                            ASCE-LC — INTÉGRITÉ+
                        </div>
                        <div class="text-xs text-surface-400 mt-0.5">
                            Rapport d'état — {{ periodLabel }}
                            <span *ngIf="filtresAppliques"
                                class="ml-2 text-blue-600 font-semibold">
                                ({{ dossiersFiltered.length }} dossier(s) filtrés)
                            </span>
                        </div>
                    </div>
                </div>
                <div class="text-xs text-surface-400 text-right">
                    <div>{{ today | date:'dd/MM/yyyy HH:mm' }}</div>
                    <div class="font-mono">RPT-{{ today | date:'yyyyMMdd' }}</div>
                </div>
            </div>

            <p-divider/>

            <!-- ── KPIs ───────────────────────────────────── -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                <div class="p-4 rounded-xl border border-surface-100
                            bg-surface-50 dark:bg-surface-700">
                    <div class="text-xs text-surface-400 mb-1">
                        {{ filtresAppliques ? 'Dossiers sélectionnés' : 'Total dossiers' }}
                    </div>
                    <div class="text-3xl font-black text-blue-600">
                        {{ filtresAppliques ? dossiersFiltered.length : stats.totalDossiers }}
                    </div>
                    <div class="text-xs text-surface-300 mt-1">{{ periodLabel }}</div>
                </div>

                <div class="p-4 rounded-xl border border-surface-100
                            bg-surface-50 dark:bg-surface-700">
                    <div class="text-xs text-surface-400 mb-1">Taux recevabilité</div>
                    <div class="text-3xl font-black text-green-600">
                        {{ (stats.admissibilityRate||0)|number:'1.0-1' }}%
                    </div>
                    <div class="text-xs text-surface-300 mt-1">Recevables / examinés</div>
                </div>

                <div class="p-4 rounded-xl border border-surface-100
                            bg-surface-50 dark:bg-surface-700">
                    <div class="text-xs text-surface-400 mb-1">Préjudice estimé</div>
                    <div class="text-2xl font-black text-amber-600">
                        {{ formatAmount(filtresAppliques
                            ? getMontantFiltre() : stats.totalEstimatedLoss) }}
                    </div>
                    <div class="text-xs text-surface-300 mt-1">FCFA signalé</div>
                </div>

                <div class="p-4 rounded-xl border"
                    [class.border-red-200]="totalAlerts>0"
                    [class.bg-red-50]="totalAlerts>0"
                    [class.border-surface-100]="totalAlerts===0"
                    [class.bg-surface-50]="totalAlerts===0">
                    <div class="text-xs text-surface-400 mb-1">Alertes délais</div>
                    <div class="text-3xl font-black"
                        [class.text-red-600]="totalAlerts>0"
                        [class.text-surface-600]="totalAlerts===0">
                        {{ totalAlerts }}
                    </div>
                    <div class="text-xs text-surface-300 mt-1">Dépassements légaux</div>
                </div>
            </div>

            <!-- KPIs secondaires -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div class="p-3 rounded-xl bg-surface-50 border border-surface-100 text-center">
                    <div class="text-xs text-surface-400 mb-1">Investigués</div>
                    <div class="text-2xl font-black text-purple-600">
                        {{ stats.investigatedCount||0 }}
                    </div>
                </div>
                <div class="p-3 rounded-xl bg-surface-50 border border-surface-100 text-center">
                    <div class="text-xs text-surface-400 mb-1">Rapports produits</div>
                    <div class="text-2xl font-black text-blue-600">
                        {{ stats.reportsProduced||0 }}
                    </div>
                </div>
                <div class="p-3 rounded-xl bg-surface-50 border border-surface-100 text-center">
                    <div class="text-xs text-surface-400 mb-1">Renvoyés justice</div>
                    <div class="text-2xl font-black text-indigo-600">
                        {{ stats.referredToJustice||0 }}
                    </div>
                </div>
                <div class="p-3 rounded-xl bg-surface-50 border border-surface-100 text-center">
                    <div class="text-xs text-surface-400 mb-1">Transférés</div>
                    <div class="text-2xl font-black text-surface-500">
                        {{ stats.transferredCount||0 }}
                    </div>
                </div>
            </div>

            <p-divider/>

            <!-- ── Délais réglementaires ──────────────────── -->
            <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">
                Délais réglementaires §D.2
            </p>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="flex flex-col gap-4">
                    <div *ngFor="let d of delayIndicators">
                        <div class="flex justify-between text-sm mb-1.5">
                            <span class="text-surface-600 font-medium">{{ d.label }}</span>
                            <span class="font-bold text-xs"
                                [class.text-red-600]="(d.value||0)>d.max"
                                [class.text-amber-600]="(d.value||0)>d.max*.8&&(d.value||0)<=d.max"
                                [class.text-green-600]="(d.value||0)<=d.max*.8">
                                {{ (d.value||0)|number:'1.0-1' }}j / {{ d.max }}j
                            </span>
                        </div>
                        <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-700"
                                [style.width]="getDelayWidth(d.value,d.max)"
                                [class.bg-red-500]="(d.value||0)>d.max"
                                [class.bg-amber-400]="(d.value||0)>d.max*.8&&(d.value||0)<=d.max"
                                [class.bg-green-500]="(d.value||0)<=d.max*.8">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <div *ngFor="let a of alertCards"
                        class="p-4 rounded-xl border text-center"
                        [ngStyle]="{
                            background:  a.value>0 ? a.bgAlert    : '#f0fdf4',
                            borderColor: a.value>0 ? a.borderAlert : '#bbf7d0'
                        }">
                        <div class="text-2xl font-black mb-1"
                            [ngStyle]="{color: a.value>0 ? a.colorAlert : '#15803d'}">
                            {{ a.value }}
                        </div>
                        <div class="text-xs text-surface-400">{{ a.label }}</div>
                    </div>
                </div>
            </div>

            <p-divider/>

            <!-- ── Répartition par statut ─────────────────── -->
            <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">
                Répartition par statut
                <span *ngIf="filtresAppliques"
                    class="normal-case font-normal tracking-normal
                           text-blue-500 ml-2">— sélection filtrée</span>
            </p>

            <table class="w-full text-sm mb-6">
                <thead>
                    <tr class="border-b-2 border-surface-100">
                        <th class="text-left py-2 px-3 text-xs text-surface-400
                                   font-semibold uppercase tracking-wide">Statut</th>
                        <th class="text-right py-2 px-3 text-xs text-surface-400
                                   font-semibold uppercase tracking-wide">Nb</th>
                        <th class="text-right py-2 px-3 text-xs text-surface-400
                                   font-semibold uppercase tracking-wide">%</th>
                        <th class="py-2 px-3 hidden lg:table-cell"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let row of statusRowsFiltered"
                        class="border-b border-surface-50 hover:bg-surface-50">
                        <td class="py-2.5 px-3">
                            <p-tag [value]="row.label" [severity]="row.severity"
                                styleClass="text-xs"/>
                        </td>
                        <td class="text-right py-2.5 px-3 font-black
                                   text-surface-900 text-base">{{ row.count }}</td>
                        <td class="text-right py-2.5 px-3
                                   text-surface-400 font-medium">
                            {{ row.pct|number:'1.0-1' }}%
                        </td>
                        <td class="py-2.5 px-3 hidden lg:table-cell">
                            <div class="h-2 bg-surface-100 rounded-full w-32">
                                <div class="h-full rounded-full"
                                    [style.width]="row.pct+'%'"
                                    [style.background]="row.color"></div>
                            </div>
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="border-t-2 border-surface-100">
                        <td class="py-2.5 px-3 font-bold text-surface-600">Total</td>
                        <td class="text-right py-2.5 px-3 font-black
                                   text-surface-900 text-lg">
                            {{ dossiersFiltered.length }}
                        </td>
                        <td class="text-right py-2.5 px-3 font-bold
                                   text-surface-400">100%</td>
                        <td class="hidden lg:table-cell"></td>
                    </tr>
                </tfoot>
            </table>

            <p-divider/>

            <!-- ── Liste dossiers ─────────────────────────── -->
            <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">
                Liste des dossiers
                <span class="font-black text-green-600 ml-2 normal-case
                             tracking-normal text-sm">
                    {{ dossiersFiltered.length }}
                </span>
                <span *ngIf="filtresAppliques"
                    class="normal-case font-normal tracking-normal
                           text-blue-500 ml-1">— filtrés</span>
            </p>

            <div *ngIf="loadingDossiers" class="py-8 text-center text-surface-400">
                <i class="pi pi-spin pi-spinner text-xl"></i>
                <p class="text-xs mt-2">Chargement...</p>
            </div>

            <div *ngIf="!loadingDossiers && dossiersFiltered.length === 0"
                class="py-10 text-center text-surface-400">
                <i class="pi pi-inbox text-3xl mb-3 block text-surface-300"></i>
                <p class="font-medium">Aucun dossier pour cette sélection</p>
                <p-button label="Réinitialiser les filtres" severity="secondary"
                    text size="small" styleClass="mt-2" (onClick)="resetFiltres()"/>
            </div>

            <div *ngIf="!loadingDossiers && dossiersFiltered.length > 0"
                class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b-2 border-surface-100">
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">N°</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Objet</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Type</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Statut</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Canal</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Reçu le</th>
                            <th class="text-right py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Montant</th>
                            <th class="text-left py-2 px-2 text-xs text-surface-400
                                       uppercase tracking-wide font-semibold">Priorité</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let d of dossiersFiltered; let odd=odd"
                            class="border-b border-surface-50"
                            [class.bg-surface-50]="odd">
                            <td class="py-2.5 px-2 font-mono text-xs font-bold
                                       text-primary-600 whitespace-nowrap">
                                {{ d.number||'—' }}
                            </td>
                            <td class="py-2.5 px-2 text-sm text-surface-700">
                                <div class="truncate" style="max-width:220px">
                                    {{ d.object }}
                                </div>
                            </td>
                            <td class="py-2.5 px-2 text-xs text-surface-500 whitespace-nowrap">
                                {{ getTypeLabel(d.type) }}
                            </td>
                            <td class="py-2.5 px-2">
                                <span class="inline-block px-2 py-0.5 rounded-full
                                             text-xs font-semibold whitespace-nowrap"
                                    [ngStyle]="{background:getStatusBg(d.status),
                                                color:getStatusColor(d.status)}">
                                    {{ getStatusLabel(d.status) }}
                                </span>
                            </td>
                            <td class="py-2.5 px-2 text-xs text-surface-500 whitespace-nowrap">
                                {{ getModeLabel(d.submissionMode) }}
                            </td>
                            <td class="py-2.5 px-2 text-xs text-surface-400 whitespace-nowrap">
                                {{ d.receptionDate|date:'dd/MM/yyyy' }}
                            </td>
                            <td class="py-2.5 px-2 text-right text-xs font-bold text-amber-700
                                       whitespace-nowrap">
                                <span *ngIf="d.estimatedLoss">
                                    {{ formatAmount(d.estimatedLoss) }}
                                </span>
                                <span *ngIf="!d.estimatedLoss"
                                    class="text-surface-300 font-normal">—</span>
                            </td>
                            <td class="py-2.5 px-2">
                                <span class="text-xs px-2 py-0.5 rounded-full font-bold
                                             whitespace-nowrap"
                                    [ngStyle]="{background:getPriorityBg(d.priority||'NORMAL'),
                                                color:getPriorityColor(d.priority||'NORMAL')}">
                                    {{ getPriorityIcon(d.priority||'NORMAL') }}
                                    {{ getPriorityLabel(d.priority||'NORMAL') }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pied rapport -->
            <div class="mt-6 pt-4 border-t border-surface-100 flex justify-between
                        text-xs text-surface-300">
                <span>ASCE-LC — Confidentiel — Manuel §D.2</span>
                <span>{{ today|date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
        </div>

    </ng-container>

    <!-- État vide initial -->
    <div *ngIf="!loading && !stats"
        class="bg-white rounded-2xl border border-surface-100 p-16 text-center">
        <div class="w-16 h-16 rounded-2xl bg-green-50 flex items-center
                    justify-center mx-auto mb-4">
            <i class="pi pi-chart-bar text-green-600 text-2xl"></i>
        </div>
        <p class="font-medium text-surface-500">
            Sélectionnez une période ci-dessus pour générer le rapport
        </p>
    </div>

</div>
    `
})
export class RapportEtatComponent implements OnInit {

    private statsService   = inject(StatistiqueService);
    private dossierService = inject(DossierService);
    private msgService     = inject(MessageService);

    loading         = false;
    loadingDossiers = false;
    exportingPdf    = false;
    exportingExcel  = false;

    stats:            StatistiqueResponse | null = null;
    allDossiers:      DossierResponse[]          = [];
    dossiersFiltered: DossierResponse[]          = [];
    today             = new Date();

    activePeriod = '';
    periodLabel  = '';
    dateDebut:   Date | null = null;
    dateFin:     Date | null = null;

    filterStatut:   string | null = null;
    filterType:     string | null = null;
    filterCanal:    string | null = null;
    filterPriorite: string | null = null;

    filtresAppliques     = false;
    filtresAppliquesData = {
        statut: null as string|null, type: null as string|null,
        canal:  null as string|null, priorite: null as string|null
    };

    statusRowsFiltered: any[] = [];

    readonly shortcuts = [
        { key:'month',    label:'Ce mois'         },
        { key:'quarter',  label:'Ce trimestre'     },
        { key:'semester', label:'Ce semestre'      },
        { key:'year',     label:'Cette année'      },
        { key:'last12',   label:'12 derniers mois' },
    ];

    readonly statutOptions = [
        {label:'Soumis',              value:'SOUMIS'},
        {label:'Reçu',                value:'RECU'},
        {label:'En étude',            value:'EN_ETUDE_OPPORTUNITE'},
        {label:'Attente complément',  value:'EN_ATTENTE_COMPLEMENT'},
        {label:'En revue CTADP',      value:'EN_REVUE_CTADP'},
        {label:'Recevable',           value:'RECEVABLE'},
        {label:'Irrecevable',         value:'IRRECEVABLE'},
        {label:'Transféré',           value:'TRANSFERE'},
        {label:'En investigation',    value:'EN_INVESTIGATION'},
        {label:'Rapport produit',     value:'RAPPORT_PRODUIT'},
        {label:'Décision rendue',     value:'DECISION_RENDUE'},
        {label:'Clôturé',             value:'CLOS'},
        {label:'Classé',              value:'CLASSE'},
    ];

    readonly typeOptions = [
        {label:'Plainte',      value:'COMPLAINT'},
        {label:'Dénonciation', value:'DENUNCIATION'},
        {label:'Auto-saisine', value:'AUTO_REFERRAL'},
        {label:'Anonyme',      value:'ANONYMOUS'},
    ];

    readonly canalOptions = [
        {label:'Guichet BRPD',     value:'IN_PERSON'},
        {label:'Formulaire Web',   value:'WEB_FORM'},
        {label:'Email',            value:'EMAIL'},
        {label:'SMS',              value:'SMS'},
        {label:'Téléphone',        value:'PHONE'},
        {label:'Numéro Vert',      value:'GREEN_NUMBER'},
        {label:'Réseaux Sociaux',  value:'SOCIAL_MEDIA'},
        {label:'Comptoir Audio',   value:'AUDIO_COUNTER'},
        {label:'Formulaire Papier',value:'PAPER_FORM'},
        {label:'Courrier Postal',  value:'POSTAL_MAIL'},
        {label:'Presse',           value:'PRESS_MEDIA'},
        {label:'Rapport Audit',    value:'AUDIT_REPORT'},
    ];

    readonly prioriteOptions = [
        {label:'🔴 Critique', value:'CRITIQUE'},
        {label:'🟠 Urgent',   value:'URGENT'},
        {label:'🔵 Normal',   value:'NORMAL'},
        {label:'⚪ Faible',   value:'FAIBLE'},
    ];

    get totalAlerts(): number {
        return (this.stats?.overdueAcknowledgments||0)
             + (this.stats?.overdueInvestigations||0)
             + (this.stats?.overdueComplements||0);
    }

    get delayIndicators() {
        if (!this.stats) return [];
        return [
            {label:'Enregistrement B4',   value:this.stats.avgRegistrationDelayDays,     max:7},
            {label:'Durée investigation', value:this.stats.avgInvestigationDurationDays, max:90},
            {label:'Approbation DEI',     value:this.stats.avgDeiApprovalDays,           max:15},
            {label:'Approbation CGE',     value:this.stats.avgCgeApprovalDays,           max:20}
        ].filter(d => d.value != null);
    }

    get alertCards() {
        return [
            {label:'AR en retard', value:this.stats?.overdueAcknowledgments||0,
             bgAlert:'#fef2f2', borderAlert:'#fecaca', colorAlert:'#dc2626'},
            {label:'Compléments',  value:this.stats?.overdueComplements||0,
             bgAlert:'#fffbeb', borderAlert:'#fde68a', colorAlert:'#d97706'},
            {label:'Enquêtes',     value:this.stats?.overdueInvestigations||0,
             bgAlert:'#fef2f2', borderAlert:'#fecaca', colorAlert:'#dc2626'}
        ];
    }

    ngOnInit(): void {
        this.applyShortcut({key:'year', label:'Cette année'});
    }

    applyShortcut(p: {key:string; label:string}): void {
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
        this.periodLabel = p.label+' ('+start.toLocaleDateString('fr-FR')
            +' – '+now.toLocaleDateString('fr-FR')+')';
        this.resetFiltresSilent();
        this.load(start, now);
    }

    generateCustom(): void {
        if (!this.dateDebut || !this.dateFin) return;
        if (this.dateFin < this.dateDebut) {
            this.msgService.add({severity:'warn', summary:'Période invalide',
                detail:'La date de fin doit être après la date de début'}); return;
        }
        this.periodLabel = this.dateDebut.toLocaleDateString('fr-FR')
            +' – '+this.dateFin.toLocaleDateString('fr-FR');
        this.resetFiltresSilent();
        this.load(this.dateDebut, this.dateFin);
    }

    private load(start: Date, end: Date): void {
        this.loading=true; this.loadingDossiers=true;
        this.stats=null; this.allDossiers=[]; this.dossiersFiltered=[];
        const s=start.toISOString(), e=end.toISOString();

        this.statsService.getDashboard(s,e).subscribe({
            next: st => { this.stats=st; this.loading=false; },
            error: () => { this.loading=false;
                this.msgService.add({severity:'error',summary:'Erreur',
                    detail:'Impossible de charger les statistiques'}); }
        });

        this.dossierService.findByPeriod(s,e).subscribe({
            next: list => {
                this.allDossiers=list; this.dossiersFiltered=[...list];
                this.buildStatusRowsFromList(list); this.loadingDossiers=false;
            },
            error: () => { this.loadingDossiers=false; }
        });
    }

    appliquerFiltres(): void {
        this.dossiersFiltered = this.allDossiers.filter(d => {
            if (this.filterStatut   && d.status !== this.filterStatut)               return false;
            if (this.filterType     && d.type   !== this.filterType)                 return false;
            if (this.filterCanal    && d.submissionMode !== this.filterCanal)        return false;
            if (this.filterPriorite && (d.priority||'NORMAL') !== this.filterPriorite) return false;
            return true;
        });
        this.filtresAppliquesData = {
            statut: this.filterStatut, type: this.filterType,
            canal: this.filterCanal, priorite: this.filterPriorite
        };
        this.filtresAppliques = !!(this.filterStatut||this.filterType
                                  ||this.filterCanal||this.filterPriorite);
        this.buildStatusRowsFromList(this.dossiersFiltered);
    }

    resetFiltres(): void {
        this.filterStatut=null; this.filterType=null;
        this.filterCanal=null;  this.filterPriorite=null;
        this.filtresAppliques=false;
        this.filtresAppliquesData={statut:null,type:null,canal:null,priorite:null};
        this.dossiersFiltered=[...this.allDossiers];
        this.buildStatusRowsFromList(this.allDossiers);
    }

    private resetFiltresSilent(): void {
        this.filterStatut=null; this.filterType=null;
        this.filterCanal=null;  this.filterPriorite=null;
        this.filtresAppliques=false;
        this.filtresAppliquesData={statut:null,type:null,canal:null,priorite:null};
    }

    getMontantFiltre(): number {
        return this.dossiersFiltered.reduce((s,d)=>s+(d.estimatedLoss||0),0);
    }

    private buildStatusRowsFromList(list: DossierResponse[]): void {
        const counts: Record<string,number>={};
        list.forEach(d=>{ counts[d.status]=(counts[d.status]||0)+1; });
        const total=list.length||1;
        const cfg: Record<string,any>={
            SOUMIS:{label:'Soumis',severity:'info',color:'#3b82f6'},
            RECU:{label:'Reçu',severity:'info',color:'#06b6d4'},
            EN_ETUDE_OPPORTUNITE:{label:'En étude',severity:'warn',color:'#f59e0b'},
            EN_ATTENTE_COMPLEMENT:{label:'Complément',severity:'warn',color:'#f97316'},
            EN_REVUE_CTADP:{label:'CTADP',severity:'warn',color:'#8b5cf6'},
            RECEVABLE:{label:'Recevable',severity:'success',color:'#22c55e'},
            IRRECEVABLE:{label:'Irrecevable',severity:'danger',color:'#ef4444'},
            TRANSFERE:{label:'Transféré',severity:'secondary',color:'#94a3b8'},
            EN_INVESTIGATION:{label:'Investigation',severity:'warn',color:'#ec4899'},
            RAPPORT_PRODUIT:{label:'Rapport',severity:'info',color:'#6366f1'},
            DECISION_RENDUE:{label:'Décision',severity:'success',color:'#10b981'},
            CLOS:{label:'Clôturé',severity:'success',color:'#22c55e'},
            CLASSE:{label:'Classé',severity:'secondary',color:'#94a3b8'}
        };
        this.statusRowsFiltered=Object.entries(counts)
            .filter(([,v])=>v>0)
            .map(([s,count])=>({s,count,pct:(count/total)*100,
                ...(cfg[s]||{label:s,severity:'info',color:'#3b82f6'})}))
            .sort((a,b)=>b.count-a.count);
    }

    async exportPdf(): Promise<void> {
        this.exportingPdf=true;
        try {
            const {default:jsPDF}=await import('jspdf');
            const {default:autoTable}=await import('jspdf-autotable');
            const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
            const W=doc.internal.pageSize.getWidth();
            let y=0;

            doc.setFillColor(22,163,74); doc.rect(0,0,W,26,'F');
            doc.setTextColor(255,255,255);
            doc.setFontSize(13); doc.setFont('helvetica','bold');
            doc.text('ASCE-LC — INTÉGRITÉ+',14,10);
            doc.setFontSize(9); doc.setFont('helvetica','normal');
            doc.text('Rapport d\'état — '+this.periodLabel
                +(this.filtresAppliques?' [FILTRÉ]':''),14,16);
            doc.setTextColor(0,0,0);
            doc.setFontSize(7); doc.setTextColor(150,150,150);
            doc.text('Généré le : '+this.today.toLocaleDateString('fr-FR')
                +' à '+this.today.toLocaleTimeString('fr-FR'),W-14,24,{align:'right'});
            doc.setTextColor(0,0,0); y=33;

            autoTable(doc,{startY:y,
                head:[['Indicateur','Valeur']],
                body:[
                    ['Dossiers',String(this.dossiersFiltered.length)],
                    ['Taux recevabilité',(this.stats!.admissibilityRate||0).toFixed(1)+'%'],
                    ['Investigués',String(this.stats!.investigatedCount||0)],
                    ['Rapports produits',String(this.stats!.reportsProduced||0)],
                    ['Renvoyés justice',String(this.stats!.referredToJustice||0)],
                    ['Alertes délais',String(this.totalAlerts)],
                    ['Préjudice',this.formatAmount(this.filtresAppliques
                        ?this.getMontantFiltre():this.stats!.totalEstimatedLoss)],
                    ['Délai enregistrement',(this.stats!.avgRegistrationDelayDays||0).toFixed(1)+'j / 7j'],
                    ['Délai investigation',(this.stats!.avgInvestigationDurationDays||0).toFixed(1)+'j / 90j'],
                ],
                theme:'striped',headStyles:{fillColor:[22,163,74],fontSize:9},
                bodyStyles:{fontSize:9},columnStyles:{1:{fontStyle:'bold',halign:'right'}},
                margin:{left:14,right:14}});
            y=(doc as any).lastAutoTable.finalY+8;

            autoTable(doc,{startY:y,
                head:[['Statut','Nombre','%']],
                body:this.statusRowsFiltered.map(r=>[r.label,r.count,r.pct.toFixed(1)+'%']),
                foot:[['TOTAL',this.dossiersFiltered.length,'100%']],
                theme:'striped',headStyles:{fillColor:[22,163,74],fontSize:9},
                bodyStyles:{fontSize:9},footStyles:{fontStyle:'bold',fillColor:[240,253,244]},
                columnStyles:{1:{halign:'right',fontStyle:'bold'},2:{halign:'right'}},
                margin:{left:14,right:14}});

            if(this.dossiersFiltered.length>0){
                doc.addPage(); y=14;
                doc.setFontSize(10); doc.setFont('helvetica','bold');
                doc.text('Liste des dossiers ('+this.dossiersFiltered.length+')',14,y);
                y+=3; doc.setDrawColor(200,200,200); doc.line(14,y,W-14,y); y+=2;
                autoTable(doc,{startY:y,
                    head:[['N°','Objet','Type','Statut','Canal','Reçu le','Montant','Priorité']],
                    body:this.dossiersFiltered.map(d=>[
                        d.number||'—',
                        (d.object||'').substring(0,35)+((d.object||'').length>35?'…':''),
                        this.getTypeLabel(d.type),this.getStatusLabel(d.status),
                        this.getModeLabel(d.submissionMode),
                        d.receptionDate?new Date(d.receptionDate).toLocaleDateString('fr-FR'):'—',
                        d.estimatedLoss?this.formatAmount(d.estimatedLoss):'—',
                        this.getPriorityLabel(d.priority||'NORMAL')
                    ]),
                    theme:'striped',headStyles:{fillColor:[22,163,74],fontSize:8},
                    bodyStyles:{fontSize:7.5},
                    columnStyles:{0:{cellWidth:16},1:{cellWidth:48},2:{cellWidth:19},
                        3:{cellWidth:21},4:{cellWidth:17},5:{cellWidth:19},
                        6:{cellWidth:21,halign:'right'},7:{cellWidth:17}},
                    margin:{left:8,right:8}});
            }

            const pages=(doc as any).internal.getNumberOfPages();
            for(let i=1;i<=pages;i++){
                doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150,150,150);
                doc.text('ASCE-LC — Confidentiel',14,doc.internal.pageSize.getHeight()-8);
                doc.text('Page '+i+'/'+pages,W-14,doc.internal.pageSize.getHeight()-8,{align:'right'});
            }
            const fn='rapport_ASCE_'+this.today.toISOString().split('T')[0]
                +(this.filtresAppliques?'_filtre':'')+'.pdf';
            doc.save(fn);
            this.msgService.add({severity:'success',summary:'PDF exporté',detail:fn});
        } catch(err){
            console.error(err);
            this.msgService.add({severity:'error',summary:'Erreur PDF',
                detail:'Vérifiez que jspdf et jspdf-autotable sont installés.'});
        } finally { this.exportingPdf=false; }
    }

    async exportExcel(): Promise<void> {
        this.exportingExcel=true;
        try {
            const XLSX=await import('xlsx');
            const wb=XLSX.utils.book_new();
            const wsR=XLSX.utils.aoa_to_sheet([
                ['ASCE-LC — INTÉGRITÉ+'],
                ['Rapport d\'état — '+this.periodLabel],
                ['Généré le : '+this.today.toLocaleDateString('fr-FR')],
                [],
                ['Indicateur','Valeur'],
                ['Dossiers',this.dossiersFiltered.length],
                ['Taux recevabilité (%)',+(this.stats!.admissibilityRate||0).toFixed(1)],
                ['Investigués',this.stats!.investigatedCount||0],
                ['Rapports produits',this.stats!.reportsProduced||0],
                ['Renvoyés justice',this.stats!.referredToJustice||0],
                ['Alertes délais',this.totalAlerts],
                ['Préjudice (FCFA)',this.filtresAppliques
                    ?this.getMontantFiltre():this.stats!.totalEstimatedLoss||0],
                ['Délai enregistrement (j)',+(this.stats!.avgRegistrationDelayDays||0).toFixed(1)],
                ['Délai investigation (j)',+(this.stats!.avgInvestigationDurationDays||0).toFixed(1)],
                [],
                ['Statut','Nombre','%'],
                ...this.statusRowsFiltered.map(r=>[r.label,r.count,+r.pct.toFixed(1)]),
                ['TOTAL',this.dossiersFiltered.length,100]
            ]);
            wsR['!cols']=[{wch:35},{wch:15},{wch:10}];
            XLSX.utils.book_append_sheet(wb,wsR,'Résumé');

            const wsD=XLSX.utils.aoa_to_sheet([
                ['Numéro','Objet','Type','Statut','Canal',
                 'Reçu le','Montant (FCFA)','Priorité','Déclarant','Code accès'],
                ...this.dossiersFiltered.map(d=>[
                    d.number||'',d.object||'',
                    this.getTypeLabel(d.type),this.getStatusLabel(d.status),
                    this.getModeLabel(d.submissionMode),
                    d.receptionDate?new Date(d.receptionDate).toLocaleDateString('fr-FR'):'',
                    d.estimatedLoss||0,
                    this.getPriorityLabel(d.priority||'NORMAL'),
                    d.declarant?.displayName||'Anonyme',d.accessCode||''
                ])
            ]);
            wsD['!cols']=[{wch:14},{wch:45},{wch:14},{wch:20},{wch:14},
                          {wch:12},{wch:22},{wch:11},{wch:25},{wch:14}];
            XLSX.utils.book_append_sheet(wb,wsD,'Liste dossiers');

            if(this.stats!.monthlyTrend?.length){
                const wsTr=XLSX.utils.aoa_to_sheet([
                    ['Mois','Dossiers reçus','Investigations'],
                    ...this.stats!.monthlyTrend.map(m=>[m.month,m.count,m.investigations])
                ]);
                wsTr['!cols']=[{wch:12},{wch:18},{wch:16}];
                XLSX.utils.book_append_sheet(wb,wsTr,'Tendance');
            }

            const fn='rapport_ASCE_'+this.today.toISOString().split('T')[0]
                +(this.filtresAppliques?'_filtre':'')+'.xlsx';
            XLSX.writeFile(wb,fn);
            this.msgService.add({severity:'success',summary:'Excel exporté',detail:fn});
        } catch(err){
            console.error(err);
            this.msgService.add({severity:'error',summary:'Erreur Excel',
                detail:'Vérifiez que xlsx est installé.'});
        } finally { this.exportingExcel=false; }
    }

    getDelayWidth(v:number|undefined,max:number):string{
        return Math.min((v||0),max)/max*100+'%';
    }
    formatAmount(a?:number):string{
        if(!a)return'0 FCFA';
        if(a>=1_000_000_000)return(a/1_000_000_000).toFixed(1)+' Mds';
        if(a>=1_000_000)return(a/1_000_000).toFixed(1)+' M';
        return a.toLocaleString('fr-FR')+' FCFA';
    }
    getStatusLabel(s:string):string{
        const l:Record<string,string>={SOUMIS:'Soumis',RECU:'Reçu',
            EN_ETUDE_OPPORTUNITE:'En étude',EN_ATTENTE_COMPLEMENT:'Complément',
            EN_REVUE_CTADP:'CTADP',RECEVABLE:'Recevable',IRRECEVABLE:'Irrecevable',
            TRANSFERE:'Transféré',EN_INVESTIGATION:'Investigation',
            RAPPORT_PRODUIT:'Rapport',DECISION_RENDUE:'Décision',
            CLOS:'Clôturé',CLASSE:'Classé'};
        return l[s]||s;
    }
    getStatusBg(s:string):string{
        const m:Record<string,string>={SOUMIS:'#dbeafe',RECU:'#dbeafe',
            EN_ETUDE_OPPORTUNITE:'#fef3c7',EN_ATTENTE_COMPLEMENT:'#fef3c7',
            EN_REVUE_CTADP:'#fef3c7',RECEVABLE:'#dcfce7',IRRECEVABLE:'#fee2e2',
            TRANSFERE:'#f1f5f9',EN_INVESTIGATION:'#f3e8ff',RAPPORT_PRODUIT:'#dbeafe',
            DECISION_RENDUE:'#dcfce7',CLOS:'#dcfce7',CLASSE:'#f1f5f9'};
        return m[s]||'#f1f5f9';
    }
    getStatusColor(s:string):string{
        const m:Record<string,string>={SOUMIS:'#1d4ed8',RECU:'#1d4ed8',
            EN_ETUDE_OPPORTUNITE:'#b45309',EN_ATTENTE_COMPLEMENT:'#b45309',
            EN_REVUE_CTADP:'#b45309',RECEVABLE:'#15803d',IRRECEVABLE:'#b91c1c',
            TRANSFERE:'#475569',EN_INVESTIGATION:'#7e22ce',RAPPORT_PRODUIT:'#1d4ed8',
            DECISION_RENDUE:'#15803d',CLOS:'#15803d',CLASSE:'#475569'};
        return m[s]||'#475569';
    }
    getTypeLabel(t:string):string{
        return{COMPLAINT:'Plainte',DENUNCIATION:'Dénonciation',
               AUTO_REFERRAL:'Auto-saisine',ANONYMOUS:'Anonyme'}[t]||t;
    }
    getModeLabel(m:string):string{
        const l:Record<string,string>={IN_PERSON:'Guichet',WEB_FORM:'Web',
            EMAIL:'Email',SMS:'SMS',PHONE:'Téléphone',GREEN_NUMBER:'N° Vert',
            SOCIAL_MEDIA:'Réseaux',AUDIO_COUNTER:'Audio',PAPER_FORM:'Formulaire',
            POSTAL_MAIL:'Courrier',PRESS_MEDIA:'Presse',AUDIT_REPORT:'Rapport'};
        return l[m]||m;
    }
    getPriorityLabel(p:string):string{
        return{CRITIQUE:'Critique',URGENT:'Urgent',NORMAL:'Normal',FAIBLE:'Faible'}[p]||p;
    }
    getPriorityIcon(p:string):string{
        return{CRITIQUE:'🔴',URGENT:'🟠',NORMAL:'🔵',FAIBLE:'⚪'}[p]||'🔵';
    }
    getPriorityBg(p:string):string{
        return{CRITIQUE:'#FEE2E2',URGENT:'#FFF7ED',NORMAL:'#EFF6FF',FAIBLE:'#F8FAFC'}[p]||'#EFF6FF';
    }
    getPriorityColor(p:string):string{
        return{CRITIQUE:'#DC2626',URGENT:'#EA580C',NORMAL:'#2563EB',FAIBLE:'#94A3B8'}[p]||'#2563EB';
    }
}