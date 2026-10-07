import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import {
    InformationPreoccupanteService,
    InformationPreoccupanteResponse,
    AutoReferralSource,
    StatutInformationPreoccupante
} from '../../../core/services/information-preoccupante.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-informations-preoccupantes-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, TagModule, DialogModule,
        TextareaModule, InputTextModule, SelectModule, DatePickerModule,
        ToastModule, ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Informations préoccupantes</h1>
            <p class="text-surface-400 text-sm mt-1">
                {{ items.length }} information(s) — signalements reçus hors dépôt de plainte (presse, audit, dénonciation interne...)
            </p>
        </div>
        <p-button label="Nouvelle information" icon="pi pi-plus" (onClick)="openCreateDialog()"/>
    </div>

    <div *ngIf="loading" class="flex justify-center py-12">
        <p-progressSpinner strokeWidth="4" />
    </div>

    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">
        <p-table [value]="items" dataKey="id" styleClass="p-datatable-sm" [rowHover]="true">
            <ng-template pTemplate="header">
                <tr>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">Réception</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">Objet</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-40">Source</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-40">Statut</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-28">Dossiers</th>
                    <th class="w-16"></th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-i>
                <tr class="border-b border-surface-50 cursor-pointer transition-colors"
                    [routerLink]="['/app/informations-preoccupantes', i.id]">
                    <td class="px-4 py-3">
                        <span class="text-sm font-medium">{{ i.dateReception | date:'dd/MM/yyyy' }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-sm text-surface-700 truncate">{{ i.objet }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-xs text-surface-500">{{ getSourceLabel(i.source) }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <p-tag [value]="getStatutLabel(i.statut)" [severity]="getStatutSeverity(i.statut)" styleClass="text-xs" />
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-xs font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                            {{ i.dossiersRattaches.length }}
                        </span>
                    </td>
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                        <p-button icon="pi pi-eye" severity="info" text size="small"
                            [routerLink]="['/app/informations-preoccupantes', i.id]"/>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="6">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                                <i class="pi pi-eye text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">Aucune information préoccupante enregistrée</p>
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>
</div>

<p-dialog [(visible)]="showCreateDialog" header="Nouvelle information préoccupante"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Objet <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="createForm.objet" class="w-full"
                placeholder="Ex : Article de presse sur des malversations présumées..."/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Description <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="createForm.description" rows="4" class="w-full"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Source <span class="text-red-500">*</span>
                </label>
                <p-select [(ngModel)]="createForm.source" [options]="sourceOptions"
                    optionLabel="label" optionValue="value" placeholder="Sélectionner..."
                    styleClass="w-full" appendTo="body"/>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Date de réception <span class="text-red-500">*</span>
                </label>
                <p-datepicker [(ngModel)]="createForm.dateReception" dateFormat="dd/mm/yy"
                    showIcon styleClass="w-full" appendTo="body"/>
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Référence de la source
            </label>
            <input pInputText [(ngModel)]="createForm.sourceReference" class="w-full"
                placeholder="Ex : L'Observateur Paalga, édition du 12/09/2026..."/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showCreateDialog=false"/>
        <p-button label="Créer" icon="pi pi-check" [loading]="creating"
            [disabled]="!createForm.objet.trim() || !createForm.description.trim() || !createForm.source || !createForm.dateReception"
            (onClick)="createInformation()"/>
    </ng-template>
</p-dialog>
    `
})
export class InformationsPreoccupantesList implements OnInit {

    private informationPreoccupanteService = inject(InformationPreoccupanteService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    items: InformationPreoccupanteResponse[] = [];
    loading = true;

    showCreateDialog = false;
    creating = false;
    createForm: {
        objet: string; description: string;
        source: AutoReferralSource | null; sourceReference: string;
        dateReception: Date | null;
    } = { objet: '', description: '', source: null, sourceReference: '', dateReception: new Date() };

    readonly sourceOptions: { label: string; value: AutoReferralSource }[] = [
        { label: 'Presse écrite', value: 'WRITTEN_PRESS' },
        { label: 'Télévision', value: 'TELEVISION' },
        { label: 'Radio', value: 'RADIO' },
        { label: 'Réseaux sociaux', value: 'SOCIAL_MEDIA' },
        { label: "Rapport d'audit", value: 'AUDIT_REPORT' },
        { label: "Rapport d'inspection", value: 'INSPECTION_REPORT' },
        { label: 'Dénonciation interne', value: 'INTERNAL_TIP' },
        { label: 'Institution partenaire', value: 'PARTNER_INSTITUTION' },
        { label: 'Saisine du procureur', value: 'PROSECUTOR_REFERRAL' },
        { label: 'Autre', value: 'OTHER' }
    ];

    ngOnInit(): void { this.loadAll(); }

    private loadAll(): void {
        this.loading = true;
        this.informationPreoccupanteService.findAll(0, 200).subscribe({
            next: page => { this.items = page.content; this.loading = false; },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les informations préoccupantes'
                });
            }
        });
    }

    openCreateDialog(): void {
        this.createForm = { objet: '', description: '', source: null, sourceReference: '', dateReception: new Date() };
        this.showCreateDialog = true;
    }

    createInformation(): void {
        if (!this.createForm.objet.trim() || !this.createForm.description.trim()
            || !this.createForm.source || !this.createForm.dateReception) return;

        this.creating = true;
        this.informationPreoccupanteService.create({
            objet: this.createForm.objet.trim(),
            description: this.createForm.description.trim(),
            source: this.createForm.source,
            sourceReference: this.createForm.sourceReference.trim() || undefined,
            dateReception: this.createForm.dateReception.toISOString()
        }).subscribe({
            next: i => {
                this.creating = false;
                this.showCreateDialog = false;
                this.router.navigate(['/app/informations-preoccupantes', i.id]);
            },
            error: err => {
                this.creating = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Création impossible'
                });
            }
        });
    }

    getSourceLabel(s: AutoReferralSource): string {
        return this.sourceOptions.find(o => o.value === s)?.label ?? s;
    }

    getStatutLabel(s: StatutInformationPreoccupante): string {
        return ({
            NOUVELLE: 'Nouvelle',
            RATTACHEE: 'Rattachée',
            AUTO_SAISINE_DECLENCHEE: 'Auto-saisine déclenchée',
            CLASSEE_SANS_SUITE: 'Classée sans suite'
        } as Record<string, string>)[s] ?? s;
    }

    getStatutSeverity(s: StatutInformationPreoccupante): TagSeverity {
        return ({
            NOUVELLE: 'info',
            RATTACHEE: 'warn',
            AUTO_SAISINE_DECLENCHEE: 'success',
            CLASSEE_SANS_SUITE: 'secondary'
        } as Record<string, TagSeverity>)[s] ?? 'info';
    }
}
