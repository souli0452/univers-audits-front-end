import {
    Component, OnInit, OnChanges, OnDestroy,
    Input, SimpleChanges, inject
} from '@angular/core';
import { CommonModule }                       from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule }                        from '@angular/forms';
import { DomSanitizer, SafeHtml }             from '@angular/platform-browser';
import { Subject }                            from 'rxjs';
import { takeUntil }                          from 'rxjs/operators';

import { ButtonModule }     from 'primeng/button';
import { TagModule }        from 'primeng/tag';
import { DialogModule }     from 'primeng/dialog';
import { TextareaModule }   from 'primeng/textarea';
import { SelectModule }     from 'primeng/select';
import { ToastModule }      from 'primeng/toast';
import { SkeletonModule }   from 'primeng/skeleton';
import { AvatarModule }     from 'primeng/avatar';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule }    from 'primeng/tooltip';
import { EditorModule }     from 'primeng/editor';
import { MessageService }   from 'primeng/api';

import {
    InvestigationService,
    InvestigationResponse,
    TeamRole,
    SubmitReportRequest,
    AgentSummaryInMember,
    InvestigationMemberResponse
} from '../../../core/services/investigation.service';
import { AgentService }      from '../../../core/services/agent.service';
import { KeycloakService }   from '../../../core/auth/keycloak.service';
import { AttachmentService } from '../../../core/services/attachment.service';


type TagSeverity =
    | 'success' | 'info' | 'warn' | 'danger'
    | 'secondary' | 'contrast' | null | undefined;

type OutcomeValue =
    | 'ADMINISTRATIVE_SANCTIONS'
    | 'JUDICIAL_REFERRAL'
    | 'ARCHIVED'
    | 'PRESS_RELEASE'
    | 'ANNUAL_REPORT';


interface AgentOption {
    label: string;
    value: string;
}

interface SelectOption<T extends string = string> {
    label: string;
    value: T;
}

interface ApprovalStep {
    label:  string;
    icon:   string;
    delay:  string;
    done:   boolean;
    active: boolean;
    date:   string | null | undefined;
}

interface ApiError {
    error?: { message?: string };
}


@Component({
    selector:    'app-investigation-detail',
    standalone:  true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, DialogModule,
        TextareaModule, SelectModule, ToastModule,
        SkeletonModule, AvatarModule, DatePickerModule,
        TooltipModule, EditorModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<p-dialog [(visible)]="showSuspendDialog"
    header="Suspendre l'investigation"
    [modal]="true" [style]="{width:'440px'}">
    <div class="py-2">
        <label class="text-sm font-semibold text-surface-700 mb-2 block">
            Motif de suspension *
        </label>
        <textarea pTextarea [(ngModel)]="suspendReason"
            placeholder="Expliquez la raison de la suspension..."
            rows="4" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showSuspendDialog = false" />
        <p-button label="Suspendre" icon="pi pi-pause" severity="danger"
            [loading]="actioning" (onClick)="executeSuspend()" />
    </ng-template>
</p-dialog>

<!-- ── Dialog prolongation ────────────────────────────── -->
<p-dialog [(visible)]="showExtendDialog"
    header="Prolonger le délai"
    [modal]="true" [style]="{width:'460px'}">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Nouvelle date d'échéance *
            </label>
            <p-datepicker [(ngModel)]="extendDate"
                dateFormat="dd/mm/yy" [minDate]="today"
                styleClass="w-full" appendTo="body" />
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Motif de prolongation *
            </label>
            <textarea pTextarea [(ngModel)]="extendReason"
                placeholder="Justification..." rows="3" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showExtendDialog = false" />
        <p-button label="Prolonger" icon="pi pi-calendar-plus"
            [loading]="actioning" (onClick)="executeExtend()" />
    </ng-template>
</p-dialog>

<!-- ── Dialog rapport final ───────────────────────────── -->
<p-dialog [(visible)]="showReportDialog"
    header="Soumettre le rapport final"
    [modal]="true" [style]="{width:'700px'}" [draggable]="false">
    <div class="flex flex-col gap-5 py-2">

        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Rapport complet *
            </label>
            <p-editor [(ngModel)]="reportRequest.finalReport"
                [style]="{'height':'180px'}"
                placeholder="Rapport détaillé de l'investigation...">
                <ng-template pTemplate="header">
                    <span class="ql-formats">
                        <button class="ql-bold"      title="Gras"></button>
                        <button class="ql-italic"    title="Italique"></button>
                        <button class="ql-underline" title="Souligné"></button>
                    </span>
                    <span class="ql-formats">
                        <select class="ql-align" title="Alignement"></select>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-list" value="ordered" title="Liste numérotée"></button>
                        <button class="ql-list" value="bullet"  title="Liste à puces"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-clean" title="Effacer la mise en forme"></button>
                    </span>
                </ng-template>
            </p-editor>
        </div>

        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Conclusions *
            </label>
            <p-editor [(ngModel)]="reportRequest.conclusions"
                [style]="{'height':'140px'}"
                placeholder="Conclusions principales...">
                <ng-template pTemplate="header">
                    <span class="ql-formats">
                        <button class="ql-bold"></button>
                        <button class="ql-italic"></button>
                        <button class="ql-underline"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-list" value="ordered"></button>
                        <button class="ql-list" value="bullet"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-clean"></button>
                    </span>
                </ng-template>
            </p-editor>
        </div>

        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Recommandations
            </label>
            <p-editor [(ngModel)]="reportRequest.recommendations"
                [style]="{'height':'120px'}"
                placeholder="Recommandations...">
                <ng-template pTemplate="header">
                    <span class="ql-formats">
                        <button class="ql-bold"></button>
                        <button class="ql-italic"></button>
                        <button class="ql-underline"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-list" value="ordered"></button>
                        <button class="ql-list" value="bullet"></button>
                    </span>
                    <span class="ql-formats">
                        <button class="ql-clean"></button>
                    </span>
                </ng-template>
            </p-editor>
        </div>

        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Issue / Résultat *
            </label>
            <p-select [(ngModel)]="reportRequest.outcome"
                [options]="outcomeOptions"
                optionLabel="label" optionValue="value"
                placeholder="Sélectionner..." styleClass="w-full"
                appendTo="body" />
        </div>

        <!-- Zone upload -->
        <div class="border-t border-surface-100 pt-4">
            <div class="flex items-center gap-2 mb-3">
                <div class="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <i class="pi pi-paperclip text-amber-600 text-xs"></i>
                </div>
                <span class="text-sm font-semibold text-surface-700">Documents joints</span>
                <span class="text-xs text-surface-400">(optionnel)</span>
            </div>
            <div class="border-2 border-dashed border-surface-200 rounded-xl p-4
                        hover:border-primary-300 transition-colors cursor-pointer"
                 (dragover)="$event.preventDefault()"
                 (drop)="onFileDrop($event)">
                <div class="flex flex-col items-center gap-2 text-surface-400 text-sm">
                    <i class="pi pi-upload text-2xl text-surface-300"></i>
                    <span>Glissez vos fichiers ici ou</span>
                    <label class="cursor-pointer">
                        <span class="text-primary-600 font-semibold hover:underline">
                            Parcourir
                        </span>
                        <input type="file" multiple class="hidden"
                               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
                               (change)="onFileSelect($event)" />
                    </label>
                    <span class="text-xs text-surface-300">
                        PDF, Word, Images, Vidéos — max 10 Mo par fichier
                    </span>
                </div>
            </div>

            <div *ngIf="reportFiles.length > 0" class="flex flex-col gap-2 mt-3">
                <div *ngFor="let f of reportFiles; let i = index"
                     class="flex items-center gap-3 p-2.5 bg-surface-50
                            rounded-xl border border-surface-100">
                    <div class="w-8 h-8 rounded-lg flex items-center
                                justify-center flex-shrink-0"
                         [class.bg-red-100]="f.type.includes('pdf')"
                         [class.bg-blue-100]="f.type.startsWith('image/')"
                         [class.bg-purple-100]="f.type.startsWith('video/')"
                         [class.bg-surface-200]="!f.type.includes('pdf')
                             && !f.type.startsWith('image/')
                             && !f.type.startsWith('video/')">
                        <i class="pi text-xs"
                           [class.pi-file-pdf]="f.type.includes('pdf')"
                           [class.text-red-600]="f.type.includes('pdf')"
                           [class.pi-image]="f.type.startsWith('image/')"
                           [class.text-blue-600]="f.type.startsWith('image/')"
                           [class.pi-video]="f.type.startsWith('video/')"
                           [class.text-purple-600]="f.type.startsWith('video/')"
                           [class.pi-file]="!f.type.includes('pdf')
                               && !f.type.startsWith('image/')
                               && !f.type.startsWith('video/')"
                           [class.text-surface-500]="!f.type.includes('pdf')
                               && !f.type.startsWith('image/')
                               && !f.type.startsWith('video/')">
                        </i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium text-surface-900 truncate">{{ f.name }}</div>
                        <div class="text-xs text-surface-400">{{ formatFileSize(f.size) }}</div>
                    </div>
                    <p-button icon="pi pi-times" severity="danger" text
                        size="small" (onClick)="removeReportFile(i)" />
                </div>
            </div>

            <div *ngIf="uploadProgress > 0 && uploadProgress < 100" class="mt-3">
                <div class="flex justify-between text-xs text-surface-400 mb-1">
                    <span>Upload en cours...</span>
                    <span>{{ uploadProgress }}%</span>
                </div>
                <div class="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 rounded-full transition-all"
                         [style.width]="uploadProgress + '%'"></div>
                </div>
            </div>
        </div>
    </div>

    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="cancelReport()" />
        <p-button label="Soumettre le rapport" icon="pi pi-send" severity="success"
            [loading]="actioning"
            [disabled]="!reportRequest.finalReport || !reportRequest.conclusions"
            (onClick)="executeSubmitReport()" />
    </ng-template>
</p-dialog>

<!-- ── Dialog décision CGE ────────────────────────────── -->
<p-dialog [(visible)]="showCgeDialog"
    header="Décision finale CGE"
    [modal]="true" [style]="{width:'460px'}">
    <div class="py-2">
        <label class="text-sm font-semibold text-surface-700 mb-2 block">
            Décision / Justification *
        </label>
        <textarea pTextarea [(ngModel)]="cgeReason"
            placeholder="Décision et justification..."
            rows="4" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showCgeDialog = false" />
        <p-button label="Valider la décision" icon="pi pi-gavel" severity="success"
            [loading]="actioning" (onClick)="executeApproveCge()" />
    </ng-template>
</p-dialog>

<!-- ── Dialog ajouter membre ──────────────────────────── -->
<p-dialog [(visible)]="showAddMemberDialog"
    header="Ajouter un membre à l'équipe"
    [modal]="true" [style]="{width:'500px'}">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">Agent *</label>
            <p-select [(ngModel)]="newMemberAgentId"
                [options]="availableAgents"
                optionLabel="label" optionValue="value"
                placeholder="Sélectionner un agent..."
                styleClass="w-full" [filter]="true" appendTo="body" />
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">Rôle *</label>
            <p-select [(ngModel)]="newMemberRole"
                [options]="roleOptions"
                optionLabel="label" optionValue="value"
                styleClass="w-full" appendTo="body" />
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showAddMemberDialog = false" />
        <p-button label="Ajouter" icon="pi pi-user-plus"
            [loading]="actioning" (onClick)="executeAddMember()" />
    </ng-template>
</p-dialog>

<!-- ════════════════════════════════════════════════════════
     PAGE PRINCIPALE
     ════════════════════════════════════════════════════════ -->

<div *ngIf="!loading; else sk" class="flex flex-col gap-5">

    <!-- En-tête page standalone -->
    <div *ngIf="!isPanel" class="flex items-start justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
            <p-button icon="pi pi-arrow-left" severity="secondary" text
                routerLink="/app/investigations" />
            <div>
                <div class="flex items-center gap-2 flex-wrap">
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                        Investigation — {{ inv?.dossierNumber || '—' }}
                    </h1>
                    <p-tag *ngIf="inv"
                        [value]="getStatusLabel(inv.status)"
                        [severity]="getStatusSeverity(inv.status)" />
                    <p-tag *ngIf="inv?.overdue"
                        value="EN RETARD" severity="danger"
                        styleClass="text-xs animate-pulse" />
                </div>
                <p class="text-surface-400 text-sm mt-1">{{ inv?.dossierObject }}</p>
            </div>
        </div>
    </div>

    <!-- Actions page standalone -->
    <ng-container *ngIf="!isPanel && inv">
        <div class="flex gap-2 flex-wrap justify-end">
            <ng-container *ngTemplateOutlet="actionButtons; context: {inv: inv}" />
        </div>
    </ng-container>

    <!-- En-tête panel -->
    <div *ngIf="isPanel"
        class="bg-white dark:bg-surface-800 rounded-2xl p-4
               border border-surface-100 dark:border-surface-700">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900
                            flex items-center justify-center">
                    <i class="pi pi-search text-primary-600 text-sm"></i>
                </div>
                Investigation
                <p-tag *ngIf="inv"
                    [value]="getStatusLabel(inv.status)"
                    [severity]="getStatusSeverity(inv.status)"
                    styleClass="text-xs" />
                <p-tag *ngIf="inv?.overdue"
                    value="EN RETARD" severity="danger"
                    styleClass="text-xs animate-pulse" />
            </h3>
            <div class="flex gap-2 flex-wrap" *ngIf="inv">
                <ng-container *ngTemplateOutlet="actionButtons; context: {inv: inv}" />
            </div>
        </div>
    </div>

    <!-- Template actions partagé -->
    <ng-template #actionButtons let-inv="inv">
        <p-button *ngIf="inv.status === 'INITIATED' && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Démarrer" icon="pi pi-play" severity="success" size="small"
            [loading]="actioning" (onClick)="executeStart()" />
        <p-button *ngIf="inv.status === 'IN_PROGRESS' && hasRole(['CGEA','CGE','ADMIN_DDIC'])"
            label="Suspendre" icon="pi pi-pause" severity="warn" size="small"
            (onClick)="showSuspendDialog = true" />
        <p-button *ngIf="inv.status === 'SUSPENDED' && hasRole(['CGEA','CGE','ADMIN_DDIC'])"
            label="Reprendre" icon="pi pi-play" severity="info" size="small"
            [loading]="actioning" (onClick)="executeResume()" />
        <p-button *ngIf="inv.status === 'IN_PROGRESS' && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Prolonger" icon="pi pi-calendar-plus"
            severity="secondary" outlined size="small"
            (onClick)="showExtendDialog = true" />
        <p-button *ngIf="inv.status === 'IN_PROGRESS' && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
            label="Soumettre rapport" icon="pi pi-file-check" size="small"
            (onClick)="showReportDialog = true" />
        <p-button *ngIf="inv.status === 'COMPLETED' && !inv.deiApprovedAt
                         && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Approuver DEI" icon="pi pi-check" severity="success" size="small"
            [loading]="actioning" (onClick)="executeApproveDei()" />
        <p-button *ngIf="inv.deiApprovedAt && !inv.legalAdvisorApprovedAt
                         && hasRole(['CONSEILLER_JURIDIQUE','ADMIN_DDIC'])"
            label="Approuver Juridique" icon="pi pi-shield" severity="success" size="small"
            [loading]="actioning" (onClick)="executeApproveLegal()" />
        <p-button *ngIf="inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt
                         && hasRole(['CGE','ADMIN_DDIC'])"
            label="Décision CGE" icon="pi pi-gavel" severity="success" size="small"
            (onClick)="showCgeDialog = true" />
    </ng-template>

    <!-- ════════════════════════════════════════════════════
         GRILLE PRINCIPALE
         ════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- ══ CAS 1 : PAS d'investigation → pleine largeur ══ -->
        <div *ngIf="!inv && isPanel" class="lg:col-span-3">
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-8
                        border border-surface-100 dark:border-surface-700 max-w-2xl mx-auto">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700
                                flex items-center justify-center mx-auto mb-3">
                        <i class="pi pi-search text-2xl text-surface-300"></i>
                    </div>
                    <p class="font-semibold text-surface-600 dark:text-surface-300 text-sm">
                        Aucune investigation ouverte pour ce dossier
                    </p>
                </div>

                <!-- RECEVABLE + CGEA -->
                <div *ngIf="dossierStatus === 'RECEVABLE' && hasRole(['CGEA','ADMIN_DDIC'])"
                    class="flex flex-col gap-4">
                    <div class="p-4 bg-green-50 dark:bg-green-950 border border-green-200
                                dark:border-green-800 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="pi pi-check-circle text-green-600"></i>
                            <span class="text-sm font-semibold text-green-700 dark:text-green-300">
                                Dossier déclaré recevable
                            </span>
                        </div>
                        <p class="text-xs text-green-600 dark:text-green-400 ml-6">
                            Le CGE a validé ce dossier. Vous pouvez ouvrir l'investigation.
                        </p>
                    </div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border
                                border-surface-100 dark:border-surface-600">
                        <label class="text-xs font-semibold text-surface-600 uppercase
                                      tracking-wide mb-3 block">
                            Durée prévue de l'investigation
                        </label>
                        <div class="flex items-center gap-3 mb-3">
                            <input type="number" [(ngModel)]="openDays"
                                min="90" max="365"
                                class="p-inputtext w-28 text-sm text-center font-mono font-bold" />
                            <span class="text-sm text-surface-400">jours</span>
                            <span class="text-xs text-surface-300 ml-auto">min 90 · max 365</span>
                        </div>
                        <div class="flex gap-2">
                            <button *ngFor="let d of quickDays"
                                class="text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
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
                        [loading]="actioning" (onClick)="openInvestigation()" />
                </div>

                <!-- RECEVABLE, pas CGEA -->
                <div *ngIf="dossierStatus === 'RECEVABLE' && !hasRole(['CGEA','ADMIN_DDIC'])"
                    class="p-3 bg-blue-50 border border-blue-200 rounded-xl
                           text-sm text-blue-700 text-center">
                    <i class="pi pi-info-circle mr-2"></i>
                    Dossier recevable. En attente d'ouverture par le CGEA.
                </div>

                <!-- Pas encore recevable -->
                <div *ngIf="dossierStatus !== 'RECEVABLE'
                            && dossierStatus !== 'EN_INVESTIGATION'
                            && dossierStatus !== 'RAPPORT_PRODUIT'
                            && dossierStatus !== 'DECISION_RENDUE'
                            && dossierStatus !== 'CLOS'"
                    class="p-3 bg-surface-50 border border-surface-200 rounded-xl
                           text-xs text-surface-400 text-center">
                    L'investigation sera possible après la décision de recevabilité du CGE.
                </div>
            </div>
        </div>

        <!-- ══ CAS 2 : investigation existe → layout 2/3 + 1/3 ══ -->
        <ng-container *ngIf="inv">

            <!-- Colonne gauche (2/3) -->
            <div class="lg:col-span-2 flex flex-col gap-5">

                <!-- Progression -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                               flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900
                                    flex items-center justify-center">
                            <i class="pi pi-chart-line text-blue-600 text-xs"></i>
                        </div>
                        Progression de l'enquête
                    </h3>
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-surface-400">Avancement temporel</span>
                            <span class="font-bold text-surface-700 dark:text-surface-200">
                                {{ getProgress() }}%
                            </span>
                        </div>
                        <div class="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-500"
                                [style.width]="getProgress() + '%'"
                                [style.background]="getProgressGradient()">
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3 text-sm">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl text-center">
                            <div class="text-surface-400 text-xs mb-1">Début</div>
                            <div class="font-semibold text-surface-900 dark:text-surface-0 text-xs">
                                {{ inv.startDate ? (inv.startDate | date:'dd/MM/yyyy') : 'Non démarrée' }}
                            </div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl text-center">
                            <div class="text-surface-400 text-xs mb-1">Durée prévue</div>
                            <div class="font-semibold text-surface-900 dark:text-surface-0">
                                {{ inv.plannedDurationDays }}j
                            </div>
                        </div>
                        <div class="p-3 rounded-xl text-center border"
                            [style.background]="inv.overdue ? '#fff5f5'
                                : !inv.startDate ? '#f9fafb'
                                : (inv.remainingDays || 0) <= 10 ? '#fffbeb' : '#f0fdf4'"
                            [style.border-color]="inv.overdue ? '#fca5a5'
                                : !inv.startDate ? '#e5e7eb'
                                : (inv.remainingDays || 0) <= 10 ? '#fde68a' : '#86efac'">
                            <div class="text-xs mb-1"
                                [style.color]="inv.overdue ? '#ef4444' : '#9ca3af'">
                                Délai restant
                            </div>
                            <div class="font-bold"
                                [style.color]="inv.overdue ? '#dc2626'
                                    : !inv.startDate ? '#9ca3af'
                                    : (inv.remainingDays || 0) <= 10 ? '#d97706' : '#16a34a'">
                                {{ inv.overdue ? 'Dépassé'
                                    : !inv.startDate ? '—'
                                    : (inv.remainingDays || 0) + 'j' }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Circuit de validation -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                               flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900
                                    flex items-center justify-center">
                            <i class="pi pi-list-check text-purple-600 text-xs"></i>
                        </div>
                        Circuit de validation
                    </h3>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let step of approvalSteps; let i = index"
                            class="flex items-center gap-3 p-3 rounded-xl border transition-all"
                            [style.background]="step.done ? '#f0fdf4' : step.active ? '#eff6ff' : '#f9fafb'"
                            [style.border-color]="step.done ? '#86efac' : step.active ? '#bfdbfe' : '#e5e7eb'">
                            <div class="w-9 h-9 rounded-full flex items-center
                                        justify-center flex-shrink-0"
                                [style.background]="step.done ? '#22c55e' : step.active ? '#3b82f6' : '#e5e7eb'">
                                <i class="pi text-white text-xs"
                                    [class]="step.done ? 'pi-check' : step.icon"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold"
                                    [style.color]="step.done ? '#16a34a' : step.active ? '#2563eb' : '#9ca3af'">
                                    {{ step.label }}
                                    <span class="text-xs font-normal ml-1" style="color:#9ca3af;">
                                        {{ step.delay }}
                                    </span>
                                </div>
                                <div *ngIf="step.date" class="text-xs text-green-600 mt-0.5">
                                    ✓ {{ step.date | date:'dd/MM/yyyy HH:mm' }}
                                </div>
                                <div *ngIf="step.active && !step.date"
                                    style="display:inline-flex;align-items:center;gap:4px;
                                           font-size:.7rem;color:#3b82f6;margin-top:3px;
                                           background:#eff6ff;padding:2px 8px;border-radius:20px;">
                                    <div style="width:5px;height:5px;border-radius:50%;
                                        background:#3b82f6;animation:pulse 1s infinite;"></div>
                                    En attente
                                </div>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                                [style.background]="step.done ? '#dcfce7' : step.active ? '#dbeafe' : '#f3f4f6'"
                                [style.color]="step.done ? '#16a34a' : step.active ? '#2563eb' : '#9ca3af'">
                                {{ i + 1 }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Rapport — innerHTML assaini via DomSanitizer -->
                <div *ngIf="safeReport">
                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">
                        Rapport
                    </div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                leading-relaxed text-surface-700 dark:text-surface-200
                                border border-surface-100 overflow-hidden"
                         [innerHTML]="safeReport">
                    </div>
                </div>

                <div *ngIf="safeConclusions">
                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">
                        Conclusions
                    </div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                leading-relaxed text-surface-700 dark:text-surface-200
                                border border-surface-100 overflow-hidden"
                         [innerHTML]="safeConclusions">
                    </div>
                </div>

                <div *ngIf="safeRecommendations">
                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">
                        Recommandations
                    </div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                leading-relaxed text-surface-700 dark:text-surface-200
                                border border-surface-100 overflow-hidden"
                         [innerHTML]="safeRecommendations">
                    </div>
                </div>

            </div>

            <!-- Colonne droite (1/3) -->
            <div class="flex flex-col gap-5">

                <!-- Lien dossier associé (page standalone) -->
                <div *ngIf="!isPanel"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-4
                           border border-surface-100 dark:border-surface-700">
                    <h3 class="text-sm font-bold text-surface-700 dark:text-surface-200
                               mb-3 flex items-center gap-2">
                        <i class="pi pi-folder text-primary-600"></i>
                        Dossier associé
                    </h3>
                    <p-button [label]="inv.dossierNumber || 'Voir le dossier'"
                        icon="pi pi-external-link" iconPos="right"
                        severity="info" text size="small"
                        [routerLink]="['/app/dossiers', inv.dossierId]" />
                </div>

                <!-- Bouton "Continuer dans Investigations" (mode panel) -->
                <div *ngIf="isPanel"
                    class="bg-gradient-to-br from-primary-50 to-primary-100
                           dark:from-primary-950 dark:to-primary-900
                           rounded-2xl p-4 border border-primary-200 dark:border-primary-800">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-primary-200 dark:bg-primary-800
                                    flex items-center justify-center">
                            <i class="pi pi-arrow-right text-primary-700 dark:text-primary-200 text-xs"></i>
                        </div>
                        <span class="text-sm font-semibold text-primary-800 dark:text-primary-200">
                            Gérer l'investigation
                        </span>
                    </div>
                    <p class="text-xs text-primary-600 dark:text-primary-300 mb-3 leading-relaxed">
                        Pour ajouter des membres, soumettre un rapport ou suivre le
                        circuit complet, accédez à la page dédiée.
                    </p>
                    <p-button label="Ouvrir dans Investigations"
                        icon="pi pi-external-link" iconPos="right"
                        severity="info" size="small" styleClass="w-full justify-center"
                        [routerLink]="['/app/investigations', inv.id]" />
                </div>

                <!-- Équipe d'investigation -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0
                                   flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900
                                        flex items-center justify-center">
                                <i class="pi pi-users text-green-600 text-xs"></i>
                            </div>
                            Équipe
                            <span class="text-xs bg-surface-100 dark:bg-surface-700
                                         text-surface-500 px-2 py-0.5 rounded-full font-normal">
                                {{ inv.members?.length || 0 }} membre(s)
                            </span>
                        </h3>
                        <p-button
                            *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                   && inv.status !== 'COMPLETED'
                                   && inv.status !== 'ARCHIVED'"
                            icon="pi pi-user-plus" severity="success" text size="small"
                            pTooltip="Ajouter un membre" tooltipPosition="left"
                            (onClick)="showAddMemberDialog = true" />
                    </div>

                    <div *ngIf="!inv.members?.length" class="text-center py-6">
                        <div class="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700
                                    flex items-center justify-center mx-auto mb-3">
                            <i class="pi pi-users text-xl text-surface-300"></i>
                        </div>
                        <p class="text-surface-400 text-xs">Aucun membre dans l'équipe</p>
                        <p *ngIf="hasRole(['CGEA','ADMIN_DDIC'])"
                            class="text-primary-500 text-xs mt-1 cursor-pointer"
                            (click)="showAddMemberDialog = true">
                            + Ajouter un membre
                        </p>
                    </div>

                    <div class="flex flex-col gap-2" *ngIf="inv.members?.length">
                        <div *ngFor="let m of inv.members"
                            class="flex items-start gap-2 p-2.5 rounded-xl
                                   hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                            <div class="w-8 h-8 rounded-lg flex items-center
                                        justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                [style.background]="m.teamRole === 'TEAM_LEADER' ? '#fef9c3' : '#dbeafe'"
                                [style.color]="m.teamRole === 'TEAM_LEADER' ? '#854d0e' : '#1d4ed8'">
                                {{ getInitials(m.agent.firstName + ' ' + m.agent.lastName) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-semibold text-surface-900
                                            dark:text-surface-0 break-words leading-tight">
                                    {{ m.agent.firstName + ' ' + m.agent.lastName }}
                                </div>
                                <div class="text-xs text-surface-400 font-mono mt-0.5">
                                    {{ m.agent.matricule || '' }}
                                </div>
                                <span class="inline-block mt-1 text-xs px-2 py-0.5
                                             rounded-full font-semibold"
                                    [style.background]="m.teamRole === 'TEAM_LEADER' ? '#fef9c3' : '#dbeafe'"
                                    [style.color]="m.teamRole === 'TEAM_LEADER' ? '#854d0e' : '#1d4ed8'">
                                    {{ getRoleLabel(m.teamRole) }}
                                </span>
                            </div>
                            <p-button
                                *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                       && inv.status !== 'COMPLETED'
                                       && inv.status !== 'ARCHIVED'"
                                icon="pi pi-times" severity="danger" text size="small"
                                pTooltip="Retirer" tooltipPosition="left"
                                (onClick)="executeRemoveMember(m.agent.id)" />
                        </div>
                    </div>
                </div>

            </div>
        </ng-container>

    </div>
</div>

<!-- Skeleton -->
<ng-template #sk>
    <div class="flex flex-col gap-5">
        <p-skeleton height="3rem" borderRadius="16px" />
        <div class="grid grid-cols-3 gap-5">
            <div class="col-span-2 flex flex-col gap-4">
                <p-skeleton height="160px" borderRadius="16px" />
                <p-skeleton height="200px" borderRadius="16px" />
            </div>
            <div class="flex flex-col gap-4">
                <p-skeleton height="200px" borderRadius="16px" />
            </div>
        </div>
    </div>
</ng-template>
    `
})
export class InvestigationDetail implements OnInit, OnChanges, OnDestroy {

    @Input() dossierId:     string | null = null;
    @Input() dossierStatus: string | null = null;

    get isPanel(): boolean { return !!this.dossierId; }


    private readonly route                = inject(ActivatedRoute);
    private readonly router               = inject(Router);
    private readonly investigationService = inject(InvestigationService);
    private readonly agentService         = inject(AgentService);
    private readonly keycloakService      = inject(KeycloakService);
    private readonly messageService       = inject(MessageService);
    private readonly attachmentService    = inject(AttachmentService);
    private readonly sanitizer            = inject(DomSanitizer);


    private readonly destroy$ = new Subject<void>();


    inv:      InvestigationResponse | null = null;
    loading   = true;
    actioning = false;
    readonly today = new Date();

    safeReport:          SafeHtml | null = null;
    safeConclusions:     SafeHtml | null = null;
    safeRecommendations: SafeHtml | null = null;
    showSuspendDialog   = false;
    showExtendDialog    = false;
    showReportDialog    = false;
    showCgeDialog       = false;
    showAddMemberDialog = false;
    suspendReason    = '';
    extendDate:      Date | null = null;
    extendReason     = '';
    cgeReason        = '';
    newMemberAgentId = '';
    newMemberRole:   TeamRole = 'MEMBER';
    openDays         = 90;

    reportRequest: SubmitReportRequest = {
        finalReport:     '',
        conclusions:     '',
        recommendations: '',
        outcome:         'ADMINISTRATIVE_SANCTIONS'
    };

    reportFiles:    File[] = [];
    uploadProgress = 0;
    availableAgents: AgentOption[]  = [];
    approvalSteps:   ApprovalStep[] = [];

    readonly quickDays: readonly number[] = [90, 120, 180];

    readonly roleOptions: SelectOption<TeamRole>[] = [
        { label: 'Chef de mission', value: 'TEAM_LEADER' },
        { label: 'Investigateur',   value: 'MEMBER'      }
    ];

    readonly outcomeOptions: SelectOption<OutcomeValue>[] = [
        { label: 'Sanctions administratives', value: 'ADMINISTRATIVE_SANCTIONS' },
        { label: 'Saisine judiciaire',         value: 'JUDICIAL_REFERRAL'        },
        { label: 'Classé sans suite',          value: 'ARCHIVED'                 },
        { label: 'Communiqué de presse',       value: 'PRESS_RELEASE'            },
        { label: 'Rapport annuel',             value: 'ANNUAL_REPORT'            }
    ];



    ngOnInit(): void {
        if (this.dossierId) {
            this.loadByDossier(this.dossierId);
        } else {
            const id = this.route.snapshot.paramMap.get('id');
            if (id) this.loadById(id);
        }
        this.loadAgents();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const change = changes['dossierId'];
        if (change && !change.firstChange) {
            const newId = change.currentValue as string | null;
            if (newId) this.loadByDossier(newId);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadById(id: string): void {
        this.loading = true;
        this.investigationService.findById(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary:  'Erreur',
                        detail:   'Investigation introuvable'
                    });
                }
            });
    }

    private loadByDossier(dossierId: string): void {
        this.loading = true;
        this.investigationService.findByDossier(dossierId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.loading = false;
                },
                error: () => {
                    this.inv     = null;
                    this.loading = false;
                }
            });
    }


    private reloadInv(): void {
        if (!this.inv) return;
        this.investigationService.findById(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: freshInv => this.setInv(freshInv),
                error: () => {  }
            });
    }

    private loadAgents(): void {
        this.agentService.findAll(0, 100)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (page: { content: AgentSummaryInMember[] }) => {
                    this.availableAgents = page.content.map(a => ({
                        label: `${a.firstName} ${a.lastName} — ${a.matricule}`,
                        value: a.id
                    }));
                },
                error: () => { }
            });
    }


    private setInv(inv: InvestigationResponse | null): void {
        this.inv = inv;
        if (inv) {
            this.buildApprovalSteps(inv);
            this.safeReport          = inv.finalReport
                ? this.sanitizer.bypassSecurityTrustHtml(inv.finalReport)
                : null;
            this.safeConclusions     = inv.conclusions
                ? this.sanitizer.bypassSecurityTrustHtml(inv.conclusions)
                : null;
            this.safeRecommendations = inv.recommendations
                ? this.sanitizer.bypassSecurityTrustHtml(inv.recommendations)
                : null;
        } else {
            this.safeReport = this.safeConclusions = this.safeRecommendations = null;
        }
    }

    private buildApprovalSteps(inv: InvestigationResponse): void {
        this.approvalSteps = [
            {
                label:  'Rapport soumis',
                icon:   'pi-file',
                delay:  '',
                done:   !!inv.reportSubmittedAt,
                active: inv.status === 'IN_PROGRESS',
                date:   inv.reportSubmittedAt
            },
            {
                label:  'Approbation DEI',
                icon:   'pi-user',
                delay:  '(15 jours ouvrables)',
                done:   !!inv.deiApprovedAt,
                active: !!inv.reportSubmittedAt && !inv.deiApprovedAt,
                date:   inv.deiApprovedAt
            },
            {
                label:  'Conseiller Juridique',
                icon:   'pi-shield',
                delay:  '(10 jours ouvrables)',
                done:   !!inv.legalAdvisorApprovedAt,
                active: !!inv.deiApprovedAt && !inv.legalAdvisorApprovedAt,
                date:   inv.legalAdvisorApprovedAt
            },
            {
                label:  'Décision finale CGE',
                icon:   'pi-gavel',
                delay:  '(20 jours ouvrables)',
                done:   !!inv.cgeApprovedAt,
                active: !!inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt,
                date:   inv.cgeApprovedAt
            }
        ];
    }


    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.addReportFiles(Array.from(input.files));
            input.value = '';
        }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer?.files) {
            this.addReportFiles(Array.from(event.dataTransfer.files));
        }
    }

    private addReportFiles(files: File[]): void {
        const maxSize = 10 * 1024 * 1024;
        for (const f of files) {
            if (f.size > maxSize) {
                this.messageService.add({
                    severity: 'warn',
                    summary:  'Fichier trop volumineux',
                    detail:   `${f.name} dépasse 10 Mo`
                });
            } else {
                this.reportFiles.push(f);
            }
        }
    }

    removeReportFile(index: number): void {
        this.reportFiles.splice(index, 1);
    }

    cancelReport(): void {
        this.showReportDialog = false;
        this.reportFiles      = [];
        this.uploadProgress   = 0;
    }

    formatFileSize(bytes: number): string {
        return this.attachmentService.formatSize(bytes);
    }


    openInvestigation(): void {
        if (!this.dossierId) return;
        this.actioning = true;
        this.investigationService
            .open(this.dossierId, { plannedDurationDays: this.openDays })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning = false;
                    this.messageService.add({
                        severity: 'success',
                        summary:  'Investigation ouverte',
                        detail:   'Redirection vers la page dédiée...'
                    });
                    setTimeout(() => this.router.navigate(['/app/investigations', inv.id]), 800);
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeStart(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.start(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning = false;
                    this.messageService.add({
                        severity: 'success',
                        summary:  'Investigation démarrée',
                        detail:   `Échéance : ${new Date(inv.plannedEndDate!).toLocaleDateString('fr-FR')}`
                    });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeSuspend(): void {
        if (!this.inv || !this.suspendReason.trim()) return;
        this.actioning = true;
        this.investigationService.suspend(this.inv.id, this.suspendReason)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning         = false;
                    this.showSuspendDialog = false;
                    this.suspendReason     = '';
                    this.messageService.add({ severity: 'warn', summary: 'Suspendue' });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeResume(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.resume(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning = false;
                    this.messageService.add({ severity: 'success', summary: 'Reprise' });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeExtend(): void {
        if (!this.inv || !this.extendDate || !this.extendReason.trim()) return;
        this.actioning = true;
        this.investigationService
            .extendDeadline(this.inv.id, {
                newDeadline: this.extendDate.toISOString(),
                reason:      this.extendReason
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning        = false;
                    this.showExtendDialog = false;
                    this.extendDate       = null;
                    this.extendReason     = '';
                    this.messageService.add({ severity: 'success', summary: 'Délai prolongé' });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeSubmitReport(): void {
        if (!this.inv || !this.reportRequest.finalReport || !this.reportRequest.conclusions) return;
        this.actioning = true;

        if (this.reportFiles.length > 0) {
            this.uploadProgress = 10;
            this.attachmentService.upload(this.inv.dossierId, this.reportFiles)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => { this.uploadProgress = 80; this.submitReportData(); },
                    error: (err: ApiError) => {
                        this.actioning      = false;
                        this.uploadProgress = 0;
                        this.showError(err);
                    }
                });
        } else {
            this.submitReportData();
        }
    }

    private submitReportData(): void {
        if (!this.inv) return;
        this.uploadProgress = 90;
        this.investigationService.submitReport(this.inv.id, this.reportRequest)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning        = false;
                    this.uploadProgress   = 100;
                    this.showReportDialog = false;
                    this.reportRequest    = {
                        finalReport: '', conclusions: '',
                        recommendations: '', outcome: 'ADMINISTRATIVE_SANCTIONS'
                    };
                    this.reportFiles = [];
                    setTimeout(() => { this.uploadProgress = 0; }, 1000);
                    this.messageService.add({
                        severity: 'success',
                        summary:  'Rapport soumis',
                        detail:   "En attente d'approbation DEI."
                    });
                },
                error: (err: ApiError) => {
                    this.actioning      = false;
                    this.uploadProgress = 0;
                    this.showError(err);
                }
            });
    }

    executeApproveDei(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.approveDei(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning = false;
                    this.messageService.add({ severity: 'success', summary: 'Approuvé DEI' });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeApproveLegal(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.approveLegal(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning = false;
                    this.messageService.add({ severity: 'success', summary: 'Approuvé juridique' });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeApproveCge(): void {
        if (!this.inv || !this.cgeReason.trim()) return;
        this.actioning = true;
        this.investigationService.approveCge(this.inv.id, this.cgeReason)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv);
                    this.actioning     = false;
                    this.showCgeDialog = false;
                    this.cgeReason     = '';
                    this.messageService.add({
                        severity: 'success',
                        summary:  'Décision CGE rendue',
                        detail:   'Dossier → DÉCISION RENDUE'
                    });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeAddMember(): void {
        if (!this.inv || !this.newMemberAgentId) return;
        this.actioning = true;
        this.investigationService
            .addMember(this.inv.id, {
                agentId:  this.newMemberAgentId,
                teamRole: this.newMemberRole
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.investigationService.findById(this.inv!.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: freshInv => {
                                this.setInv(freshInv);
                                this.actioning           = false;
                                this.showAddMemberDialog = false;
                                this.newMemberAgentId    = '';
                                this.newMemberRole       = 'MEMBER';
                                this.messageService.add({
                                    severity: 'success',
                                    summary:  'Membre ajouté',
                                    detail:   'L\'équipe a été mise à jour.'
                                });
                            },
                            error: () => {
                                this.actioning           = false;
                                this.showAddMemberDialog = false;
                                this.newMemberAgentId    = '';
                                this.newMemberRole       = 'MEMBER';
                                this.messageService.add({
                                    severity: 'warn',
                                    summary:  'Membre ajouté',
                                    detail:   'Rafraîchissez si le membre n\'apparaît pas.'
                                });
                            }
                        });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

   
    executeRemoveMember(agentId: string): void {
        if (!this.inv) return;
        this.investigationService.removeMember(this.inv.id, agentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.investigationService.findById(this.inv!.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: freshInv => {
                                this.setInv(freshInv);
                                this.messageService.add({
                                    severity: 'info',
                                    summary:  'Membre retiré',
                                    detail:   'L\'équipe a été mise à jour.'
                                });
                            },
                            error: () => {
                                this.messageService.add({
                                    severity: 'warn',
                                    summary:  'Membre retiré',
                                    detail:   'Rafraîchissez si la liste n\'est pas à jour.'
                                });
                            }
                        });
                },
                error: (err: ApiError) => this.showError(err)
            });
    }


    getProgress(): number {
        if (!this.inv?.startDate || !this.inv?.plannedEndDate) return 0;
        const start = new Date(this.inv.startDate).getTime();
        const end   = new Date(
            this.inv.extendedDeadline ?? this.inv.plannedEndDate
        ).getTime();
        return Math.min(
            Math.max(Math.round(((Date.now() - start) / (end - start)) * 100), 0),
            100
        );
    }

    getProgressGradient(): string {
        if (this.inv?.overdue)        return 'linear-gradient(90deg,#ef4444,#dc2626)';
        if (this.getProgress() >= 80) return 'linear-gradient(90deg,#f59e0b,#d97706)';
        return 'linear-gradient(90deg,#22c55e,#16a34a)';
    }

    hasRole(roles: string[]): boolean {
        return this.keycloakService.hasAnyRole(roles);
    }

    getInitials(name: string): string {
        return (name || '')
            .split(' ')
            .map(n => n[0] ?? '')
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    getRoleLabel(role: TeamRole): string {
        return role === 'TEAM_LEADER' ? 'Chef mission' : 'Investigateur';
    }

    getStatusLabel(status: string): string {
        const labels: Readonly<Record<string, string>> = {
            INITIATED:   'Initiée',
            IN_PROGRESS: 'En cours',
            SUSPENDED:   'Suspendue',
            COMPLETED:   'Rapport soumis',
            ARCHIVED:    'Archivée'
        };
        return labels[status] ?? status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Readonly<Record<string, TagSeverity>> = {
            INITIATED:   'info',
            IN_PROGRESS: 'success',
            SUSPENDED:   'warn',
            COMPLETED:   'info',
            ARCHIVED:    'secondary'
        };
        return map[status] ?? 'info';
    }

    private showError(err: ApiError): void {
        this.messageService.add({
            severity: 'error',
            summary:  'Erreur',
            detail:   err.error?.message ?? "Une erreur s'est produite"
        });
    }
}