import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { StatistiqueResponse } from '../../../core/models/dossier.model';

@Component({
    selector: 'app-statistiques-dashboard',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule,
        ChartModule, SelectModule, SkeletonModule,
        TagModule, ToastModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <!-- ── En-tête ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Statistiques
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Tableau de bord analytique ASCE-LC
                <span *ngIf="stats?.period"
                    class="ml-2 px-2 py-0.5 bg-primary-50 text-primary-600
                           rounded-full text-xs font-medium">
                    {{ stats?.period }}
                </span>
            </p>
        </div>
        <div class="flex gap-2">
            <p-select [(ngModel)]="selectedPeriod"
                [options]="periodOptions"
                optionLabel="label" optionValue="value"
                (onChange)="onPeriodChange()"
                styleClass="text-sm" />
            <p-button icon="pi pi-refresh" severity="secondary" outlined
                pTooltip="Actualiser" (onClick)="loadStats()" />
        </div>
    </div>

    <!-- ── KPIs principaux ─────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-folder text-blue-600 dark:text-blue-400"></i>
                </div>
                <span class="text-surface-400 text-sm">Total dossiers</span>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black text-surface-900 dark:text-surface-0">
                    {{ stats?.totalDossiers || 0 }}
                </div>
                <div class="text-xs text-surface-400 mt-1">{{ selectedPeriodLabel }}</div>
            </ng-container>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                </div>
                <span class="text-surface-400 text-sm">Taux recevabilité</span>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black text-green-600">
                    {{ (stats?.admissibilityRate || 0) | number:'1.0-1' }}%
                </div>
                <div class="text-xs text-surface-400 mt-1">Recevables / examinés</div>
            </ng-container>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-money-bill text-amber-600 dark:text-amber-400"></i>
                </div>
                <span class="text-surface-400 text-sm">Préjudice estimé</span>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-2xl font-black text-amber-600">
                    {{ formatAmount(stats?.totalEstimatedLoss) }}
                </div>
                <div class="text-xs text-surface-400 mt-1">FCFA total signalé</div>
            </ng-container>
        </div>

        <div class="rounded-2xl p-5 border shadow-sm transition-all"
            [class]="hasAlerts
                ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700'">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                    [class]="hasAlerts ? 'bg-red-100 dark:bg-red-900' : 'bg-surface-100 dark:bg-surface-700'">
                    <i class="pi pi-bell"
                        [class]="hasAlerts ? 'text-red-600' : 'text-surface-400'"></i>
                </div>
                <span class="text-surface-400 text-sm">Alertes délais</span>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black"
                    [class]="hasAlerts ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'">
                    {{ totalAlerts }}
                </div>
                <div class="text-xs text-surface-400 mt-1">Dépassements légaux</div>
            </ng-container>
        </div>

    </div>

    <!-- ── Graphiques ligne 1 ──────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                       flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900
                            flex items-center justify-center">
                    <i class="pi pi-chart-pie text-blue-600 text-xs"></i>
                </div>
                Répartition par statut
            </h3>
            <div *ngIf="!loading && statusChartData; else skChart">
                <p-chart type="doughnut" [data]="statusChartData"
                    [options]="doughnutOptions" height="280px" />
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                       flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900
                            flex items-center justify-center">
                    <i class="pi pi-chart-bar text-purple-600 text-xs"></i>
                </div>
                Canaux de réception
            </h3>
            <div *ngIf="!loading && modeChartData; else skChart">
                <p-chart type="bar" [data]="modeChartData"
                    [options]="barOptions" height="280px" />
            </div>
        </div>

    </div>

    <!-- ── Graphiques ligne 2 ──────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                       flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900
                            flex items-center justify-center">
                    <i class="pi pi-chart-pie text-green-600 text-xs"></i>
                </div>
                Types de saisine
            </h3>
            <div *ngIf="!loading && typeChartData; else skChart">
                <p-chart type="pie" [data]="typeChartData"
                    [options]="doughnutOptions" height="280px" />
            </div>
        </div>

        <!-- Indicateurs de performance -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                       flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900
                            flex items-center justify-center">
                    <i class="pi pi-gauge text-amber-600 text-xs"></i>
                </div>
                Indicateurs de performance
            </h3>

            <div *ngIf="!loading && stats; else skChart" class="flex flex-col gap-5">

                <!-- Délai moyen enregistrement -->
                <div>
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-surface-500 font-medium">
                            Délai moyen enregistrement
                        </span>
                        <span class="font-bold"
                            [class]="getDelayTextClass(stats.avgRegistrationDelayDays, 7)">
                            {{ (stats.avgRegistrationDelayDays || 0) | number:'1.0-1' }}j
                            <span class="text-surface-400 font-normal">/ 7j</span>
                        </span>
                    </div>
                    <div class="h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700"
                            [class]="getDelayClass(stats.avgRegistrationDelayDays, 7)"
                            [style.width]="getDelayWidth(stats.avgRegistrationDelayDays, 7)">
                        </div>
                    </div>
                </div>

                <!-- Durée investigation -->
                <div>
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-surface-500 font-medium">
                            Durée moyenne investigation
                        </span>
                        <span class="font-bold"
                            [class]="getDelayTextClass(stats.avgInvestigationDurationDays, 90)">
                            {{ (stats.avgInvestigationDurationDays || 0) | number:'1.0-1' }}j
                            <span class="text-surface-400 font-normal">/ 90j</span>
                        </span>
                    </div>
                    <div class="h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700"
                            [class]="getDelayClass(stats.avgInvestigationDurationDays, 90)"
                            [style.width]="getDelayWidth(stats.avgInvestigationDurationDays, 90)">
                        </div>
                    </div>
                </div>

                <!-- Taux recevabilité -->
                <div>
                    <div class="flex justify-between text-sm mb-2">
                        <span class="text-surface-500 font-medium">
                            Taux de recevabilité
                        </span>
                        <span class="font-bold text-green-600">
                            {{ (stats.admissibilityRate || 0) | number:'1.0-1' }}%
                        </span>
                    </div>
                    <div class="h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-green-400 to-green-600
                                    rounded-full transition-all duration-700"
                            [style.width]="(stats.admissibilityRate || 0) + '%'">
                        </div>
                    </div>
                </div>

                <!-- Alertes -->
                <div class="grid grid-cols-2 gap-3 mt-1">
                    <div class="p-3 rounded-xl border text-center transition-all"
                        [class]="(stats.overdueAcknowledgments || 0) > 0
                            ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                            : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'">
                        <div class="text-2xl font-black mb-1"
                            [class]="(stats.overdueAcknowledgments || 0) > 0 ? 'text-red-600' : 'text-green-600'">
                            {{ stats.overdueAcknowledgments || 0 }}
                        </div>
                        <div class="text-xs text-surface-400 font-medium">Accusés en retard</div>
                    </div>
                    <div class="p-3 rounded-xl border text-center transition-all"
                        [class]="(stats.overdueInvestigations || 0) > 0
                            ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                            : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'">
                        <div class="text-2xl font-black mb-1"
                            [class]="(stats.overdueInvestigations || 0) > 0 ? 'text-red-600' : 'text-green-600'">
                            {{ stats.overdueInvestigations || 0 }}
                        </div>
                        <div class="text-xs text-surface-400 font-medium">Enquêtes en retard</div>
                    </div>
                </div>

                <!-- Renvoyés justice -->
                <div *ngIf="(stats.referredToJustice || 0) > 0"
                    class="p-3 rounded-xl border border-purple-200 dark:border-purple-800
                           bg-purple-50 dark:bg-purple-950 flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl
                                flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-send text-purple-600"></i>
                    </div>
                    <div>
                        <div class="text-lg font-black text-purple-700 dark:text-purple-300">
                            {{ stats.referredToJustice }}
                        </div>
                        <div class="text-xs text-surface-400">Renvoyés en justice</div>
                    </div>
                </div>

            </div>
        </div>

    </div>

    <!-- ── Tableau récapitulatif ───────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                border border-surface-100 dark:border-surface-700 shadow-sm">
        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                   flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700
                        flex items-center justify-center">
                <i class="pi pi-table text-surface-500 text-xs"></i>
            </div>
            Détail par statut
        </h3>

        <div *ngIf="!loading && stats; else skTable" class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-surface-100 dark:border-surface-700">
                        <th class="text-left py-3 px-3 text-xs text-surface-400
                                   font-semibold uppercase tracking-wide">Statut</th>
                        <th class="text-right py-3 px-3 text-xs text-surface-400
                                   font-semibold uppercase tracking-wide">Nombre</th>
                        <th class="text-right py-3 px-3 text-xs text-surface-400
                                   font-semibold uppercase tracking-wide">%</th>
                        <th class="py-3 px-3 text-xs text-surface-400
                                   font-semibold uppercase tracking-wide">Répartition</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let row of statusTableData"
                        class="border-b border-surface-50 dark:border-surface-700
                               hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                        <td class="py-3 px-3">
                            <p-tag [value]="row.label" [severity]="row.severity"
                                styleClass="text-xs" />
                        </td>
                        <td class="text-right py-3 px-3 font-black text-surface-900
                                   dark:text-surface-0 text-base">
                            {{ row.count }}
                        </td>
                        <td class="text-right py-3 px-3 text-surface-400 font-medium">
                            {{ row.percentage | number:'1.0-1' }}%
                        </td>
                        <td class="py-3 px-3">
                            <div class="h-2 bg-surface-100 dark:bg-surface-700 rounded-full w-32">
                                <div class="h-full rounded-full transition-all duration-500"
                                    [style.width]="row.percentage + '%'"
                                    [style.background]="row.color">
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="border-t-2 border-surface-200 dark:border-surface-600">
                        <td class="py-3 px-3 font-bold text-surface-700 dark:text-surface-200">
                            Total
                        </td>
                        <td class="text-right py-3 px-3 font-black text-surface-900
                                   dark:text-surface-0 text-lg">
                            {{ stats.totalDossiers }}
                        </td>
                        <td class="text-right py-3 px-3 font-bold text-surface-500">
                            100%
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>

</div>

<!-- ── Squelettes partagés ─────────────────────────────────── -->
<ng-template #skKpi>
    <p-skeleton height="2.5rem" borderRadius="8px" />
</ng-template>
<ng-template #skChart>
    <p-skeleton height="280px" borderRadius="12px" />
</ng-template>
<ng-template #skTable>
    <p-skeleton height="200px" borderRadius="12px" />
</ng-template>
    `
})
export class StatistiquesDashboard implements OnInit {

    private statistiqueService = inject(StatistiqueService);
    private messageService     = inject(MessageService);

    loading             = true;
    stats: StatistiqueResponse | null = null;
    selectedPeriod      = 'year';
    selectedPeriodLabel = 'Cette année';

    statusChartData: any = null;
    modeChartData:   any = null;
    typeChartData:   any = null;
    statusTableData: any[] = [];

    readonly doughnutOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 14, font: { size: 11 } }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    };

    readonly barOptions = {
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
        },
        responsive: true,
        maintainAspectRatio: false
    };

    readonly periodOptions = [
        { label: 'Cette année',       value: 'year'   },
        { label: 'Ce trimestre',      value: 'quarter' },
        { label: 'Ce mois',           value: 'month'   },
        { label: '30 derniers jours', value: '30days'  }
    ];

    get hasAlerts():  boolean { return this.totalAlerts > 0; }
    get totalAlerts(): number {
        return (this.stats?.overdueAcknowledgments || 0)
             + (this.stats?.overdueInvestigations  || 0);
    }

    ngOnInit(): void { this.loadStats(); }

    onPeriodChange(): void {
        this.selectedPeriodLabel = this.periodOptions.find(
            p => p.value === this.selectedPeriod
        )?.label || '';
        this.loadStats();
    }

    loadStats(): void {
        this.loading = true;
        const { start, end } = this.getPeriodDates();

        this.statistiqueService.getDashboard(start, end).subscribe({
            next: stats => {
                this.stats = stats;
                this.buildCharts(stats);
                this.buildTable(stats);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'warn', summary: 'Statistiques',
                    detail: 'Impossible de charger les statistiques'
                });
            }
        });
    }

    private getPeriodDates(): { start: string; end: string } {
        const now = new Date();
        let start: Date;

        switch (this.selectedPeriod) {
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case '30days':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                start = new Date(now.getFullYear(), 0, 1);
        }

        return { start: start.toISOString(), end: now.toISOString() };
    }

    private buildCharts(stats: StatistiqueResponse): void {
        const palette = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6',
                         '#06b6d4','#ec4899','#10b981','#f97316',
                         '#6366f1','#14b8a6','#ef4444','#84cc16'];

        const statusLabels: Record<string,string> = {
            SOUMIS:'Soumis', RECU:'Reçu',
            EN_ETUDE_OPPORTUNITE:'Étude', EN_ATTENTE_COMPLEMENT:'Complément',
            EN_REVUE_CTADP:'CTADP', RECEVABLE:'Recevable',
            IRRECEVABLE:'Irrecevable', TRANSFERE:'Transféré',
            EN_INVESTIGATION:'Investigation', RAPPORT_PRODUIT:'Rapport',
            DECISION_RENDUE:'Décision', CLOS:'Clôturé', CLASSE:'Classé'
        };
        const modeLabels: Record<string,string> = {
            IN_PERSON:'Guichet', WEB_FORM:'Web', EMAIL:'Email',
            SMS:'SMS', PHONE:'Tel', GREEN_NUMBER:'N°Vert',
            SOCIAL_MEDIA:'Réseaux', AUDIO_COUNTER:'Audio', PAPER_FORM:'Formulaire'
        };
        const typeLabels: Record<string,string> = {
            COMPLAINT:'Plainte', DENUNCIATION:'Dénonciation',
            AUTO_REFERRAL:'Auto-saisine', ANONYMOUS:'Anonyme'
        };

        const sEntries = Object.entries(stats.countByStatus       || {}).filter(([,v]) => v > 0);
        const mEntries = Object.entries(stats.countBySubmissionMode|| {}).filter(([,v]) => v > 0);
        const tEntries = Object.entries(stats.countByType         || {}).filter(([,v]) => v > 0);

        this.statusChartData = {
            labels:   sEntries.map(([k]) => statusLabels[k] || k),
            datasets: [{ data: sEntries.map(([,v]) => v),
                backgroundColor: palette.slice(0, sEntries.length), borderWidth: 2 }]
        };

        this.modeChartData = {
            labels:   mEntries.map(([k]) => modeLabels[k] || k),
            datasets: [{ label: 'Dossiers', data: mEntries.map(([,v]) => v),
                backgroundColor: mEntries.map((_, i) => palette[i % palette.length]),
                borderRadius: 8, borderWidth: 0 }]
        };

        this.typeChartData = {
            labels:   tEntries.map(([k]) => typeLabels[k] || k),
            datasets: [{ data: tEntries.map(([,v]) => v),
                backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#8b5cf6'],
                borderWidth: 2 }]
        };
    }

    private buildTable(stats: StatistiqueResponse): void {
        const total = stats.totalDossiers || 1;
        const cfg: Record<string,{label:string;severity:any;color:string}> = {
            SOUMIS:                { label:'Soumis',        severity:'info',      color:'#3b82f6' },
            RECU:                  { label:'Reçu',          severity:'info',      color:'#06b6d4' },
            EN_ETUDE_OPPORTUNITE:  { label:'En étude',      severity:'warn',      color:'#f59e0b' },
            EN_ATTENTE_COMPLEMENT: { label:'Complément',    severity:'warn',      color:'#f97316' },
            EN_REVUE_CTADP:        { label:'CTADP',         severity:'warn',      color:'#8b5cf6' },
            RECEVABLE:             { label:'Recevable',     severity:'success',   color:'#22c55e' },
            IRRECEVABLE:           { label:'Irrecevable',   severity:'danger',    color:'#ef4444' },
            TRANSFERE:             { label:'Transféré',     severity:'secondary', color:'#94a3b8' },
            EN_INVESTIGATION:      { label:'Investigation', severity:'warn',      color:'#ec4899' },
            RAPPORT_PRODUIT:       { label:'Rapport',       severity:'info',      color:'#6366f1' },
            DECISION_RENDUE:       { label:'Décision',      severity:'success',   color:'#10b981' },
            CLOS:                  { label:'Clôturé',       severity:'success',   color:'#22c55e' },
            CLASSE:                { label:'Classé',        severity:'secondary', color:'#94a3b8' }
        };

        this.statusTableData = Object.entries(stats.countByStatus || {})
            .filter(([,v]) => v > 0)
            .map(([status, count]) => ({
                status, count,
                percentage: (count / total) * 100,
                ...(cfg[status] || { label: status, severity: 'info', color: '#3b82f6' })
            }))
            .sort((a, b) => b.count - a.count);
    }

    formatAmount(amount?: number): string {
        if (!amount) return '0 FCFA';
        if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(1) + ' Mds';
        if (amount >= 1_000_000)     return (amount / 1_000_000).toFixed(1) + ' M';
        return amount.toLocaleString('fr-FR') + ' FCFA';
    }

    getDelayClass(value: number | undefined, max: number): string {
        const ratio = (value || 0) / max;
        if (ratio >= 0.9) return 'bg-red-500';
        if (ratio >= 0.7) return 'bg-amber-400';
        return 'bg-gradient-to-r from-green-400 to-green-500';
    }

    getDelayTextClass(value: number | undefined, max: number): string {
        const ratio = (value || 0) / max;
        if (ratio >= 0.9) return 'text-red-600';
        if (ratio >= 0.7) return 'text-amber-600';
        return 'text-green-600';
    }

    getDelayWidth(value: number | undefined, max: number): string {
        return Math.min((value || 0), max) / max * 100 + '%';
    }
}