import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierStatus, isVersionConflict } from '../../../core/models/dossier.model';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { AttachmentService, AttachmentResponse } from '../../../core/services/attachment.service';
import {
    TargetedPartyService,
    TargetedPartyResponse,
    TargetedPartyRequest
} from '../../../core/services/targeted-party.service';
import {
    WitnessService,
    WitnessResponse,
    WitnessRequest
} from '../../../core/services/witness.service';
import {
    ObservationService,
    ObservationResponse,
    ObservationRequest
} from '../../../core/services/observation.service';
import { InvestigationService } from '../../../core/services/investigation.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as mammoth from 'mammoth';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

interface WorkflowStep {
    label: string; status: DossierStatus; icon: string;
    date?: string; active: boolean; completed: boolean;
}

@Component({
    selector: 'app-dossier-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, DialogModule,
        TextareaModule, ToastModule, SkeletonModule,
        ConfirmDialogModule, TooltipModule, SelectModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast />
<p-confirmDialog />

<!-- ── Dialog transition ──────────────────────────────────── -->
<p-dialog [(visible)]="showTransitionDialog" [header]="transitionDialogTitle"
    [modal]="true" [style]="{width:'500px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
            <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
            <p class="text-sm text-blue-700">{{ transitionPlaceholder }}</p>
        </div>
        <textarea pTextarea [(ngModel)]="transitionReason"
            placeholder="Motif / Observation (optionnel)"
            rows="4" class="w-full resize-none"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showTransitionDialog=false"/>
        <p-button [label]="transitionDialogTitle"
            [loading]="transitioning" (onClick)="executeTransition()"/>
    </ng-template>
</p-dialog>


<p-dialog [(visible)]="showVersionConflictDialog"
    header="Conflit de version détecté"
    [modal]="true" [style]="{width:'480px'}" [draggable]="false"
    [closable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300
                    rounded-xl">
            <i class="pi pi-exclamation-triangle text-amber-600 text-xl
                       flex-shrink-0 mt-0.5"></i>
            <div>
                <div class="font-bold text-amber-800 mb-1">
                    Ce dossier a été modifié par un autre agent
                </div>
                <p class="text-sm text-amber-700 leading-relaxed">
                    Votre version locale (v{{ staleVersion }}) est différente
                    de la version en base. Le dossier a été rechargé
                    automatiquement. Vous pouvez maintenant réessayer.
                </p>
            </div>
        </div>
        <div *ngIf="conflictRefreshing"
            class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200
                   rounded-xl">
            <i class="pi pi-spin pi-spinner text-blue-600"></i>
            <span class="text-sm text-blue-700">Rechargement du dossier...</span>
        </div>
        <div *ngIf="!conflictRefreshing"
            class="flex items-center gap-2 p-3 bg-green-50 border border-green-200
                   rounded-xl">
            <i class="pi pi-check-circle text-green-600"></i>
            <span class="text-sm text-green-700 font-medium">
                Dossier synchronisé — version actuelle : v{{ dossier?.version }}
            </span>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Fermer et réessayer"
            icon="pi pi-refresh"
            severity="warn"
            [disabled]="conflictRefreshing"
            (onClick)="closeVersionConflictDialog()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog Partie visée ────────────────────────────────── -->
<p-dialog [(visible)]="showPartyDialog"
    [header]="editingParty ? 'Modifier la partie' : 'Ajouter une partie visée'"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-3 py-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Type de partie <span class="text-red-500 font-bold">*</span>
                </label>
                <p-select [(ngModel)]="partyForm.partyType"
                    [options]="partyTypeOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Sélectionner..." styleClass="w-full" appendTo="body" />
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Rôle allégué
                </label>
                <p-select [(ngModel)]="partyForm.allegedRole"
                    [options]="allegedRoleOptions"
                    optionLabel="label" optionValue="value"
                    placeholder="Sélectionner..." styleClass="w-full" appendTo="body" />
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Prénom <span class="text-red-500 font-bold">*</span>
                </label>
                <input pInputText [(ngModel)]="partyForm.firstName"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="Prénom" />
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Nom <span class="text-red-500 font-bold">*</span>
                </label>
                <input pInputText [(ngModel)]="partyForm.name"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="Nom" />
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Poste / Fonction
                </label>
                <input pInputText [(ngModel)]="partyForm.position"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="Ex: Directeur Général" />
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Institution
                </label>
                <input pInputText [(ngModel)]="partyForm.institution"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="Ex: Ministère des Finances" />
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Téléphone
                </label>
                <input pInputText [(ngModel)]="partyForm.phoneNumber"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="+226 XX XX XX XX" />
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Email
                </label>
                <input pInputText [(ngModel)]="partyForm.email"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="email@exemple.bf" />
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Relation avec le déclarant
            </label>
            <input pInputText [(ngModel)]="partyForm.relationWithDeclarant"
                class="w-full border border-surface-300 rounded-lg px-3 py-2"
                placeholder="Ex: Supérieur hiérarchique" />
        </div>
        <!-- Légende champs obligatoires -->
        <p class="text-xs text-surface-400 mt-1">
            <span class="text-red-500 font-bold">*</span> Champs obligatoires
        </p>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPartyDialog=false"/>
        <p-button [label]="editingParty ? 'Modifier' : 'Ajouter'"
            icon="pi pi-check" [loading]="savingParty" (onClick)="saveParty()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog Témoin ──────────────────────────────────────── -->
<p-dialog [(visible)]="showWitnessDialog"
    [header]="editingWitness ? 'Modifier le témoin' : 'Ajouter un témoin'"
    [modal]="true" [style]="{width:'540px'}" [draggable]="false">
    <div class="flex flex-col gap-3 py-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Prénom <span class="text-red-500 font-bold">*</span>
                </label>
                <input pInputText [(ngModel)]="witnessForm.firstName"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="Prénom" />
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Nom <span class="text-red-500 font-bold">*</span>
                </label>
                <input pInputText [(ngModel)]="witnessForm.lastName"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="Nom" />
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Profession
                </label>
                <input pInputText [(ngModel)]="witnessForm.profession"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="Profession" />
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Téléphone
                </label>
                <input pInputText [(ngModel)]="witnessForm.phoneNumber"
                    class="w-full border border-surface-300 rounded-lg px-3 py-2"
                    placeholder="+226 XX XX XX XX" />
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Nature du témoignage
            </label>
            <textarea pTextarea [(ngModel)]="witnessForm.testimonyNature"
                rows="2" class="w-full resize-none"
                placeholder="Décrivez la nature du témoignage..."></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Relation avec les parties
            </label>
            <input pInputText [(ngModel)]="witnessForm.relationWithParties"
                class="w-full border border-surface-300 rounded-lg px-3 py-2"
                placeholder="Ex: Collègue de travail" />
        </div>
        <div class="flex items-center gap-6 pt-1">
            <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" [(ngModel)]="witnessForm.anonymous" />
                Anonyme
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" [(ngModel)]="witnessForm.consentToContact" />
                Consent à être recontacté
            </label>
        </div>
        <!-- Légende champs obligatoires -->
        <p class="text-xs text-surface-400 mt-1">
            <span class="text-red-500 font-bold">*</span> Champs obligatoires
        </p>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showWitnessDialog=false"/>
        <p-button [label]="editingWitness ? 'Modifier' : 'Ajouter'"
            icon="pi pi-check" [loading]="savingWitness" (onClick)="saveWitness()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog Observation ─────────────────────────────────── -->
<p-dialog [(visible)]="showObsDialog" header="Ajouter une observation"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-3 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Type <span class="text-red-500 font-bold">*</span>
            </label>
            <p-select [(ngModel)]="obsForm.type" [options]="obsTypeOptions"
                optionLabel="label" optionValue="value"
                placeholder="Sélectionner..." styleClass="w-full" appendTo="body"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Contenu <span class="text-red-500 font-bold">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="obsForm.content" rows="5"
                class="w-full resize-none"
                placeholder="Saisissez votre observation..."></textarea>
        </div>
        <label *ngIf="hasRole(['CGE','CGEA','CONSEILLER_JURIDIQUE'])"
            class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" [(ngModel)]="obsForm.confidential"/>
            <span class="font-medium">Confidentiel</span>
            <span class="text-xs text-surface-400">(CGE, CGEA et juridique uniquement)</span>
        </label>
        <!-- Légende champs obligatoires -->
        <p class="text-xs text-surface-400 mt-1">
            <span class="text-red-500 font-bold">*</span> Champs obligatoires
        </p>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showObsDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="savingObs" (onClick)="saveObservation()"/>
    </ng-template>
</p-dialog>

<!-- ══════════════════════════════════════════════════════════
     PAGE
     ══════════════════════════════════════════════════════════ -->
<div *ngIf="!loading; else sk" class="flex flex-col gap-4">

    <!-- En-tête -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100
                dark:border-surface-700 px-5 py-4">
        <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex items-start gap-3">
                <p-button icon="pi pi-arrow-left" severity="secondary"
                    text routerLink="/app/dossiers"/>
                <div>
                    <div class="flex items-center gap-3 flex-wrap">
                        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            {{ dossier?.number || 'En attente de numéro' }}
                        </h1>
                        <p-tag *ngIf="dossier"
                            [value]="getStatusLabel(dossier.status)"
                            [severity]="getStatusSeverity(dossier.status)"/>
                        <span *ngIf="dossier"
                            class="inline-flex items-center gap-1 px-2 py-0.5
                                   bg-surface-100 dark:bg-surface-700
                                   text-surface-400 text-xs font-mono rounded-full
                                   border border-surface-200 dark:border-surface-600"
                            pTooltip="Version du dossier (optimistic locking)"
                            tooltipPosition="bottom">
                            <i class="pi pi-code" style="font-size:9px;"></i>
                            v{{ dossier.version }}
                        </span>
                        <span *ngIf="justRefreshedAfterConflict"
                            class="inline-flex items-center gap-1 px-2 py-0.5
                                   bg-green-100 text-green-700 text-xs font-medium
                                   rounded-full border border-green-200">
                            <i class="pi pi-check-circle" style="font-size:9px;"></i>
                            Synchronisé
                        </span>
                    </div>
                    <p class="text-surface-400 text-sm mt-1">{{ dossier?.object }}</p>
                </div>
            </div>
            <div class="flex gap-2 flex-wrap" *ngIf="dossier">
                <p-button *ngIf="dossier.status==='SOUMIS' && hasRole(['AGENT_BRPD'])"
                    label="Enregistrer" icon="pi pi-check" severity="success" size="small"
                    (onClick)="openRegister()"/>
                <p-button *ngIf="dossier.status==='RECU' && hasRole(['CONSEILLER_JURIDIQUE','CGEA'])"
                    label="Démarrer étude" icon="pi pi-play" severity="info" size="small"
                    (onClick)="openStartStudy()"/>
                <p-button *ngIf="dossier.status==='EN_ETUDE_OPPORTUNITE'
                                 && hasRole(['CONSEILLER_JURIDIQUE'])"
                    label="Demander complément" icon="pi pi-question-circle"
                    severity="warn" size="small" (onClick)="openRequestComplement()"/>
                <p-button *ngIf="dossier.status==='EN_ETUDE_OPPORTUNITE'
                                 && hasRole(['CONSEILLER_JURIDIQUE'])"
                    label="Soumettre CTADP" icon="pi pi-send" size="small"
                    (onClick)="openSubmitCtadp()"/>
                <p-button *ngIf="dossier.status==='EN_REVUE_CTADP' && hasRole(['CGE','CGEA'])"
                    label="Recevable" icon="pi pi-check-circle" severity="success" size="small"
                    (onClick)="openDeclareAdmissible()"/>
                <p-button *ngIf="dossier.status==='EN_REVUE_CTADP' && hasRole(['CGE','CGEA'])"
                    label="Irrecevable" icon="pi pi-times-circle" severity="danger" size="small"
                    (onClick)="openDeclareInadmissible()"/>
                <p-button *ngIf="dossier.status==='DECISION_RENDUE' && hasRole(['CGE','CGEA'])"
                    label="Clôturer" icon="pi pi-lock" severity="secondary" size="small"
                    (onClick)="openClose()"/>
                <p-button label="PDF" icon="pi pi-file-pdf"
                    severity="secondary" outlined size="small"
                    pTooltip="Exporter en PDF" (onClick)="exportPdf()"/>
            </div>
        </div>
    </div>

    <!-- Grid principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- ── Colonne principale (2/3) ──────────────────── -->
        <div class="lg:col-span-2 flex flex-col gap-4">

            <!-- Infos générales + déclarant -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl border
                        border-surface-100 dark:border-surface-700 overflow-hidden">
                <div class="px-5 py-3 border-b border-surface-100 dark:border-surface-700
                            flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                        <i class="pi pi-file text-primary-600 text-xs"></i>
                    </div>
                    <h3 class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                        Informations générales
                    </h3>
                </div>
                <div class="p-5">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Type</div>
                            <div class="font-semibold text-sm">{{ getTypeLabel(dossier?.type||'') }}</div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Canal</div>
                            <div class="font-semibold text-sm">{{ getModeLabel(dossier?.submissionMode||'') }}</div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Créé le</div>
                            <div class="font-semibold text-sm">{{ dossier?.createdAt | date:'dd/MM/yyyy' }}</div>
                        </div>
                        <div *ngIf="dossier?.receptionDate"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Reçu le</div>
                            <div class="font-semibold text-sm">{{ dossier?.receptionDate | date:'dd/MM/yyyy' }}</div>
                        </div>
                        <div *ngIf="dossier?.eligibilityDecisionDate"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Décision</div>
                            <div class="font-semibold text-sm">{{ dossier?.eligibilityDecisionDate | date:'dd/MM/yyyy' }}</div>
                        </div>
                        <div *ngIf="dossier?.estimatedLoss"
                            class="p-3 bg-red-50 dark:bg-red-950 rounded-xl border border-red-100">
                            <div class="text-xs text-red-400 uppercase tracking-wide mb-1">Montant estimé</div>
                            <div class="font-bold text-sm text-red-600">{{ dossier?.estimatedLoss | number }} FCFA</div>
                        </div>
                    </div>
                    <div *ngIf="dossier?.description"
                        class="mb-4 text-sm text-surface-600 dark:text-surface-300
                               leading-relaxed bg-surface-50 dark:bg-surface-700
                               rounded-xl p-3 border border-surface-100 dark:border-surface-600">
                        {{ dossier?.description }}
                    </div>
                    <!-- Déclarant -->
                    <div *ngIf="dossier?.declarant"
                        class="flex items-center gap-3 p-3 rounded-xl border
                               border-surface-100 dark:border-surface-600
                               bg-surface-50 dark:bg-surface-700">
                        <div class="w-9 h-9 rounded-full bg-green-100 flex items-center
                                    justify-center font-bold text-green-700 text-sm flex-shrink-0">
                            {{ getInitials(dossier?.declarant?.displayName || '') }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-semibold text-surface-900
                                        dark:text-surface-0 flex items-center gap-2">
                                {{ dossier?.declarant?.displayName }}
                                <span *ngIf="dossier?.declarant?.anonymous"
                                    class="text-xs bg-amber-100 text-amber-700
                                           px-2 py-0.5 rounded-full">Anonyme</span>
                            </div>
                            <div class="text-xs text-surface-400 mt-0.5
                                        flex items-center gap-3 flex-wrap">
                                <span *ngIf="dossier?.declarant?.phoneNumber">
                                    <i class="pi pi-phone mr-1 text-xs"></i>
                                    {{ dossier?.declarant?.phoneNumber }}
                                </span>
                                <span *ngIf="dossier?.declarant?.email">
                                    <i class="pi pi-envelope mr-1 text-xs"></i>
                                    {{ dossier?.declarant?.email }}
                                </span>
                                <span *ngIf="dossier?.declarant?.commune">
                                    <i class="pi pi-map-marker mr-1 text-xs"></i>
                                    {{ dossier?.declarant?.commune }}
                                </span>
                            </div>
                        </div>
                        <span class="text-xs bg-green-50 text-green-700 px-2 py-1
                                     rounded-lg font-medium flex-shrink-0">
                            Déclarant
                        </span>
                    </div>
                </div>
            </div>

            <!-- ── Panel onglets ───────────────────────────── -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl border
                        border-surface-100 dark:border-surface-700 overflow-hidden">
                <div class="flex border-b border-surface-100 dark:border-surface-700
                            overflow-x-auto">
                    <button *ngFor="let tab of tabs" (click)="activeTab = tab.key"
                        class="flex items-center gap-2 px-5 py-3 text-sm font-medium
                               whitespace-nowrap transition-all border-b-2 -mb-px"
                        [class.border-primary-500]="activeTab === tab.key"
                        [class.text-primary-600]="activeTab === tab.key"
                        [class.border-transparent]="activeTab !== tab.key"
                        [class.text-surface-400]="activeTab !== tab.key">
                        <i [class]="tab.icon + ' text-xs'"></i>
                        {{ tab.label }}
                        <span *ngIf="tab.count() > 0"
                            class="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            [class.bg-primary-100]="activeTab === tab.key"
                            [class.text-primary-700]="activeTab === tab.key"
                            [class.bg-surface-100]="activeTab !== tab.key"
                            [class.text-surface-500]="activeTab !== tab.key">
                            {{ tab.count() }}
                        </span>
                    </button>
                </div>

                <!-- ONGLET Parties visées -->
                <div *ngIf="activeTab === 'parties'" class="p-5">
                    <div class="flex justify-end mb-4" *ngIf="canEditDossier()">
                        <p-button icon="pi pi-plus" label="Ajouter une partie"
                            severity="danger" outlined size="small"
                            (onClick)="openAddParty()"/>
                    </div>
                    <div *ngIf="parties.length === 0" class="text-center py-10 text-surface-400">
                        <div class="w-12 h-12 rounded-xl bg-surface-100 flex items-center
                                    justify-center mx-auto mb-3">
                            <i class="pi pi-user-minus text-xl text-surface-300"></i>
                        </div>
                        <p class="text-sm">Aucune partie visée enregistrée</p>
                        <p class="text-xs mt-1 text-surface-300">
                            Ajoutez les personnes impliquées dans les faits dénoncés
                        </p>
                    </div>
                    <div class="flex flex-col gap-3" *ngIf="parties.length > 0">
                        <div *ngFor="let p of parties"
                            class="flex items-start gap-3 p-4 rounded-xl border
                                   border-surface-100 dark:border-surface-600
                                   bg-surface-50 dark:bg-surface-700
                                   hover:border-surface-200 transition-colors">
                            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center
                                        justify-center flex-shrink-0 font-bold text-red-600 text-sm">
                                {{ getInitials((p.firstName||'') + ' ' + (p.name||'')) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                    {{ p.firstName }} {{ p.name }}
                                </div>
                                <div class="text-xs text-surface-500 mt-0.5">
                                    <span *ngIf="p.position">{{ p.position }}</span>
                                    <span *ngIf="p.institution" class="text-red-500">
                                        · {{ p.institution }}
                                    </span>
                                </div>
                                <div class="flex items-center gap-2 mt-2 flex-wrap">
                                    <span *ngIf="p.allegedRole"
                                        class="text-xs bg-red-50 text-red-700 px-2 py-0.5
                                               rounded-full font-medium border border-red-100">
                                        {{ getAllegedRoleLabel(p.allegedRole) }}
                                    </span>
                                    <span class="text-xs bg-surface-100 text-surface-500
                                                 px-2 py-0.5 rounded-full">
                                        {{ getPartyTypeLabel(p.partyType) }}
                                    </span>
                                    <span *ngIf="p.phoneNumber" class="text-xs text-surface-400">
                                        <i class="pi pi-phone text-xs mr-0.5"></i>{{ p.phoneNumber }}
                                    </span>
                                </div>
                            </div>
                            <div class="flex gap-1 flex-shrink-0" *ngIf="canEditDossier()">
                                <p-button icon="pi pi-pencil" severity="info" text size="small"
                                    pTooltip="Modifier" (onClick)="openEditParty(p)"/>
                                <p-button icon="pi pi-trash" severity="danger" text size="small"
                                    pTooltip="Supprimer" (onClick)="deleteParty(p.id)"/>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ONGLET Témoins -->
                <div *ngIf="activeTab === 'witnesses'" class="p-5">
                    <div class="flex justify-end mb-4" *ngIf="canEditDossier()">
                        <p-button icon="pi pi-plus" label="Ajouter un témoin"
                            severity="info" outlined size="small"
                            (onClick)="openAddWitness()"/>
                    </div>
                    <div *ngIf="witnesses.length === 0" class="text-center py-10 text-surface-400">
                        <div class="w-12 h-12 rounded-xl bg-surface-100 flex items-center
                                    justify-center mx-auto mb-3">
                            <i class="pi pi-eye text-xl text-surface-300"></i>
                        </div>
                        <p class="text-sm">Aucun témoin enregistré</p>
                    </div>
                    <div class="flex flex-col gap-3" *ngIf="witnesses.length > 0">
                        <div *ngFor="let w of witnesses"
                            class="flex items-start gap-3 p-4 rounded-xl border
                                   border-surface-100 dark:border-surface-600
                                   bg-surface-50 dark:bg-surface-700
                                   hover:border-surface-200 transition-colors">
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center
                                        justify-center flex-shrink-0 font-bold text-blue-600 text-sm">
                                {{ w.anonymous ? '?'
                                    : getInitials((w.firstName||'') + ' ' + (w.lastName||'')) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-sm text-surface-900
                                            dark:text-surface-0 flex items-center gap-2">
                                    {{ w.anonymous ? 'Témoin anonyme'
                                        : ((w.firstName||'') + ' ' + (w.lastName||'')) }}
                                    <span *ngIf="w.anonymous"
                                        class="text-xs bg-surface-200 text-surface-600
                                               px-2 py-0.5 rounded-full">Anonyme</span>
                                </div>
                                <div class="text-xs text-surface-400 mt-0.5">
                                    <span *ngIf="w.profession">{{ w.profession }}</span>
                                    <span *ngIf="w.phoneNumber && !w.anonymous">
                                        · {{ w.phoneNumber }}
                                    </span>
                                </div>
                                <div *ngIf="w.testimonyNature"
                                    class="text-xs text-surface-500 mt-2 italic
                                           bg-white dark:bg-surface-800 rounded-lg p-2
                                           border border-surface-100 dark:border-surface-600">
                                    {{ w.testimonyNature }}
                                </div>
                                <div class="flex items-center gap-2 mt-2">
                                    <span *ngIf="w.consentToContact"
                                        class="text-xs bg-green-50 text-green-600 px-2 py-0.5
                                               rounded-full border border-green-100">
                                        <i class="pi pi-check text-xs mr-0.5"></i>
                                        Consent à être recontacté
                                    </span>
                                </div>
                            </div>
                            <div class="flex gap-1 flex-shrink-0" *ngIf="canEditDossier()">
                                <p-button icon="pi pi-pencil" severity="info" text size="small"
                                    pTooltip="Modifier" (onClick)="openEditWitness(w)"/>
                                <p-button icon="pi pi-trash" severity="danger" text size="small"
                                    pTooltip="Supprimer" (onClick)="deleteWitness(w.id)"/>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ONGLET Observations -->
                <div *ngIf="activeTab === 'observations'" class="p-5">
                    <div class="flex justify-end mb-4" *ngIf="!isClosed()">
                        <p-button icon="pi pi-plus" label="Ajouter une observation"
                            severity="secondary" outlined size="small"
                            (onClick)="showObsDialog = true"/>
                    </div>
                    <div *ngIf="observations.length === 0"
                        class="text-center py-10 text-surface-400">
                        <div class="w-12 h-12 rounded-xl bg-surface-100 flex items-center
                                    justify-center mx-auto mb-3">
                            <i class="pi pi-comments text-xl text-surface-300"></i>
                        </div>
                        <p class="text-sm">Aucune observation enregistrée</p>
                    </div>
                    <div class="flex flex-col gap-3" *ngIf="observations.length > 0">
                        <div *ngFor="let obs of observations"
                            class="p-4 rounded-xl border transition-colors"
                            [class.bg-orange-50]="obs.confidential"
                            [class.dark:bg-orange-950]="obs.confidential"
                            [class.border-orange-200]="obs.confidential"
                            [class.bg-surface-50]="!obs.confidential"
                            [class.dark:bg-surface-700]="!obs.confidential"
                            [class.border-surface-100]="!obs.confidential"
                            [class.dark:border-surface-600]="!obs.confidential">
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-xs font-semibold bg-purple-100
                                                 text-purple-700 px-2 py-0.5 rounded-full">
                                        {{ getObsTypeLabel(obs.type) }}
                                    </span>
                                    <span *ngIf="obs.confidential"
                                        class="text-xs bg-orange-100 text-orange-700
                                               px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <i class="pi pi-lock text-xs"></i> Confidentiel
                                    </span>
                                </div>
                                <span class="text-xs text-surface-400 flex-shrink-0">
                                    {{ obs.createdAt | date:'dd/MM/yyyy HH:mm' }}
                                </span>
                            </div>
                            <p class="text-sm text-surface-700 dark:text-surface-200 leading-relaxed">
                                {{ obs.content }}
                            </p>
                            <div class="flex items-center gap-1 mt-3 text-xs text-surface-400">
                                <i class="pi pi-user text-xs"></i>
                                <span class="font-medium">{{ obs.authorFullName }}</span>
                                <span class="mx-1 text-surface-300">·</span>
                                <span class="text-surface-300">{{ obs.statusSnapshot }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ONGLET Pièces jointes -->
                <div *ngIf="activeTab === 'attachments'" class="p-5">
                    <div *ngIf="attachments.length === 0"
                        class="text-center py-10 text-surface-400">
                        <div class="w-12 h-12 rounded-xl bg-surface-100 flex items-center
                                    justify-center mx-auto mb-3">
                            <i class="pi pi-paperclip text-xl text-surface-300"></i>
                        </div>
                        <p class="text-sm">Aucune pièce jointe</p>
                    </div>
                    <div class="flex flex-col gap-3" *ngIf="attachments.length > 0">
                        <div *ngFor="let att of attachments"
                            class="rounded-xl border border-surface-100
                                   dark:border-surface-600 overflow-hidden">
                            <div class="flex items-center gap-3 p-3
                                        bg-surface-50 dark:bg-surface-700">
                                <div class="w-9 h-9 rounded-lg flex items-center
                                            justify-center flex-shrink-0"
                                    [class.bg-purple-100]="isAudio(att)"
                                    [class.bg-red-100]="isPdf(att)"
                                    [class.bg-blue-100]="isImage(att)"
                                    [class.bg-indigo-100]="isWord(att)"
                                    [class.bg-green-100]="isVideo(att)"
                                    [class.bg-surface-200]="isOther(att)">
                                    <i class="text-sm pi"
                                        [class.pi-microphone]="isAudio(att)"
                                        [class.text-purple-600]="isAudio(att)"
                                        [class.pi-file-pdf]="isPdf(att)"
                                        [class.text-red-600]="isPdf(att)"
                                        [class.pi-image]="isImage(att)"
                                        [class.text-blue-600]="isImage(att)"
                                        [class.pi-file-word]="isWord(att)"
                                        [class.text-indigo-600]="isWord(att)"
                                        [class.pi-video]="isVideo(att)"
                                        [class.text-green-600]="isVideo(att)"
                                        [class.pi-file]="isOther(att)"
                                        [class.text-surface-500]="isOther(att)">
                                    </i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-sm font-medium text-surface-900
                                                dark:text-surface-0 truncate">
                                        {{ att.originalName }}
                                    </div>
                                    <div class="text-xs text-surface-400 mt-0.5
                                                flex items-center gap-2">
                                        <span>{{ formatSize(att.fileSizeBytes) }}</span>
                                        <span *ngIf="isAudio(att)" class="text-purple-500 font-medium">Audio</span>
                                        <span *ngIf="isPdf(att)" class="text-red-500 font-medium">PDF</span>
                                        <span *ngIf="isImage(att)" class="text-blue-500 font-medium">Image</span>
                                        <span *ngIf="isWord(att)" class="text-indigo-500 font-medium">Word</span>
                                        <span *ngIf="isVideo(att)" class="text-green-500 font-medium">Vidéo</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1 flex-shrink-0">
                                    <p-button *ngIf="getBlobUrl(att.id)"
                                        [icon]="previewId===att.id ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                        severity="info" text size="small"
                                        [pTooltip]="previewId===att.id ? 'Fermer' : 'Visualiser'"
                                        (onClick)="togglePreview(att)"/>
                                    <a *ngIf="getBlobUrl(att.id)"
                                        [href]="getBlobUrl(att.id)"
                                        [download]="att.originalName">
                                        <p-button icon="pi pi-download"
                                            severity="secondary" text size="small"
                                            pTooltip="Télécharger"/>
                                    </a>
                                    <i *ngIf="!getBlobUrl(att.id)"
                                        class="pi pi-spin pi-spinner text-surface-300 text-sm"></i>
                                </div>
                            </div>
                            <div *ngIf="previewId === att.id">
                                <div *ngIf="isAudio(att)" class="p-3 bg-white dark:bg-surface-800">
                                    <audio [src]="getBlobUrl(att.id)" controls
                                        controlsList="nodownload nofullscreen"
                                        class="w-full" style="height:36px;"></audio>
                                </div>
                                <div *ngIf="isImage(att)"
                                    class="bg-surface-900 flex items-center justify-center p-2"
                                    style="max-height:400px;overflow:auto;">
                                    <img [src]="getBlobUrl(att.id)"
                                        class="max-w-full object-contain rounded"
                                        style="max-height:380px;" alt="Pièce jointe"/>
                                </div>
                                <div *ngIf="isPdf(att)" style="height:500px;">
                                    <iframe [src]="getSafeUrl(att.id)"
                                        class="w-full h-full border-0"
                                        title="Document PDF"></iframe>
                                </div>
                                <div *ngIf="isVideo(att)" class="bg-surface-900 p-2">
                                    <video [src]="getBlobUrl(att.id)" controls
                                        class="w-full rounded" style="max-height:400px;"></video>
                                </div>
                                <div *ngIf="isWord(att)">
                                    <div *ngIf="docxHtml[att.id]; else docxLoading"
                                        class="p-5 bg-white overflow-auto text-sm leading-relaxed"
                                        style="max-height:500px;"
                                        [innerHTML]="docxHtml[att.id]"></div>
                                    <ng-template #docxLoading>
                                        <div class="flex items-center gap-2 p-4 text-xs text-surface-400">
                                            <i class="pi pi-spin pi-spinner"></i>
                                            Conversion du document...
                                        </div>
                                    </ng-template>
                                </div>
                                <div *ngIf="isOther(att)"
                                    class="p-4 text-center text-sm text-surface-400 bg-surface-50">
                                    <i class="pi pi-download text-lg mb-2 block"></i>
                                    Ce type de fichier ne peut pas être prévisualisé.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- ── Colonne droite (1/3) ──────────────────────── -->
        <div class="flex flex-col gap-4">

            <!-- Code d'accès -->
            <div class="bg-gradient-to-br from-primary-600 to-primary-800
                        rounded-2xl p-5 text-white">
                <div class="text-xs opacity-60 uppercase tracking-widest mb-2">
                    Code de suivi citoyen
                </div>
                <div class="font-mono text-2xl font-bold tracking-widest mb-1">
                    {{ dossier?.accessCode }}
                </div>
                <div class="text-xs opacity-50 flex items-center gap-1 mt-2">
                    <i class="pi pi-info-circle text-xs"></i>
                    À remettre avec le formulaire B4
                </div>
            </div>

            <!-- BLOC INVESTIGATION -->
            <div *ngIf="dossier && isInvestigationVisible()"
                class="bg-white dark:bg-surface-800 rounded-2xl border
                       border-surface-100 dark:border-surface-700 overflow-hidden">
                <div class="px-4 py-3 border-b border-surface-100 dark:border-surface-700
                            flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900
                                flex items-center justify-center">
                        <i class="pi pi-search text-primary-600 text-xs"></i>
                    </div>
                    <h3 class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                        Investigation
                    </h3>
                </div>
                <div class="p-4">
                    <div *ngIf="dossier.status === 'RECEVABLE'
                                && hasRole(['CGEA','ADMIN_DDIC'])"
                        class="flex flex-col gap-3">
                        <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200
                                    dark:border-green-800 rounded-xl">
                            <div class="flex items-center gap-2 mb-1">
                                <i class="pi pi-check-circle text-green-600 text-sm"></i>
                                <span class="text-xs font-semibold text-green-700
                                             dark:text-green-300">
                                    Dossier recevable
                                </span>
                            </div>
                            <p class="text-xs text-green-600 dark:text-green-400 ml-5">
                                Vous pouvez ouvrir l'investigation.
                            </p>
                        </div>
                        <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-3 border
                                    border-surface-100 dark:border-surface-600">
                            <label class="text-xs font-semibold text-surface-600 uppercase
                                          tracking-wide mb-2 block">
                                Durée (jours)
                            </label>
                            <div class="flex items-center gap-2 mb-2">
                                <input type="number" [(ngModel)]="openDays"
                                    min="90" max="365"
                                    class="p-inputtext w-20 text-sm text-center
                                           font-mono font-bold" />
                                <span class="text-xs text-surface-400">jours</span>
                            </div>
                            <div class="flex gap-1.5">
                                <button *ngFor="let d of [90, 120, 180]"
                                    class="text-xs px-2 py-1 rounded-lg border
                                           transition-colors cursor-pointer flex-1
                                           text-center"
                                    [class.bg-primary-100]="openDays === d"
                                    [class.text-primary-700]="openDays === d"
                                    [class.border-primary-300]="openDays === d"
                                    [class.bg-surface-100]="openDays !== d"
                                    [class.text-surface-500]="openDays !== d"
                                    [class.border-surface-200]="openDays !== d"
                                    (click)="openDays = d">
                                    {{ d }}j
                                </button>
                            </div>
                        </div>
                        <p-button label="Ouvrir l'investigation" icon="pi pi-play"
                            severity="success" styleClass="w-full justify-center"
                            [loading]="openingInvestigation"
                            (onClick)="openInvestigation()"/>
                    </div>
                    <div *ngIf="dossier.status === 'RECEVABLE'
                                && !hasRole(['CGEA','ADMIN_DDIC'])"
                        class="p-3 bg-blue-50 border border-blue-200 rounded-xl
                               text-xs text-blue-700 text-center">
                        <i class="pi pi-info-circle mr-1"></i>
                        En attente d'ouverture par le CGEA.
                    </div>
                    <div *ngIf="dossier.status !== 'RECEVABLE'"
                        class="flex flex-col gap-2">
                        <div class="flex items-center gap-2 p-2 bg-surface-50
                                    dark:bg-surface-700 rounded-xl">
                            <div class="w-6 h-6 rounded-full flex items-center
                                        justify-center flex-shrink-0"
                                [class.bg-green-500]="dossier.status === 'CLOS'"
                                [class.bg-blue-500]="dossier.status === 'EN_INVESTIGATION'"
                                [class.bg-amber-500]="dossier.status === 'RAPPORT_PRODUIT'"
                                [class.bg-purple-500]="dossier.status === 'DECISION_RENDUE'"
                                [class.bg-surface-400]="!['CLOS','EN_INVESTIGATION',
                                    'RAPPORT_PRODUIT','DECISION_RENDUE']
                                    .includes(dossier.status)">
                                <i class="pi pi-search text-white" style="font-size:9px;"></i>
                            </div>
                            <span class="text-xs font-medium text-surface-700
                                         dark:text-surface-200">
                                {{ getStatusLabel(dossier.status) }}
                            </span>
                        </div>
                        <p-button label="Accéder à l'investigation"
                            icon="pi pi-arrow-right" iconPos="right"
                            severity="info" size="small"
                            styleClass="w-full justify-center"
                            routerLink="/app/investigations"
                            [queryParams]="{dossier: dossier.id}"/>
                    </div>
                </div>
            </div>

            <!-- Workflow -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl border
                        border-surface-100 dark:border-surface-700 overflow-hidden">
                <div class="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                    <h3 class="font-semibold text-sm text-surface-900 dark:text-surface-0
                               flex items-center gap-2">
                        <i class="pi pi-list text-primary-600 text-xs"></i>
                        Workflow Manuel B
                    </h3>
                </div>
                <div class="p-4">
                    <div class="flex flex-col gap-0">
                        <div *ngFor="let step of workflowSteps; let last = last"
                            class="flex gap-3">
                            <div class="flex flex-col items-center">
                                <div class="w-7 h-7 rounded-full flex items-center
                                            justify-center border-2 flex-shrink-0 transition-all"
                                    [class.bg-green-500]="step.completed"
                                    [class.border-green-500]="step.completed"
                                    [class.bg-primary-500]="step.active"
                                    [class.border-primary-500]="step.active"
                                    [class.animate-pulse]="step.active"
                                    [class.bg-surface-100]="!step.completed && !step.active"
                                    [class.border-surface-200]="!step.completed && !step.active">
                                    <i *ngIf="step.completed"
                                        class="pi pi-check text-white" style="font-size:9px;"></i>
                                    <i *ngIf="!step.completed" [class]="step.icon"
                                        style="font-size:9px;"
                                        [class.text-white]="step.active"
                                        [class.text-surface-400]="!step.active"></i>
                                </div>
                                <div *ngIf="!last" class="w-px flex-1 my-0.5 min-h-3"
                                    [class.bg-green-400]="step.completed"
                                    [class.bg-surface-200]="!step.completed"></div>
                            </div>
                            <div class="pb-3 flex-1 min-w-0">
                                <div class="text-xs font-medium leading-tight mt-1"
                                    [class.text-green-600]="step.completed"
                                    [class.text-primary-600]="step.active && !step.completed"
                                    [class.text-surface-400]="!step.completed && !step.active">
                                    {{ step.label }}
                                </div>
                                <div *ngIf="step.date" class="text-xs text-surface-300 mt-0.5">
                                    {{ step.date | date:'dd/MM/yy' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agent en charge -->
            <div *ngIf="dossier?.agentInCharge"
                class="bg-white dark:bg-surface-800 rounded-2xl border
                       border-surface-100 dark:border-surface-700 p-4">
                <div class="text-xs text-surface-400 uppercase tracking-wide mb-3">
                    Agent en charge
                </div>
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center
                                justify-center font-bold text-primary-600 text-sm flex-shrink-0">
                        {{ dossier?.agentInCharge?.firstName?.[0] }}{{ dossier?.agentInCharge?.lastName?.[0] }}
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-surface-900 dark:text-surface-0">
                            {{ dossier?.agentInCharge?.firstName }}
                            {{ dossier?.agentInCharge?.lastName }}
                        </div>
                        <div class="text-xs text-surface-400 font-mono">
                            {{ dossier?.agentInCharge?.matricule }}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<!-- Skeleton -->
<ng-template #sk>
    <div class="flex flex-col gap-4">
        <p-skeleton height="72px" borderRadius="16px"/>
        <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 flex flex-col gap-4">
                <p-skeleton height="180px" borderRadius="16px"/>
                <p-skeleton height="300px" borderRadius="16px"/>
            </div>
            <div class="flex flex-col gap-4">
                <p-skeleton height="80px" borderRadius="16px"/>
                <p-skeleton height="260px" borderRadius="16px"/>
                <p-skeleton height="80px" borderRadius="16px"/>
            </div>
        </div>
    </div>
</ng-template>
    `
})
export class DossierDetail implements OnInit {

    private route                = inject(ActivatedRoute);
    private router               = inject(Router);
    private dossierService       = inject(DossierService);
    private investigationService = inject(InvestigationService);
    private keycloakService      = inject(KeycloakService);
    private messageService       = inject(MessageService);
    private http                 = inject(HttpClient);
    private attachmentService    = inject(AttachmentService);
    private targetedPartyService = inject(TargetedPartyService);
    private witnessService       = inject(WitnessService);
    private observationService   = inject(ObservationService);
    private sanitizer            = inject(DomSanitizer);

    dossier:              DossierResponse | null  = null;
    loading               = true;
    transitioning         = false;
    openingInvestigation  = false;
    openDays              = 90;
    attachments:          AttachmentResponse[]    = [];
    parties:              TargetedPartyResponse[] = [];
    witnesses:            WitnessResponse[]       = [];
    observations:         ObservationResponse[]   = [];
    attachmentBlobs:      { [id: string]: string } = {};
    previewId:            string | null = null;
    docxHtml:             { [id: string]: string } = {};
    staleVersion                  = 0;
    showVersionConflictDialog     = false;
    conflictRefreshing            = false;
    justRefreshedAfterConflict    = false;

    activeTab = 'parties';
    tabs = [
        { key: 'parties',      label: 'Parties visées', icon: 'pi pi-user-minus',
          count: () => this.parties.length      },
        { key: 'witnesses',    label: 'Témoins',        icon: 'pi pi-eye',
          count: () => this.witnesses.length    },
        { key: 'observations', label: 'Observations',   icon: 'pi pi-comments',
          count: () => this.observations.length },
        { key: 'attachments',  label: 'Pièces jointes', icon: 'pi pi-paperclip',
          count: () => this.attachments.length  }
    ];

    showTransitionDialog  = false;
    transitionDialogTitle = '';
    transitionPlaceholder = '';
    transitionReason      = '';
    currentTransitionType = '';
    workflowSteps: WorkflowStep[] = [];

    showPartyDialog   = false;
    showWitnessDialog = false;
    showObsDialog     = false;

    editingParty:   TargetedPartyResponse | null = null;
    editingWitness: WitnessResponse | null       = null;

    savingParty   = false;
    savingWitness = false;
    savingObs     = false;

    partyForm:   TargetedPartyRequest = this.emptyPartyForm();
    witnessForm: WitnessRequest       = this.emptyWitnessForm();
    obsForm:     ObservationRequest   = { type: '', content: '', confidential: false };

    readonly partyTypeOptions = [
        { label: 'Personne physique', value: 'PRIVATE_PERSON'  },
        { label: 'Entreprise',        value: 'COMPANY'          },
        { label: 'Agent public',      value: 'PUBLIC_AGENT'     },
        { label: 'Autorité publique', value: 'PUBLIC_AUTHORITY' }
    ];
    readonly allegedRoleOptions = [
        { label: 'Auteur principal', value: 'MAIN_PERPETRATOR' },
        { label: 'Complice',         value: 'ACCOMPLICE'        },
        { label: 'Bénéficiaire',     value: 'BENEFICIARY'       },
        { label: 'Instigateur',      value: 'INSTIGATOR'        }
    ];
    readonly obsTypeOptions = [
        { label: 'Note interne',          value: 'INTERNAL_NOTE'          },
        { label: 'Analyse recevabilité',  value: 'ADMISSIBILITY_ANALYSIS' },
        { label: 'Avis CTADP',           value: 'CTADP_OPINION'          },
        { label: 'Demande de complément', value: 'COMPLEMENT_REQUEST'     },
        { label: 'Décision CGE',         value: 'CGE_DECISION'           },
        { label: 'Constat terrain',       value: 'FIELD_FINDING'          },
        { label: 'Note de transfert',     value: 'TRANSFER_NOTE'          }
    ];

    private readonly investigationStatuses: DossierStatus[] = [
        'RECEVABLE', 'EN_INVESTIGATION', 'RAPPORT_PRODUIT', 'DECISION_RENDUE', 'CLOS'
    ];

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
                this.loadRelatedData(id);
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur', detail: 'Dossier introuvable'
                });
            }
        });
    }

    private loadRelatedData(id: string): void {
        this.attachmentService.listByDossier(id).subscribe({
            next: a => { this.attachments = a; a.forEach(att => this.loadBlob(att)); },
            error: () => {}
        });
        this.targetedPartyService.findAll(id).subscribe({
            next: p => { this.parties = p; }, error: () => {}
        });
        this.witnessService.findAll(id).subscribe({
            next: w => { this.witnesses = w; }, error: () => {}
        });
        this.observationService.findAll(id).subscribe({
            next: o => { this.observations = o; }, error: () => {}
        });
    }


    private handleTransitionError(err: any): void {
        this.transitioning = false;

        if (isVersionConflict(err)) {
            this.staleVersion              = this.dossier?.version ?? 0;
            this.showTransitionDialog      = false;
            this.showVersionConflictDialog = true;
            this.conflictRefreshing        = true;

            this.dossierService.refreshById(this.dossier!.id).subscribe({
                next: fresh => {
                    this.dossier            = fresh;
                    this.buildWorkflowSteps(fresh);
                    this.conflictRefreshing = false;
                },
                error: () => {
                    this.conflictRefreshing = false;
                    this.messageService.add({
                        severity: 'error',
                        summary:  'Erreur de rechargement',
                        detail:   'Impossible de recharger le dossier. Rafraîchissez la page.'
                    });
                }
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary:  'Erreur',
                detail:   err.error?.message || 'Transition échouée'
            });
        }
    }

    closeVersionConflictDialog(): void {
        this.showVersionConflictDialog  = false;
        this.justRefreshedAfterConflict = true;
        setTimeout(() => { this.justRefreshedAfterConflict = false; }, 5000);
    }


    openInvestigation(): void {
        if (!this.dossier) return;
        this.openingInvestigation = true;
        this.investigationService
            .open(this.dossier.id, { plannedDurationDays: this.openDays })
            .subscribe({
                next: inv => {
                    this.openingInvestigation = false;
                    this.messageService.add({
                        severity: 'success',
                        summary:  'Investigation ouverte',
                        detail:   'Redirection...'
                    });
                    setTimeout(() => {
                        this.router.navigate(['/app/investigations', inv.id]);
                    }, 800);
                },
                error: err => {
                    this.openingInvestigation = false;
                    this.messageService.add({
                        severity: 'error', summary: 'Erreur',
                        detail: err.error?.message || "Erreur lors de l'ouverture"
                    });
                }
            });
    }


    openAddParty(): void {
        this.editingParty    = null;
        this.partyForm       = this.emptyPartyForm();
        this.showPartyDialog = true;
    }

    openEditParty(p: TargetedPartyResponse): void {
        this.editingParty = p;
        this.partyForm = {
            partyType: p.partyType, firstName: p.firstName, name: p.name,
            position: p.position, institution: p.institution,
            organization: p.organization, address: p.address,
            phoneNumber: p.phoneNumber, email: p.email,
            relationWithDeclarant: p.relationWithDeclarant, allegedRole: p.allegedRole
        };
        this.showPartyDialog = true;
    }

    saveParty(): void {
        if (!this.dossier || !this.partyForm.partyType
            || !this.partyForm.firstName?.trim() || !this.partyForm.name?.trim()) {
            this.messageService.add({
                severity: 'warn', summary: 'Champs obligatoires',
                detail:   'Type de partie, Prénom et Nom sont requis.'
            });
            return;
        }
        this.savingParty = true;

        const obs$ = this.editingParty
            ? this.targetedPartyService.update(
                this.dossier.id, this.editingParty.id, this.partyForm)
            : this.targetedPartyService.create(this.dossier.id, this.partyForm);

        obs$.subscribe({
            next: () => {

                this.targetedPartyService.findAll(this.dossier!.id).subscribe({
                    next: p => {
                        this.parties         = p;
                        this.savingParty     = false;
                        this.showPartyDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: this.editingParty ? 'Partie modifiée' : 'Partie ajoutée'
                        });
                    },
                    error: () => {
                        // Mutation OK mais rechargement échoué → on ferme quand même
                        this.savingParty     = false;
                        this.showPartyDialog = false;
                        this.messageService.add({
                            severity: 'warn',
                            summary:  this.editingParty ? 'Partie modifiée' : 'Partie ajoutée',
                            detail:   'Rafraîchissez si la liste n\'est pas à jour.'
                        });
                    }
                });
            },
            error: err => {
                this.savingParty = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Erreur lors de la sauvegarde'
                });
            }
        });
    }

    deleteParty(partyId: string): void {
        if (!this.dossier) return;
        this.targetedPartyService.delete(this.dossier.id, partyId).subscribe({
            next: () => {
              
                this.targetedPartyService.findAll(this.dossier!.id).subscribe({
                    next: p => {
                        this.parties = p;
                        this.messageService.add({ severity: 'info', summary: 'Partie supprimée' });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'warn', summary: 'Partie supprimée',
                            detail:   'Rafraîchissez si la liste n\'est pas à jour.'
                        });
                    }
                });
            },
            error: err => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Suppression échouée'
                });
            }
        });
    }

    

    openAddWitness(): void {
        this.editingWitness    = null;
        this.witnessForm       = this.emptyWitnessForm();
        this.showWitnessDialog = true;
    }

    openEditWitness(w: WitnessResponse): void {
        this.editingWitness = w;
        this.witnessForm = {
            firstName: w.firstName, lastName: w.lastName, profession: w.profession,
            phoneNumber: w.phoneNumber, email: w.email, address: w.address,
            testimonyNature: w.testimonyNature,
            relationWithParties: w.relationWithParties,
            interrogationDate: w.interrogationDate,
            consentToContact: w.consentToContact, anonymous: w.anonymous
        };
        this.showWitnessDialog = true;
    }

    saveWitness(): void {
        if (!this.dossier || !this.witnessForm.firstName?.trim()
            || (!this.witnessForm.anonymous && !this.witnessForm.lastName?.trim())) {
            this.messageService.add({
                severity: 'warn', summary: 'Champs obligatoires',
                detail:   'Prénom et Nom sont requis (sauf témoin anonyme).'
            });
            return;
        }
        this.savingWitness = true;

        const obs$ = this.editingWitness
            ? this.witnessService.update(
                this.dossier.id, this.editingWitness.id, this.witnessForm)
            : this.witnessService.create(this.dossier.id, this.witnessForm);

        obs$.subscribe({
            next: () => {
                
                this.witnessService.findAll(this.dossier!.id).subscribe({
                    next: w => {
                        this.witnesses          = w;
                        this.savingWitness      = false;
                        this.showWitnessDialog  = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: this.editingWitness ? 'Témoin modifié' : 'Témoin ajouté'
                        });
                    },
                    error: () => {
                        this.savingWitness     = false;
                        this.showWitnessDialog = false;
                        this.messageService.add({
                            severity: 'warn',
                            summary:  this.editingWitness ? 'Témoin modifié' : 'Témoin ajouté',
                            detail:   'Rafraîchissez si la liste n\'est pas à jour.'
                        });
                    }
                });
            },
            error: err => {
                this.savingWitness = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Erreur lors de la sauvegarde'
                });
            }
        });
    }

    deleteWitness(witnessId: string): void {
        if (!this.dossier) return;
        this.witnessService.delete(this.dossier.id, witnessId).subscribe({
            next: () => {
                this.witnessService.findAll(this.dossier!.id).subscribe({
                    next: w => {
                        this.witnesses = w;
                        this.messageService.add({ severity: 'info', summary: 'Témoin supprimé' });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'warn', summary: 'Témoin supprimé',
                            detail:   'Rafraîchissez si la liste n\'est pas à jour.'
                        });
                    }
                });
            },
            error: err => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Suppression échouée'
                });
            }
        });
    }

    saveObservation(): void {
        if (!this.dossier || !this.obsForm.type || !this.obsForm.content) return;
        this.savingObs = true;
        this.observationService.create(this.dossier.id, this.obsForm).subscribe({
            next: obs => {
                this.observations  = [obs, ...this.observations];
                this.savingObs     = false;
                this.showObsDialog = false;
                this.obsForm       = { type: '', content: '', confidential: false };
                this.messageService.add({ severity: 'success', summary: 'Observation ajoutée' });
            },
            error: err => {
                this.savingObs = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Erreur'
                });
            }
        });
    }


    loadBlob(att: AttachmentResponse): void {
        const url = this.attachmentService.getDownloadUrl(att.id);
        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: blob => {
                this.attachmentBlobs = {
                    ...this.attachmentBlobs,
                    [att.id]: URL.createObjectURL(blob)
                };
            },
            error: () => {}
        });
    }

    getBlobUrl(id: string): string { return this.attachmentBlobs[id] || ''; }

    getSafeUrl(id: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            this.attachmentBlobs[id] || ''
        );
    }

    togglePreview(att: AttachmentResponse): void {
        if (this.previewId === att.id) { this.previewId = null; }
        else {
            this.previewId = att.id;
            if (this.isWord(att) && !this.docxHtml[att.id]) this.convertDocx(att);
        }
    }

    private convertDocx(att: AttachmentResponse): void {
        const blobUrl = this.attachmentBlobs[att.id];
        if (!blobUrl) return;
        fetch(blobUrl)
            .then(r => r.arrayBuffer())
            .then(buf => (mammoth as any).convertToHtml({ arrayBuffer: buf }))
            .then((res: any) => {
                this.docxHtml = { ...this.docxHtml, [att.id]: res.value };
            })
            .catch(() => {
                this.docxHtml = {
                    ...this.docxHtml,
                    [att.id]: '<p style="color:#ef4444;padding:16px;">Impossible de convertir.</p>'
                };
            });
    }

    isAudio(att: AttachmentResponse): boolean {
        return att.mimeType.startsWith('audio/') || att.isAudio;
    }
    isPdf(att: AttachmentResponse):   boolean { return att.mimeType.includes('pdf'); }
    isImage(att: AttachmentResponse): boolean { return att.mimeType.startsWith('image/'); }
    isWord(att: AttachmentResponse):  boolean {
        return att.mimeType.includes('word')
            || att.mimeType.includes('officedocument.wordprocessingml')
            || att.originalName.toLowerCase().endsWith('.docx')
            || att.originalName.toLowerCase().endsWith('.doc');
    }
    isVideo(att: AttachmentResponse): boolean { return att.mimeType.startsWith('video/'); }
    isOther(att: AttachmentResponse): boolean {
        return !this.isAudio(att) && !this.isPdf(att)
            && !this.isImage(att) && !this.isWord(att) && !this.isVideo(att);
    }


    private buildWorkflowSteps(dossier: DossierResponse): void {
        const order: DossierStatus[] = [
            'SOUMIS', 'RECU', 'EN_ETUDE_OPPORTUNITE', 'EN_REVUE_CTADP',
            'RECEVABLE', 'EN_INVESTIGATION', 'RAPPORT_PRODUIT', 'DECISION_RENDUE', 'CLOS'
        ];
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu — B4 remis',
            EN_ETUDE_OPPORTUNITE: 'Étude opportunité', EN_REVUE_CTADP: 'Revue CTADP',
            RECEVABLE: 'Déclaré recevable', EN_INVESTIGATION: 'En investigation',
            RAPPORT_PRODUIT: 'Rapport produit', DECISION_RENDUE: 'Décision rendue',
            CLOS: 'Dossier clôturé'
        };
        const icons: Record<string, string> = {
            SOUMIS: 'pi pi-upload', RECU: 'pi pi-inbox',
            EN_ETUDE_OPPORTUNITE: 'pi pi-search', EN_REVUE_CTADP: 'pi pi-users',
            RECEVABLE: 'pi pi-check', EN_INVESTIGATION: 'pi pi-eye',
            RAPPORT_PRODUIT: 'pi pi-file', DECISION_RENDUE: 'pi pi-gavel',
            CLOS: 'pi pi-lock'
        };
        const idx = order.indexOf(dossier.status);
        this.workflowSteps = order.map((status, i) => ({
            label:     labels[status] || status,
            status,
            icon:      icons[status] || 'pi pi-circle',
            active:    i === idx,
            completed: i < idx,
            date: i === 0 ? dossier.createdAt
                : i === 1 ? dossier.receptionDate
                : undefined
        }));
    }


    openTransition(type: string, title: string, placeholder: string): void {
        this.currentTransitionType = type;
        this.transitionDialogTitle = title;
        this.transitionPlaceholder = placeholder;
        this.transitionReason      = '';
        this.showTransitionDialog  = true;
    }

    openRegister():            void { this.openTransition('register',             'Enregistrer le dossier',     'Le dossier sera enregistré et un numéro B4 attribué au déclarant.'); }
    openStartStudy():          void { this.openTransition('start-study',          'Démarrer étude opportunité', "L'étude d'opportunité sera lancée par le conseiller juridique."); }
    openRequestComplement():   void { this.openTransition('request-complement',   'Demander un complément',     'Précisez les informations manquantes nécessaires au traitement.'); }
    openSubmitCtadp():         void { this.openTransition('submit-ctadp',         'Soumettre au CTADP',         'Le dossier sera transmis au Comité Technique pour revue.'); }
    openDeclareAdmissible():   void { this.openTransition('declare-admissible',   'Déclarer recevable',         'Le dossier sera déclaré recevable et une enquête pourra être ouverte.'); }
    openDeclareInadmissible(): void { this.openTransition('declare-inadmissible', 'Déclarer irrecevable',       'Le dossier sera clôturé comme irrecevable. Précisez le motif.'); }
    openClose():               void { this.openTransition('close',                'Clôturer le dossier',        'Le dossier sera définitivement clôturé.'); }

    executeTransition(): void {
        if (!this.dossier) return;
        this.transitioning = true;

        const request = {
            version: this.dossier.version,
            reason:  this.transitionReason
        };

        const map: Record<string, () => any> = {
            'register':             () => this.dossierService.registerReception(this.dossier!.id, request),
            'start-study':          () => this.dossierService.startOpportunityStudy(this.dossier!.id, request),
            'request-complement':   () => this.dossierService.requestComplement(this.dossier!.id, request),
            'submit-ctadp':         () => this.dossierService.submitToCtadp(this.dossier!.id, request),
            'declare-admissible':   () => this.dossierService.declareAdmissible(this.dossier!.id, request),
            'declare-inadmissible': () => this.dossierService.declareInadmissible(this.dossier!.id, request),
            'close':                () => this.dossierService.close(this.dossier!.id, request)
        };

        const obs$ = map[this.currentTransitionType]?.();
        if (!obs$) { this.transitioning = false; return; }

        obs$.subscribe({
            next: (updated: DossierResponse) => {
                this.dossier = updated;
                this.buildWorkflowSteps(updated);
                this.transitioning        = false;
                this.showTransitionDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary:  'Statut mis à jour',
                    detail:   this.getStatusLabel(updated.status)
                });
            },
            error: (err: any) => this.handleTransitionError(err)
        });
    }

    exportPdf(): void {
        if (!this.dossier) return;
        const url = `${environment.apiUrl}/pdf/dossier/${this.dossier.id}`;
        this.http.get(url, { responseType: 'blob' as 'json' }).subscribe({
            next: (blob: any) => {
                const link    = document.createElement('a');
                link.href     = URL.createObjectURL(blob);
                link.download = `dossier-${this.dossier!.number || this.dossier!.id}.pdf`;
                link.click(); URL.revokeObjectURL(link.href);
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: 'Impossible de générer le PDF'
            })
        });
    }


    hasRole(roles: string[]): boolean { return this.keycloakService.hasAnyRole(roles); }

    canEditDossier(): boolean {
        return !this.isClosed() && this.hasRole([
            'AGENT_BRPD', 'CONTROLEUR_ETAT', 'CONSEILLER_JURIDIQUE',
            'CGEA', 'CGE', 'ADMIN_DDIC'
        ]);
    }

    isClosed(): boolean {
        return ['CLOS', 'CLASSE', 'IRRECEVABLE'].includes(this.dossier?.status || '');
    }

    isInvestigationVisible(): boolean {
        return this.investigationStatuses.includes(
            this.dossier?.status as DossierStatus
        );
    }

    formatSize(bytes: number): string { return this.attachmentService.formatSize(bytes); }

    getInitials(name: string): string {
        return (name || '').trim().split(' ').filter(Boolean)
            .map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    getAllegedRoleLabel(role: string): string {
        const l: Record<string, string> = {
            MAIN_PERPETRATOR: 'Auteur principal', ACCOMPLICE: 'Complice',
            BENEFICIARY: 'Bénéficiaire', INSTIGATOR: 'Instigateur'
        };
        return l[role] || role;
    }

    getPartyTypeLabel(type: string): string {
        const l: Record<string, string> = {
            PRIVATE_PERSON: 'Personne physique', COMPANY: 'Entreprise',
            PUBLIC_AGENT: 'Agent public', PUBLIC_AUTHORITY: 'Autorité publique'
        };
        return l[type] || type;
    }

    getObsTypeLabel(type: string): string {
        const l: Record<string, string> = {
            INTERNAL_NOTE: 'Note interne', ADMISSIBILITY_ANALYSIS: 'Analyse recevabilité',
            CTADP_OPINION: 'Avis CTADP', COMPLEMENT_REQUEST: 'Demande complément',
            CGE_DECISION: 'Décision CGE', FIELD_FINDING: 'Constat terrain',
            TRANSFER_NOTE: 'Note transfert'
        };
        return l[type] || type;
    }

    getStatusLabel(status: string): string {
        const l: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'En étude', EN_ATTENTE_COMPLEMENT: 'Complément',
            EN_REVUE_CTADP: 'CTADP', RECEVABLE: 'Recevable',
            IRRECEVABLE: 'Irrecevable', TRANSFERE: 'Transféré',
            EN_INVESTIGATION: 'Investigation', RAPPORT_PRODUIT: 'Rapport',
            DECISION_RENDUE: 'Décision', CLOS: 'Clôturé', CLASSE: 'Classé'
        };
        return l[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const m: Record<string, TagSeverity> = {
            SOUMIS: 'info', RECU: 'info', EN_ETUDE_OPPORTUNITE: 'warn',
            EN_ATTENTE_COMPLEMENT: 'warn', EN_REVUE_CTADP: 'warn',
            RECEVABLE: 'success', IRRECEVABLE: 'danger', TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn', RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success', CLOS: 'success', CLASSE: 'secondary'
        };
        return m[status] ?? 'info';
    }

    getTypeLabel(type: string): string {
        const l: Record<string, string> = {
            COMPLAINT: 'Plainte', DENUNCIATION: 'Dénonciation',
            AUTO_REFERRAL: 'Auto-saisine', ANONYMOUS: 'Anonyme'
        };
        return l[type] || type;
    }

    getModeLabel(mode: string): string {
        const l: Record<string, string> = {
            IN_PERSON: 'Guichet BRPD', WEB_FORM: 'Formulaire Web', EMAIL: 'Email',
            SMS: 'SMS', PHONE: 'Téléphone', GREEN_NUMBER: 'Numéro Vert',
            SOCIAL_MEDIA: 'Réseaux Sociaux', AUDIO_COUNTER: 'Comptoir Audio',
            PAPER_FORM: 'Formulaire Papier', POSTAL_MAIL: 'Courrier Postal',
            PRESS_MEDIA: 'Presse', AUDIT_REPORT: 'Rapport Audit'
        };
        return l[mode] || mode;
    }

    private emptyPartyForm(): TargetedPartyRequest {
        return {
            partyType: '', firstName: '', name: '', position: '',
            institution: '', organization: '', address: '',
            phoneNumber: '', email: '', relationWithDeclarant: '', allegedRole: ''
        };
    }

    private emptyWitnessForm(): WitnessRequest {
        return {
            firstName: '', lastName: '', profession: '', phoneNumber: '',
            email: '', address: '', testimonyNature: '', relationWithParties: '',
            anonymous: false, consentToContact: false
        };
    }
}