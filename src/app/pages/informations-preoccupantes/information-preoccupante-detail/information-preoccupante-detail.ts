import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import {
    InformationPreoccupanteService,
    InformationPreoccupanteResponse,
    AutoReferralSource,
    StatutInformationPreoccupante
} from '../../../core/services/information-preoccupante.service';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse } from '../../../core/models/dossier.model';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-information-preoccupante-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, DialogModule, TextareaModule, InputTextModule,
        ToastModule, SkeletonModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div *ngIf="loading" class="flex flex-col gap-4">
    <p-skeleton height="3rem" width="20rem"/>
    <p-skeleton height="10rem"/>
</div>

<div *ngIf="!loading && info" class="flex flex-col gap-6">

    <div class="flex items-center gap-3">
        <p-button icon="pi pi-arrow-left" severity="secondary" text (onClick)="back()"/>
        <div class="flex-1">
            <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ info.objet }}</h1>
                <p-tag [value]="getStatutLabel(info.statut)" [severity]="getStatutSeverity(info.statut)"/>
            </div>
            <p class="text-surface-400 text-sm mt-1">
                Reçue le {{ info.dateReception | date:'dd/MM/yyyy' }} — {{ getSourceLabel(info.source) }}
                <span *ngIf="info.sourceReference"> ({{ info.sourceReference }})</span>
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 flex flex-col gap-5">

            <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                        border border-surface-100 dark:border-surface-700">
                <h3 class="text-sm font-bold text-surface-700 dark:text-surface-200 mb-3 uppercase tracking-wide">
                    Description
                </h3>
                <p class="text-sm text-surface-700 whitespace-pre-line leading-relaxed">{{ info.description }}</p>
            </div>

            <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                        border border-surface-100 dark:border-surface-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <i class="pi pi-link text-blue-600 text-xs"></i>
                        </div>
                        Dossiers rattachés ({{ info.dossiersRattaches.length }})
                    </h3>
                    <p-button *ngIf="info.statut !== 'CLASSEE_SANS_SUITE'"
                        label="Rattacher un dossier" icon="pi pi-plus" size="small" outlined
                        (onClick)="openRattacherDialog()"/>
                </div>
                <p *ngIf="!info.dossiersRattaches.length" class="text-sm text-surface-400">
                    Aucun dossier rattaché pour l'instant.
                </p>
                <div class="flex flex-col gap-2">
                    <div *ngFor="let d of info.dossiersRattaches"
                        class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl flex items-center justify-between">
                        <div>
                            <div class="text-sm font-bold text-surface-800">{{ d.dossierNumber || '—' }}</div>
                            <div *ngIf="d.commentaire" class="text-xs text-surface-500 mt-0.5">{{ d.commentaire }}</div>
                            <div class="text-xs text-surface-400 mt-0.5">Rattaché le {{ d.linkedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                        </div>
                        <p-button icon="pi pi-external-link" severity="info" text size="small"
                            [routerLink]="['/app/dossiers', d.dossierId]"/>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-5">
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-4
                        border border-surface-100 dark:border-surface-700">
                <h3 class="text-sm font-bold text-surface-700 dark:text-surface-200 mb-3 uppercase tracking-wide">
                    Actions
                </h3>
                <div class="flex flex-col gap-2">
                    <p-button *ngIf="info.statut==='NOUVELLE' || info.statut==='RATTACHEE'"
                        label="Déclencher une auto-saisine" icon="pi pi-bolt" severity="warn"
                        [loading]="triggeringAutoSaisine" (onClick)="confirmAutoSaisine()" styleClass="w-full"/>
                    <p-button *ngIf="info.statut==='NOUVELLE' || info.statut==='RATTACHEE'"
                        label="Classer sans suite" icon="pi pi-times" severity="secondary" outlined
                        [loading]="classingSansSuite" (onClick)="executeClasserSansSuite()" styleClass="w-full"/>
                    <p *ngIf="info.statut==='AUTO_SAISINE_DECLENCHEE'" class="text-xs text-green-600">
                        Une auto-saisine a déjà été déclenchée pour cette information.
                    </p>
                    <p *ngIf="info.statut==='CLASSEE_SANS_SUITE'" class="text-xs text-surface-400">
                        Cette information a été classée sans suite.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ── Dialog rattacher dossier ────────────────────────────── -->
<p-dialog [(visible)]="showRattacherDialog" header="Rattacher un dossier"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div class="flex gap-2">
            <input pInputText [(ngModel)]="dossierSearchTerm" class="w-full"
                placeholder="Numéro ou objet du dossier..." (keydown.enter)="searchDossiers()"/>
            <p-button icon="pi pi-search" [loading]="searchingDossiers" (onClick)="searchDossiers()"/>
        </div>
        <div *ngIf="dossierResults.length" class="flex flex-col gap-2 max-h-64 overflow-y-auto">
            <div *ngFor="let d of dossierResults"
                class="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors"
                [class.border-primary-400]="selectedDossier?.id === d.id"
                [class.bg-primary-50]="selectedDossier?.id === d.id"
                [class.border-surface-100]="selectedDossier?.id !== d.id"
                (click)="selectedDossier = d">
                <div>
                    <div class="text-sm font-bold text-surface-800">{{ d.number || '—' }}</div>
                    <div class="text-xs text-surface-500 truncate">{{ d.object }}</div>
                </div>
                <i class="pi" [class.pi-check-circle]="selectedDossier?.id === d.id"
                    [class.text-primary-600]="selectedDossier?.id === d.id"></i>
            </div>
        </div>
        <p *ngIf="searchedOnce && !dossierResults.length" class="text-sm text-surface-400">
            Aucun dossier trouvé pour cette recherche.
        </p>
        <div *ngIf="selectedDossier">
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Commentaire
            </label>
            <textarea pTextarea [(ngModel)]="rattacherCommentaire" rows="3" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showRattacherDialog=false"/>
        <p-button label="Rattacher" icon="pi pi-link"
            [loading]="rattaching" [disabled]="!selectedDossier"
            (onClick)="executeRattacherDossier()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog confirmation auto-saisine ───────────────────────── -->
<p-dialog [(visible)]="showAutoSaisineDialog" header="Déclencher une auto-saisine"
    [modal]="true" [style]="{width:'480px'}" [draggable]="false">
    <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
        <i class="pi pi-exclamation-triangle text-amber-600 mt-0.5 flex-shrink-0"></i>
        <p class="text-sm text-amber-700 leading-relaxed">
            Cette action crée automatiquement un nouveau dossier de plainte (auto-saisine ASCE-LC)
            à partir de cette information préoccupante. Cette action est irréversible.
        </p>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showAutoSaisineDialog=false"/>
        <p-button label="Confirmer l'auto-saisine" icon="pi pi-bolt" severity="warn"
            [loading]="triggeringAutoSaisine" (onClick)="executeDeclencherAutoSaisine()"/>
    </ng-template>
</p-dialog>
    `
})
export class InformationPreoccupanteDetail implements OnInit {

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private informationPreoccupanteService = inject(InformationPreoccupanteService);
    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);

    info: InformationPreoccupanteResponse | null = null;
    loading = true;

    showRattacherDialog = false;
    dossierSearchTerm = '';
    searchingDossiers = false;
    searchedOnce = false;
    dossierResults: DossierResponse[] = [];
    selectedDossier: DossierResponse | null = null;
    rattacherCommentaire = '';
    rattaching = false;

    showAutoSaisineDialog = false;
    triggeringAutoSaisine = false;
    classingSansSuite = false;

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

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.load(id);
    }

    private load(id: string): void {
        this.loading = true;
        this.informationPreoccupanteService.findById(id).subscribe({
            next: i => { this.info = i; this.loading = false; },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Information introuvable' });
            }
        });
    }

    back(): void { this.router.navigate(['/app/informations-preoccupantes']); }

    openRattacherDialog(): void {
        this.dossierSearchTerm = '';
        this.dossierResults = [];
        this.selectedDossier = null;
        this.rattacherCommentaire = '';
        this.searchedOnce = false;
        this.showRattacherDialog = true;
    }

    searchDossiers(): void {
        const term = this.dossierSearchTerm.trim().toLowerCase();
        if (!term) return;
        this.searchingDossiers = true;
        this.dossierService.findAll(0, 200).subscribe({
            next: page => {
                this.dossierResults = page.content
                    .filter(d => (d.number ?? '').toLowerCase().includes(term)
                              || (d.object ?? '').toLowerCase().includes(term))
                    .slice(0, 10);
                this.searchingDossiers = false;
                this.searchedOnce = true;
            },
            error: () => { this.searchingDossiers = false; this.searchedOnce = true; }
        });
    }

    executeRattacherDossier(): void {
        if (!this.info || !this.selectedDossier) return;
        this.rattaching = true;
        this.informationPreoccupanteService
            .rattacherDossier(this.info.id, this.selectedDossier.id, { commentaire: this.rattacherCommentaire.trim() || undefined })
            .subscribe({
                next: i => {
                    this.info = i;
                    this.rattaching = false;
                    this.showRattacherDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Dossier rattaché' });
                },
                error: err => {
                    this.rattaching = false;
                    this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Rattachement impossible' });
                }
            });
    }

    confirmAutoSaisine(): void { this.showAutoSaisineDialog = true; }

    executeDeclencherAutoSaisine(): void {
        if (!this.info) return;
        this.triggeringAutoSaisine = true;
        this.informationPreoccupanteService.declencherAutoSaisine(this.info.id).subscribe({
            next: () => {
                this.triggeringAutoSaisine = false;
                this.showAutoSaisineDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Auto-saisine déclenchée', detail: 'Nouveau dossier créé' });
                if (this.info) this.load(this.info.id);
            },
            error: err => {
                this.triggeringAutoSaisine = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Auto-saisine impossible' });
            }
        });
    }

    executeClasserSansSuite(): void {
        if (!this.info) return;
        this.classingSansSuite = true;
        this.informationPreoccupanteService.classerSansSuite(this.info.id).subscribe({
            next: i => {
                this.info = i;
                this.classingSansSuite = false;
                this.messageService.add({ severity: 'info', summary: 'Classée sans suite' });
            },
            error: err => {
                this.classingSansSuite = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Classement impossible' });
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
