import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierStatus } from '../../../core/models/dossier.model';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { AttachmentService, AttachmentResponse } from '../../../core/services/attachment.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { InvestigationDetail } from '../../investigations/investigation-detail/investigation-detail';
import * as mammoth from 'mammoth';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

interface WorkflowStep {
    label:     string;
    status:    DossierStatus;
    icon:      string;
    date?:     string;
    active:    boolean;
    completed: boolean;
}

@Component({
    selector: 'app-dossier-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, TimelineModule,
        DialogModule, TextareaModule, ToastModule,
        SkeletonModule, ConfirmDialogModule, TooltipModule,
        InvestigationDetail
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast />
<p-confirmDialog />

<!-- ── Dialog transition ──────────────────────────────────── -->
<p-dialog
    [(visible)]="showTransitionDialog"
    [header]="transitionDialogTitle"
    [modal]="true"
    [style]="{width: '500px'}"
    [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl
                    flex items-start gap-2">
            <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
            <p class="text-sm text-blue-700">{{ transitionPlaceholder }}</p>
        </div>
        <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-surface-700">
                Motif / Observation
            </label>
            <textarea pTextarea [(ngModel)]="transitionReason"
                placeholder="Saisissez votre observation..."
                rows="4" class="w-full resize-none">
            </textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showTransitionDialog = false" />
        <p-button [label]="transitionDialogTitle"
            [loading]="transitioning" (onClick)="executeTransition()" />
    </ng-template>
</p-dialog>

<!-- ── Contenu principal ──────────────────────────────────── -->
<div *ngIf="!loading; else loadingSkeleton" class="flex flex-col gap-6">

    <!-- En-tête -->
    <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-4">
            <p-button icon="pi pi-arrow-left" severity="secondary"
                text routerLink="/app/dossiers" />
            <div>
                <div class="flex items-center gap-3 flex-wrap">
                    <h1 class="text-3xl font-bold text-surface-900
                               dark:text-surface-0">
                        {{ dossier?.number || 'En attente de numéro' }}
                    </h1>
                    <p-tag *ngIf="dossier"
                        [value]="getStatusLabel(dossier.status)"
                        [severity]="getStatusSeverity(dossier.status)" />
                </div>
                <p class="text-surface-400 text-sm mt-1 max-w-lg">
                    {{ dossier?.object }}
                </p>
            </div>
        </div>

        <!-- Actions workflow -->
        <div class="flex gap-2 flex-wrap justify-end flex-shrink-0"
             *ngIf="dossier">
            <p-button
                *ngIf="dossier.status === 'SOUMIS' && hasRole(['AGENT_BRPD'])"
                label="Enregistrer" icon="pi pi-check"
                severity="success" size="small"
                (onClick)="openRegister()" />
            <p-button
                *ngIf="dossier.status === 'RECU'
                       && hasRole(['CONSEILLER_JURIDIQUE','CGEA'])"
                label="Démarrer étude" icon="pi pi-play"
                severity="info" size="small"
                (onClick)="openStartStudy()" />
            <p-button
                *ngIf="dossier.status === 'EN_ETUDE_OPPORTUNITE'
                       && hasRole(['CONSEILLER_JURIDIQUE'])"
                label="Demander complément" icon="pi pi-question-circle"
                severity="warn" size="small"
                (onClick)="openRequestComplement()" />
            <p-button
                *ngIf="dossier.status === 'EN_ETUDE_OPPORTUNITE'
                       && hasRole(['CONSEILLER_JURIDIQUE'])"
                label="Soumettre CTADP" icon="pi pi-send" size="small"
                (onClick)="openSubmitCtadp()" />
            <p-button
                *ngIf="dossier.status === 'EN_REVUE_CTADP'
                       && hasRole(['CGE','CGEA'])"
                label="Recevable" icon="pi pi-check-circle"
                severity="success" size="small"
                (onClick)="openDeclareAdmissible()" />
            <p-button
                *ngIf="dossier.status === 'EN_REVUE_CTADP'
                       && hasRole(['CGE','CGEA'])"
                label="Irrecevable" icon="pi pi-times-circle"
                severity="danger" size="small"
                (onClick)="openDeclareInadmissible()" />
            <p-button
                *ngIf="dossier.status === 'DECISION_RENDUE'
                       && hasRole(['CGE','CGEA'])"
                label="Clôturer" icon="pi pi-lock"
                severity="secondary" size="small"
                (onClick)="openClose()" />
            <p-button
                label="PDF" icon="pi pi-file-pdf"
                severity="secondary" outlined size="small"
                pTooltip="Exporter en PDF"
                (onClick)="exportPdf()" />
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- ── Colonne principale ──────────────────────────── -->
        <div class="lg:col-span-2 flex flex-col gap-4">

            <!-- Informations du dossier -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl
                        border border-surface-100 dark:border-surface-700
                        overflow-hidden">
                <div class="px-5 py-4 border-b border-surface-100
                            dark:border-surface-700 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-primary-100
                                flex items-center justify-center">
                        <i class="pi pi-file text-primary-600 text-sm"></i>
                    </div>
                    <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                        Informations du dossier
                    </h3>
                </div>
                <div class="p-5">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Type</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ getTypeLabel(dossier?.type || '') }}
                            </div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Canal</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ getModeLabel(dossier?.submissionMode || '') }}
                            </div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Date création</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ dossier?.createdAt | date:'dd/MM/yyyy' }}
                            </div>
                        </div>
                        <div *ngIf="dossier?.incidentLocation"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Lieu des faits</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ dossier?.incidentLocation }}
                            </div>
                        </div>
                        <div *ngIf="dossier?.incidentPeriod"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Période</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ dossier?.incidentPeriod }}
                            </div>
                        </div>
                        <div *ngIf="dossier?.estimatedLoss"
                            class="p-3 bg-red-50 dark:bg-red-950 rounded-xl
                                   border border-red-100 dark:border-red-900">
                            <div class="text-xs text-red-400 uppercase tracking-wide mb-1">Montant estimé</div>
                            <div class="font-bold text-sm text-red-600 dark:text-red-400">
                                {{ dossier?.estimatedLoss | number }} FCFA
                            </div>
                        </div>
                        <div *ngIf="dossier?.receptionDate"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Date réception</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ dossier?.receptionDate | date:'dd/MM/yyyy' }}
                            </div>
                        </div>
                        <div *ngIf="dossier?.acknowledgmentDeadline"
                            class="p-3 rounded-xl"
                            [class.bg-red-50]="dossier?.acknowledgmentOverdue"
                            [class.border-red-200]="dossier?.acknowledgmentOverdue"
                            [class.border]="dossier?.acknowledgmentOverdue"
                            [class.bg-surface-50]="!dossier?.acknowledgmentOverdue"
                            [class.dark:bg-surface-700]="!dossier?.acknowledgmentOverdue">
                            <div class="text-xs uppercase tracking-wide mb-1"
                                [class.text-red-400]="dossier?.acknowledgmentOverdue"
                                [class.text-surface-400]="!dossier?.acknowledgmentOverdue">
                                Délai accusé réception
                            </div>
                            <div class="font-semibold text-sm flex items-center gap-1"
                                [class.text-red-600]="dossier?.acknowledgmentOverdue"
                                [class.text-surface-900]="!dossier?.acknowledgmentOverdue">
                                {{ dossier?.acknowledgmentDeadline | date:'dd/MM/yyyy' }}
                                <i *ngIf="dossier?.acknowledgmentOverdue"
                                    class="pi pi-exclamation-triangle text-red-500 text-xs"></i>
                            </div>
                        </div>
                    </div>
                    <div *ngIf="dossier?.description"
                        class="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
                        <div class="text-xs text-surface-400 uppercase tracking-wide mb-2">Description</div>
                        <p class="text-sm leading-relaxed text-surface-700 dark:text-surface-300">
                            {{ dossier?.description }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Déclarant -->
            <div *ngIf="dossier?.declarant"
                class="bg-white dark:bg-surface-800 rounded-2xl
                       border border-surface-100 dark:border-surface-700
                       overflow-hidden">
                <div class="px-5 py-4 border-b border-surface-100
                            dark:border-surface-700 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-green-100
                                    flex items-center justify-center">
                            <i class="pi pi-user text-green-600 text-sm"></i>
                        </div>
                        <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                            Déclarant
                        </h3>
                    </div>
                    <p-tag *ngIf="dossier?.declarant?.anonymous"
                        value="Anonyme" severity="warn" styleClass="text-xs" />
                </div>
                <div class="p-5">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Nom</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ dossier?.declarant?.displayName }}
                            </div>
                        </div>
                        <div *ngIf="dossier?.declarant?.email"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Email</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0 truncate">
                                {{ dossier?.declarant?.email }}
                            </div>
                        </div>
                        <div *ngIf="dossier?.declarant?.phoneNumber"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Téléphone</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ dossier?.declarant?.phoneNumber }}
                            </div>
                        </div>
                        <div *ngIf="dossier?.declarant?.commune"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Commune</div>
                            <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">
                                {{ dossier?.declarant?.commune }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Investigation -->
            <app-investigation-detail
                *ngIf="dossier && isInvestigationVisible()"
                [dossierId]="dossier.id"
                [dossierStatus]="dossier.status" />

            <!-- ── Pièces jointes ──────────────────────────── -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl
                        border border-surface-100 dark:border-surface-700
                        overflow-hidden">
                <div class="px-5 py-4 border-b border-surface-100
                            dark:border-surface-700 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-amber-100
                                    flex items-center justify-center">
                            <i class="pi pi-paperclip text-amber-600 text-sm"></i>
                        </div>
                        <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                            Pièces jointes
                        </h3>
                    </div>
                    <span *ngIf="attachments.length > 0"
                        class="text-xs bg-surface-100 dark:bg-surface-700
                               text-surface-600 dark:text-surface-300
                               px-2 py-1 rounded-full font-medium">
                        {{ attachments.length }} fichier(s)
                    </span>
                </div>
                <div class="p-5">

                    <div *ngIf="attachments.length === 0"
                        class="flex flex-col items-center justify-center py-8 text-surface-400">
                        <div class="w-12 h-12 rounded-xl bg-surface-100
                                    flex items-center justify-center mb-3">
                            <i class="pi pi-inbox text-xl text-surface-300"></i>
                        </div>
                        <p class="text-sm">Aucune pièce jointe</p>
                    </div>

                    <div class="flex flex-col gap-4" *ngIf="attachments.length > 0">
                        <div *ngFor="let att of attachments"
                            class="rounded-xl border border-surface-100
                                   dark:border-surface-700 overflow-hidden">

                            <!-- En-tête fichier -->
                            <div class="flex items-center gap-3 p-3
                                        bg-surface-50 dark:bg-surface-700">
                                <div class="w-10 h-10 rounded-lg flex items-center
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
                                    <p-button
                                        *ngIf="getBlobUrl(att.id)"
                                        [icon]="previewId === att.id ? 'pi pi-eye-slash' : 'pi pi-eye'"
                                        severity="info" text size="small"
                                        [pTooltip]="previewId === att.id ? 'Fermer' : 'Visualiser'"
                                        (onClick)="togglePreview(att)" />
                                    <a *ngIf="getBlobUrl(att.id)"
                                        [href]="getBlobUrl(att.id)"
                                        [download]="att.originalName">
                                        <p-button icon="pi pi-download"
                                            severity="secondary" text size="small"
                                            pTooltip="Télécharger" />
                                    </a>
                                    <i *ngIf="!getBlobUrl(att.id)"
                                        class="pi pi-spin pi-spinner text-surface-300 text-sm"></i>
                                </div>
                            </div>

                            <!-- Preview inline -->
                            <div *ngIf="previewId === att.id">

                                <!-- Audio -->
                                <div *ngIf="isAudio(att)"
                                    class="p-3 bg-white dark:bg-surface-800">
                                    <audio [src]="getBlobUrl(att.id)" controls
                                        controlsList="nodownload nofullscreen"
                                        class="w-full" style="height:36px;">
                                    </audio>
                                </div>

                                <!-- Image -->
                                <div *ngIf="isImage(att)"
                                    class="bg-surface-900 flex items-center
                                           justify-center p-2"
                                    style="max-height:400px;overflow:auto;">
                                    <img [src]="getBlobUrl(att.id)"
                                        class="max-w-full object-contain rounded"
                                        style="max-height:380px;"
                                        alt="Pièce jointe" />
                                </div>

                                <!-- PDF -->
                                <div *ngIf="isPdf(att)" style="height:500px;">
                                    <iframe [src]="getSafeUrl(att.id)"
                                        class="w-full h-full border-0"
                                        title="Document PDF">
                                    </iframe>
                                </div>

                                <!-- Vidéo -->
                                <div *ngIf="isVideo(att)"
                                    class="bg-surface-900 p-2">
                                    <video [src]="getBlobUrl(att.id)" controls
                                        class="w-full rounded"
                                        style="max-height:400px;">
                                    </video>
                                </div>

                                <!-- Word DOCX -->
                                <div *ngIf="isWord(att)">
                                    <div *ngIf="docxHtml[att.id]; else docxLoading"
                                        class="p-5 bg-white overflow-auto
                                               text-sm leading-relaxed"
                                        style="max-height:500px;"
                                        [innerHTML]="docxHtml[att.id]">
                                    </div>
                                    <ng-template #docxLoading>
                                        <div class="flex items-center gap-2 p-4
                                                    text-xs text-surface-400">
                                            <i class="pi pi-spin pi-spinner"></i>
                                            Conversion du document...
                                        </div>
                                    </ng-template>
                                </div>

                                <!-- Autre -->
                                <div *ngIf="isOther(att)"
                                    class="p-4 text-center text-sm
                                           text-surface-400 bg-surface-50">
                                    <i class="pi pi-download text-lg mb-2 block"></i>
                                    Ce type de fichier ne peut pas être prévisualisé.
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- ── Colonne droite ──────────────────────────────── -->
        <div class="flex flex-col gap-4">

            <!-- Code d'accès -->
            <div class="bg-gradient-to-br from-primary-600 to-primary-700
                        rounded-2xl p-5 text-white">
                <div class="flex items-center gap-2 mb-3">
                    <i class="pi pi-qrcode text-primary-200 text-sm"></i>
                    <span class="text-primary-200 text-xs font-medium uppercase tracking-wide">
                        Code de suivi citoyen
                    </span>
                </div>
                <div class="font-mono text-3xl font-bold tracking-widest mb-2">
                    {{ dossier?.accessCode }}
                </div>
                <div class="text-primary-200 text-xs flex items-center gap-1">
                    <i class="pi pi-info-circle text-xs"></i>
                    À remettre au déclarant (formulaire B4)
                </div>
            </div>

            <!-- Workflow -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl
                        border border-surface-100 dark:border-surface-700
                        overflow-hidden">
                <div class="px-5 py-4 border-b border-surface-100
                            dark:border-surface-700 flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-primary-100
                                flex items-center justify-center">
                        <i class="pi pi-list text-primary-600 text-sm"></i>
                    </div>
                    <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                        Workflow Manuel B
                    </h3>
                </div>
                <div class="p-5">
                    <div class="flex flex-col gap-0">
                        <div *ngFor="let step of workflowSteps; let last = last"
                            class="flex gap-3">
                            <div class="flex flex-col items-center">
                                <div class="w-8 h-8 rounded-full flex items-center
                                            justify-center border-2 flex-shrink-0
                                            transition-all"
                                    [class.bg-green-500]="step.completed"
                                    [class.border-green-500]="step.completed"
                                    [class.bg-primary-500]="step.active"
                                    [class.border-primary-500]="step.active"
                                    [class.animate-pulse]="step.active"
                                    [class.bg-surface-100]="!step.completed && !step.active"
                                    [class.border-surface-200]="!step.completed && !step.active">
                                    <i *ngIf="step.completed"
                                        class="pi pi-check text-white text-xs"></i>
                                    <i *ngIf="!step.completed"
                                        [class]="step.icon + ' text-xs'"
                                        [class.text-white]="step.active"
                                        [class.text-surface-400]="!step.active"></i>
                                </div>
                                <div *ngIf="!last"
                                    class="w-0.5 flex-1 my-1 min-h-4"
                                    [class.bg-green-400]="step.completed"
                                    [class.bg-surface-200]="!step.completed"></div>
                            </div>
                            <div class="pb-4 flex-1 min-w-0">
                                <div class="text-sm font-medium leading-tight"
                                    [class.text-green-600]="step.completed"
                                    [class.text-primary-600]="step.active && !step.completed"
                                    [class.text-surface-400]="!step.completed && !step.active">
                                    {{ step.label }}
                                </div>
                                <div *ngIf="step.date"
                                    class="text-xs text-surface-400 mt-0.5">
                                    {{ step.date | date:'dd/MM/yyyy' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agent en charge -->
            <div *ngIf="dossier?.agentInCharge"
                class="bg-white dark:bg-surface-800 rounded-2xl
                       border border-surface-100 dark:border-surface-700 p-5">
                <h3 class="font-semibold mb-4 text-sm flex items-center gap-2
                           text-surface-900 dark:text-surface-0">
                    <div class="w-8 h-8 rounded-lg bg-teal-100
                                flex items-center justify-center">
                        <i class="pi pi-user-edit text-teal-600 text-sm"></i>
                    </div>
                    Agent en charge
                </h3>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-full
                                flex items-center justify-center
                                font-bold text-primary-600">
                        {{ dossier?.agentInCharge?.firstName?.[0] }}{{ dossier?.agentInCharge?.lastName?.[0] }}
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-surface-900
                                    dark:text-surface-0">
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
<ng-template #loadingSkeleton>
    <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
            <p-skeleton width="40px" height="40px" borderRadius="8px" />
            <div class="flex flex-col gap-2 flex-1">
                <p-skeleton width="300px" height="32px" />
                <p-skeleton width="200px" height="16px" />
            </div>
        </div>
        <div class="grid grid-cols-3 gap-6">
            <div class="col-span-2 flex flex-col gap-4">
                <p-skeleton height="200px" borderRadius="16px" />
                <p-skeleton height="120px" borderRadius="16px" />
                <p-skeleton height="150px" borderRadius="16px" />
            </div>
            <div class="flex flex-col gap-4">
                <p-skeleton height="100px" borderRadius="16px" />
                <p-skeleton height="300px" borderRadius="16px" />
            </div>
        </div>
    </div>
</ng-template>
    `
})
export class DossierDetail implements OnInit {

    private route             = inject(ActivatedRoute);
    private dossierService    = inject(DossierService);
    private keycloakService   = inject(KeycloakService);
    private messageService    = inject(MessageService);
    private http              = inject(HttpClient);
    private attachmentService = inject(AttachmentService);
    private sanitizer         = inject(DomSanitizer);

    dossier:         DossierResponse | null = null;
    loading          = true;
    transitioning    = false;
    attachments:     AttachmentResponse[] = [];
    attachmentBlobs: { [id: string]: string } = {};
    previewId:       string | null = null;
    docxHtml:        { [id: string]: string } = {};

    showTransitionDialog   = false;
    transitionDialogTitle  = '';
    transitionPlaceholder  = '';
    transitionReason       = '';
    currentTransitionType  = '';
    workflowSteps:         WorkflowStep[] = [];

    private readonly investigationStatuses: DossierStatus[] = [
        'RECEVABLE', 'EN_INVESTIGATION',
        'RAPPORT_PRODUIT', 'DECISION_RENDUE', 'CLOS'
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
                this.attachmentService.listByDossier(id).subscribe({
                    next: atts => {
                        this.attachments = atts;
                        atts.forEach(att => this.loadBlob(att));
                    },
                    error: () => {}
                });
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Dossier introuvable'
                });
            }
        });
    }

    // ── Blob / Preview ────────────────────────────────────────

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

    getBlobUrl(id: string): string {
        return this.attachmentBlobs[id] || '';
    }

    getSafeUrl(id: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            this.attachmentBlobs[id] || ''
        );
    }

    togglePreview(att: AttachmentResponse): void {
        if (this.previewId === att.id) {
            this.previewId = null;
        } else {
            this.previewId = att.id;
            if (this.isWord(att) && !this.docxHtml[att.id]) {
                this.convertDocx(att);
            }
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
                    [att.id]: '<p style="color:#ef4444;padding:16px;">Impossible de convertir ce document.</p>'
                };
            });
    }

    // ── Helpers type fichier ──────────────────────────────────

    isAudio(att: AttachmentResponse): boolean {
        return att.mimeType.startsWith('audio/') || att.isAudio;
    }
    isPdf(att: AttachmentResponse): boolean {
        return att.mimeType.includes('pdf');
    }
    isImage(att: AttachmentResponse): boolean {
        return att.mimeType.startsWith('image/');
    }
    isWord(att: AttachmentResponse): boolean {
        return att.mimeType.includes('word')
            || att.mimeType.includes('officedocument.wordprocessingml')
            || att.originalName.toLowerCase().endsWith('.docx')
            || att.originalName.toLowerCase().endsWith('.doc');
    }
    isVideo(att: AttachmentResponse): boolean {
        return att.mimeType.startsWith('video/');
    }
    isOther(att: AttachmentResponse): boolean {
        return !this.isAudio(att) && !this.isPdf(att)
            && !this.isImage(att) && !this.isWord(att)
            && !this.isVideo(att);
    }

    // ── Workflow ──────────────────────────────────────────────

    private buildWorkflowSteps(dossier: DossierResponse): void {
        const order: DossierStatus[] = [
            'SOUMIS', 'RECU', 'EN_ETUDE_OPPORTUNITE', 'EN_REVUE_CTADP',
            'RECEVABLE', 'EN_INVESTIGATION', 'RAPPORT_PRODUIT',
            'DECISION_RENDUE', 'CLOS'
        ];
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu — B4 remis',
            EN_ETUDE_OPPORTUNITE: 'Étude opportunité',
            EN_REVUE_CTADP: 'Revue CTADP',
            RECEVABLE: 'Déclaré recevable',
            EN_INVESTIGATION: 'En investigation',
            RAPPORT_PRODUIT: 'Rapport produit',
            DECISION_RENDUE: 'Décision rendue',
            CLOS: 'Dossier clôturé'
        };
        const icons: Record<string, string> = {
            SOUMIS: 'pi pi-upload', RECU: 'pi pi-inbox',
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
            label:     labels[status] || status,
            status,
            icon:      icons[status] || 'pi pi-circle',
            active:    index === currentIndex,
            completed: index < currentIndex,
            date:      index === 0 ? dossier.createdAt
                     : index === 1 ? dossier.receptionDate
                     : undefined
        }));
    }

    // ── Transitions ───────────────────────────────────────────

    openTransition(type: string, title: string, placeholder: string): void {
        this.currentTransitionType = type;
        this.transitionDialogTitle = title;
        this.transitionPlaceholder = placeholder;
        this.transitionReason      = '';
        this.showTransitionDialog  = true;
    }

    openRegister():            void { this.openTransition('register',             'Enregistrer le dossier',    'Le dossier sera enregistré et un numéro B4 attribué au déclarant.'); }
    openStartStudy():          void { this.openTransition('start-study',          'Démarrer étude opportunité', "L'étude d'opportunité sera lancée par le conseiller juridique."); }
    openRequestComplement():   void { this.openTransition('request-complement',   'Demander un complément',    'Précisez les informations manquantes nécessaires au traitement.'); }
    openSubmitCtadp():         void { this.openTransition('submit-ctadp',         'Soumettre au CTADP',        'Le dossier sera transmis au Comité Technique pour revue.'); }
    openDeclareAdmissible():   void { this.openTransition('declare-admissible',   'Déclarer recevable',        'Le dossier sera déclaré recevable et une enquête pourra être ouverte.'); }
    openDeclareInadmissible(): void { this.openTransition('declare-inadmissible', 'Déclarer irrecevable',      'Le dossier sera clôturé comme irrecevable. Précisez le motif.'); }
    openClose():               void { this.openTransition('close',                'Clôturer le dossier',       'Le dossier sera définitivement clôturé.'); }

    executeTransition(): void {
        if (!this.dossier) return;
        this.transitioning = true;
        const request = { version: this.dossier.version, reason: this.transitionReason };

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
                this.dossier              = updated;
                this.buildWorkflowSteps(updated);
                this.transitioning        = false;
                this.showTransitionDialog = false;
                this.messageService.add({
                    severity: 'success', summary: 'Statut mis à jour',
                    detail: this.getStatusLabel(updated.status)
                });
            },
            error: (err: any) => {
                this.transitioning = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Transition échouée'
                });
            }
        });
    }

    // ── Export PDF ────────────────────────────────────────────

    exportPdf(): void {
        if (!this.dossier) return;
        const url = `${environment.apiUrl}/pdf/dossier/${this.dossier.id}`;
        this.http.get(url, { responseType: 'blob' as 'json' }).subscribe({
            next: (blob: any) => {
                const link    = document.createElement('a');
                link.href     = URL.createObjectURL(blob);
                link.download = `dossier-${this.dossier!.number || this.dossier!.id}.pdf`;
                link.click();
                URL.revokeObjectURL(link.href);
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: 'Impossible de générer le PDF'
            })
        });
    }

    // ── Utilitaires ───────────────────────────────────────────

    hasRole(roles: string[]): boolean {
        return this.keycloakService.hasAnyRole(roles);
    }

    isInvestigationVisible(): boolean {
        return this.investigationStatuses.includes(this.dossier?.status as DossierStatus);
    }

    formatSize(bytes: number): string {
        return this.attachmentService.formatSize(bytes);
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
            EN_ETUDE_OPPORTUNITE: 'warn', EN_ATTENTE_COMPLEMENT: 'warn',
            EN_REVUE_CTADP: 'warn', RECEVABLE: 'success',
            IRRECEVABLE: 'danger', TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn', RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success', CLOS: 'success', CLASSE: 'secondary'
        };
        return map[status] ?? 'info';
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            COMPLAINT: 'Plainte', DENUNCIATION: 'Dénonciation',
            AUTO_REFERRAL: 'Auto-saisine', ANONYMOUS: 'Anonyme'
        };
        return labels[type] || type;
    }

    getModeLabel(mode: string): string {
        const labels: Record<string, string> = {
            IN_PERSON: 'Guichet BRPD', WEB_FORM: 'Formulaire Web',
            EMAIL: 'Email', SMS: 'SMS', PHONE: 'Téléphone',
            GREEN_NUMBER: 'Numéro Vert', SOCIAL_MEDIA: 'Réseaux Sociaux',
            AUDIO_COUNTER: 'Comptoir Audio', PAPER_FORM: 'Formulaire Papier',
            POSTAL_MAIL: 'Courrier Postal', PRESS_MEDIA: 'Presse',
            AUDIT_REPORT: 'Rapport Audit'
        };
        return labels[mode] || mode;
    }
}