import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierStatus } from '../../../core/models/dossier.model';
import { KeycloakService } from '../../../core/auth/keycloak.service';

@Component({
    selector: 'app-dossiers-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        TableModule,
        ButtonModule,
        TagModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast />
<p-confirmDialog />

<div class="flex flex-col gap-4">

    <!-- En-tête -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold">Dossiers</h1>
            <p class="text-surface-500 text-sm mt-1">
                {{ totalRecords }} dossier(s) au total
            </p>
        </div>
        <p-button
            label="Nouveau Dossier"
            icon="pi pi-plus"
            routerLink="/dossiers/nouveau" />
    </div>

    <!-- Filtres -->
    <div class="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700">
        <div class="flex flex-wrap gap-3">

            <div class="flex-1 min-w-48">
                <label class="text-xs text-surface-500 mb-1 block">
                    Recherche
                </label>
                <input
                    pInputText
                    [(ngModel)]="searchText"
                    placeholder="Numéro, objet..."
                    class="w-full text-sm"
                    (input)="onSearch()" />
            </div>

            <div class="min-w-48">
                <label class="text-xs text-surface-500 mb-1 block">
                    Statut
                </label>
                <p-select
                    [(ngModel)]="selectedStatus"
                    [options]="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Tous les statuts"
                    [showClear]="true"
                    styleClass="w-full text-sm"
                    (onChange)="onStatusFilter()" />
            </div>

            <div class="flex items-end">
                <p-button
                    icon="pi pi-refresh"
                    severity="secondary"
                    outlined
                    (onClick)="loadDossiers()"
                    pTooltip="Actualiser" />
            </div>

        </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
        <p-table
            [value]="dossiers"
            [loading]="loading"
            [paginator]="true"
            [rows]="pageSize"
            [totalRecords]="totalRecords"
            [lazy]="true"
            (onLazyLoad)="onLazyLoad($event)"
            [rowsPerPageOptions]="[10, 20, 50]"
            dataKey="id"
            styleClass="p-datatable-sm"
            [rowHover]="true">

            <ng-template pTemplate="header">
                <tr>
                    <th pSortableColumn="number" class="w-36">
                        Numéro <p-sortIcon field="number" />
                    </th>
                    <th>Objet</th>
                    <th class="w-32">Type</th>
                    <th class="w-36">Statut</th>
                    <th class="w-32">Canal</th>
                    <th pSortableColumn="createdAt" class="w-36">
                        Date <p-sortIcon field="createdAt" />
                    </th>
                    <th class="w-24">Actions</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-d>
                <tr class="cursor-pointer"
                    [routerLink]="['/dossiers', d.id]">
                    <td>
                        <span class="font-mono text-xs font-semibold text-primary-600">
                            {{ d.number || '—' }}
                        </span>
                    </td>
                    <td>
                        <div class="max-w-xs">
                            <div class="text-sm font-medium truncate">
                                {{ d.object }}
                            </div>
                            <div *ngIf="d.declarant" class="text-xs text-surface-400">
                                {{ d.declarant.displayName }}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="text-xs">
                            {{ getTypeLabel(d.type) }}
                        </span>
                    </td>
                    <td>
                        <p-tag
                            [value]="getStatusLabel(d.status)"
                            [severity]="getStatusSeverity(d.status)"
                            styleClass="text-xs" />
                    </td>
                    <td>
                        <span class="text-xs text-surface-500">
                            {{ getModeLabel(d.submissionMode) }}
                        </span>
                    </td>
                    <td>
                        <span class="text-xs text-surface-500">
                            {{ d.createdAt | date:'dd/MM/yyyy' }}
                        </span>
                    </td>
                    <td (click)="$event.stopPropagation()">
                        <div class="flex gap-1">
                            <p-button
                                icon="pi pi-eye"
                                severity="info"
                                text
                                size="small"
                                [routerLink]="['/dossiers', d.id]"
                                pTooltip="Voir le dossier" />
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="7" class="text-center py-12 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        Aucun dossier trouvé
                    </td>
                </tr>
            </ng-template>

        </p-table>
    </div>

</div>
    `
})
export class DossiersList implements OnInit {

    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);

    dossiers: DossierResponse[] = [];
    loading = true;
    totalRecords = 0;
    pageSize = 20;
    currentPage = 0;

    searchText = '';
    selectedStatus: DossierStatus | null = null;

    statusOptions = [
        { label: 'Soumis', value: 'SOUMIS' },
        { label: 'Reçu', value: 'RECU' },
        { label: 'En étude opportunité', value: 'EN_ETUDE_OPPORTUNITE' },
        { label: 'En attente complément', value: 'EN_ATTENTE_COMPLEMENT' },
        { label: 'En revue CTADP', value: 'EN_REVUE_CTADP' },
        { label: 'Recevable', value: 'RECEVABLE' },
        { label: 'Irrecevable', value: 'IRRECEVABLE' },
        { label: 'Transféré', value: 'TRANSFERE' },
        { label: 'En investigation', value: 'EN_INVESTIGATION' },
        { label: 'Rapport produit', value: 'RAPPORT_PRODUIT' },
        { label: 'Décision rendue', value: 'DECISION_RENDUE' },
        { label: 'Clôturé', value: 'CLOS' },
        { label: 'Classé', value: 'CLASSE' }
    ];

    ngOnInit(): void {
        this.loadDossiers();
    }

    loadDossiers(): void {
        this.loading = true;

        const obs = this.selectedStatus
            ? this.dossierService.findByStatus(
                this.selectedStatus,
                this.currentPage,
                this.pageSize
              )
            : this.dossierService.findAll(
                this.currentPage,
                this.pageSize
              );

        obs.subscribe({
            next: page => {
                this.dossiers = page.content;
                this.totalRecords = page.totalElements;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les dossiers'
                });
            }
        });
    }

    onLazyLoad(event: any): void {
        this.currentPage = Math.floor(
            (event.first || 0) / (event.rows || this.pageSize)
        );
        this.pageSize = event.rows || this.pageSize;
        this.loadDossiers();
    }

    onSearch(): void {
        this.currentPage = 0;
        this.loadDossiers();
    }

    onStatusFilter(): void {
        this.currentPage = 0;
        this.loadDossiers();
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

    getStatusSeverity(status: string): any {
        const map: Record<string, string> = {
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

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            COMPLAINT: 'Plainte',
            DENUNCIATION: 'Dénonciation',
            AUTO_REFERRAL: 'Auto-saisine',
            ANONYMOUS: 'Anonyme'
        };
        return labels[type] || type;
    }

    getModeLabel(mode: string): string {
        const labels: Record<string, string> = {
            IN_PERSON: 'Guichet',
            WEB_FORM: 'Web',
            EMAIL: 'Email',
            SMS: 'SMS',
            PHONE: 'Téléphone',
            GREEN_NUMBER: 'N° Vert',
            SOCIAL_MEDIA: 'Réseaux',
            AUDIO_COUNTER: 'Audio',
            PAPER_FORM: 'Formulaire',
            FAX: 'Fax',
            POSTAL_MAIL: 'Courrier'
        };
        return labels[mode] || mode;
    }
}