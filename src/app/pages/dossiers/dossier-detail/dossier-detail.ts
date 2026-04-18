import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierStatus } from '../../../core/models/dossier.model';
import { KeycloakService } from '../../../core/auth/keycloak.service';

interface WorkflowStep {
    label: string;
    status: DossierStatus;
    icon: string;
    color: string;
    date?: string;
    active: boolean;
    completed: boolean;
}

@Component({
    selector: 'app-dossier-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, TimelineModule,
        CardModule, DialogModule, TextareaModule,
        ToastModule, SkeletonModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast />
<p-confirmDialog />

<!-- Dialog transition -->
<p-dialog
    [(visible)]="showTransitionDialog"
    [header]="transitionDialogTitle"
    [modal]="true"
    [style]="{width: '480px'}"
    [draggable]="false">
    <div class="flex flex-col gap-3 py-2">
        <label class="text-sm font-medium">
            Motif / Observation
        </label>
        <textarea
            pTextarea
            [(ngModel)]="transitionReason"
            [placeholder]="transitionPlaceholder"
            rows="4"
            class="w-full">
        </textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button
            label="Annuler"
            severity="secondary"
            outlined
            (onClick)="showTransitionDialog = false" />
        <p-button
            [label]="transitionDialogTitle"
            [loading]="transitioning"
            (onClick)="executeTransition()" />
    </ng-template>
</p-dialog>

<div class="flex flex-col gap-4" *ngIf="!loading; else loadingSkeleton">

    <!-- En-tête -->
    <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
            <p-button
                icon="pi pi-arrow-left"
                severity="secondary"
                text
                routerLink="/dossiers" />
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-2xl font-bold">
                        {{ dossier?.number || 'Dossier en attente' }}
                    </h1>
                    <p-tag
                        *ngIf="dossier"
                        [value]="getStatusLabel(dossier.status)"
                        [severity]="getStatusSeverity(dossier.status)" />
                </div>
                <p class="text-surface-500 text-sm mt-1">
                    {{ dossier?.object }}
                </p>
            </div>
        </div>

        <!-- Actions workflow -->
        <div class="flex gap-2 flex-wrap justify-end" *ngIf="dossier">
            
            <p-button
                *ngIf="dossier.status === 'SOUMIS' && hasRole(['AGENT_BRPD'])"
                label="Enregistrer"
                icon="pi pi-check"
                severity="success"
                size="small"
                (onClick)="openRegister()" />

            <p-button
                *ngIf="dossier.status === 'RECU' && hasRole(['CONSEILLER_JURIDIQUE', 'CGEA'])"
                label="Demarrer Etude"
                icon="pi pi-play"
                severity="info"
                size="small"
                (onClick)="openStartStudy()" />

            <p-button
                *ngIf="dossier.status === 'EN_ETUDE_OPPORTUNITE' && hasRole(['CONSEILLER_JURIDIQUE'])"
                label="Demander Complement"
                icon="pi pi-question-circle"
                severity="warn"
                size="small"
                (onClick)="openRequestComplement()" />

            <p-button
                *ngIf="dossier.status === 'EN_ETUDE_OPPORTUNITE' && hasRole(['CONSEILLER_JURIDIQUE'])"
                label="Soumettre CTADP"
                icon="pi pi-send"
                size="small"
                (onClick)="openSubmitCtadp()" />
           <p-button
                *ngIf="dossier.status === 'EN_REVUE_CTADP' && hasRole(['CGE', 'CGEA'])"
                label="Declarer Recevable"
                icon="pi pi-check-circle"
                severity="success"
                size="small"
                (onClick)="openDeclareAdmissible()" />
                
            <p-button
                *ngIf="dossier.status === 'EN_REVUE_CTADP' && hasRole(['CGE', 'CGEA'])"
                label="Irrecevable"
                icon="pi pi-times-circle"
                severity="danger"
                size="small"
                (onClick)="openDeclareInadmissible()" />    
            <p-button
                *ngIf="dossier.status === 'DECISION_RENDUE' && hasRole(['CGE', 'CGEA'])"
                label="Cloturer"
                icon="pi pi-lock"
                severity="secondary"
                size="small"
                (onClick)="openClose()" />    
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Colonne principale -->
        <div class="lg:col-span-2 flex flex-col gap-4">

            <!-- Informations du dossier -->
            <div class="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700">
                <h3 class="font-semibold mb-4 flex items-center gap-2">
                    <i class="pi pi-file text-primary-600"></i>
                    Informations du Dossier
                </h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span class="text-surface-400 block mb-1">Type</span>
                        <span class="font-medium">
                            {{ getTypeLabel(dossier?.type || '') }}
                        </span>
                    </div>
                    <div>
                        <span class="text-surface-400 block mb-1">Canal</span>
                        <span class="font-medium">
                            {{ getModeLabel(dossier?.submissionMode || '') }}
                        </span>
                    </div>
                    <div *ngIf="dossier?.incidentLocation">
                        <span class="text-surface-400 block mb-1">Lieu des faits</span>
                        <span class="font-medium">{{ dossier?.incidentLocation }}</span>
                    </div>
                    <div *ngIf="dossier?.incidentPeriod">
                        <span class="text-surface-400 block mb-1">Période</span>
                        <span class="font-medium">{{ dossier?.incidentPeriod }}</span>
                    </div>
                    <div *ngIf="dossier?.estimatedLoss">
                        <span class="text-surface-400 block mb-1">Montant estimé</span>
                        <span class="font-medium text-red-600">
                            {{ dossier?.estimatedLoss | number }} FCFA
                        </span>
                    </div>
                    <div>
                        <span class="text-surface-400 block mb-1">Date de création</span>
                        <span class="font-medium">
                            {{ dossier?.createdAt | date:'dd/MM/yyyy HH:mm' }}
                        </span>
                    </div>
                    <div *ngIf="dossier?.receptionDate">
                        <span class="text-surface-400 block mb-1">Date de réception</span>
                        <span class="font-medium">
                            {{ dossier?.receptionDate | date:'dd/MM/yyyy' }}
                        </span>
                    </div>
                    <div *ngIf="dossier?.acknowledgmentDeadline">
                        <span class="text-surface-400 block mb-1">Délai accusé réception</span>
                        <span class="font-medium"
                              [class.text-red-600]="dossier?.acknowledgmentOverdue">
                            {{ dossier?.acknowledgmentDeadline | date:'dd/MM/yyyy' }}
                            <i *ngIf="dossier?.acknowledgmentOverdue"
                               class="pi pi-exclamation-triangle text-red-600 ml-1"></i>
                        </span>
                    </div>
                </div>

                <!-- Description -->
                <div class="mt-4 pt-4 border-t border-surface-100" *ngIf="dossier?.description">
                    <span class="text-surface-400 text-sm block mb-2">Description</span>
                    <p class="text-sm leading-relaxed">{{ dossier?.description }}</p>
                </div>
            </div>

            <!-- Informations du déclarant -->
            <div class="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700"
                 *ngIf="dossier?.declarant">
                <h3 class="font-semibold mb-4 flex items-center gap-2">
                    <i class="pi pi-user text-primary-600"></i>
                    Déclarant
                    <p-tag
                        *ngIf="dossier?.declarant?.anonymous"
                        value="Anonyme"
                        severity="warn"
                        styleClass="text-xs" />
                </h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span class="text-surface-400 block mb-1">Nom</span>
                        <span class="font-medium">
                            {{ dossier?.declarant?.displayName }}
                        </span>
                    </div>
                    <div *ngIf="dossier?.declarant?.email">
                        <span class="text-surface-400 block mb-1">Email</span>
                        <span class="font-medium">{{ dossier?.declarant?.email }}</span>
                    </div>
                    <div *ngIf="dossier?.declarant?.phoneNumber">
                        <span class="text-surface-400 block mb-1">Téléphone</span>
                        <span class="font-medium">{{ dossier?.declarant?.phoneNumber }}</span>
                    </div>
                    <div *ngIf="dossier?.declarant?.commune">
                        <span class="text-surface-400 block mb-1">Commune</span>
                        <span class="font-medium">{{ dossier?.declarant?.commune }}</span>
                    </div>
                </div>
            </div>

        </div>

        <!-- Colonne droite — Timeline workflow -->
        <div class="flex flex-col gap-4">

            <!-- Code d'accès -->
            <div class="bg-primary-50 dark:bg-primary-900 rounded-xl p-4 border border-primary-200">
                <div class="text-xs text-primary-600 font-medium mb-1">
                    Code de suivi citoyen
                </div>
                <div class="font-mono text-2xl font-bold text-primary-700 tracking-widest">
                    {{ dossier?.accessCode }}
                </div>
                <div class="text-xs text-primary-500 mt-1">
                    À remettre au déclarant (formulaire B4)
                </div>
            </div>

            <!-- Timeline Manuel B -->
            <div class="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700">
                <h3 class="font-semibold mb-4 flex items-center gap-2">
                    <i class="pi pi-list text-primary-600"></i>
                    Workflow Manuel B
                </h3>
                <p-timeline
                    [value]="workflowSteps"
                    styleClass="workflow-timeline">
                    <ng-template pTemplate="marker" let-step>
                        <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                             [class]="step.completed
                                ? 'bg-green-500 border-green-500'
                                : step.active
                                    ? 'bg-primary-500 border-primary-500 animate-pulse'
                                    : 'bg-surface-100 border-surface-300 dark:bg-surface-700'">
                            <i [class]="step.icon + ' text-xs '"
                               [class.text-white]="step.completed || step.active"
                               [class.text-surface-400]="!step.completed && !step.active"></i>
                        </div>
                    </ng-template>
                    <ng-template pTemplate="content" let-step>
                        <div class="pb-3">
                            <div class="text-sm font-medium"
                                 [class.text-green-600]="step.completed"
                                 [class.text-primary-600]="step.active"
                                 [class.text-surface-400]="!step.completed && !step.active">
                                {{ step.label }}
                            </div>
                            <div *ngIf="step.date" class="text-xs text-surface-400 mt-0.5">
                                {{ step.date | date:'dd/MM/yyyy' }}
                            </div>
                        </div>
                    </ng-template>
                </p-timeline>
            </div>

            <!-- Agent en charge -->
            <div class="bg-white dark:bg-surface-800 rounded-xl p-4 border border-surface-200 dark:border-surface-700"
                 *ngIf="dossier?.agentInCharge">
                <h3 class="font-semibold mb-3 text-sm flex items-center gap-2">
                    <i class="pi pi-user-edit text-primary-600"></i>
                    Agent en charge
                </h3>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-user text-primary-600"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium">
                            {{ dossier?.agentInCharge?.firstName }}
                            {{ dossier?.agentInCharge?.lastName }}
                        </div>
                        <div class="text-xs text-surface-400">
                            {{ dossier?.agentInCharge?.matricule }}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<!-- Skeleton chargement -->
<ng-template #loadingSkeleton>
    <div class="flex flex-col gap-4">
        <p-skeleton height="3rem" />
        <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 flex flex-col gap-3">
                <p-skeleton height="12rem" />
                <p-skeleton height="8rem" />
            </div>
            <div class="flex flex-col gap-3">
                <p-skeleton height="5rem" />
                <p-skeleton height="15rem" />
            </div>
        </div>
    </div>
</ng-template>
    `
})
export class DossierDetail implements OnInit {

    private route = inject(ActivatedRoute);
    private dossierService = inject(DossierService);
    private keycloakService = inject(KeycloakService);
    private messageService = inject(MessageService);

    dossier: DossierResponse | null = null;
    loading = true;
    transitioning = false;

    showTransitionDialog = false;
    transitionDialogTitle = '';
    transitionPlaceholder = '';
    transitionReason = '';
    currentTransitionType = '';

    workflowSteps: WorkflowStep[] = [];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.loadDossier(id);
    }

    private loadDossier(id: string): void {
        this.loading = true;
        this.dossierService.findById(id).subscribe({
            next: dossier => {
                this.dossier = dossier;
                this.buildWorkflowSteps(dossier);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Dossier introuvable'
                });
            }
        });
    }

    private buildWorkflowSteps(dossier: DossierResponse): void {
        const order: DossierStatus[] = [
            'SOUMIS', 'RECU', 'EN_ETUDE_OPPORTUNITE',
            'EN_REVUE_CTADP', 'RECEVABLE',
            'EN_INVESTIGATION', 'RAPPORT_PRODUIT',
            'DECISION_RENDUE', 'CLOS'
        ];

        const labels: Record<string, string> = {
            SOUMIS: 'Soumis',
            RECU: 'Reçu — B4 remis',
            EN_ETUDE_OPPORTUNITE: 'Étude opportunité',
            EN_REVUE_CTADP: 'Revue CTADP',
            RECEVABLE: 'Déclaré recevable',
            EN_INVESTIGATION: 'En investigation',
            RAPPORT_PRODUIT: 'Rapport produit',
            DECISION_RENDUE: 'Décision rendue',
            CLOS: 'Dossier clôturé'
        };

        const icons: Record<string, string> = {
            SOUMIS: 'pi pi-upload',
            RECU: 'pi pi-inbox',
            EN_ETUDE_OPPORTUNITE: 'pi pi-search',
            EN_REVUE_CTADP: 'pi pi-users',
            RECEVABLE: 'pi pi-check',
            EN_INVESTIGATION: 'pi pi-eye',
            RAPPORT_PRODUIT: 'pi pi-file',
            DECISION_RENDUE: 'pi pi-gavel',
            CLOS: 'pi pi-lock'
        };

        const currentIndex = order.indexOf(dossier.status);

        this.workflowSteps = order.map((status, index) => ({
            label: labels[status] || status,
            status,
            icon: icons[status] || 'pi pi-circle',
            color: index < currentIndex ? '#22c55e'
                 : index === currentIndex ? '#3b82f6'
                 : '#94a3b8',
            active: index === currentIndex,
            completed: index < currentIndex,
            date: index === 0 ? dossier.createdAt
                : index === 1 ? dossier.receptionDate
                : undefined
        }));
    }

    openTransition(
        type: string,
        title: string,
        placeholder: string
    ): void {
        this.currentTransitionType = type;
        this.transitionDialogTitle = title;
        this.transitionPlaceholder = placeholder;
        this.transitionReason = '';
        this.showTransitionDialog = true;
    }

              openRegister(): void {
                this.openTransition('register', 'Enregistrer le dossier', 'Motif...');
            }

            openStartStudy(): void {
                this.openTransition('start-study', 'Demarrer etude opportunite', 'Observations...');
            }

            openRequestComplement(): void {
                this.openTransition('request-complement', 'Demander un complement', 'Informations manquantes...');
            }

            openSubmitCtadp(): void {
                this.openTransition('submit-ctadp', 'Soumettre au CTADP', 'Recommandation...');
            }

            openDeclareAdmissible(): void {
                this.openTransition('declare-admissible', 'Declarer recevable', 'Motif de recevabilite...');
            }

            openDeclareInadmissible(): void {
                this.openTransition('declare-inadmissible', 'Declarer irrecevable', 'Motif...');
            }

            openClose(): void {
                this.openTransition('close', 'Cloturer le dossier', 'Motif de cloture...');
            }
    executeTransition(): void {
        if (!this.dossier) return;

        this.transitioning = true;
        const request = {
            version: this.dossier.version,
            reason: this.transitionReason
        };

        let obs$;
        switch (this.currentTransitionType) {
            case 'register':
                obs$ = this.dossierService
                    .registerReception(this.dossier.id, request);
                break;
            case 'start-study':
                obs$ = this.dossierService
                    .startOpportunityStudy(this.dossier.id, request);
                break;
            case 'request-complement':
                obs$ = this.dossierService
                    .requestComplement(this.dossier.id, request);
                break;
            case 'submit-ctadp':
                obs$ = this.dossierService
                    .submitToCtadp(this.dossier.id, request);
                break;
            case 'declare-admissible':
                obs$ = this.dossierService
                    .declareAdmissible(this.dossier.id, request);
                break;
            case 'declare-inadmissible':
                obs$ = this.dossierService
                    .declareInadmissible(this.dossier.id, request);
                break;
            case 'close':
                obs$ = this.dossierService
                    .close(this.dossier.id, request);
                break;
            default:
                this.transitioning = false;
                return;
        }

        obs$.subscribe({
            next: updated => {
                this.dossier = updated;
                this.buildWorkflowSteps(updated);
                this.transitioning = false;
                this.showTransitionDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: `Statut mis à jour : ${this.getStatusLabel(updated.status)}`
                });
            },
            error: err => {
                this.transitioning = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Transition échouée'
                });
            }
        });
    }

    hasRole(roles: string[]): boolean {
        return this.keycloakService.hasAnyRole(roles);
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'En étude',
            EN_ATTENTE_COMPLEMENT: 'Complément',
            EN_REVUE_CTADP: 'CTADP',
            RECEVABLE: 'Recevable',
            IRRECEVABLE: 'Irrecevable',
            TRANSFERE: 'Transféré',
            EN_INVESTIGATION: 'Investigation',
            RAPPORT_PRODUIT: 'Rapport',
            DECISION_RENDUE: 'Décision',
            CLOS: 'Clôturé', CLASSE: 'Classé'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): any {
        const map: Record<string, string> = {
            SOUMIS: 'info', RECU: 'info',
            EN_ETUDE_OPPORTUNITE: 'warn',
            EN_ATTENTE_COMPLEMENT: 'warn',
            EN_REVUE_CTADP: 'warn',
            RECEVABLE: 'success',
            IRRECEVABLE: 'danger',
            TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn',
            RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success',
            CLOS: 'success', CLASSE: 'secondary'
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
            IN_PERSON: 'Guichet BRPD',
            WEB_FORM: 'Formulaire Web',
            EMAIL: 'Email', SMS: 'SMS',
            PHONE: 'Téléphone',
            GREEN_NUMBER: 'Numéro Vert',
            SOCIAL_MEDIA: 'Réseaux Sociaux',
            AUDIO_COUNTER: 'Comptoir Audio',
            PAPER_FORM: 'Formulaire Papier',
            POSTAL_MAIL: 'Courrier Postal',
            FAX: 'Fax'
        };
        return labels[mode] || mode;
    }
}