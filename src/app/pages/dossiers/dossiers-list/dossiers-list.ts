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
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierStatus } from '../../../core/models/dossier.model';
import { StatistiqueService, PublicStats } from '../../../core/services/statistique.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-dossiers-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, TagModule,
        InputTextModule, SelectModule, ToastModule,
        ProgressSpinnerModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <!-- ── En-tête ─────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Dossiers
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                {{ stats.totalDossiers }} dossier(s) enregistré(s)
            </p>
        </div>
        <p-button label="Nouveau Dossier" icon="pi pi-plus"
            routerLink="/app/dossiers/nouveau" />
    </div>

    <!-- ── Cartes statistiques — données réelles API ──────── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-inbox text-blue-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-blue-600">
                    {{ statsLoading ? '…' : stats.dossiersNouveaux }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">Nouveaux</div>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-clock text-amber-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-amber-600">
                    {{ statsLoading ? '…' : stats.dossiersEnCours }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">En cours</div>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-check-circle text-green-600"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-green-600">
                    {{ statsLoading ? '…' : stats.dossiersTraites }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">Traités</div>
            </div>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-folder text-surface-500"></i>
            </div>
            <div>
                <div class="text-xl font-bold text-primary-600">
                    {{ statsLoading ? '…' : stats.totalDossiers }}
                </div>
                <div class="text-xs text-surface-400 uppercase tracking-wide">Total</div>
            </div>
        </div>

    </div>

    <!-- ── Filtres ─────────────────────────────────────────── -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl p-4 border border-surface-100">
        <div class="flex flex-wrap gap-3 items-end">

            <div class="flex-1 min-w-56">
                <label class="text-xs text-surface-400 font-medium mb-1.5 block uppercase tracking-wide">
                    Recherche
                </label>
                <div class="flex items-center gap-2 border border-surface-200 rounded-xl px-3 py-2">
                    <i class="pi pi-search text-surface-300 text-sm"></i>
                    <input pInputText [(ngModel)]="searchText"
                        placeholder="Numéro, objet, déclarant..."
                        class="flex-1 border-none shadow-none outline-none bg-transparent text-sm"
                        (input)="onSearch()" />
                    <i *ngIf="searchText"
                        class="pi pi-times text-surface-300 text-xs cursor-pointer"
                        (click)="clearSearch()"></i>
                </div>
            </div>

            <div class="min-w-52">
                <label class="text-xs text-surface-400 font-medium mb-1.5 block uppercase tracking-wide">
                    Statut
                </label>
                <p-select [(ngModel)]="selectedStatus"
                    [options]="statusOptions" optionLabel="label"
                    optionValue="value" placeholder="Tous les statuts"
                    [showClear]="true" styleClass="w-full"
                    (onChange)="onStatusFilter()" />
            </div>

            <p-button icon="pi pi-refresh" severity="secondary" outlined
                pTooltip="Actualiser" (onClick)="refresh()" />

        </div>
    </div>

    <!-- ── Spinner ────────────────────────────────────────── -->
    <div *ngIf="loading" class="flex justify-center py-12">
        <p-progressSpinner strokeWidth="4" />
    </div>

    <!-- ── Tableau ─────────────────────────────────────────── -->
    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">

        <p-table [value]="dossiers"
            [paginator]="dossiers.length > 0" [rows]="pageSize"
            [rowsPerPageOptions]="[10, 20, 50]"
            dataKey="id" styleClass="p-datatable-sm" [rowHover]="true">

            <ng-template pTemplate="header">
                <tr>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36">Numéro</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">Dossier</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">Type</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36">Statut</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">Canal</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">Date</th>
                    <th class="w-16"></th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-d>
                <tr class="border-b border-surface-50 cursor-pointer transition-colors"
                    [routerLink]="['/app/dossiers', d.id]">

                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-8 rounded-full flex-shrink-0"
                                [ngClass]="getStatusBarClass(d.status)"></div>
                            <span class="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                                {{ d.number || '—' }}
                            </span>
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <div class="font-medium text-sm text-surface-900 truncate max-w-xs">
                            {{ d.object }}
                        </div>
                        <div *ngIf="d.declarant"
                            class="flex items-center gap-1 text-xs text-surface-400 mt-0.5">
                            <i class="pi pi-user text-xs"></i>
                            {{ d.declarant?.displayName }}
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <i [ngClass]="getTypeIcon(d.type)" class="text-xs text-surface-400"></i>
                            <span class="text-xs text-surface-600">{{ getTypeLabel(d.type) }}</span>
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <p-tag [value]="getStatusLabel(d.status)"
                            [severity]="getStatusSeverity(d.status)"
                            styleClass="text-xs" />
                    </td>

                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1.5">
                            <i [ngClass]="getModeIcon(d.submissionMode)" class="text-xs text-surface-300"></i>
                            <span class="text-xs text-surface-500">{{ getModeLabel(d.submissionMode) }}</span>
                        </div>
                    </td>

                    <td class="px-4 py-3">
                        <span class="text-xs text-surface-400">{{ d.createdAt | date:'dd/MM/yyyy' }}</span>
                    </td>

                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                        <p-button icon="pi pi-eye" severity="info" text size="small"
                            [routerLink]="['/app/dossiers', d.id]"
                            pTooltip="Voir" tooltipPosition="top" />
                    </td>

                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="7">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                                <i class="pi pi-inbox text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">Aucun dossier trouvé</p>
                            <p-button *ngIf="searchText || selectedStatus"
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
export class DossiersList implements OnInit {

    private dossierService   = inject(DossierService);
    private messageService   = inject(MessageService);
    private statistiqueService = inject(StatistiqueService);

    dossiers:     DossierResponse[] = [];
    loading       = true;
    statsLoading  = true;
    totalRecords  = 0;
    pageSize      = 20;
    currentPage   = 0;
    searchText    = '';
    selectedStatus: DossierStatus | null = null;

    // Stats réelles depuis l'API
    stats: PublicStats = {
        totalDossiers:    0,
        dossiersNouveaux: 0,
        dossiersEnCours:  0,
        dossiersTraites:  0,
        confidentiel:     '100%',
        delaiJours:       7
    };

    statusOptions = [
        { label: 'Soumis',                value: 'SOUMIS' },
        { label: 'Reçu',                  value: 'RECU' },
        { label: 'En étude opportunité',  value: 'EN_ETUDE_OPPORTUNITE' },
        { label: 'En attente complément', value: 'EN_ATTENTE_COMPLEMENT' },
        { label: 'En revue CTADP',        value: 'EN_REVUE_CTADP' },
        { label: 'Recevable',             value: 'RECEVABLE' },
        { label: 'Irrecevable',           value: 'IRRECEVABLE' },
        { label: 'Transféré',             value: 'TRANSFERE' },
        { label: 'En investigation',      value: 'EN_INVESTIGATION' },
        { label: 'Rapport produit',       value: 'RAPPORT_PRODUIT' },
        { label: 'Décision rendue',       value: 'DECISION_RENDUE' },
        { label: 'Clôturé',               value: 'CLOS' },
        { label: 'Classé',                value: 'CLASSE' }
    ];

    ngOnInit(): void {
        this.loadDossiers();
        this.loadStats();
    }

    private loadStats(): void {
        this.statsLoading = true;
        this.statistiqueService.getPublicStats().subscribe({
            next:  s  => { this.stats = s; this.statsLoading = false; },
            error: () => { this.statsLoading = false; }
        });
    }

    loadDossiers(): void {
        this.loading = true;

        const obs = this.selectedStatus
            ? this.dossierService.findByStatus(
                this.selectedStatus, this.currentPage, this.pageSize)
            : this.dossierService.findAll(this.currentPage, this.pageSize);

        obs.subscribe({
            next: page => {
                this.dossiers    = page.content;
                this.totalRecords = page.totalElements;
                this.loading     = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   'Impossible de charger les dossiers'
                });
            }
        });
    }

    // Recharge les dossiers ET les stats
    refresh(): void {
        this.loadDossiers();
        this.loadStats();
    }

    onSearch():       void { this.currentPage = 0; this.loadDossiers(); }
    onStatusFilter(): void { this.currentPage = 0; this.loadDossiers(); }

    clearSearch(): void {
        this.searchText  = '';
        this.currentPage = 0;
        this.loadDossiers();
    }

    clearStatusFilter(): void {
        this.selectedStatus = null;
        this.currentPage    = 0;
        this.loadDossiers();
    }

    resetFilters(): void {
        this.searchText     = '';
        this.selectedStatus = null;
        this.currentPage    = 0;
        this.loadDossiers();
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'En étude', EN_ATTENTE_COMPLEMENT: 'Complément',
            EN_REVUE_CTADP: 'CTADP', RECEVABLE: 'Recevable',
            IRRECEVABLE: 'Irrecevable', TRANSFERE: 'Transféré',
            EN_INVESTIGATION: 'Investigation', RAPPORT_PRODUIT: 'Rapport',
            DECISION_RENDUE: 'Décision', CLOS: 'Clôturé', CLASSE: 'Classé'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            SOUMIS: 'info', RECU: 'info',
            EN_ETUDE_OPPORTUNITE: 'warn', EN_ATTENTE_COMPLEMENT: 'warn', EN_REVUE_CTADP: 'warn',
            RECEVABLE: 'success', IRRECEVABLE: 'danger', TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn', RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success', CLOS: 'success', CLASSE: 'secondary'
        };
        return map[status] ?? 'info';
    }

    getStatusBarClass(status: string): string {
        const map: Record<string, string> = {
            SOUMIS: 'bg-blue-400', RECU: 'bg-blue-500',
            EN_ETUDE_OPPORTUNITE: 'bg-amber-400', EN_ATTENTE_COMPLEMENT: 'bg-amber-500',
            EN_REVUE_CTADP: 'bg-orange-400', RECEVABLE: 'bg-green-500',
            IRRECEVABLE: 'bg-red-400', TRANSFERE: 'bg-surface-400',
            EN_INVESTIGATION: 'bg-purple-400', RAPPORT_PRODUIT: 'bg-teal-400',
            DECISION_RENDUE: 'bg-green-600', CLOS: 'bg-green-700', CLASSE: 'bg-surface-300'
        };
        return map[status] || 'bg-surface-200';
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            COMPLAINT: 'Plainte', DENUNCIATION: 'Dénonciation',
            AUTO_REFERRAL: 'Auto-saisine', ANONYMOUS: 'Anonyme'
        };
        return labels[type] || type;
    }

    getTypeIcon(type: string): string {
        const icons: Record<string, string> = {
            COMPLAINT: 'pi pi-exclamation-circle', DENUNCIATION: 'pi pi-megaphone',
            AUTO_REFERRAL: 'pi pi-search', ANONYMOUS: 'pi pi-eye-slash'
        };
        return icons[type] || 'pi pi-file';
    }

    getModeLabel(mode: string): string {
        const labels: Record<string, string> = {
            IN_PERSON: 'Guichet', WEB_FORM: 'Web', EMAIL: 'Email',
            SMS: 'SMS', PHONE: 'Téléphone', GREEN_NUMBER: 'N° Vert',
            SOCIAL_MEDIA: 'Réseaux', AUDIO_COUNTER: 'Audio',
            PAPER_FORM: 'Formulaire', FAX: 'Fax', POSTAL_MAIL: 'Courrier'
        };
        return labels[mode] || mode;
    }

    getModeIcon(mode: string): string {
        const icons: Record<string, string> = {
            IN_PERSON: 'pi pi-building', WEB_FORM: 'pi pi-globe',
            EMAIL: 'pi pi-envelope', SMS: 'pi pi-mobile',
            PHONE: 'pi pi-phone', GREEN_NUMBER: 'pi pi-phone',
            SOCIAL_MEDIA: 'pi pi-share-alt', AUDIO_COUNTER: 'pi pi-microphone',
            PAPER_FORM: 'pi pi-file', FAX: 'pi pi-print', POSTAL_MAIL: 'pi pi-send'
        };
        return icons[mode] || 'pi pi-circle';
    }
}