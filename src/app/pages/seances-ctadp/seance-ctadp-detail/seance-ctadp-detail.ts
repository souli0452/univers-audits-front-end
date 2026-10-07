import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import {
    SeanceCtadpService,
    SeanceCtadpResponse,
    StatutSeanceCtadp,
    RecommandationCtadp
} from '../../../core/services/seance-ctadp.service';
import { DossierService } from '../../../core/services/dossier.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-seance-ctadp-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, DialogModule,
        TextareaModule, SelectModule, ToastModule, SkeletonModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div *ngIf="loading" class="flex flex-col gap-4">
    <p-skeleton height="4rem" />
    <p-skeleton height="12rem" />
</div>

<div *ngIf="!loading && seance" class="flex flex-col gap-6">

    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 p-6">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-2">
            <button class="text-surface-400 hover:text-surface-700 flex items-center gap-2 text-sm"
                routerLink="/app/seances-ctadp">
                <i class="pi pi-arrow-left"></i> Retour aux séances
            </button>
            <p-tag [value]="getStatutLabel(seance.statut)" [severity]="getStatutSeverity(seance.statut)"/>
        </div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
            Séance CTADP du {{ seance.dateSeance | date:'dd/MM/yyyy' }}
        </h1>
        <p *ngIf="seance.participants" class="text-sm text-surface-500 mt-1">
            <i class="pi pi-users mr-1"></i> {{ seance.participants }}
        </p>

        <div class="flex gap-2 mt-4" *ngIf="canManage()">
            <p-button *ngIf="seance.statut === 'PLANIFIEE'" label="Ajouter un dossier" icon="pi pi-plus"
                severity="secondary" outlined size="small" (onClick)="openAddDossierDialog()"/>
            <p-button *ngIf="seance.statut === 'PLANIFIEE'" label="Tenir la séance" icon="pi pi-check-circle"
                size="small" (onClick)="openTenirDialog()"/>
        </div>

        <div *ngIf="seance.procesVerbal" class="mt-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-700">
            <div class="text-xs font-bold uppercase tracking-wide text-surface-500 mb-2">Procès-verbal</div>
            <p class="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-line">{{ seance.procesVerbal }}</p>
        </div>
    </div>

    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 overflow-hidden">
        <div class="px-5 py-4 border-b border-surface-100 dark:border-surface-700">
            <h2 class="font-semibold text-surface-800 dark:text-surface-100">
                Dossiers examinés ({{ seance.dossiers.length }})
            </h2>
        </div>

        <div *ngIf="seance.dossiers.length === 0" class="text-center py-10 text-surface-400">
            <div class="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-folder-open text-xl text-surface-300"></i>
            </div>
            <p class="text-sm">Aucun dossier rattaché à cette séance</p>
        </div>

        <div *ngFor="let d of seance.dossiers"
            class="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-50
                   last:border-b-0 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-semibold text-primary-600 bg-primary-50
                                 px-2 py-1 rounded-md border border-primary-100">
                        {{ d.dossierNumber || '—' }}
                    </span>
                    <a [routerLink]="['/app/dossiers', d.dossierId]"
                        class="text-sm font-medium text-surface-800 dark:text-surface-100 hover:underline truncate">
                        {{ d.dossierObject || '—' }}
                    </a>
                </div>
                <div *ngIf="d.commentaire" class="text-xs text-surface-500 mt-1">{{ d.commentaire }}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                <p-tag *ngIf="d.recommandation" [value]="getRecommandationLabel(d.recommandation)"
                    [severity]="getRecommandationSeverity(d.recommandation)" styleClass="text-xs"/>
                <span *ngIf="!d.recommandation" class="text-xs text-surface-400 italic">Sans recommandation</span>
                <p-button *ngIf="canManage() && seance.statut === 'PLANIFIEE'"
                    icon="pi pi-pencil" severity="secondary" text size="small"
                    pTooltip="Enregistrer la recommandation" (onClick)="openRecommandationDialog(d)"/>
            </div>
        </div>
    </div>
</div>

<p-dialog [(visible)]="showAddDossierDialog" header="Ajouter un dossier à la séance"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <p class="text-xs text-surface-500">
            Seuls les dossiers en revue CTADP (statut "Revue CTADP") peuvent être ajoutés.
        </p>
        <p-select [(ngModel)]="selectedDossierId" [options]="availableDossierOptions"
            optionLabel="label" optionValue="value" placeholder="Sélectionner un dossier..."
            [filter]="true" filterBy="label" styleClass="w-full" appendTo="body"/>
        <p *ngIf="availableDossierOptions.length === 0" class="text-xs text-surface-400">
            Aucun dossier en revue CTADP disponible actuellement.
        </p>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showAddDossierDialog=false"/>
        <p-button label="Ajouter" icon="pi pi-check" [loading]="addingDossier"
            [disabled]="!selectedDossierId" (onClick)="addDossier()"/>
    </ng-template>
</p-dialog>

<p-dialog [(visible)]="showRecommandationDialog" header="Recommandation CTADP"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2" *ngIf="recommandationTarget">
        <div class="p-3 rounded-xl bg-surface-50 text-sm">
            <span class="font-mono text-xs font-semibold text-primary-600">{{ recommandationTarget.dossierNumber }}</span>
            — {{ recommandationTarget.dossierObject }}
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Recommandation <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="recommandationForm.recommandation" [options]="recommandationOptions"
                optionLabel="label" optionValue="value" placeholder="Sélectionner..."
                styleClass="w-full" appendTo="body"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Commentaire</label>
            <textarea pTextarea [(ngModel)]="recommandationForm.commentaire" rows="4"
                class="w-full resize-none" placeholder="Commentaire (optionnel)..."></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showRecommandationDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check" [loading]="savingRecommandation"
            (onClick)="saveRecommandation()"/>
    </ng-template>
</p-dialog>

<p-dialog [(visible)]="showTenirDialog" header="Tenir la séance"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            La séance passera au statut "Tenue" et ne pourra plus être modifiée.
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Procès-verbal</label>
            <textarea pTextarea [(ngModel)]="procesVerbalForm" rows="6"
                class="w-full resize-none" placeholder="Procès-verbal de la séance (optionnel)..."></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showTenirDialog=false"/>
        <p-button label="Tenir la séance" icon="pi pi-check-circle" [loading]="tenirLoading" (onClick)="tenirSeance()"/>
    </ng-template>
</p-dialog>
    `
})
export class SeanceCtadpDetail implements OnInit {

    private route              = inject(ActivatedRoute);
    private seanceCtadpService = inject(SeanceCtadpService);
    private dossierService     = inject(DossierService);
    private keycloakService    = inject(KeycloakService);
    private messageService     = inject(MessageService);

    seance:  SeanceCtadpResponse | null = null;
    loading = true;

    showAddDossierDialog     = false;
    addingDossier            = false;
    availableDossierOptions: { label: string; value: string }[] = [];
    selectedDossierId: string | null = null;

    showRecommandationDialog = false;
    savingRecommandation     = false;
    recommandationTarget: SeanceCtadpResponse['dossiers'][number] | null = null;
    recommandationForm: { recommandation: RecommandationCtadp | null; commentaire: string } =
        { recommandation: null, commentaire: '' };

    showTenirDialog = false;
    tenirLoading    = false;
    procesVerbalForm = '';

    readonly recommandationOptions = [
        { label: 'Validation investigation',            value: 'VALIDATION_INVESTIGATION' },
        { label: 'Classement sans suite',                value: 'CLASSEMENT' },
        { label: 'Transmission institution partenaire',  value: 'TRANSMISSION_INSTITUTION_PARTENAIRE' },
        { label: 'Orientation administrative',           value: 'ORIENTATION_ADMINISTRATIVE' }
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.load(id);
    }

    private load(id: string): void {
        this.loading = true;
        this.seanceCtadpService.findById(id).subscribe({
            next: s => { this.seance = s; this.loading = false; },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur', detail: 'Séance introuvable'
                });
            }
        });
    }

    canManage(): boolean {
        return this.keycloakService.hasAnyRole(['CGEA', 'CONSEILLER_JURIDIQUE', 'ADMIN_DDIC']);
    }

    openAddDossierDialog(): void {
        this.selectedDossierId = null;
        this.showAddDossierDialog = true;
        this.dossierService.findByStatus('EN_REVUE_CTADP', 0, 200).subscribe({
            next: page => {
                const already = new Set((this.seance?.dossiers || []).map(d => d.dossierId));
                this.availableDossierOptions = page.content
                    .filter(d => !already.has(d.id))
                    .map(d => ({ label: `${d.number || '—'} — ${d.object}`, value: d.id }));
            },
            error: () => { this.availableDossierOptions = []; }
        });
    }

    addDossier(): void {
        if (!this.seance || !this.selectedDossierId) return;
        this.addingDossier = true;
        this.seanceCtadpService.addDossier(this.seance.id, { dossierId: this.selectedDossierId }).subscribe({
            next: s => {
                this.seance = s;
                this.addingDossier = false;
                this.showAddDossierDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Dossier ajouté à la séance' });
            },
            error: err => {
                this.addingDossier = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || "Impossible d'ajouter le dossier"
                });
            }
        });
    }

    openRecommandationDialog(d: SeanceCtadpResponse['dossiers'][number]): void {
        this.recommandationTarget = d;
        this.recommandationForm = {
            recommandation: d.recommandation || null,
            commentaire: d.commentaire || ''
        };
        this.showRecommandationDialog = true;
    }

    saveRecommandation(): void {
        if (!this.seance || !this.recommandationTarget || !this.recommandationForm.recommandation) {
            this.messageService.add({
                severity: 'warn', summary: 'Champ obligatoire',
                detail: 'La recommandation est obligatoire.'
            });
            return;
        }
        this.savingRecommandation = true;
        this.seanceCtadpService.recordRecommandation(
            this.seance.id, this.recommandationTarget.dossierId,
            {
                recommandation: this.recommandationForm.recommandation,
                commentaire: this.recommandationForm.commentaire.trim() || undefined
            }
        ).subscribe({
            next: s => {
                this.seance = s;
                this.savingRecommandation = false;
                this.showRecommandationDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Recommandation enregistrée' });
            },
            error: err => {
                this.savingRecommandation = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Enregistrement impossible'
                });
            }
        });
    }

    openTenirDialog(): void {
        this.procesVerbalForm = '';
        this.showTenirDialog = true;
    }

    tenirSeance(): void {
        if (!this.seance) return;
        this.tenirLoading = true;
        this.seanceCtadpService.tenir(this.seance.id, {
            procesVerbal: this.procesVerbalForm.trim() || undefined
        }).subscribe({
            next: s => {
                this.seance = s;
                this.tenirLoading = false;
                this.showTenirDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Séance tenue' });
            },
            error: err => {
                this.tenirLoading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Action impossible'
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

    getRecommandationLabel(r: RecommandationCtadp): string {
        return {
            VALIDATION_INVESTIGATION: 'Validation investigation',
            CLASSEMENT: 'Classement',
            TRANSMISSION_INSTITUTION_PARTENAIRE: 'Transmission institution',
            ORIENTATION_ADMINISTRATIVE: 'Orientation administrative'
        }[r] || r;
    }

    getRecommandationSeverity(r: RecommandationCtadp): TagSeverity {
        return ({
            VALIDATION_INVESTIGATION: 'success',
            CLASSEMENT: 'secondary',
            TRANSMISSION_INSTITUTION_PARTENAIRE: 'info',
            ORIENTATION_ADMINISTRATIVE: 'warn'
        } as Record<string, TagSeverity>)[r] ?? 'info';
    }
}
