import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { StatistiqueService } from '../../core/services/statistique.service';
import { DossierService } from '../../core/services/dossier.service';
import { StatistiqueResponse, DossierResponse } from '../../core/models/dossier.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        CardModule,
        ChartModule,
        TagModule,
        SkeletonModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <!-- En-tête -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                Tableau de Bord
            </h1>
            <p class="text-surface-500 mt-1">
                Bienvenue, {{ userInfo.firstName }} —
                 {{ today | date:'dd/MM/yyyy' }}
            </p>
        </div>
        <div class="flex gap-2">
            <p-button
                label="Nouveau Dossier"
                icon="pi pi-plus"
                routerLink="/dossiers/nouveau"
                severity="primary" />
            <p-button
                label="Suivi Citoyen"
                icon="pi pi-search"
                routerLink="/suivi"
                severity="secondary"
                outlined />
        </div>
    </div>

    <!-- KPIs principaux -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Total Dossiers -->
        <div class="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-500 text-sm font-medium">Total Dossiers</span>
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <i class="pi pi-folder text-blue-600 dark:text-blue-400"></i>
                </div>
            </div>
            <div *ngIf="!loading; else skeleton">
                <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                    {{ stats?.totalDossiers || 0 }}
                </div>
                <div class="text-xs text-surface-400 mt-1">Cette année</div>
            </div>
            <ng-template #skeleton>
                <p-skeleton height="2rem" styleClass="mb-2" />
            </ng-template>
        </div>

        <!-- En Investigation -->
        <div class="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-500 text-sm font-medium">En Investigation</span>
                <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <i class="pi pi-eye text-orange-600 dark:text-orange-400"></i>
                </div>
            </div>
            <div *ngIf="!loading; else skeleton2">
                <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                    {{ stats?.countByStatus?.['EN_INVESTIGATION'] || 0 }}
                </div>
                <div class="text-xs text-surface-400 mt-1">Enquêtes actives</div>
            </div>
            <ng-template #skeleton2>
                <p-skeleton height="2rem" styleClass="mb-2" />
            </ng-template>
        </div>

        <!-- Taux Recevabilité -->
        <div class="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-500 text-sm font-medium">Taux Recevabilité</span>
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <i class="pi pi-check-circle text-green-600 dark:text-green-400"></i>
                </div>
            </div>
            <div *ngIf="!loading; else skeleton3">
                <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                    {{ stats?.admissibilityRate || 0 | number:'1.0-1' }}%
                </div>
                <div class="text-xs text-surface-400 mt-1">Dossiers recevables</div>
            </div>
            <ng-template #skeleton3>
                <p-skeleton height="2rem" styleClass="mb-2" />
            </ng-template>
        </div>

        <!-- Alertes délais -->
        <div class="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700"
             [class.border-red-300]="hasAlerts">
            <div class="flex items-center justify-between mb-3">
                <span class="text-surface-500 text-sm font-medium">Alertes Délais</span>
                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                     [class]="hasAlerts ? 'bg-red-100 dark:bg-red-900' : 'bg-surface-100 dark:bg-surface-700'">
                    <i class="pi pi-bell"
                       [class]="hasAlerts ? 'text-red-600 dark:text-red-400' : 'text-surface-400'"></i>
                </div>
            </div>
            <div *ngIf="!loading; else skeleton4">
                <div class="text-3xl font-bold"
                     [class]="hasAlerts ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'">
                    {{ totalAlerts }}
                </div>
                <div class="text-xs text-surface-400 mt-1">Dépassements de délai</div>
            </div>
            <ng-template #skeleton4>
                <p-skeleton height="2rem" styleClass="mb-2" />
            </ng-template>
        </div>

    </div>

    <!-- Graphiques -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Répartition par statut -->
        <div class="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700">
            <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-4">
                Répartition par Statut
            </h3>
            <div *ngIf="!loading && statusChartData; else chartSkeleton">
                <p-chart
                    type="doughnut"
                    [data]="statusChartData"
                    [options]="chartOptions"
                    height="250px" />
            </div>
            <ng-template #chartSkeleton>
                <p-skeleton height="250px" />
            </ng-template>
        </div>

        <!-- Répartition par canal -->
        <div class="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700">
            <h3 class="font-semibold text-surface-900 dark:text-surface-0 mb-4">
                Canaux de Réception
            </h3>
            <div *ngIf="!loading && modeChartData; else chartSkeleton2">
                <p-chart
                    type="bar"
                    [data]="modeChartData"
                    [options]="barChartOptions"
                    height="250px" />
            </div>
            <ng-template #chartSkeleton2>
                <p-skeleton height="250px" />
            </ng-template>
        </div>

    </div>

    <!-- Dossiers récents -->
    <div class="bg-white dark:bg-surface-800 rounded-xl p-5 shadow-sm border border-surface-200 dark:border-surface-700">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                Dossiers Récents
            </h3>
            <p-button
                label="Voir tous"
                icon="pi pi-arrow-right"
                iconPos="right"
                routerLink="/dossiers"
                severity="secondary"
                text
                size="small" />
        </div>

        <div *ngIf="!loadingDossiers; else tableSkeleton">
            <div *ngFor="let d of recentDossiers"
                 class="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-700 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-700 px-2 rounded-lg cursor-pointer transition-colors"
                 [routerLink]="['/dossiers', d.id]">

                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-file text-primary-600 dark:text-primary-400 text-sm"></i>
                    </div>
                    <div>
                        <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">
                            {{ d.number || 'En attente' }}
                        </div>
                        <div class="text-surface-400 text-xs truncate max-w-xs">
                            {{ d.object }}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3 flex-shrink-0">
                    <p-tag
                        [value]="getStatusLabel(d.status)"
                        [severity]="getStatusSeverity(d.status)" />
                    <span class="text-xs text-surface-400">
                        {{ d.createdAt | date:'dd/MM/yyyy' }}
                    </span>
                </div>
            </div>

            <div *ngIf="recentDossiers.length === 0"
                 class="text-center py-8 text-surface-400">
                <i class="pi pi-inbox text-4xl mb-3 block"></i>
                Aucun dossier pour l'instant
            </div>
        </div>

        <ng-template #tableSkeleton>
            <div class="flex flex-col gap-3">
                <p-skeleton *ngFor="let i of [1,2,3,4,5]" height="3rem" />
            </div>
        </ng-template>
    </div>

</div>
    `
})
export class Dashboard implements OnInit {

    private keycloakService = inject(KeycloakService);
    private statistiqueService = inject(StatistiqueService);
    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);

    userInfo = this.keycloakService.getUserInfo();
    today = new Date();

    loading = true;
    loadingDossiers = true;

    stats: StatistiqueResponse | null = null;
    recentDossiers: DossierResponse[] = [];

    statusChartData: any = null;
    modeChartData: any = null;
    chartOptions: any = {};
    barChartOptions: any = {};

    get hasAlerts(): boolean {
        return this.totalAlerts > 0;
    }

    get totalAlerts(): number {
        return (this.stats?.overdueAcknowledgments || 0)
             + (this.stats?.overdueInvestigations || 0);
    }

    ngOnInit(): void {
        this.loadStats();
        this.loadRecentDossiers();
        this.initChartOptions();
    }

    private loadStats(): void {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1)
            .toISOString();
        const end = now.toISOString();

        this.statistiqueService.getDashboard(start, end)
            .subscribe({
                next: stats => {
                    this.stats = stats;
                    this.buildStatusChart(stats);
                    this.buildModeChart(stats);
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Statistiques',
                        detail: 'Impossible de charger les statistiques'
                    });
                }
            });
    }

    private loadRecentDossiers(): void {
        this.dossierService.findAll(0, 5).subscribe({
            next: page => {
                this.recentDossiers = page.content;
                this.loadingDossiers = false;
            },
            error: () => {
                this.loadingDossiers = false;
            }
        });
    }

    private buildStatusChart(stats: StatistiqueResponse): void {
        const statusLabels: Record<string, string> = {
            SOUMIS: 'Soumis',
            RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'Étude',
            EN_REVUE_CTADP: 'CTADP',
            RECEVABLE: 'Recevable',
            EN_INVESTIGATION: 'Investigation',
            RAPPORT_PRODUIT: 'Rapport',
            DECISION_RENDUE: 'Décision',
            CLOS: 'Clôturé',
            CLASSE: 'Classé',
            IRRECEVABLE: 'Irrecevable',
            TRANSFERE: 'Transféré'
        };

        const colors = [
            '#3b82f6', '#22c55e', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#ec4899',
            '#10b981', '#f97316', '#6366f1',
            '#14b8a6', '#ef4444', '#84cc16'
        ];

        const entries = Object.entries(
            stats.countByStatus || {}
        ).filter(([, v]) => v > 0);

        this.statusChartData = {
            labels: entries.map(([k]) =>
                statusLabels[k] || k),
            datasets: [{
                data: entries.map(([, v]) => v),
                backgroundColor: colors.slice(0, entries.length),
                borderWidth: 2
            }]
        };
    }

    private buildModeChart(stats: StatistiqueResponse): void {
        const modeLabels: Record<string, string> = {
            IN_PERSON: 'Guichet',
            WEB_FORM: 'Web',
            EMAIL: 'Email',
            SMS: 'SMS',
            PHONE: 'Téléphone',
            GREEN_NUMBER: 'N° Vert',
            SOCIAL_MEDIA: 'Réseaux',
            AUDIO_COUNTER: 'Audio',
            PAPER_FORM: 'Formulaire'
        };

        const entries = Object.entries(
            stats.countBySubmissionMode || {}
        ).filter(([, v]) => v > 0);

        this.modeChartData = {
            labels: entries.map(([k]) =>
                modeLabels[k] || k),
            datasets: [{
                label: 'Nombre de dossiers',
                data: entries.map(([, v]) => v),
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }]
        };
    }

    private initChartOptions(): void {
        this.chartOptions = {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 12, font: { size: 11 } }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };

        this.barChartOptions = {
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis',
            RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'En étude',
            EN_ATTENTE_COMPLEMENT: 'Complément',
            EN_REVUE_CTADP: 'CTADP',
            RECEVABLE: 'Recevable',
            IRRECEVABLE: 'Irrecevable',
            TRANSFERE: 'Transféré',
            EN_INVESTIGATION: 'Investigation',
            RAPPORT_PRODUIT: 'Rapport',
            DECISION_RENDUE: 'Décision',
            CLOS: 'Clôturé',
            CLASSE: 'Classé'
        };
        return labels[status] || status;
    }

    getStatusSeverity(
        status: string
    ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, any> = {
            SOUMIS: 'info',
            RECU: 'info',
            EN_ETUDE_OPPORTUNITE: 'warn',
            EN_ATTENTE_COMPLEMENT: 'warn',
            EN_REVUE_CTADP: 'warn',
            RECEVABLE: 'success',
            IRRECEVABLE: 'danger',
            TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn',
            RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success',
            CLOS: 'success',
            CLASSE: 'secondary'
        };
        return map[status] || 'info';
    }
}