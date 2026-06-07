import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { StatistiqueService } from '../../core/services/statistique.service';
import { DossierService } from '../../core/services/dossier.service';
import { StatistiqueResponse, DossierResponse } from '../../core/models/dossier.model';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule, RouterModule, ButtonModule,
        ChartModule, TagModule, SkeletonModule,
        ToastModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Tableau de Bord
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Bienvenue, <strong class="text-surface-600 dark:text-surface-200">
                {{ userInfo.firstName }}</strong> —
                {{ today | date:'EEEE dd MMMM yyyy':'':'fr' }}
            </p>
        </div>
        <div class="flex gap-2">
            <p-button label="Nouveau Dossier" icon="pi pi-plus"
                routerLink="/app/dossiers/nouveau" />
            <p-button label="Suivi Citoyen" icon="pi pi-search"
                routerLink="/portail/suivi" severity="secondary" outlined />
        </div>
    </div>

    <!-- ── KPIs ────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Total -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-400 text-sm font-medium">Total dossiers</span>
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-folder text-blue-600 dark:text-blue-400"></i>
                </div>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black text-surface-900 dark:text-surface-0">
                    {{ stats?.totalDossiers || 0 }}
                </div>
                <div class="text-xs text-surface-400 mt-1">Cette année</div>
            </ng-container>
        </div>

        <!-- En investigation -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-400 text-sm font-medium">En investigation</span>
                <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-eye text-purple-600 dark:text-purple-400"></i>
                </div>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black text-purple-600">
                    {{ stats?.countByStatus?.['EN_INVESTIGATION'] || 0 }}
                </div>
                <div class="text-xs text-surface-400 mt-1">Enquêtes actives</div>
            </ng-container>
        </div>

        <!-- Taux recevabilité -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-400 text-sm font-medium">Taux recevabilité</span>
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                </div>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black text-green-600">
                    {{ (stats?.admissibilityRate || 0) | number:'1.0-1' }}%
                </div>
                <div class="text-xs text-surface-400 mt-1">Dossiers recevables</div>
            </ng-container>
        </div>

        <!-- Alertes -->
        <div class="rounded-2xl p-5 border shadow-sm transition-all"
            [class]="hasAlerts
                ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700'">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-400 text-sm font-medium">Alertes délais</span>
                <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                    [class]="hasAlerts
                        ? 'bg-red-100 dark:bg-red-900'
                        : 'bg-surface-100 dark:bg-surface-700'">
                    <i class="pi pi-bell"
                        [class]="hasAlerts ? 'text-red-600' : 'text-surface-400'"></i>
                </div>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black"
                    [class]="hasAlerts ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'">
                    {{ totalAlerts }}
                </div>
                <div class="text-xs mt-1"
                    [class]="hasAlerts ? 'text-red-400' : 'text-surface-400'">
                    {{ hasAlerts ? 'Intervention requise' : 'Aucun dépassement' }}
                </div>
            </ng-container>
        </div>

    </div>

    <!-- ── Barre de statuts ────────────────────────────────── -->
    <div *ngIf="!loading && stats"
        class="bg-white dark:bg-surface-800 rounded-2xl p-5
               border border-surface-100 dark:border-surface-700 shadow-sm">
        <h3 class="text-sm font-bold text-surface-500 uppercase tracking-wide mb-4">
            Répartition des dossiers par statut
        </h3>
        <div class="flex h-4 rounded-full overflow-hidden gap-0.5">
            <div *ngFor="let seg of statusSegments"
                class="h-full rounded-sm transition-all duration-700"
                [style.width]="seg.pct + '%'"
                [style.background]="seg.color"
                [pTooltip]="seg.label + ' : ' + seg.count"
                tooltipPosition="top">
            </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-3">
            <div *ngFor="let seg of statusSegments"
                class="flex items-center gap-1.5 text-xs text-surface-500">
                <div class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    [style.background]="seg.color"></div>
                {{ seg.label }} ({{ seg.count }})
            </div>
        </div>
    </div>

    <!-- ── Graphiques ──────────────────────────────────────── -->
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
                    [options]="chartOptions" height="250px" />
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
                    [options]="barChartOptions" height="250px" />
            </div>
        </div>

    </div>

    <!-- ── Dossiers récents ────────────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                border border-surface-100 dark:border-surface-700 shadow-sm">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-surface-900 dark:text-surface-0
                       flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700
                            flex items-center justify-center">
                    <i class="pi pi-clock text-surface-500 text-xs"></i>
                </div>
                Dossiers récents
            </h3>
            <p-button label="Voir tous" icon="pi pi-arrow-right"
                iconPos="right" routerLink="/app/dossiers"
                severity="secondary" text size="small" />
        </div>

        <div *ngIf="!loadingDossiers; else skTable">
            <div *ngFor="let d of recentDossiers"
                class="flex items-center justify-between py-3
                       border-b border-surface-50 dark:border-surface-700
                       last:border-0 hover:bg-surface-50
                       dark:hover:bg-surface-700 px-2 rounded-xl
                       cursor-pointer transition-colors"
                [routerLink]="['/app/dossiers', d.id]">

                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        [style.background]="getStatusBg(d.status)">
                        <i class="pi pi-file text-xs"
                            [style.color]="getStatusColor(d.status)"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-surface-900 dark:text-surface-0
                                    text-sm font-mono">
                            {{ d.number || '—' }}
                        </div>
                        <div class="text-surface-400 text-xs truncate max-w-xs">
                            {{ d.object }}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3 flex-shrink-0">
                    <p-tag [value]="getStatusLabel(d.status)"
                        [severity]="getStatusSeverity(d.status)"
                        styleClass="text-xs" />
                    <span class="text-xs text-surface-400 hidden sm:block">
                        {{ d.createdAt | date:'dd/MM/yyyy' }}
                    </span>
                    <i class="pi pi-chevron-right text-surface-300 text-xs"></i>
                </div>
            </div>

            <div *ngIf="recentDossiers.length === 0"
                class="flex flex-col items-center justify-center py-12">
                <div class="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-700
                            flex items-center justify-center mb-3">
                    <i class="pi pi-inbox text-2xl text-surface-300"></i>
                </div>
                <p class="font-medium text-surface-400 text-sm">Aucun dossier pour l'instant</p>
                <p-button label="Créer le premier dossier"
                    icon="pi pi-plus" severity="primary" text size="small"
                    styleClass="mt-2" routerLink="/app/dossiers/nouveau" />
            </div>
        </div>

    </div>

</div>

<!-- Squelettes partagés -->
<ng-template #skKpi>
    <p-skeleton height="2.5rem" borderRadius="8px" />
</ng-template>
<ng-template #skChart>
    <p-skeleton height="250px" borderRadius="12px" />
</ng-template>
<ng-template #skTable>
    <div class="flex flex-col gap-3">
        <p-skeleton *ngFor="let i of [1,2,3,4,5]" height="3.5rem" borderRadius="12px" />
    </div>
</ng-template>
    `
})
export class Dashboard implements OnInit {

    private keycloakService    = inject(KeycloakService);
    private statistiqueService = inject(StatistiqueService);
    private dossierService     = inject(DossierService);
    private messageService     = inject(MessageService);

    userInfo        = this.keycloakService.getUserInfo();
    today           = new Date();
    loading         = true;
    loadingDossiers = true;

    stats: StatistiqueResponse | null = null;
    recentDossiers: DossierResponse[] = [];
    statusSegments: { label: string; count: number; pct: number; color: string }[] = [];

    statusChartData: any = null;
    modeChartData:   any = null;

    readonly chartOptions = {
        plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } },
        responsive: true,
        maintainAspectRatio: false
    };

    readonly barChartOptions = {
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
        },
        responsive: true,
        maintainAspectRatio: false
    };

    get hasAlerts():  boolean { return this.totalAlerts > 0; }
    get totalAlerts(): number {
        return (this.stats?.overdueAcknowledgments || 0)
             + (this.stats?.overdueInvestigations  || 0);
    }

    ngOnInit(): void {
        this.loadStats();
        this.loadRecentDossiers();
    }

    private loadStats(): void {
    const now   = new Date();
    const start = new Date(now.getFullYear(), 0, 1).toISOString();
    const end   = now.toISOString();

    this.statistiqueService.getDashboard(start, end).subscribe({
        next: stats => {
            this.stats = stats;
            this.buildStatusChart(stats);
            this.buildModeChart(stats);
            this.buildStatusSegments(stats);
            this.loading = false;
        },
        error: (err) => {
            this.loading = false;
            if (err.status !== 403) {
                this.messageService.add({
                    severity: 'warn',
                    summary:  'Statistiques',
                    detail:   'Impossible de charger les statistiques'
                });
            }
        }
    });
}

    private loadRecentDossiers(): void {
        this.dossierService.findAll(0, 5).subscribe({
            next:  page => { this.recentDossiers = page.content; this.loadingDossiers = false; },
            error: ()   => { this.loadingDossiers = false; }
        });
    }

    private buildStatusSegments(stats: StatistiqueResponse): void {
        const total = stats.totalDossiers || 1;
        const cfg: Record<string, { label: string; color: string }> = {
            SOUMIS:                { label: 'Soumis',        color: '#3b82f6' },
            RECU:                  { label: 'Reçu',          color: '#06b6d4' },
            EN_ETUDE_OPPORTUNITE:  { label: 'Étude',         color: '#f59e0b' },
            EN_ATTENTE_COMPLEMENT: { label: 'Complément',    color: '#f97316' },
            EN_REVUE_CTADP:        { label: 'CTADP',         color: '#8b5cf6' },
            RECEVABLE:             { label: 'Recevable',     color: '#22c55e' },
            IRRECEVABLE:           { label: 'Irrecevable',   color: '#ef4444' },
            TRANSFERE:             { label: 'Transféré',     color: '#94a3b8' },
            EN_INVESTIGATION:      { label: 'Investigation', color: '#ec4899' },
            RAPPORT_PRODUIT:       { label: 'Rapport',       color: '#6366f1' },
            DECISION_RENDUE:       { label: 'Décision',      color: '#10b981' },
            CLOS:                  { label: 'Clôturé',       color: '#16a34a' },
            CLASSE:                { label: 'Classé',        color: '#cbd5e1' }
        };

        this.statusSegments = Object.entries(stats.countByStatus || {})
            .filter(([, v]) => v > 0)
            .map(([k, v]) => ({
                label: cfg[k]?.label || k,
                count: v,
                pct:   (v / total) * 100,
                color: cfg[k]?.color || '#94a3b8'
            }))
            .sort((a, b) => b.count - a.count);
    }

    private buildStatusChart(stats: StatistiqueResponse): void {
        const labels: Record<string, string> = {
            SOUMIS:'Soumis', RECU:'Reçu', EN_ETUDE_OPPORTUNITE:'Étude',
            EN_REVUE_CTADP:'CTADP', RECEVABLE:'Recevable',
            EN_INVESTIGATION:'Investigation', RAPPORT_PRODUIT:'Rapport',
            DECISION_RENDUE:'Décision', CLOS:'Clôturé', CLASSE:'Classé',
            IRRECEVABLE:'Irrecevable', TRANSFERE:'Transféré'
        };
        const palette = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6',
                         '#06b6d4','#ec4899','#10b981','#f97316',
                         '#6366f1','#14b8a6','#ef4444','#84cc16'];
        const entries = Object.entries(stats.countByStatus || {}).filter(([,v]) => v > 0);
        this.statusChartData = {
            labels:   entries.map(([k]) => labels[k] || k),
            datasets: [{ data: entries.map(([,v]) => v),
                backgroundColor: palette.slice(0, entries.length), borderWidth: 2 }]
        };
    }

    private buildModeChart(stats: StatistiqueResponse): void {
        const labels: Record<string, string> = {
            IN_PERSON:'Guichet', WEB_FORM:'Web', EMAIL:'Email',
            SMS:'SMS', PHONE:'Téléphone', GREEN_NUMBER:'N°Vert',
            SOCIAL_MEDIA:'Réseaux', AUDIO_COUNTER:'Audio', PAPER_FORM:'Formulaire'
        };
        const palette = ['#3b82f6','#8b5cf6','#22c55e','#f59e0b',
                         '#06b6d4','#ec4899','#10b981','#f97316','#6366f1'];
        const entries = Object.entries(stats.countBySubmissionMode || {}).filter(([,v]) => v > 0);
        this.modeChartData = {
            labels:   entries.map(([k]) => labels[k] || k),
            datasets: [{
                label: 'Dossiers',
                data:  entries.map(([,v]) => v),
                backgroundColor: entries.map((_, i) => palette[i % palette.length]),
                borderRadius: 8, borderWidth: 0
            }]
        };
    }

    getStatusBg(status: string): string {
        const map: Record<string, string> = {
            SOUMIS:'#eff6ff', RECU:'#eff6ff', EN_ETUDE_OPPORTUNITE:'#fffbeb',
            EN_REVUE_CTADP:'#faf5ff', RECEVABLE:'#f0fdf4', IRRECEVABLE:'#fff5f5',
            EN_INVESTIGATION:'#fdf4ff', CLOS:'#f0fdf4', DECISION_RENDUE:'#f0fdf4'
        };
        return map[status] || '#f9fafb';
    }

    getStatusColor(status: string): string {
        const map: Record<string, string> = {
            SOUMIS:'#3b82f6', RECU:'#06b6d4', EN_ETUDE_OPPORTUNITE:'#f59e0b',
            EN_REVUE_CTADP:'#8b5cf6', RECEVABLE:'#22c55e', IRRECEVABLE:'#ef4444',
            EN_INVESTIGATION:'#ec4899', CLOS:'#16a34a', DECISION_RENDUE:'#10b981'
        };
        return map[status] || '#94a3b8';
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            SOUMIS:'Soumis', RECU:'Reçu', EN_ETUDE_OPPORTUNITE:'En étude',
            EN_ATTENTE_COMPLEMENT:'Complément', EN_REVUE_CTADP:'CTADP',
            RECEVABLE:'Recevable', IRRECEVABLE:'Irrecevable', TRANSFERE:'Transféré',
            EN_INVESTIGATION:'Investigation', RAPPORT_PRODUIT:'Rapport',
            DECISION_RENDUE:'Décision', CLOS:'Clôturé', CLASSE:'Classé'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            SOUMIS:'info', RECU:'info',
            EN_ETUDE_OPPORTUNITE:'warn', EN_ATTENTE_COMPLEMENT:'warn', EN_REVUE_CTADP:'warn',
            RECEVABLE:'success', IRRECEVABLE:'danger', TRANSFERE:'secondary',
            EN_INVESTIGATION:'warn', RAPPORT_PRODUIT:'info',
            DECISION_RENDUE:'success', CLOS:'success', CLASSE:'secondary'
        };
        return map[status] ?? 'info';
    }
}