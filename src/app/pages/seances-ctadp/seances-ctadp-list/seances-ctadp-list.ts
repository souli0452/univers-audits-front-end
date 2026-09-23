import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import {
    SeanceCtadpService,
    SeanceCtadpResponse,
    StatutSeanceCtadp
} from '../../../core/services/seance-ctadp.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-seances-ctadp-list',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        TableModule, ButtonModule, TagModule, DialogModule,
        TextareaModule, DatePickerModule, ToastModule, ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Séances CTADP</h1>
            <p class="text-surface-400 text-sm mt-1">
                {{ seances.length }} séance(s) — Comité de Traitement et d'Analyse des Dossiers de Plaintes
            </p>
        </div>
        <p-button label="Nouvelle séance" icon="pi pi-plus" (onClick)="openCreateDialog()"/>
    </div>

    <div *ngIf="loading" class="flex justify-center py-12">
        <p-progressSpinner strokeWidth="4" />
    </div>

    <div *ngIf="!loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">
        <p-table [value]="seances" dataKey="id" styleClass="p-datatable-sm" [rowHover]="true">
            <ng-template pTemplate="header">
                <tr>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-36">Date</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">Statut</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4">Participants</th>
                    <th class="text-xs text-surface-400 font-semibold uppercase tracking-wide py-3 px-4 w-32">Dossiers</th>
                    <th class="w-16"></th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-s>
                <tr class="border-b border-surface-50 cursor-pointer transition-colors"
                    [routerLink]="['/app/seances-ctadp', s.id]">
                    <td class="px-4 py-3">
                        <span class="text-sm font-medium">{{ s.dateSeance | date:'dd/MM/yyyy' }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <p-tag [value]="getStatutLabel(s.statut)" [severity]="getStatutSeverity(s.statut)" styleClass="text-xs" />
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-sm text-surface-600 truncate">{{ s.participants || '—' }}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="text-xs font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                            {{ s.dossiers.length }}
                        </span>
                    </td>
                    <td class="px-4 py-3" (click)="$event.stopPropagation()">
                        <p-button icon="pi pi-eye" severity="info" text size="small"
                            [routerLink]="['/app/seances-ctadp', s.id]"/>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="5">
                        <div class="flex flex-col items-center justify-center py-16">
                            <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                                <i class="pi pi-users text-2xl text-surface-300"></i>
                            </div>
                            <p class="font-medium text-surface-500">Aucune séance CTADP enregistrée</p>
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>
</div>

<p-dialog [(visible)]="showCreateDialog" header="Nouvelle séance CTADP"
    [modal]="true" [style]="{width:'480px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Date de la séance <span class="text-red-500">*</span>
            </label>
            <p-datepicker [(ngModel)]="createForm.date" dateFormat="dd/mm/yy"
                showIcon styleClass="w-full" appendTo="body"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Participants</label>
            <textarea pTextarea [(ngModel)]="createForm.participants" rows="3"
                class="w-full resize-none" placeholder="Liste des participants (optionnel)..."></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showCreateDialog=false"/>
        <p-button label="Créer" icon="pi pi-check" [loading]="creating" (onClick)="createSeance()"/>
    </ng-template>
</p-dialog>
    `
})
export class SeancesCtadpList implements OnInit {

    private seanceCtadpService = inject(SeanceCtadpService);
    private messageService     = inject(MessageService);
    private router              = inject(Router);

    seances: SeanceCtadpResponse[] = [];
    loading = true;

    showCreateDialog = false;
    creating         = false;
    createForm: { date: Date | null; participants: string } = { date: new Date(), participants: '' };

    ngOnInit(): void { this.loadAll(); }

    private loadAll(): void {
        this.loading = true;
        this.seanceCtadpService.findAll(0, 200).subscribe({
            next: page => { this.seances = page.content; this.loading = false; },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les séances CTADP'
                });
            }
        });
    }

    openCreateDialog(): void {
        this.createForm = { date: new Date(), participants: '' };
        this.showCreateDialog = true;
    }

    createSeance(): void {
        if (!this.createForm.date) {
            this.messageService.add({
                severity: 'warn', summary: 'Champ obligatoire',
                detail: 'La date de la séance est obligatoire.'
            });
            return;
        }
        this.creating = true;
        this.seanceCtadpService.create({
            dateSeance: this.createForm.date.toISOString(),
            participants: this.createForm.participants.trim() || undefined
        }).subscribe({
            next: s => {
                this.creating = false;
                this.showCreateDialog = false;
                this.router.navigate(['/app/seances-ctadp', s.id]);
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

    getStatutLabel(s: StatutSeanceCtadp): string {
        return { PLANIFIEE: 'Planifiée', TENUE: 'Tenue', ANNULEE: 'Annulée' }[s] || s;
    }

    getStatutSeverity(s: StatutSeanceCtadp): TagSeverity {
        return ({ PLANIFIEE: 'warn', TENUE: 'success', ANNULEE: 'danger' } as Record<string, TagSeverity>)[s] ?? 'info';
    }
}
