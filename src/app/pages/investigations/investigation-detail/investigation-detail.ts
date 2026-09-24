import {
    Component, OnInit, OnChanges, OnDestroy,
    Input, SimpleChanges, inject
} from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule }                         from '@angular/forms';
import { Subject }                             from 'rxjs';
import { takeUntil }                           from 'rxjs/operators';
import { ButtonModule }     from 'primeng/button';
import { TagModule }        from 'primeng/tag';
import { DialogModule }     from 'primeng/dialog';
import { TextareaModule }   from 'primeng/textarea';
import { SelectModule }     from 'primeng/select';
import { ToastModule }      from 'primeng/toast';
import { SkeletonModule }   from 'primeng/skeleton';
import { AvatarModule }     from 'primeng/avatar';
import { TooltipModule }    from 'primeng/tooltip';
import { EditorModule }     from 'primeng/editor';
import { InputTextModule }  from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule }   from 'primeng/checkbox';
import { MessageService }   from 'primeng/api';
import { environment }      from '../../../../environments/environment';
import {
    InvestigationService,
    InvestigationResponse,
    InvestigationMemberResponse,
    TeamRole,
    SubmitReportRequest,
    ExtendDeadlineRequest
} from '../../../core/services/investigation.service';
import { AgentService }      from '../../../core/services/agent.service';
import { KeycloakService }   from '../../../core/auth/keycloak.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import {
    TransmissionAutoriteService,
    TransmissionAutoriteResponse
} from '../../../core/services/transmission-autorite.service';
import {
    RequeteParquetService, RequeteParquetResponse,
    ConstitutionPartieCivileService, ConstitutionPartieCivileResponse,
    SuiviProcedurePenaleService, SuiviProcedurePenaleResponse
} from '../../../core/services/suites-judiciaires.service';
import {
    PlanActionsService, PlanActionsStatusResponse,
    MissionSuiviService, MissionSuiviResponse
} from '../../../core/services/suivi-sanctions.service';
import {
    DemandeDocumentsService, DemandeDocumentsResponse, EscalationLevel
} from '../../../core/services/demande-documents.service';
import {
    InventairePiecesService, InventairePieceItemResponse,
    AttachmentSource, ModeObtention, AttachmentStatus
} from '../../../core/services/inventaire-pieces.service';
import {
    AuditionService, AuditionResponse, IntervieweeType, AuditionStatus,
    PvAuditionResponse
} from '../../../core/services/audition.service';
import {
    VisiteTerrainService, VisiteTerrainResponse, VisiteStatus,
    PvConstatResponse
} from '../../../core/services/visite-terrain.service';
import {
    ChecklistDossierTravailService, ChecklistDossierTravailItemResponse
} from '../../../core/services/checklist-dossier-travail.service';
import {
    RapportEnqueteService, RapportEnqueteResponse, NoteRecommandationsResponse
} from '../../../core/services/rapport-enquete.service';
import { TargetedPartyService, TargetedPartyResponse } from '../../../core/services/targeted-party.service';
import { WitnessService, WitnessResponse } from '../../../core/services/witness.service';
import {
    FicheRetexService, FicheRetexResponse, FicheRetexRequest, PublierLeconRequest
} from '../../../core/services/fiche-retex.service';
import { TypeInfractionService, TypeInfraction } from '../../../core/services/parametres-metier.service';
import {
    InvestigationCadrageService, MandatResponse,
    EngagementConfidentialiteResponse,
    PlanInvestigationResponse, RevisionPlanResponse,
    IncidentObjectiviteResponse,
    ProcedureUrgenceResponse, StatutProcedureUrgence,
    MesureConservatoireResponse
} from '../../../core/services/investigation-cadrage.service';

type TagSeverity =
    | 'success' | 'info' | 'warn' | 'danger'
    | 'secondary' | 'contrast' | null | undefined;

type OutcomeValue =
    | 'ADMINISTRATIVE_SANCTIONS'
    | 'JUDICIAL_REFERRAL'
    | 'ARCHIVED'
    | 'PRESS_RELEASE'
    | 'ANNUAL_REPORT';

type ReportMode = 'ONLINE' | 'UPLOAD';

interface AgentOption  { label: string; value: string; }
interface SelectOption<T extends string = string> { label: string; value: T; }
interface ApprovalStep {
    label: string; icon: string; delay: string;
    done: boolean; active: boolean; date: string | null | undefined;
}
interface ApiError { error?: { message?: string }; }

@Component({
    selector:   'app-investigation-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, DialogModule,
        TextareaModule, SelectModule, ToastModule,
        SkeletonModule, AvatarModule, TooltipModule, EditorModule,
        InputTextModule, InputNumberModule, DatePickerModule,
        MultiSelectModule, CheckboxModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<!-- ── Dialog suspension ──────────────────────────────────── -->
<p-dialog [(visible)]="showSuspendDialog"
    header="Suspendre l'investigation"
    [modal]="true" [style]="{width:'440px'}">
    <div class="py-2">
        <label class="text-sm font-semibold text-surface-700 mb-2 block">
            Motif de suspension <span class="text-red-500">*</span>
        </label>
        <textarea pTextarea [(ngModel)]="suspendReason"
            placeholder="Expliquez la raison de la suspension..."
            rows="4" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showSuspendDialog=false"/>
        <p-button label="Suspendre" icon="pi pi-pause" severity="danger"
            [loading]="actioning" (onClick)="executeSuspend()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog prolongation ────────────────────────────────── -->
<p-dialog [(visible)]="showExtendDialog"
    header="Prolonger l'investigation"
    [modal]="true" [style]="{width:'540px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
            <i class="pi pi-book text-blue-600 mt-0.5 flex-shrink-0"></i>
            <div>
                <div class="text-xs font-bold text-blue-700 mb-1">Manuel des Procédures</div>
                <p class="text-xs text-blue-600 leading-relaxed">
                    Durée normale : <strong>90 jours</strong>.
                    Toute prolongation doit être validée par
                    <strong>DEI → CGEA → CGE</strong> avant d'être saisie.
                </p>
            </div>
        </div>
        <div *ngIf="inv?.plannedEndDate || inv?.extendedDeadline" class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl border border-surface-100">
                <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Échéance actuelle</div>
                <div class="font-bold text-sm"
                    [class.text-red-600]="inv?.overdue"
                    [class.text-surface-900]="!inv?.overdue">
                    {{ (inv?.extendedDeadline || inv?.plannedEndDate) | date:'dd/MM/yyyy' }}
                    <span *ngIf="inv?.overdue" class="ml-1 text-xs font-normal text-red-500">(dépassée)</span>
                </div>
            </div>
            <div class="p-3 bg-green-50 rounded-xl border border-green-200">
                <div class="text-xs text-green-600 uppercase tracking-wide mb-1">Nouvelle échéance</div>
                <div class="font-bold text-sm text-green-700">
                    {{ computedNewDeadline | date:'dd/MM/yyyy' }}
                </div>
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-2 block uppercase tracking-wide">
                Durée supplémentaire (jours) <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="flex items-center gap-3 mb-2">
                <input type="number" [(ngModel)]="extendDays"
                    (ngModelChange)="onExtendDaysChange()"
                    min="1" max="365"
                    class="p-inputtext w-28 text-center text-xl font-bold font-mono"/>
                <span class="text-sm text-surface-400">jours supplémentaires</span>
            </div>
            <div class="flex gap-2 flex-wrap">
                <button *ngFor="let opt of extendOptions"
                    class="text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
                    [class.bg-primary-100]="extendDays === opt.days"
                    [class.text-primary-700]="extendDays === opt.days"
                    [class.border-primary-300]="extendDays === opt.days"
                    [class.bg-surface-100]="extendDays !== opt.days"
                    [class.text-surface-500]="extendDays !== opt.days"
                    [class.border-surface-200]="extendDays !== opt.days"
                    (click)="setExtendDays(opt.days)">
                    {{ opt.label }}
                </button>
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Motif de la prolongation <span class="text-red-500 ml-1">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="extendReason" rows="4" class="w-full resize-none"
                [class.border-red-400]="extendReasonError"
                placeholder="Ex: Complexité nécessitant des investigations complémentaires...">
            </textarea>
            <p *ngIf="extendReasonError" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                <i class="pi pi-exclamation-circle text-xs"></i> Le motif est obligatoire
            </p>
        </div>
        <label class="flex items-start gap-2 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <input type="checkbox" [(ngModel)]="hierarchyApproved" class="mt-0.5 flex-shrink-0"/>
            <span class="text-sm text-amber-800">
                <strong>Je confirme</strong> avoir obtenu l'accord de la hiérarchie (DEI, CGEA, CGE)
            </span>
        </label>
        <p *ngIf="hierarchyApprovedError" class="text-xs text-red-500 -mt-2 flex items-center gap-1">
            <i class="pi pi-exclamation-circle text-xs"></i> Vous devez confirmer l'accord hiérarchique.
        </p>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="cancelExtend()"/>
        <p-button label="Confirmer la prolongation" icon="pi pi-calendar-plus"
            severity="info" [loading]="actioning" (onClick)="executeExtend()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog rapport ─────────────────────────────────────── -->
<p-dialog [(visible)]="showReportDialog"
    header="Soumettre le rapport final"
    [modal]="true" [style]="{width:'740px'}" [draggable]="false">
    <div class="flex flex-col gap-5 py-2">
        <div class="grid grid-cols-2 gap-3">
            <div class="border-2 rounded-xl p-3 cursor-pointer transition-all"
                [class.border-primary-500]="reportMode==='ONLINE'"
                [class.bg-primary-50]="reportMode==='ONLINE'"
                [class.border-surface-200]="reportMode!=='ONLINE'"
                [class.bg-surface-50]="reportMode!=='ONLINE'"
                (click)="setReportMode('ONLINE')">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        [class.bg-primary-100]="reportMode==='ONLINE'"
                        [class.bg-surface-200]="reportMode!=='ONLINE'">
                        <i class="pi pi-file-edit"
                            [class.text-primary-600]="reportMode==='ONLINE'"
                            [class.text-surface-400]="reportMode!=='ONLINE'"></i>
                    </div>
                    <div>
                        <div class="font-bold text-sm"
                            [class.text-primary-700]="reportMode==='ONLINE'"
                            [class.text-surface-600]="reportMode!=='ONLINE'">Rédiger en ligne</div>
                        <div class="text-xs mt-0.5"
                            [class.text-primary-500]="reportMode==='ONLINE'"
                            [class.text-surface-400]="reportMode!=='ONLINE'">Saisir le rapport dans l'éditeur</div>
                    </div>
                    <div *ngIf="reportMode==='ONLINE'"
                        class="ml-auto w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-check text-white" style="font-size:9px;"></i>
                    </div>
                </div>
            </div>
            <div class="border-2 rounded-xl p-3 cursor-pointer transition-all"
                [class.border-green-500]="reportMode==='UPLOAD'"
                [class.bg-green-50]="reportMode==='UPLOAD'"
                [class.border-surface-200]="reportMode!=='UPLOAD'"
                [class.bg-surface-50]="reportMode!=='UPLOAD'"
                (click)="setReportMode('UPLOAD')">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        [class.bg-green-100]="reportMode==='UPLOAD'"
                        [class.bg-surface-200]="reportMode!=='UPLOAD'">
                        <i class="pi pi-file-pdf"
                            [class.text-green-600]="reportMode==='UPLOAD'"
                            [class.text-surface-400]="reportMode!=='UPLOAD'"></i>
                    </div>
                    <div>
                        <div class="font-bold text-sm"
                            [class.text-green-700]="reportMode==='UPLOAD'"
                            [class.text-surface-600]="reportMode!=='UPLOAD'">Importer un rapport</div>
                        <div class="text-xs mt-0.5"
                            [class.text-green-500]="reportMode==='UPLOAD'"
                            [class.text-surface-400]="reportMode!=='UPLOAD'">Uploader un PDF déjà rédigé</div>
                    </div>
                    <div *ngIf="reportMode==='UPLOAD'"
                        class="ml-auto w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-check text-white" style="font-size:9px;"></i>
                    </div>
                </div>
            </div>
        </div>

        <ng-container *ngIf="reportMode==='ONLINE'">
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                <div class="text-xs text-blue-700 leading-relaxed">
                    Rédigez le rapport dans les champs ci-dessous.
                    Un <strong>PDF officiel ASCE-LC sera généré automatiquement</strong> à la soumission.
                </div>
            </div>
            <div>
                <label class="text-sm font-semibold text-surface-700 mb-2 block">
                    Rapport complet <span class="text-red-500">*</span>
                </label>
                <p-editor [(ngModel)]="reportRequest.finalReport" [style]="{'height':'160px'}"
                    placeholder="Rapport détaillé de l'investigation...">
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
                        <span class="ql-formats"><button class="ql-clean"></button></span>
                    </ng-template>
                </p-editor>
            </div>
            <div>
                <label class="text-sm font-semibold text-surface-700 mb-2 block">
                    Conclusions <span class="text-red-500">*</span>
                </label>
                <p-editor [(ngModel)]="reportRequest.conclusions" [style]="{'height':'120px'}"
                    placeholder="Conclusions principales...">
                    <ng-template pTemplate="header">
                        <span class="ql-formats">
                            <button class="ql-bold"></button>
                            <button class="ql-italic"></button>
                        </span>
                        <span class="ql-formats">
                            <button class="ql-list" value="ordered"></button>
                            <button class="ql-list" value="bullet"></button>
                        </span>
                        <span class="ql-formats"><button class="ql-clean"></button></span>
                    </ng-template>
                </p-editor>
            </div>
            <div>
                <label class="text-sm font-semibold text-surface-700 mb-2 block">
                    Recommandations
                    <span class="text-surface-400 font-normal text-xs ml-1">(optionnel)</span>
                </label>
                <p-editor [(ngModel)]="reportRequest.recommendations" [style]="{'height':'100px'}"
                    placeholder="Recommandations...">
                    <ng-template pTemplate="header">
                        <span class="ql-formats">
                            <button class="ql-bold"></button>
                            <button class="ql-italic"></button>
                        </span>
                        <span class="ql-formats">
                            <button class="ql-list" value="ordered"></button>
                            <button class="ql-list" value="bullet"></button>
                        </span>
                    </ng-template>
                </p-editor>
            </div>
            <div class="flex items-center gap-2 p-3 bg-surface-50 border border-surface-200 rounded-xl">
                <i class="pi pi-file-pdf text-red-500"></i>
                <span class="text-xs text-surface-600 flex-1">Un PDF officiel sera généré automatiquement à la soumission.</span>
                <p-button label="Aperçu PDF" icon="pi pi-eye" severity="secondary" outlined size="small"
                    [disabled]="!reportRequest.finalReport || !reportRequest.conclusions"
                    [loading]="generatingPreview"
                    pTooltip="Générer un aperçu du rapport PDF"
                    (onClick)="previewReportPdf()"/>
            </div>
        </ng-container>

        <ng-container *ngIf="reportMode==='UPLOAD'">
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <i class="pi pi-info-circle text-amber-500 mt-0.5"></i>
                <div class="text-xs text-amber-800 leading-relaxed">
                    Importez le rapport <strong>déjà rédigé et signé</strong> (format PDF recommandé).
                </div>
            </div>
            <div>
                <label class="text-sm font-semibold text-surface-700 mb-2 block">
                    Rapport officiel (fichier) <span class="text-red-500">*</span>
                </label>
                <div *ngIf="!uploadedReportFile"
                    class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
                    [class.border-green-400]="isDragOver" [class.bg-green-50]="isDragOver"
                    [class.border-surface-300]="!isDragOver" [class.bg-surface-50]="!isDragOver"
                    (dragover)="onDragOver($event)" (dragleave)="isDragOver=false"
                    (drop)="onReportFileDrop($event)" (click)="reportFileInput.click()">
                    <input #reportFileInput type="file" class="hidden" accept=".pdf,.doc,.docx"
                        (change)="onReportFileSelect($event)"/>
                    <div class="w-14 h-14 rounded-2xl bg-red-50 border border-red-200
                                flex items-center justify-center mx-auto mb-3">
                        <i class="pi pi-file-pdf text-red-500 text-2xl"></i>
                    </div>
                    <p class="font-semibold text-surface-700 mb-1">Cliquez ou glissez votre rapport ici</p>
                    <p class="text-xs text-surface-400">PDF, Word — max 50 Mo</p>
                </div>
                <div *ngIf="uploadedReportFile"
                    class="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                    <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-file-pdf text-red-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-sm text-surface-900 truncate">{{ uploadedReportFile.name }}</div>
                        <div class="text-xs text-surface-400 mt-0.5">
                            {{ formatFileSize(uploadedReportFile.size) }}
                            <span class="ml-2 text-green-600 font-semibold">
                                <i class="pi pi-check-circle" style="font-size:10px;"></i> Fichier prêt
                            </span>
                        </div>
                    </div>
                    <p-button icon="pi pi-times" severity="danger" text size="small"
                        pTooltip="Supprimer" (onClick)="uploadedReportFile=null"/>
                </div>
            </div>
            <div>
                <label class="text-sm font-semibold text-surface-700 mb-2 block">
                    Résumé des conclusions <span class="text-red-500">*</span>
                    <span class="text-surface-400 font-normal text-xs ml-2">(pour la traçabilité système)</span>
                </label>
                <textarea pTextarea [(ngModel)]="reportRequest.conclusions"
                    rows="4" class="w-full resize-none"
                    placeholder="Résumez les conclusions principales du rapport importé..."></textarea>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-2 block uppercase tracking-wide">
                    Annexes complémentaires <span class="text-surface-300 font-normal">(optionnel)</span>
                </label>
                <div class="border border-dashed border-surface-200 rounded-xl p-3
                            text-center cursor-pointer bg-surface-50 hover:bg-surface-100 transition"
                    (click)="annexInput.click()">
                    <input #annexInput type="file" multiple class="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
                        (change)="onFileSelect($event)"/>
                    <i class="pi pi-paperclip text-surface-300 text-lg mb-1 block"></i>
                    <p class="text-xs text-surface-400">Cliquez pour ajouter des annexes</p>
                </div>
            </div>
        </ng-container>

        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Issue / Résultat <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="reportRequest.outcome"
                [options]="outcomeOptions" optionLabel="label" optionValue="value"
                placeholder="Sélectionner..." styleClass="w-full" appendTo="body"/>
        </div>

        <div *ngIf="reportMode==='ONLINE'" class="border-t border-surface-100 pt-4">
            <div class="flex items-center gap-2 mb-3">
                <div class="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <i class="pi pi-paperclip text-amber-600 text-xs"></i>
                </div>
                <span class="text-sm font-semibold text-surface-700">Annexes</span>
                <span class="text-xs text-surface-400">(optionnel)</span>
            </div>
            <div class="border-2 border-dashed border-surface-200 rounded-xl p-4
                        hover:border-primary-300 transition-colors cursor-pointer"
                (dragover)="$event.preventDefault()" (drop)="onFileDrop($event)">
                <div class="flex flex-col items-center gap-2 text-surface-400 text-sm">
                    <i class="pi pi-upload text-2xl text-surface-300"></i>
                    <span>Glissez vos fichiers ici ou</span>
                    <label class="cursor-pointer">
                        <span class="text-primary-600 font-semibold hover:underline">Parcourir</span>
                        <input type="file" multiple class="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
                            (change)="onFileSelect($event)"/>
                    </label>
                    <span class="text-xs text-surface-300">PDF, Word, Images — max 10 Mo</span>
                </div>
            </div>
        </div>

        <div *ngIf="reportFiles.length > 0" class="flex flex-col gap-2">
            <div *ngFor="let f of reportFiles; let i = index"
                class="flex items-center gap-3 p-2.5 bg-surface-50 rounded-xl border border-surface-100">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    [class.bg-red-100]="f.type.includes('pdf')"
                    [class.bg-blue-100]="f.type.startsWith('image/')"
                    [class.bg-surface-200]="!f.type.includes('pdf') && !f.type.startsWith('image/')">
                    <i class="pi text-xs"
                        [class.pi-file-pdf]="f.type.includes('pdf')"
                        [class.text-red-600]="f.type.includes('pdf')"
                        [class.pi-image]="f.type.startsWith('image/')"
                        [class.text-blue-600]="f.type.startsWith('image/')"
                        [class.pi-file]="!f.type.includes('pdf') && !f.type.startsWith('image/')"
                        [class.text-surface-500]="!f.type.includes('pdf') && !f.type.startsWith('image/')"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-surface-900 truncate">{{ f.name }}</div>
                    <div class="text-xs text-surface-400">{{ formatFileSize(f.size) }}</div>
                </div>
                <p-button icon="pi pi-times" severity="danger" text size="small" (onClick)="removeReportFile(i)"/>
            </div>
        </div>

        <div *ngIf="uploadProgress > 0 && uploadProgress < 100" class="mt-1">
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
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="cancelReport()"/>
        <p-button
            [label]="reportMode==='ONLINE' ? 'Soumettre et générer PDF' : 'Soumettre le rapport'"
            [icon]="reportMode==='ONLINE' ? 'pi pi-file-pdf' : 'pi pi-send'"
            severity="success" [loading]="actioning" [disabled]="!canSubmitReport()"
            (onClick)="executeSubmitReport()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog CGE ─────────────────────────────────────────── -->
<p-dialog [(visible)]="showCgeDialog"
    header="Décision finale CGE"
    [modal]="true" [style]="{width:'500px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div class="p-4 rounded-xl border"
            [class.bg-surface-50]="inv?.outcome === 'ARCHIVED'"
            [class.border-surface-200]="inv?.outcome === 'ARCHIVED'"
            [class.bg-green-50]="inv?.outcome !== 'ARCHIVED'"
            [class.border-green-200]="inv?.outcome !== 'ARCHIVED'">
            <div class="flex items-center gap-2 mb-2">
                <i class="pi"
                    [class.pi-folder]="inv?.outcome === 'ARCHIVED'"
                    [class.text-surface-500]="inv?.outcome === 'ARCHIVED'"
                    [class.pi-check-circle]="inv?.outcome !== 'ARCHIVED'"
                    [class.text-green-600]="inv?.outcome !== 'ARCHIVED'"></i>
                <span class="text-sm font-bold"
                    [class.text-surface-600]="inv?.outcome === 'ARCHIVED'"
                    [class.text-green-700]="inv?.outcome !== 'ARCHIVED'">
                    {{ getCgeResultLabel() }}
                </span>
            </div>
            <p class="text-xs leading-relaxed mb-3"
                [class.text-surface-500]="inv?.outcome === 'ARCHIVED'"
                [class.text-green-600]="inv?.outcome !== 'ARCHIVED'">
                {{ getCgeResultDescription() }}
            </p>
            <div class="flex items-center gap-2">
                <span class="text-xs text-surface-400">Statut résultant :</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                    [class.bg-surface-200]="inv?.outcome === 'ARCHIVED'"
                    [class.text-surface-600]="inv?.outcome === 'ARCHIVED'"
                    [class.bg-green-100]="inv?.outcome !== 'ARCHIVED'"
                    [class.text-green-700]="inv?.outcome !== 'ARCHIVED'">
                    {{ inv?.outcome === 'ARCHIVED' ? 'CLASSÉ' : 'DÉCISION RENDUE' }}
                </span>
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Décision et justification <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="cgeReason"
                placeholder="Motivez la décision finale du CGE..."
                rows="4" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showCgeDialog=false"/>
        <p-button
            [label]="inv?.outcome==='ARCHIVED' ? 'Classer sans suite' : 'Valider la décision'"
            [icon]="inv?.outcome==='ARCHIVED' ? 'pi pi-folder' : 'pi pi-hammer'"
            [severity]="inv?.outcome==='ARCHIVED' ? 'secondary' : 'success'"
            [loading]="actioning" [disabled]="!cgeReason.trim()"
            (onClick)="executeApproveCge()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog transmission autorité ───────────────────────── -->
<p-dialog [(visible)]="showTransmissionDialog"
    header="Transmettre à l'autorité"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Autorité destinataire <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="transmissionForm.autoriteDestinataire"
                placeholder="Ex : Procureur du Faso près le tribunal de..."
                class="w-full"/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showTransmissionDialog=false"/>
        <p-button label="Transmettre" icon="pi pi-send"
            [loading]="creatingTransmission" [disabled]="!transmissionForm.autoriteDestinataire.trim()"
            (onClick)="executeCreerTransmission()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog relance transmission ────────────────────────── -->
<p-dialog [(visible)]="showRelanceDialog"
    header="Ajouter une relance"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Contenu de la relance
            </label>
            <textarea pTextarea [(ngModel)]="relanceContenu"
                placeholder="Détails de la relance auprès de l'autorité..."
                rows="4" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showRelanceDialog=false"/>
        <p-button label="Ajouter" icon="pi pi-plus"
            [loading]="addingRelance" (onClick)="executeAjouterRelance()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog requête Parquet ─────────────────────────────── -->
<p-dialog [(visible)]="showRequeteParquetDialog"
    header="Requête au Parquet"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Contenu de la requête
            </label>
            <textarea pTextarea [(ngModel)]="requeteParquetContenu"
                placeholder="Rédigez la requête à adresser au Parquet..."
                rows="8" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showRequeteParquetDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="savingRequeteParquet" (onClick)="executeEnregistrerRequeteParquet()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog constitution de partie civile ──────────────────── -->
<p-dialog [(visible)]="showConstitutionDialog"
    header="Constitution de partie civile"
    [modal]="true" [style]="{width:'480px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Justification <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="constitutionForm.justification"
                placeholder="Motivez la constitution de partie civile de l'ASCE-LC..."
                rows="4" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Montant réclamé (FCFA)
            </label>
            <p-inputnumber [(ngModel)]="constitutionForm.montantReclame"
                [min]="0" mode="decimal" styleClass="w-full" inputStyleClass="w-full"/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showConstitutionDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="creatingConstitution" [disabled]="!constitutionForm.justification.trim()"
            (onClick)="executeCreerConstitution()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog suivi de procédure pénale ───────────────────────── -->
<p-dialog [(visible)]="showSuiviPenalDialog"
    header="Ajouter une étape de procédure pénale"
    [modal]="true" [style]="{width:'480px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Date de la phase <span class="text-red-500">*</span>
            </label>
            <p-datepicker [(ngModel)]="suiviPenalForm.phaseAt" dateFormat="dd/mm/yy"
                showIcon styleClass="w-full" appendTo="body"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Phase <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="suiviPenalForm.phase"
                placeholder="Ex : Instruction, Audience, Jugement..." class="w-full"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Commentaire
            </label>
            <textarea pTextarea [(ngModel)]="suiviPenalForm.commentaire"
                rows="3" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showSuiviPenalDialog=false"/>
        <p-button label="Ajouter" icon="pi pi-plus"
            [loading]="addingSuiviPenal" [disabled]="!suiviPenalForm.phaseAt || !suiviPenalForm.phase.trim()"
            (onClick)="executeAjouterSuiviPenal()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog plan d'actions ──────────────────────────────────── -->
<p-dialog [(visible)]="showPlanActionsDialog"
    header="Déposer le plan d'actions"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Entité contrôlée <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="planActionsForm.entiteControlee" class="w-full"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Contenu du plan d'actions <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="planActionsForm.contenu"
                rows="6" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPlanActionsDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="creatingPlanActions"
            [disabled]="!planActionsForm.entiteControlee.trim() || !planActionsForm.contenu.trim()"
            (onClick)="executeCreerPlanActions()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog note d'avancement ────────────────────────────────── -->
<p-dialog [(visible)]="showAvancementDialog"
    header="Ajouter une note d'avancement"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="avancementContenu"
            placeholder="Détails de l'avancement du plan d'actions..."
            rows="4" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showAvancementDialog=false"/>
        <p-button label="Ajouter" icon="pi pi-plus"
            [loading]="addingAvancement" (onClick)="executeAjouterAvancement()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog mission de suivi ─────────────────────────────────── -->
<p-dialog [(visible)]="showMissionDialog"
    header="Ajouter une mission de suivi"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Date de la mission <span class="text-red-500">*</span>
            </label>
            <p-datepicker [(ngModel)]="missionForm.missionDate" dateFormat="dd/mm/yy"
                showIcon styleClass="w-full" appendTo="body"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Objectifs <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="missionForm.objectifs" rows="2" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Synthèse des recommandations <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="missionForm.syntheseRecommandations" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Nouvelles recommandations
            </label>
            <textarea pTextarea [(ngModel)]="missionForm.nouvellesRecommandations" rows="2" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showMissionDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="addingMission"
            [disabled]="!missionForm.missionDate || !missionForm.objectifs.trim() || !missionForm.syntheseRecommandations.trim()"
            (onClick)="executeAjouterMission()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog nouvelle demande de documents ───────────────────── -->
<p-dialog [(visible)]="showDemandeDocumentsDialog"
    header="Nouvelle demande de documents"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Destinataire <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="demandeDocumentsForm.recipientLabel" class="w-full"
                placeholder="Ex : Banque XYZ, agence de Ouagadougou..."/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Documents demandés <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="demandeDocumentsForm.documentsRequested"
                rows="4" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showDemandeDocumentsDialog=false"/>
        <p-button label="Envoyer" icon="pi pi-send"
            [loading]="creatingDemande"
            [disabled]="!demandeDocumentsForm.recipientLabel.trim() || !demandeDocumentsForm.documentsRequested.trim()"
            (onClick)="executeCreerDemandeDocuments()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog adresse erronée ───────────────────────────────── -->
<p-dialog [(visible)]="showAddressErrorDialog"
    header="Corriger l'adresse du destinataire"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Destinataire corrigé <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="addressErrorForm.correctedRecipientLabel" class="w-full"/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showAddressErrorDialog=false"/>
        <p-button label="Corriger et renvoyer" icon="pi pi-check"
            [loading]="correctingAddress" [disabled]="!addressErrorForm.correctedRecipientLabel.trim()"
            (onClick)="executeReportAddressError()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog planifier audition ─────────────────────────────── -->
<p-dialog [(visible)]="showScheduleAuditionDialog"
    header="Planifier une audition"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Personne à auditionner <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="scheduleAuditionForm.intervieweeType" [options]="intervieweeTypeOptions"
                optionLabel="label" optionValue="value" placeholder="Sélectionner..."
                styleClass="w-full" appendTo="body"/>
        </div>
        <div *ngIf="scheduleAuditionForm.intervieweeType==='TARGETED_PARTY'">
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Partie visée <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="scheduleAuditionForm.targetedPartyId" [options]="targetedParties"
                optionLabel="name" optionValue="id" placeholder="Sélectionner..."
                styleClass="w-full" appendTo="body">
                <ng-template let-p pTemplate="item">{{ (p.firstName || '') + ' ' + (p.name || '') }}</ng-template>
                <ng-template let-p pTemplate="selectedItem">{{ (p.firstName || '') + ' ' + (p.name || '') }}</ng-template>
            </p-select>
        </div>
        <div *ngIf="scheduleAuditionForm.intervieweeType==='WITNESS'">
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Témoin <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="scheduleAuditionForm.witnessId" [options]="witnesses"
                optionLabel="lastName" optionValue="id" placeholder="Sélectionner..."
                styleClass="w-full" appendTo="body">
                <ng-template let-w pTemplate="item">{{ w.firstName }} {{ w.lastName }}</ng-template>
                <ng-template let-w pTemplate="selectedItem">{{ w.firstName }} {{ w.lastName }}</ng-template>
            </p-select>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                    Date et heure <span class="text-red-500">*</span>
                </label>
                <p-datepicker [(ngModel)]="scheduleAuditionForm.scheduledAt" dateFormat="dd/mm/yy"
                    [showTime]="true" showIcon styleClass="w-full" appendTo="body"/>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Lieu</label>
                <input pInputText [(ngModel)]="scheduleAuditionForm.location" class="w-full"/>
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Enquêteurs (au moins 2) <span class="text-red-500">*</span>
            </label>
            <p-multiselect [(ngModel)]="scheduleAuditionForm.investigatorIds" [options]="availableAgents"
                optionLabel="label" optionValue="value" placeholder="Sélectionner..."
                styleClass="w-full" appendTo="body" display="chip"/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showScheduleAuditionDialog=false"/>
        <p-button label="Planifier" icon="pi pi-check"
            [loading]="schedulingAudition" [disabled]="!canScheduleAudition()"
            (onClick)="executeScheduleAudition()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog tenir audition ──────────────────────────────────── -->
<p-dialog [(visible)]="showConductAuditionDialog"
    header="Tenir l'audition"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
            Compte-rendu <span class="text-red-500">*</span>
        </label>
        <textarea pTextarea [(ngModel)]="conductSummary" rows="6" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showConductAuditionDialog=false"/>
        <p-button label="Valider" icon="pi pi-check"
            [loading]="conductingAudition" [disabled]="!conductSummary.trim()"
            (onClick)="executeConductAudition()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog annuler audition ─────────────────────────────────── -->
<p-dialog [(visible)]="showCancelAuditionDialog"
    header="Annuler l'audition"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
            Motif d'annulation <span class="text-red-500">*</span>
        </label>
        <textarea pTextarea [(ngModel)]="cancelAuditionReason" rows="3" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Retour" severity="secondary" outlined (onClick)="showCancelAuditionDialog=false"/>
        <p-button label="Confirmer l'annulation" icon="pi pi-times" severity="danger"
            [loading]="cancellingAudition" [disabled]="!cancelAuditionReason.trim()"
            (onClick)="executeCancelAudition()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog absence à l'audition ───────────────────────────────── -->
<p-dialog [(visible)]="showNoShowDialog"
    header="Constater une absence"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
            Note (optionnelle)
        </label>
        <textarea pTextarea [(ngModel)]="noShowNote" rows="3" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showNoShowDialog=false"/>
        <p-button label="Constater l'absence" icon="pi pi-user-minus" severity="warn"
            [loading]="markingNoShow" (onClick)="executeMarkNoShow()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog rédiger le PV ───────────────────────────────────── -->
<p-dialog [(visible)]="showPvCreateDialog"
    header="Rédiger le procès-verbal"
    [modal]="true" [style]="{width:'600px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="pvCreateContent" rows="10" class="w-full"
            placeholder="Contenu du procès-verbal..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPvCreateDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="creatingPv" [disabled]="!pvCreateContent.trim()"
            (onClick)="executeCreatePv()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog finaliser le PV ─────────────────────────────────── -->
<p-dialog [(visible)]="showPvFinalizeDialog"
    header="Finaliser le procès-verbal"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-3 py-2">
        <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="pvFinalizeForm.intervieweeSigned" [binary]="true" inputId="pvSigned"
                (onChange)="pvFinalizeForm.intervieweeSignatureRefused=false"/>
            <label for="pvSigned" class="text-sm">Signé par la personne auditionnée</label>
        </div>
        <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="pvFinalizeForm.intervieweeSignatureRefused" [binary]="true" inputId="pvRefused"
                (onChange)="pvFinalizeForm.intervieweeSigned=false"/>
            <label for="pvRefused" class="text-sm">Signature refusée</label>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPvFinalizeDialog=false"/>
        <p-button label="Finaliser" icon="pi pi-verified"
            [loading]="finalizingPv" (onClick)="executeFinalizePv()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog corriger le PV ─────────────────────────────────── -->
<p-dialog [(visible)]="showPvCorrectionDialog"
    header="Corriger le procès-verbal"
    [modal]="true" [style]="{width:'600px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Nouveau contenu <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="pvCorrectionForm.content" rows="8" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Motif de la correction <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="pvCorrectionForm.motifCorrection" rows="2" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPvCorrectionDialog=false"/>
        <p-button label="Enregistrer la correction" icon="pi pi-check"
            [loading]="correctingPv"
            [disabled]="!pvCorrectionForm.content.trim() || !pvCorrectionForm.motifCorrection.trim()"
            (onClick)="executeCorrectPv()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog planifier visite terrain ─────────────────────────── -->
<p-dialog [(visible)]="showScheduleVisiteDialog"
    header="Planifier une visite terrain"
    [modal]="true" [style]="{width:'500px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Lieu <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="scheduleVisiteForm.location" class="w-full"
                placeholder="Ex : Siège de l'entité contrôlée, Ouagadougou..."/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Date et heure <span class="text-red-500">*</span>
            </label>
            <p-datepicker [(ngModel)]="scheduleVisiteForm.scheduledAt" dateFormat="dd/mm/yy"
                [showTime]="true" showIcon styleClass="w-full" appendTo="body"/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showScheduleVisiteDialog=false"/>
        <p-button label="Planifier" icon="pi pi-check"
            [loading]="schedulingVisite"
            [disabled]="!scheduleVisiteForm.location.trim() || !scheduleVisiteForm.scheduledAt"
            (onClick)="executeScheduleVisite()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog tenir visite terrain ──────────────────────────────── -->
<p-dialog [(visible)]="showConductVisiteDialog"
    header="Tenir la visite terrain"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
            Compte-rendu <span class="text-red-500">*</span>
        </label>
        <textarea pTextarea [(ngModel)]="conductVisiteSummary" rows="6" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showConductVisiteDialog=false"/>
        <p-button label="Valider" icon="pi pi-check"
            [loading]="conductingVisite" [disabled]="!conductVisiteSummary.trim()"
            (onClick)="executeConductVisite()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog annuler visite terrain ─────────────────────────────── -->
<p-dialog [(visible)]="showCancelVisiteDialog"
    header="Annuler la visite terrain"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
            Motif d'annulation <span class="text-red-500">*</span>
        </label>
        <textarea pTextarea [(ngModel)]="cancelVisiteReason" rows="3" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Retour" severity="secondary" outlined (onClick)="showCancelVisiteDialog=false"/>
        <p-button label="Confirmer l'annulation" icon="pi pi-times" severity="danger"
            [loading]="cancellingVisite" [disabled]="!cancelVisiteReason.trim()"
            (onClick)="executeCancelVisite()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog carence visite terrain ─────────────────────────────── -->
<p-dialog [(visible)]="showCarenceDialog"
    header="Constater une carence"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
            Motif de la carence <span class="text-red-500">*</span>
        </label>
        <textarea pTextarea [(ngModel)]="carenceReason" rows="3" class="w-full"
            placeholder="Ex : site inaccessible, accès refusé..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showCarenceDialog=false"/>
        <p-button label="Constater la carence" icon="pi pi-exclamation-triangle" severity="warn"
            [loading]="markingCarence" [disabled]="!carenceReason.trim()"
            (onClick)="executeMarkCarence()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog rédiger PV de constat ─────────────────────────────── -->
<p-dialog [(visible)]="showPvConstatCreateDialog"
    header="Rédiger le procès-verbal de constat"
    [modal]="true" [style]="{width:'600px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="pvConstatContent" rows="10" class="w-full"
            placeholder="Contenu du procès-verbal de constat..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPvConstatCreateDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="creatingPvConstat" [disabled]="!pvConstatContent.trim()"
            (onClick)="executeCreatePvConstat()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog commentaire check-list ───────────────────────────── -->
<p-dialog [(visible)]="showChecklistCommentDialog"
    header="Commentaire du point de contrôle"
    [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="checklistCommentValue" rows="4" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showChecklistCommentDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check" (onClick)="executeSaveChecklistComment()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog rapport d'enquête ─────────────────────────────────── -->
<p-dialog [(visible)]="showRapportEnqueteDialog"
    header="Rapport d'enquête officiel"
    [modal]="true" [style]="{width:'680px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Titre</label>
            <input pInputText [(ngModel)]="rapportEnqueteForm.titre" class="w-full"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Introduction</label>
            <textarea pTextarea [(ngModel)]="rapportEnqueteForm.introduction" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Méthodologie</label>
            <textarea pTextarea [(ngModel)]="rapportEnqueteForm.methodologie" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Informations collectées</label>
            <textarea pTextarea [(ngModel)]="rapportEnqueteForm.informationsCollectees" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Exposé factuel des anomalies</label>
            <textarea pTextarea [(ngModel)]="rapportEnqueteForm.exposeFactuelAnomalies" rows="4" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Quantification du préjudice</label>
            <textarea pTextarea [(ngModel)]="rapportEnqueteForm.quantificationPrejudice" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Réserves</label>
            <textarea pTextarea [(ngModel)]="rapportEnqueteForm.reserves" rows="2" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Conclusions</label>
            <textarea pTextarea [(ngModel)]="rapportEnqueteForm.conclusions" rows="3" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showRapportEnqueteDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="savingRapportEnquete" (onClick)="executeSaveRapportEnquete()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog note de recommandations ───────────────────────────── -->
<p-dialog [(visible)]="showNoteRecommandationsDialog"
    header="Note de recommandations"
    [modal]="true" [style]="{width:'600px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="noteRecommandationsContent" rows="8" class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showNoteRecommandationsDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [loading]="savingNoteRecommandations" (onClick)="executeSaveNoteRecommandations()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog fiche RETEX ────────────────────────────────────────── -->
<p-dialog [(visible)]="showFicheRetexDialog"
    header="Fiche RETEX (retour d'expérience)"
    [modal]="true" [style]="{width:'680px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Type d'infraction</label>
            <p-select [(ngModel)]="ficheRetexForm.typeInfractionId" [options]="typesInfractionOptions"
                optionLabel="libelle" optionValue="id" placeholder="Sélectionner..."
                styleClass="w-full" appendTo="body" [showClear]="true"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Lieu</label>
            <input pInputText [(ngModel)]="ficheRetexForm.lieu" class="w-full"/>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Impact financier</label>
                <p-inputnumber [(ngModel)]="ficheRetexForm.impactFinancier" [min]="0" mode="decimal" styleClass="w-full" inputStyleClass="w-full"/>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Jours-hommes chargés</label>
                <p-inputnumber [(ngModel)]="ficheRetexForm.joursCharges" [min]="0" styleClass="w-full" inputStyleClass="w-full"/>
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Contexte</label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.contexte" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Origine des soupçons</label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.origineSoupcons" rows="2" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Difficultés rencontrées</label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.difficultesRencontrees" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Originalité des schémas</label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.originaliteSchemas" rows="2" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Stratégie et méthodes employées</label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.strategieMethodes" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Collaborateurs planifiés</label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.collaborateursPlanifies" rows="2" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Synthèse des résultats <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.syntheseResultats" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Enseignements et axes d'amélioration <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="ficheRetexForm.enseignementsAxesAmelioration" rows="4" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showFicheRetexDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [disabled]="!ficheRetexForm.syntheseResultats.trim() || !ficheRetexForm.enseignementsAxesAmelioration.trim()"
            [loading]="savingFicheRetex" (onClick)="executeSaveFicheRetex()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog publier leçon à partager ─────────────────────────────── -->
<p-dialog [(visible)]="showPublierLeconDialog"
    header="Publier comme leçon à partager"
    [modal]="true" [style]="{width:'560px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <p class="text-xs text-surface-400">
            Cette leçon sera visible par tous les agents dans la page « Leçons à partager ».
        </p>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Titre <span class="text-red-500">*</span>
            </label>
            <input pInputText [(ngModel)]="publierLeconForm.titre" class="w-full"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Résumé <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="publierLeconForm.resume" rows="6" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPublierLeconDialog=false"/>
        <p-button label="Publier" icon="pi pi-send"
            [disabled]="!publierLeconForm.titre.trim() || !publierLeconForm.resume.trim()"
            [loading]="savingPublierLecon" (onClick)="executeSavePublierLecon()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog engagement préalable ──────────────────────────────── -->
<p-dialog [(visible)]="showEngagementDialog" header="Mon engagement préalable"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-2 block uppercase tracking-wide">
                Avez-vous un conflit d'intérêts sur cette investigation ? <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
                <p-button label="Non" [outlined]="engagementForm.hasConflictOfInterest !== false"
                    severity="success" size="small" (onClick)="engagementForm.hasConflictOfInterest = false"/>
                <p-button label="Oui" [outlined]="engagementForm.hasConflictOfInterest !== true"
                    severity="warn" size="small" (onClick)="engagementForm.hasConflictOfInterest = true"/>
            </div>
        </div>
        <div *ngIf="engagementForm.hasConflictOfInterest">
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Détails du conflit</label>
            <textarea pTextarea [(ngModel)]="engagementForm.conflictDetails" rows="3" class="w-full"></textarea>
        </div>
        <p class="text-xs text-surface-400">
            En validant, vous vous engagez également à respecter la confidentialité de cette investigation.
        </p>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showEngagementDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [disabled]="engagementForm.hasConflictOfInterest === null"
            [loading]="savingEngagement" (onClick)="executeSaveEngagement()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog plan d'investigation ──────────────────────────────── -->
<p-dialog [(visible)]="showPlanDialog" [header]="planDialogHeader"
    [modal]="true" [style]="{width:'640px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Objectifs <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="planForm.objectifs" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Méthodologie <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="planForm.methodologie" rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Moyens mobilisés</label>
            <textarea pTextarea [(ngModel)]="planForm.moyensMobilises" rows="2" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Planning / procédures</label>
            <textarea pTextarea [(ngModel)]="planForm.planningProcedures" rows="2" class="w-full"></textarea>
        </div>
        <div *ngIf="plan">
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">
                Motif de la révision <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="planForm.motifRevision" rows="2" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showPlanDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check"
            [disabled]="!planForm.objectifs.trim() || !planForm.methodologie.trim() || (!!plan && !planForm.motifRevision.trim())"
            [loading]="savingPlan" (onClick)="executeSavePlan()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog incident d'objectivité ─────────────────────────────── -->
<p-dialog [(visible)]="showIncidentDialog" header="Déclarer un incident d'objectivité"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="incidentDescription" rows="4" class="w-full"
            placeholder="Description de l'incident..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showIncidentDialog=false"/>
        <p-button label="Déclarer" icon="pi pi-check"
            [disabled]="!incidentDescription.trim()"
            [loading]="savingIncident" (onClick)="executeDeclareIncident()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog demande procédure d'urgence ────────────────────────── -->
<p-dialog [(visible)]="showProcedureDialog" header="Demander une procédure d'urgence"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="procedureJustification" rows="4" class="w-full"
            placeholder="Justification de la procédure d'urgence..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showProcedureDialog=false"/>
        <p-button label="Demander" icon="pi pi-check"
            [disabled]="!procedureJustification.trim()"
            [loading]="savingProcedure" (onClick)="executeDemanderProcedure()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog décision procédure d'urgence ───────────────────────── -->
<p-dialog [(visible)]="showProcedureDecisionDialog" header="Décision sur la procédure d'urgence"
    [modal]="true" [style]="{width:'480px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="procedureDecisionMotif" rows="3" class="w-full"
            placeholder="Motif de la décision (optionnel)..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showProcedureDecisionDialog=false"/>
        <p-button label="Confirmer" icon="pi pi-check"
            [loading]="savingProcedure" (onClick)="executeDecideProcedure()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog mesure conservatoire ───────────────────────────────── -->
<p-dialog [(visible)]="showMesureDialog" header="Déclarer une mesure conservatoire"
    [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <textarea pTextarea [(ngModel)]="mesureDescription" rows="4" class="w-full"
            placeholder="Description de la mesure conservatoire..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showMesureDialog=false"/>
        <p-button label="Déclarer" icon="pi pi-check"
            [disabled]="!mesureDescription.trim()"
            [loading]="savingMesure" (onClick)="executeDeclarerMesure()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog ajout membre ────────────────────────────────── -->
<p-dialog [(visible)]="showAddMemberDialog"
    header="Ajouter un membre à l'équipe"
    [modal]="true" [style]="{width:'500px'}">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Agent <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="newMemberAgentId"
                [options]="availableAgents" optionLabel="label" optionValue="value"
                placeholder="Sélectionner un agent..."
                styleClass="w-full" [filter]="true" appendTo="body"/>
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Rôle <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="newMemberRole"
                [options]="roleOptions" optionLabel="label" optionValue="value"
                styleClass="w-full" appendTo="body"/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showAddMemberDialog=false"/>
        <p-button label="Ajouter" icon="pi pi-user-plus"
            [loading]="actioning" (onClick)="executeAddMember()"/>
    </ng-template>
</p-dialog>

<!-- ══════════════════════════════════════════════════════════ -->
<div *ngIf="!loading; else sk" class="flex flex-col gap-5">

    <div *ngIf="!isPanel" class="flex items-start justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
            <p-button icon="pi pi-arrow-left" severity="secondary" text
                routerLink="/app/investigations"/>
            <div>
                <div class="flex items-center gap-2 flex-wrap">
                    <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                        Investigation — {{ inv?.dossierNumber || '—' }}
                    </h1>
                    <p-tag *ngIf="inv"
                        [value]="getStatusLabel(inv.status)"
                        [severity]="getStatusSeverity(inv.status)"/>
                    <p-tag *ngIf="inv?.overdue"
                        value="EN RETARD" severity="danger"
                        styleClass="text-xs animate-pulse"/>
                </div>
                <p class="text-surface-400 text-sm mt-1">{{ inv?.dossierObject }}</p>
            </div>
        </div>
    </div>

    <ng-container *ngIf="!isPanel && inv">
        <div class="flex gap-2 flex-wrap justify-end">
            <ng-container *ngTemplateOutlet="actionButtons; context:{inv:inv}"/>
        </div>
    </ng-container>

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
                    styleClass="text-xs"/>
                <p-tag *ngIf="inv?.overdue"
                    value="EN RETARD" severity="danger"
                    styleClass="text-xs animate-pulse"/>
            </h3>
            <div class="flex gap-2 flex-wrap" *ngIf="inv">
                <ng-container *ngTemplateOutlet="actionButtons; context:{inv:inv}"/>
            </div>
        </div>
    </div>

    <ng-template #actionButtons let-inv="inv">
        <p-button *ngIf="inv.status==='INITIATED' && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Démarrer" icon="pi pi-play" severity="success" size="small"
            [loading]="actioning" (onClick)="executeStart()"/>
        <p-button *ngIf="inv.status==='IN_PROGRESS' && hasRole(['CGEA','CGE','ADMIN_DDIC'])"
            label="Suspendre" icon="pi pi-pause" severity="warn" size="small"
            (onClick)="showSuspendDialog=true"/>
        <p-button *ngIf="inv.status==='SUSPENDED' && hasRole(['CGEA','CGE','ADMIN_DDIC'])"
            label="Reprendre" icon="pi pi-play" severity="info" size="small"
            [loading]="actioning" (onClick)="executeResume()"/>
        <p-button *ngIf="(inv.status==='IN_PROGRESS' || inv.status==='SUSPENDED')
                         && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Prolonger" icon="pi pi-calendar-plus"
            severity="secondary" outlined size="small"
            pTooltip="Accord DEI+CGEA+CGE requis" tooltipPosition="top"
            (onClick)="openExtendDialog()"/>
        <p-button *ngIf="inv.status==='IN_PROGRESS' && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
            label="Soumettre rapport" icon="pi pi-file-check" size="small"
            (onClick)="openReportDialog()"/>
        <p-button *ngIf="inv.status==='COMPLETED' && !inv.deiApprovedAt
                         && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Approuver DEI" icon="pi pi-check" severity="success"
            size="small" [loading]="actioning" (onClick)="executeApproveDei()"/>
        <p-button *ngIf="inv.deiApprovedAt && !inv.legalAdvisorApprovedAt
                         && hasRole(['CONSEILLER_JURIDIQUE','ADMIN_DDIC'])"
            label="Approuver Juridique" icon="pi pi-shield" severity="success"
            size="small" [loading]="actioning" (onClick)="executeApproveLegal()"/>
        <p-button *ngIf="inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt
                         && hasRole(['CGE','ADMIN_DDIC'])"
            label="Décision CGE" icon="pi pi-hammer" severity="success"
            size="small" (onClick)="showCgeDialog=true"/>
    </ng-template>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

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
                <div *ngIf="dossierStatus==='RECEVABLE' && hasRole(['CGEA','ADMIN_DDIC'])"
                    class="flex flex-col gap-4">
                    <div class="p-4 bg-green-50 dark:bg-green-950 border border-green-200 rounded-xl">
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
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                border border-surface-100 dark:border-surface-600">
                        <label class="text-xs font-semibold text-surface-600 uppercase tracking-wide mb-3 block">
                            Durée prévue (min 90 jours)
                        </label>
                        <div class="flex items-center gap-3 mb-3">
                            <input type="number" [(ngModel)]="openDays" min="90" max="365"
                                class="p-inputtext w-28 text-sm text-center font-mono font-bold"/>
                            <span class="text-sm text-surface-400">jours</span>
                        </div>
                        <div class="flex gap-2">
                            <button *ngFor="let d of quickDays"
                                class="text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
                                [class.bg-primary-100]="openDays===d" [class.text-primary-700]="openDays===d"
                                [class.border-primary-300]="openDays===d"
                                [class.bg-surface-100]="openDays!==d" [class.text-surface-500]="openDays!==d"
                                [class.border-surface-200]="openDays!==d"
                                (click)="openDays=d">{{ d }}j</button>
                        </div>
                    </div>
                    <p-button label="Ouvrir l'investigation" icon="pi pi-play"
                        severity="success" styleClass="w-full justify-center"
                        [loading]="actioning" (onClick)="openInvestigation()"/>
                </div>
                <div *ngIf="dossierStatus==='RECEVABLE' && !hasRole(['CGEA','ADMIN_DDIC'])"
                    class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 text-center">
                    <i class="pi pi-info-circle mr-2"></i>
                    Dossier recevable. En attente d'ouverture par le CGEA.
                </div>
            </div>
        </div>

        <ng-container *ngIf="inv">
            <div class="lg:col-span-2 flex flex-col gap-5">

                <!-- Progression -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <i class="pi pi-chart-line text-blue-600 text-xs"></i>
                        </div>
                        Progression de l'enquête
                    </h3>
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-surface-400">Avancement temporel</span>
                            <span class="font-bold text-surface-700 dark:text-surface-200">{{ getProgress() }}%</span>
                        </div>
                        <div class="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-500"
                                [style.width]="getProgress()+'%'"
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
                            [style.background]="inv.overdue ? '#fff5f5' : !inv.startDate ? '#f9fafb' : (inv.remainingDays||0)<=10 ? '#fffbeb' : '#f0fdf4'"
                            [style.border-color]="inv.overdue ? '#fca5a5' : !inv.startDate ? '#e5e7eb' : (inv.remainingDays||0)<=10 ? '#fde68a' : '#86efac'">
                            <div class="text-xs mb-1" [style.color]="inv.overdue ? '#ef4444' : '#9ca3af'">Délai restant</div>
                            <div class="font-bold"
                                [style.color]="inv.overdue ? '#dc2626' : !inv.startDate ? '#9ca3af' : (inv.remainingDays||0)<=10 ? '#d97706' : '#16a34a'">
                                {{ inv.overdue ? 'Dépassé' : !inv.startDate ? '—' : (inv.remainingDays||0)+'j' }}
                            </div>
                        </div>
                    </div>
                    <div *ngIf="inv.extendedDeadline"
                        class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                        <i class="pi pi-calendar-plus text-amber-600 mt-0.5 flex-shrink-0"></i>
                        <div>
                            <div class="text-xs font-bold text-amber-800 mb-0.5">Investigation prolongée</div>
                            <div class="text-xs text-amber-700">
                                Nouvelle échéance : <strong>{{ inv.extendedDeadline | date:'dd/MM/yyyy' }}</strong>
                                <span *ngIf="inv.extensionReason" class="ml-1 text-amber-600">— {{ inv.extensionReason }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Circuit de validation -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <i class="pi pi-list-check text-purple-600 text-xs"></i>
                        </div>
                        Circuit de validation
                    </h3>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let step of approvalSteps; let i=index"
                            class="flex items-center gap-3 p-3 rounded-xl border transition-all"
                            [style.background]="step.done ? '#f0fdf4' : step.active ? '#eff6ff' : '#f9fafb'"
                            [style.border-color]="step.done ? '#86efac' : step.active ? '#bfdbfe' : '#e5e7eb'">
                            <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                [style.background]="step.done ? '#22c55e' : step.active ? '#3b82f6' : '#e5e7eb'">
                                <i class="pi text-white text-xs" [class]="step.done ? 'pi-check' : step.icon"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold"
                                    [style.color]="step.done ? '#16a34a' : step.active ? '#2563eb' : '#9ca3af'">
                                    {{ step.label }}
                                    <span class="text-xs font-normal ml-1" style="color:#9ca3af;">{{ step.delay }}</span>
                                </div>
                                <div *ngIf="step.date" class="text-xs text-green-600 mt-0.5">
                                    ✓ {{ step.date | date:'dd/MM/yyyy HH:mm' }}
                                </div>
                                <div *ngIf="step.active && !step.date"
                                    style="display:inline-flex;align-items:center;gap:4px;font-size:.7rem;
                                           color:#3b82f6;margin-top:3px;background:#eff6ff;
                                           padding:2px 8px;border-radius:20px;">
                                    <div style="width:5px;height:5px;border-radius:50%;background:#3b82f6;animation:pulse 1s infinite;"></div>
                                    En attente
                                </div>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                                [style.background]="step.done ? '#dcfce7' : step.active ? '#dbeafe' : '#f3f4f6'"
                                [style.color]="step.done ? '#16a34a' : step.active ? '#2563eb' : '#9ca3af'">
                                {{ i+1 }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Mandat -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <i class="pi pi-verified text-indigo-600 text-xs"></i>
                            </div>
                            Mandat
                        </h3>
                        <p-button *ngIf="!mandat && !loadingMandat && hasRole(['CGE','ADMIN_DDIC'])"
                            label="Délivrer le mandat" icon="pi pi-check" size="small" outlined
                            [loading]="deliveringMandat" (onClick)="executeDeliverMandat()"/>
                    </div>
                    <div *ngIf="loadingMandat" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingMandat && !mandat" class="text-sm text-surface-400">Aucun mandat délivré pour l'instant.</div>
                    <div *ngIf="mandat" class="text-sm text-surface-700">
                        Délivré le {{ mandat.dateDelivrance | date:'dd/MM/yyyy' }} par {{ mandat.agentCGENom }}
                    </div>
                </div>

                <!-- Engagement préalable (agent connecté) -->
                <div *ngIf="mandat" class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                                <i class="pi pi-shield text-teal-600 text-xs"></i>
                            </div>
                            Mon engagement préalable
                        </h3>
                        <p-button *ngIf="!myEngagement && !loadingEngagement"
                            label="Déclarer" icon="pi pi-pencil" size="small" outlined
                            (onClick)="openEngagementDialog()"/>
                    </div>
                    <div *ngIf="loadingEngagement" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingEngagement && !myEngagement" class="text-sm text-surface-400">
                        Confidentialité et absence de conflit d'intérêts non encore déclarées.
                    </div>
                    <div *ngIf="myEngagement" class="text-sm text-surface-700">
                        <p-tag [value]="myEngagement.hasConflictOfInterest ? 'Conflit déclaré' : 'Aucun conflit'"
                            [severity]="myEngagement.hasConflictOfInterest ? 'warn' : 'success'" styleClass="text-xs"/>
                        <span class="text-xs text-surface-400 ml-2">Signé le {{ myEngagement.signedAt | date:'dd/MM/yyyy' }}</span>
                        <p *ngIf="myEngagement.conflictDetails" class="mt-1 whitespace-pre-line">{{ myEngagement.conflictDetails }}</p>
                    </div>
                </div>

                <!-- Plan d'investigation -->
                <div *ngIf="mandat" class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <i class="pi pi-map text-purple-600 text-xs"></i>
                            </div>
                            Plan d'investigation
                            <p-tag *ngIf="plan" [value]="'v' + plan.planVersion" severity="secondary" styleClass="text-xs"/>
                            <p-tag *ngIf="plan && plan.validatedAt" value="Validé" severity="success" styleClass="text-xs"/>
                            <p-tag *ngIf="plan && !plan.validatedAt && plan.overdue" value="Validation en retard" severity="danger" styleClass="text-xs"/>
                            <p-tag *ngIf="plan && !plan.validatedAt && !plan.overdue" value="En attente de validation DEI" severity="warn" styleClass="text-xs"/>
                        </h3>
                        <div class="flex gap-2">
                            <p-button *ngIf="hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
                                [label]="plan ? 'Réviser' : 'Soumettre'" icon="pi pi-pencil" size="small" outlined
                                (onClick)="openPlanDialog()"/>
                            <p-button *ngIf="plan && !plan.validatedAt && hasRole(['CGEA','ADMIN_DDIC'])"
                                label="Valider" icon="pi pi-check" size="small"
                                [loading]="validatingPlan" (onClick)="executeValidatePlan()"/>
                        </div>
                    </div>
                    <div *ngIf="loadingPlan" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingPlan && !plan" class="text-sm text-surface-400">Aucun plan d'investigation soumis pour l'instant.</div>
                    <div *ngIf="plan" class="flex flex-col gap-3">
                        <div>
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Objectifs</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ plan.objectifs }}</p>
                        </div>
                        <div>
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Méthodologie</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ plan.methodologie }}</p>
                        </div>
                        <div *ngIf="plan.moyensMobilises">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Moyens mobilisés</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ plan.moyensMobilises }}</p>
                        </div>
                        <div *ngIf="plan.planningProcedures">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Planning / procédures</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ plan.planningProcedures }}</p>
                        </div>
                        <div class="text-xs text-surface-400">
                            Soumis par {{ plan.submittedByNom }} le {{ plan.submittedAt | date:'dd/MM/yyyy' }}
                            <span *ngIf="plan.validatedByNom"> — Validé par {{ plan.validatedByNom }} le {{ plan.validatedAt | date:'dd/MM/yyyy' }}</span>
                        </div>
                        <p-button *ngIf="planRevisions.length" [label]="'Historique des révisions (' + planRevisions.length + ')'"
                            icon="pi pi-history" text size="small" styleClass="self-start"
                            (onClick)="showPlanRevisions = !showPlanRevisions"/>
                        <div *ngIf="showPlanRevisions" class="flex flex-col gap-2">
                            <div *ngFor="let r of planRevisions" class="p-2 bg-surface-50 dark:bg-surface-700 rounded-xl text-xs">
                                <div class="font-semibold">v{{ r.versionNumber }} — {{ r.revisedByNom }} — {{ r.revisedAt | date:'dd/MM/yyyy' }}</div>
                                <div class="text-surface-500 mt-0.5">Motif : {{ r.motifRevision }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Incidents d'objectivité -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <i class="pi pi-exclamation-circle text-red-600 text-xs"></i>
                            </div>
                            Incidents d'objectivité
                            <span *ngIf="incidents.length" class="text-xs font-normal text-surface-400 ml-1">({{ incidents.length }})</span>
                        </h3>
                        <p-button *ngIf="hasRole(['CGEA','CGE','CONTROLEUR_ETAT','MEMBRE_CTADP','CONSEILLER_JURIDIQUE','ADMIN_DDIC'])"
                            label="Déclarer" icon="pi pi-plus" size="small" outlined
                            (onClick)="openIncidentDialog()"/>
                    </div>
                    <div *ngIf="loadingIncidents" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingIncidents && !incidents.length" class="text-sm text-surface-400">Aucun incident déclaré.</div>
                    <div *ngFor="let inc of incidents" class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl mb-2 last:mb-0">
                        <p class="text-sm text-surface-700 whitespace-pre-line">{{ inc.description }}</p>
                        <div class="text-xs text-surface-400 mt-1">{{ inc.declaredByNom }} — {{ inc.declaredAt | date:'dd/MM/yyyy' }}</div>
                    </div>
                </div>

                <!-- Procédures d'urgence -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                <i class="pi pi-bolt text-orange-600 text-xs"></i>
                            </div>
                            Procédures d'urgence
                            <span *ngIf="proceduresUrgence.length" class="text-xs font-normal text-surface-400 ml-1">({{ proceduresUrgence.length }})</span>
                        </h3>
                        <p-button *ngIf="hasRole(['CGEA','ADMIN_DDIC'])"
                            label="Demander" icon="pi pi-plus" size="small" outlined
                            (onClick)="openProcedureDialog()"/>
                    </div>
                    <div *ngIf="loadingProcedures" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingProcedures && !proceduresUrgence.length" class="text-sm text-surface-400">Aucune procédure d'urgence.</div>
                    <div *ngFor="let p of proceduresUrgence" class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl mb-2 last:mb-0">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <p-tag [value]="getProcedureStatusLabel(p.status)" [severity]="getProcedureStatusSeverity(p.status)" styleClass="text-xs"/>
                            <div *ngIf="p.status === 'EN_ATTENTE' && hasRole(['CGE','ADMIN_DDIC'])" class="flex gap-1">
                                <p-button icon="pi pi-check" text size="small" severity="success"
                                    pTooltip="Approuver" (onClick)="openProcedureDecisionDialog(p.id, 'approuver')"/>
                                <p-button icon="pi pi-times" text size="small" severity="danger"
                                    pTooltip="Rejeter" (onClick)="openProcedureDecisionDialog(p.id, 'rejeter')"/>
                            </div>
                        </div>
                        <p class="text-sm text-surface-700 whitespace-pre-line">{{ p.justification }}</p>
                        <div class="text-xs text-surface-400 mt-1">
                            Demandée par {{ p.requestedByNom }} — {{ p.requestedAt | date:'dd/MM/yyyy' }}
                            <span *ngIf="p.decidedByNom"> — Décidée par {{ p.decidedByNom }} le {{ p.decidedAt | date:'dd/MM/yyyy' }}</span>
                        </div>
                        <p *ngIf="p.motifDecision" class="text-xs text-surface-500 mt-1">Motif : {{ p.motifDecision }}</p>
                    </div>
                </div>

                <!-- Mesures conservatoires -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                                <i class="pi pi-lock text-cyan-600 text-xs"></i>
                            </div>
                            Mesures conservatoires
                            <span *ngIf="mesuresConservatoires.length" class="text-xs font-normal text-surface-400 ml-1">({{ mesuresConservatoires.length }})</span>
                        </h3>
                        <p-button *ngIf="hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])"
                            label="Déclarer" icon="pi pi-plus" size="small" outlined
                            (onClick)="openMesureDialog()"/>
                    </div>
                    <div *ngIf="loadingMesures" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingMesures && !mesuresConservatoires.length" class="text-sm text-surface-400">Aucune mesure conservatoire.</div>
                    <div *ngFor="let m of mesuresConservatoires" class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl mb-2 last:mb-0">
                        <p class="text-sm text-surface-700 whitespace-pre-line">{{ m.description }}</p>
                        <div class="text-xs text-surface-400 mt-1">{{ m.takenByNom }} — {{ m.takenAt | date:'dd/MM/yyyy' }}</div>
                    </div>
                </div>

                <!-- Demandes de documents -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
                                <i class="pi pi-inbox text-sky-600 text-xs"></i>
                            </div>
                            Demandes de documents
                        </h3>
                        <p-button *ngIf="hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])"
                            label="Nouvelle demande" icon="pi pi-plus" size="small" outlined
                            (onClick)="openDemandeDocumentsDialog()"/>
                    </div>
                    <div *ngIf="loadingDemandes" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingDemandes && !demandesDocuments.length" class="text-sm text-surface-400">
                        Aucune demande de documents envoyée.
                    </div>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let d of demandesDocuments"
                            class="p-3 rounded-xl border"
                            [class.bg-red-50]="d.overdue && !d.received"
                            [class.border-red-200]="d.overdue && !d.received"
                            [class.bg-green-50]="d.received"
                            [class.border-green-200]="d.received"
                            [class.bg-surface-50]="!d.received && !d.overdue"
                            [class.border-surface-200]="!d.received && !d.overdue">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-bold text-surface-800">{{ d.recipientLabel }}</span>
                                <p-tag [value]="getEscalationLabel(d.escalationLevel)"
                                    [severity]="d.received ? 'success' : (d.overdue ? 'danger' : 'info')" styleClass="text-xs"/>
                            </div>
                            <p class="text-sm text-surface-600 mb-1">{{ d.documentsRequested }}</p>
                            <div class="text-xs text-surface-500 flex items-center gap-3">
                                <span>Envoyée le {{ d.sentAt | date:'dd/MM/yyyy' }}</span>
                                <span *ngIf="d.deadline">Échéance {{ d.deadline | date:'dd/MM/yyyy' }}</span>
                                <span *ngIf="d.received" class="text-green-600">✓ Reçue le {{ d.receivedAt | date:'dd/MM/yyyy' }}</span>
                            </div>
                            <div *ngIf="!d.received && hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])"
                                class="flex items-center gap-2 mt-2">
                                <p-button label="Marquer reçue" icon="pi pi-check" text size="small"
                                    (onClick)="executeMarkReceived(d)"/>
                                <p-button *ngIf="d.overdue" label="Escalader" icon="pi pi-arrow-up" text size="small" severity="warn"
                                    (onClick)="executeEscalate(d)"/>
                                <p-button label="Adresse erronée" icon="pi pi-map-marker" text size="small" severity="secondary"
                                    (onClick)="openAddressErrorDialog(d)"/>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Inventaire des pièces -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-900 flex items-center justify-center">
                            <i class="pi pi-box text-lime-600 text-xs"></i>
                        </div>
                        Inventaire des pièces ({{ inventairePieces.length }})
                    </h3>
                    <div *ngIf="loadingInventaire" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingInventaire && !inventairePieces.length" class="text-sm text-surface-400">
                        Aucune pièce dans le dossier.
                    </div>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let p of inventairePieces"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl flex items-center justify-between">
                            <div>
                                <div class="text-sm font-bold text-surface-800">{{ p.code || '—' }}</div>
                                <div class="text-xs text-surface-500">{{ p.description || 'Sans description' }}</div>
                                <div class="text-xs text-surface-400 mt-0.5">
                                    {{ getAttachmentSourceLabel(p.source) }} — {{ getModeObtentionLabel(p.modeObtention) }}
                                    — {{ p.uploadedAt | date:'dd/MM/yyyy' }}
                                </div>
                            </div>
                            <p-tag [value]="getAttachmentStatusLabel(p.status)"
                                [severity]="p.status==='VALIDATED' ? 'success' : p.status==='REJECTED' ? 'danger' : 'info'"
                                styleClass="text-xs"/>
                        </div>
                    </div>
                </div>

                <!-- Auditions -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                                <i class="pi pi-comments text-amber-600 text-xs"></i>
                            </div>
                            Auditions
                        </h3>
                        <p-button *ngIf="hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])"
                            label="Planifier une audition" icon="pi pi-plus" size="small" outlined
                            (onClick)="openScheduleAuditionDialog()"/>
                    </div>
                    <div *ngIf="loadingAuditions" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingAuditions && !auditions.length" class="text-sm text-surface-400">
                        Aucune audition planifiée.
                    </div>
                    <div class="flex flex-col gap-3">
                        <div *ngFor="let a of auditions" class="p-3 rounded-xl border border-surface-100 dark:border-surface-700">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-bold text-surface-800">{{ a.intervieweeDisplayName }}</span>
                                <p-tag [value]="getAuditionStatusLabel(a.status)"
                                    [severity]="a.status==='CONDUCTED' ? 'success' : a.status==='SCHEDULED' ? 'info' : 'danger'"
                                    styleClass="text-xs"/>
                            </div>
                            <div class="text-xs text-surface-500 flex flex-wrap items-center gap-3 mb-1">
                                <span>{{ getIntervieweeTypeLabel(a.intervieweeType) }}</span>
                                <span>{{ a.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</span>
                                <span *ngIf="a.location">📍 {{ a.location }}</span>
                                <span *ngIf="a.investigatorNames?.length">Enquêteurs : {{ a.investigatorNames.join(', ') }}</span>
                            </div>

                            <div *ngIf="a.orderWarning" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1 mb-1">
                                <i class="pi pi-exclamation-triangle mr-1"></i>{{ a.orderWarning }}
                            </div>
                            <div *ngIf="a.secondAuditionWarning" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1 mb-1">
                                <i class="pi pi-exclamation-triangle mr-1"></i>{{ a.secondAuditionWarning }}
                            </div>

                            <div *ngIf="a.status==='SCHEDULED' && hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])"
                                class="flex items-center gap-2 mt-2">
                                <p-button label="Tenir" icon="pi pi-check" text size="small" (onClick)="openConductAuditionDialog(a)"/>
                                <p-button label="Annuler" icon="pi pi-times" text size="small" severity="secondary" (onClick)="openCancelAuditionDialog(a)"/>
                                <p-button label="Absence" icon="pi pi-user-minus" text size="small" severity="warn" (onClick)="openNoShowDialog(a)"/>
                            </div>

                            <p *ngIf="a.status==='CANCELLED' && a.cancellationReason" class="text-sm text-surface-500 mt-1">
                                Motif d'annulation : {{ a.cancellationReason }}
                            </p>
                            <p *ngIf="a.status==='NO_SHOW' && a.noShowNote" class="text-sm text-surface-500 mt-1">
                                {{ a.noShowNote }}
                            </p>

                            <!-- Sous-section PV -->
                            <div *ngIf="a.status==='CONDUCTED'" class="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                                <p *ngIf="a.summary" class="text-sm text-surface-600 mb-2">{{ a.summary }}</p>

                                <div *ngIf="!pvByAudition[a.id] && hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])">
                                    <p-button label="Rédiger le PV" icon="pi pi-file-edit" text size="small" (onClick)="openPvCreateDialog(a)"/>
                                </div>

                                <div *ngIf="pvByAudition[a.id] as pv" class="bg-surface-50 dark:bg-surface-700 rounded-xl p-3">
                                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">
                                        Procès-verbal (v{{ pv.pvVersion }})
                                    </div>
                                    <p class="text-sm text-surface-700 whitespace-pre-line mb-2">{{ pv.content }}</p>
                                    <div class="text-xs text-surface-500 mb-2">
                                        Rédigé par {{ pv.draftedByName || '—' }}
                                        <span *ngIf="pv.readBackAt"> — Relu le {{ pv.readBackAt | date:'dd/MM/yyyy HH:mm' }}</span>
                                        <span *ngIf="pv.finalizedAt"> — Finalisé le {{ pv.finalizedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                                    </div>
                                    <div *ngIf="pv.finalizedAt" class="text-xs mb-2">
                                        <span *ngIf="pv.intervieweeSigned" class="text-green-600">✓ Signé par la personne auditionnée</span>
                                        <span *ngIf="pv.intervieweeSignatureRefused" class="text-red-600">✗ Signature refusée</span>
                                    </div>

                                    <div *ngIf="hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])" class="flex items-center gap-2">
                                        <p-button *ngIf="!pv.readBackAt && !pv.finalizedAt"
                                            label="Marquer relu" icon="pi pi-eye" text size="small" (onClick)="executeMarkPvReadBack(a)"/>
                                        <p-button *ngIf="pv.readBackAt && !pv.finalizedAt"
                                            label="Finaliser (signature)" icon="pi pi-verified" text size="small" (onClick)="openPvFinalizeDialog(a)"/>
                                        <p-button *ngIf="pv.finalizedAt"
                                            label="Corriger" icon="pi pi-pencil" text size="small" severity="secondary" (onClick)="openPvCorrectionDialog(a)"/>
                                    </div>

                                    <div *ngIf="pv.corrections?.length" class="mt-2 flex flex-col gap-1">
                                        <div class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Historique des corrections</div>
                                        <div *ngFor="let c of pv.corrections" class="text-xs text-surface-500 bg-white dark:bg-surface-800 rounded-lg p-2">
                                            v{{ c.versionNumber }} — {{ c.motifCorrection }} ({{ c.correctedByName }}, {{ c.correctedAt | date:'dd/MM/yyyy' }})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Visites terrain -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                                <i class="pi pi-map-marker text-teal-600 text-xs"></i>
                            </div>
                            Visites terrain
                        </h3>
                        <p-button *ngIf="hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])"
                            label="Planifier une visite" icon="pi pi-plus" size="small" outlined
                            (onClick)="openScheduleVisiteDialog()"/>
                    </div>
                    <div *ngIf="loadingVisites" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingVisites && !visitesTerrain.length" class="text-sm text-surface-400">
                        Aucune visite terrain planifiée.
                    </div>
                    <div class="flex flex-col gap-3">
                        <div *ngFor="let v of visitesTerrain" class="p-3 rounded-xl border border-surface-100 dark:border-surface-700">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-bold text-surface-800">{{ v.location }}</span>
                                <p-tag [value]="getVisiteStatusLabel(v.status)"
                                    [severity]="v.status==='CONDUCTED' ? 'success' : v.status==='SCHEDULED' ? 'info' : 'danger'"
                                    styleClass="text-xs"/>
                            </div>
                            <div class="text-xs text-surface-500 flex flex-wrap items-center gap-3 mb-1">
                                <span>{{ v.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</span>
                                <span *ngIf="v.plannedByName">Planifiée par {{ v.plannedByName }}</span>
                            </div>

                            <div *ngIf="v.status==='SCHEDULED' && hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])"
                                class="flex items-center gap-2 mt-2">
                                <p-button label="Tenir" icon="pi pi-check" text size="small" (onClick)="openConductVisiteDialog(v)"/>
                                <p-button label="Annuler" icon="pi pi-times" text size="small" severity="secondary" (onClick)="openCancelVisiteDialog(v)"/>
                                <p-button label="Carence" icon="pi pi-exclamation-triangle" text size="small" severity="warn" (onClick)="openCarenceDialog(v)"/>
                            </div>

                            <p *ngIf="v.status==='CANCELLED' && v.cancellationReason" class="text-sm text-surface-500 mt-1">
                                Motif d'annulation : {{ v.cancellationReason }}
                            </p>
                            <p *ngIf="v.status==='CARENCE' && v.carenceReason" class="text-sm text-surface-500 mt-1">
                                Motif de carence : {{ v.carenceReason }}
                            </p>

                            <!-- Sous-section PV de constat -->
                            <div *ngIf="v.status==='CONDUCTED'" class="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                                <p *ngIf="v.summary" class="text-sm text-surface-600 mb-2">{{ v.summary }}</p>

                                <div *ngIf="!pvByVisite[v.id] && hasRole(['CONTROLEUR_ETAT','CGEA','ADMIN_DDIC'])">
                                    <p-button label="Rédiger le PV de constat" icon="pi pi-file-edit" text size="small" (onClick)="openPvConstatCreateDialog(v)"/>
                                </div>

                                <div *ngIf="pvByVisite[v.id] as pv" class="bg-surface-50 dark:bg-surface-700 rounded-xl p-3">
                                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">
                                        Procès-verbal de constat
                                    </div>
                                    <p class="text-sm text-surface-700 whitespace-pre-line mb-2">{{ pv.content }}</p>
                                    <div class="text-xs text-surface-500">Rédigé par {{ pv.draftedByName || '—' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Check-list du dossier de travail -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4 flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                            <i class="pi pi-check-square text-violet-600 text-xs"></i>
                        </div>
                        Check-list du dossier de travail
                        <span *ngIf="checklistItems.length" class="text-xs font-normal text-surface-400 ml-1">
                            ({{ getChecklistCheckedCount() }}/{{ checklistItems.length }})
                        </span>
                    </h3>
                    <div *ngIf="loadingChecklist" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingChecklist && !checklistItems.length" class="text-sm text-surface-400">
                        Aucun point de contrôle configuré.
                    </div>
                    <div class="flex flex-col gap-1">
                        <div *ngFor="let item of checklistItems"
                            class="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700">
                            <p-checkbox [ngModel]="item.coche" [binary]="true"
                                [disabled]="inv.status!=='IN_PROGRESS' || !hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC']) || savingChecklistCode===item.code"
                                (onChange)="executeToggleChecklist(item)"/>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm" [class.text-surface-400]="!item.coche" [class.text-surface-800]="item.coche">
                                    {{ item.libelle }}
                                </div>
                                <div *ngIf="item.commentaire" class="text-xs text-surface-500 mt-0.5">{{ item.commentaire }}</div>
                                <div *ngIf="item.coche && item.cocheParNom" class="text-xs text-surface-400 mt-0.5">
                                    Coché par {{ item.cocheParNom }} — {{ item.cocheAt | date:'dd/MM/yyyy' }}
                                </div>
                            </div>
                            <p-button *ngIf="inv.status==='IN_PROGRESS' && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
                                icon="pi pi-comment" text size="small" severity="secondary"
                                (onClick)="openChecklistCommentDialog(item)"/>
                        </div>
                    </div>
                </div>

                <!-- Rapport d'enquête officiel -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <i class="pi pi-book text-blue-600 text-xs"></i>
                            </div>
                            Rapport d'enquête officiel
                            <p-tag *ngIf="rapportEnquete" [value]="rapportEnquete.complet ? 'Complet' : 'Brouillon'"
                                [severity]="rapportEnquete.complet ? 'success' : 'warn'" styleClass="text-xs"/>
                        </h3>
                        <p-button *ngIf="inv.status==='IN_PROGRESS' && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
                            [label]="rapportEnquete ? 'Modifier' : 'Rédiger'" icon="pi pi-pencil" size="small" outlined
                            (onClick)="openRapportEnqueteDialog()"/>
                    </div>
                    <div *ngIf="loadingRapportEnquete" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingRapportEnquete && !rapportEnquete" class="text-sm text-surface-400">
                        Aucun rapport d'enquête rédigé pour l'instant.
                    </div>
                    <div *ngIf="rapportEnquete" class="flex flex-col gap-3">
                        <div *ngIf="rapportEnquete.titre" class="text-sm font-bold text-surface-800">{{ rapportEnquete.titre }}</div>
                        <div *ngIf="rapportEnquete.introduction">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Introduction</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ rapportEnquete.introduction }}</p>
                        </div>
                        <div *ngIf="rapportEnquete.methodologie">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Méthodologie</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ rapportEnquete.methodologie }}</p>
                        </div>
                        <div *ngIf="rapportEnquete.informationsCollectees">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Informations collectées</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ rapportEnquete.informationsCollectees }}</p>
                        </div>
                        <div *ngIf="rapportEnquete.exposeFactuelAnomalies">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Exposé factuel des anomalies</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ rapportEnquete.exposeFactuelAnomalies }}</p>
                        </div>
                        <div *ngIf="rapportEnquete.quantificationPrejudice">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Quantification du préjudice</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ rapportEnquete.quantificationPrejudice }}</p>
                        </div>
                        <div *ngIf="rapportEnquete.reserves">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Réserves</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ rapportEnquete.reserves }}</p>
                        </div>
                        <div *ngIf="rapportEnquete.conclusions">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Conclusions</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ rapportEnquete.conclusions }}</p>
                        </div>

                        <div class="pt-3 border-t border-surface-100 dark:border-surface-700">
                            <div class="flex items-center justify-between mb-2">
                                <div class="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                                    Note de recommandations
                                    <p-tag *ngIf="noteRecommandations" [value]="noteRecommandations.complet ? 'Complète' : 'Brouillon'"
                                        [severity]="noteRecommandations.complet ? 'success' : 'warn'" styleClass="text-xs ml-1"/>
                                </div>
                                <p-button *ngIf="inv.status==='IN_PROGRESS' && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
                                    [label]="noteRecommandations ? 'Modifier' : 'Rédiger'" icon="pi pi-pencil" text size="small"
                                    (onClick)="openNoteRecommandationsDialog()"/>
                            </div>
                            <p *ngIf="noteRecommandations?.contenu" class="text-sm text-surface-700 whitespace-pre-line">
                                {{ noteRecommandations?.contenu }}
                            </p>
                            <p *ngIf="!noteRecommandations" class="text-sm text-surface-400">
                                Aucune note de recommandations rédigée.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Fiche RETEX & leçon à partager -->
                <div *ngIf="inv.cgeApprovedAt" class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                                <i class="pi pi-lightbulb text-amber-600 text-xs"></i>
                            </div>
                            Fiche RETEX (retour d'expérience)
                        </h3>
                        <p-button *ngIf="!ficheRetex && !loadingFicheRetex && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
                            label="Rédiger" icon="pi pi-pencil" size="small" outlined
                            (onClick)="openFicheRetexDialog()"/>
                    </div>
                    <div *ngIf="loadingFicheRetex" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingFicheRetex && !ficheRetex" class="text-sm text-surface-400">
                        Aucune fiche RETEX rédigée pour l'instant.
                    </div>
                    <div *ngIf="ficheRetex" class="flex flex-col gap-3">
                        <div *ngIf="ficheRetex.typeInfractionLibelle" class="text-sm font-bold text-surface-800">
                            {{ ficheRetex.typeInfractionLibelle }}
                        </div>
                        <div *ngIf="ficheRetex.contexte">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Contexte</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ ficheRetex.contexte }}</p>
                        </div>
                        <div>
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Synthèse des résultats</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ ficheRetex.syntheseResultats }}</p>
                        </div>
                        <div>
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">Enseignements et axes d'amélioration</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ ficheRetex.enseignementsAxesAmelioration }}</p>
                        </div>
                        <div class="text-xs text-surface-400">Rédigée par {{ ficheRetex.redigeParNom }}</div>

                        <div class="pt-3 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between">
                            <span class="text-xs font-semibold text-surface-400 uppercase tracking-wide">Leçon à partager</span>
                            <p-tag *ngIf="leconPubliee" value="Publiée" severity="success" styleClass="text-xs"/>
                            <p-button *ngIf="!leconPubliee && hasRole(['CGE','CGEA','ADMIN_DDIC'])"
                                label="Publier comme leçon à partager" icon="pi pi-send" text size="small"
                                (onClick)="openPublierLeconDialog()"/>
                        </div>
                    </div>
                </div>

                <!-- Requête au Parquet (saisine judiciaire, rédigée avant décision CGE) -->
                <div *ngIf="inv.outcome==='JUDICIAL_REFERRAL'"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                <i class="pi pi-file-edit text-orange-600 text-xs"></i>
                            </div>
                            Requête au Parquet
                        </h3>
                        <p-button *ngIf="!inv.cgeApprovedAt && hasRole(['CONSEILLER_JURIDIQUE','ADMIN_DDIC'])"
                            [label]="requeteParquet?.complet ? 'Modifier' : 'Rédiger'" icon="pi pi-pencil" size="small" outlined
                            (onClick)="openRequeteParquetDialog()"/>
                    </div>
                    <p *ngIf="!requeteParquet?.complet" class="text-sm text-surface-400">
                        Aucune requête au Parquet rédigée pour l'instant.
                    </p>
                    <p *ngIf="requeteParquet?.complet" class="text-sm text-surface-700 whitespace-pre-line leading-relaxed">
                        {{ requeteParquet?.contenu }}
                    </p>
                </div>

                <!-- Transmission à l'autorité (saisine judiciaire) -->
                <div *ngIf="inv.outcome==='JUDICIAL_REFERRAL' && inv.cgeApprovedAt"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <i class="pi pi-send text-red-600 text-xs"></i>
                            </div>
                            Transmission à l'autorité
                        </h3>
                        <p-button *ngIf="!transmission && !loadingTransmission && hasRole(['CGE','ADMIN_DDIC'])"
                            label="Transmettre" icon="pi pi-send" size="small"
                            (onClick)="openTransmissionDialog()"/>
                    </div>

                    <div *ngIf="loadingTransmission" class="text-xs text-surface-400">Chargement...</div>

                    <div *ngIf="!loadingTransmission && !transmission" class="text-sm text-surface-400">
                        Aucune transmission enregistrée pour cette saisine judiciaire.
                    </div>

                    <div *ngIf="transmission" class="flex flex-col gap-3">
                        <div class="p-3 rounded-xl border"
                            [class.bg-red-50]="transmission.relanceOverdue"
                            [class.border-red-200]="transmission.relanceOverdue"
                            [class.bg-surface-50]="!transmission.relanceOverdue"
                            [class.border-surface-200]="!transmission.relanceOverdue">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">
                                Autorité destinataire
                            </div>
                            <div class="text-sm font-bold text-surface-800">
                                {{ transmission.autoriteDestinataire }}
                            </div>
                            <div class="text-xs text-surface-500 mt-1">
                                Transmis le {{ transmission.transmittedAt | date:'dd/MM/yyyy HH:mm' }}
                                <span *ngIf="transmission.transmittedByNom"> — {{ transmission.transmittedByNom }}</span>
                            </div>
                            <div *ngIf="transmission.relanceDueAt" class="text-xs mt-1"
                                [class.text-red-600]="transmission.relanceOverdue"
                                [class.text-surface-500]="!transmission.relanceOverdue">
                                <i class="pi" [class.pi-exclamation-triangle]="transmission.relanceOverdue"
                                    [class.pi-clock]="!transmission.relanceOverdue"></i>
                                Relance {{ transmission.relanceOverdue ? 'en retard depuis le' : 'prévue le' }}
                                {{ transmission.relanceDueAt | date:'dd/MM/yyyy' }}
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                                Relances ({{ transmission.relances.length }})
                            </span>
                            <p-button *ngIf="hasRole(['CGE','ADMIN_DDIC'])"
                                label="Ajouter une relance" icon="pi pi-plus" text size="small"
                                (onClick)="openRelanceDialog()"/>
                        </div>
                        <div *ngFor="let r of transmission.relances"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-500 flex items-center justify-between mb-1">
                                <span>{{ r.agentNom || '—' }}</span>
                                <span>{{ r.relanceAt | date:'dd/MM/yyyy HH:mm' }}</span>
                            </div>
                            <div *ngIf="r.contenu" class="text-sm text-surface-700">{{ r.contenu }}</div>
                        </div>
                    </div>
                </div>

                <!-- Constitution de partie civile -->
                <div *ngIf="inv.outcome==='JUDICIAL_REFERRAL' && inv.cgeApprovedAt"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <i class="pi pi-shield text-indigo-600 text-xs"></i>
                            </div>
                            Constitution de partie civile
                        </h3>
                        <p-button *ngIf="!constitutionPartieCivile && !loadingConstitution && hasRole(['CGE','ADMIN_DDIC'])"
                            label="Se constituer" icon="pi pi-plus" size="small" outlined
                            (onClick)="openConstitutionDialog()"/>
                    </div>
                    <div *ngIf="loadingConstitution" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingConstitution && !constitutionPartieCivile" class="text-sm text-surface-400">
                        L'ASCE-LC ne s'est pas constituée partie civile pour ce dossier.
                    </div>
                    <div *ngIf="constitutionPartieCivile" class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                        <p class="text-sm text-surface-700 mb-2">{{ constitutionPartieCivile.justification }}</p>
                        <div class="flex items-center gap-4 text-xs text-surface-500">
                            <span *ngIf="constitutionPartieCivile.montantReclame">
                                Montant réclamé : <strong>{{ constitutionPartieCivile.montantReclame | number }} FCFA</strong>
                            </span>
                            <span>{{ constitutionPartieCivile.constitueAt | date:'dd/MM/yyyy' }}
                                <span *ngIf="constitutionPartieCivile.constitueeParNom"> — {{ constitutionPartieCivile.constitueeParNom }}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Suivi de procédure pénale -->
                <div *ngIf="inv.outcome==='JUDICIAL_REFERRAL' && inv.cgeApprovedAt"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <i class="pi pi-history text-purple-600 text-xs"></i>
                            </div>
                            Suivi de procédure pénale
                        </h3>
                        <p-button *ngIf="hasRole(['CONSEILLER_JURIDIQUE','ADMIN_DDIC'])"
                            label="Ajouter une étape" icon="pi pi-plus" size="small" outlined
                            (onClick)="openSuiviPenalDialog()"/>
                    </div>
                    <div *ngIf="loadingSuiviPenal" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingSuiviPenal && !suivisProcedurePenale.length" class="text-sm text-surface-400">
                        Aucune étape de procédure pénale enregistrée.
                    </div>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let s of suivisProcedurePenale"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-bold text-surface-800">{{ s.phase }}</span>
                                <span class="text-xs text-surface-500">{{ s.phaseAt | date:'dd/MM/yyyy' }}</span>
                            </div>
                            <p *ngIf="s.commentaire" class="text-sm text-surface-600">{{ s.commentaire }}</p>
                            <div *ngIf="s.agentNom" class="text-xs text-surface-400 mt-1">{{ s.agentNom }}</div>
                        </div>
                    </div>
                </div>

                <!-- Plan d'actions (sanctions administratives) -->
                <div *ngIf="inv.outcome==='ADMINISTRATIVE_SANCTIONS' && inv.cgeApprovedAt"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                                <i class="pi pi-map text-teal-600 text-xs"></i>
                            </div>
                            Plan d'actions
                        </h3>
                        <p-button *ngIf="planActions && !planActions.exists && hasRole(['CGEA','ADMIN_DDIC'])"
                            label="Déposer le plan" icon="pi pi-plus" size="small" outlined
                            (onClick)="openPlanActionsDialog()"/>
                    </div>
                    <div *ngIf="loadingPlanActions" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="planActions && !planActions.exists" class="text-sm"
                        [class.text-red-600]="planActions.planActionsOverdue"
                        [class.text-surface-400]="!planActions.planActionsOverdue">
                        Aucun plan d'actions déposé par l'entité contrôlée.
                        <span *ngIf="planActions.planActionsDueAt">
                            {{ planActions.planActionsOverdue ? 'Échéance dépassée depuis le' : 'Attendu pour le' }}
                            {{ planActions.planActionsDueAt | date:'dd/MM/yyyy' }}
                        </span>
                    </div>
                    <div *ngIf="planActions?.exists" class="flex flex-col gap-3">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-1">
                                Entité contrôlée
                            </div>
                            <div class="text-sm font-bold text-surface-800 mb-2">{{ planActions?.entiteControlee }}</div>
                            <p class="text-sm text-surface-700 whitespace-pre-line">{{ planActions?.contenu }}</p>
                            <div class="text-xs text-surface-500 mt-2">
                                Reçu le {{ planActions?.submittedAt | date:'dd/MM/yyyy' }}
                                <span *ngIf="planActions?.receivedByNom"> — {{ planActions?.receivedByNom }}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                                Notes d'avancement ({{ planActions?.avancements?.length || 0 }})
                            </span>
                            <p-button *ngIf="hasRole(['CGEA','ADMIN_DDIC'])"
                                label="Ajouter une note" icon="pi pi-plus" text size="small"
                                (onClick)="openAvancementDialog()"/>
                        </div>
                        <div *ngFor="let a of planActions?.avancements"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="text-xs text-surface-500 flex items-center justify-between mb-1">
                                <span>{{ a.agentNom || '—' }}</span>
                                <span>{{ a.noteAt | date:'dd/MM/yyyy HH:mm' }}</span>
                            </div>
                            <div *ngIf="a.contenu" class="text-sm text-surface-700">{{ a.contenu }}</div>
                        </div>
                    </div>
                </div>

                <!-- Missions de suivi (sanctions administratives) -->
                <div *ngIf="inv.outcome==='ADMINISTRATIVE_SANCTIONS' && inv.cgeApprovedAt"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                                <i class="pi pi-verified text-cyan-600 text-xs"></i>
                            </div>
                            Missions de suivi
                        </h3>
                        <p-button *ngIf="planActions?.exists && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
                            label="Ajouter une mission" icon="pi pi-plus" size="small" outlined
                            (onClick)="openMissionDialog()"/>
                    </div>
                    <div *ngIf="loadingMissionsSuivi" class="text-xs text-surface-400">Chargement...</div>
                    <div *ngIf="!loadingMissionsSuivi && !planActions?.exists" class="text-sm text-surface-400">
                        Les missions de suivi ne peuvent être programmées qu'après le dépôt du plan d'actions.
                    </div>
                    <div *ngIf="!loadingMissionsSuivi && planActions?.exists && !missionsSuivi.length" class="text-sm"
                        [class.text-red-600]="missionSuiviOverdue"
                        [class.text-surface-400]="!missionSuiviOverdue">
                        Aucune mission de suivi réalisée.
                        <span *ngIf="missionSuiviDueAt">
                            {{ missionSuiviOverdue ? 'Échéance dépassée depuis le' : 'Attendue pour le' }}
                            {{ missionSuiviDueAt | date:'dd/MM/yyyy' }}
                        </span>
                    </div>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let m of missionsSuivi"
                            class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm font-bold text-surface-800">{{ m.objectifs }}</span>
                                <span class="text-xs text-surface-500">{{ m.missionDate | date:'dd/MM/yyyy' }}</span>
                            </div>
                            <p class="text-sm text-surface-600">{{ m.syntheseRecommandations }}</p>
                            <p *ngIf="m.nouvellesRecommandations" class="text-sm text-surface-500 mt-1 italic">
                                Nouvelles recommandations : {{ m.nouvellesRecommandations }}
                            </p>
                            <div *ngIf="m.conductedByNom" class="text-xs text-surface-400 mt-1">{{ m.conductedByNom }}</div>
                        </div>
                    </div>
                </div>

                <div *ngIf="safeReport">
                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">Rapport</div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 leading-relaxed
                                text-surface-700 dark:text-surface-200 border border-surface-100 overflow-hidden"
                        [innerHTML]="safeReport"></div>
                </div>
                <div *ngIf="safeConclusions">
                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">Conclusions</div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 leading-relaxed
                                text-surface-700 dark:text-surface-200 border border-surface-100 overflow-hidden"
                        [innerHTML]="safeConclusions"></div>
                </div>
                <div *ngIf="safeRecommendations">
                    <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">Recommandations</div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 leading-relaxed
                                text-surface-700 dark:text-surface-200 border border-surface-100 overflow-hidden"
                        [innerHTML]="safeRecommendations"></div>
                </div>
            </div>

            <!-- Colonne droite -->
            <div class="flex flex-col gap-5">

                <div *ngIf="!isPanel"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-4
                           border border-surface-100 dark:border-surface-700">
                    <h3 class="text-sm font-bold text-surface-700 dark:text-surface-200
                               mb-3 flex items-center gap-2">
                        <i class="pi pi-folder text-primary-600"></i> Dossier associé
                    </h3>
                    <p-button
                        [label]="inv.dossierNumber || 'Voir le dossier'"
                        icon="pi pi-external-link" iconPos="right"
                        severity="info" text size="small"
                        [routerLink]="['/app/dossiers', inv.dossier?.id ?? inv.dossierId]"/>
                </div>

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
                        Pour ajouter des membres, soumettre un rapport ou prolonger,
                        accédez à la page dédiée.
                    </p>
                    <p-button label="Ouvrir dans Investigations"
                        icon="pi pi-external-link" iconPos="right"
                        severity="info" size="small" styleClass="w-full justify-center"
                        [routerLink]="['/app/investigations', inv.id]"/>
                </div>

                <!-- ── Équipe ────────────────────────────────────── -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <i class="pi pi-users text-green-600 text-xs"></i>
                            </div>
                            Équipe
                            <span class="text-xs bg-surface-100 dark:bg-surface-700 text-surface-500
                                         px-2 py-0.5 rounded-full font-normal">
                                {{ activeMembers.length }} membre(s)
                            </span>
                        </h3>
                        <p-button
                            *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                   && inv.status !== 'COMPLETED'
                                   && inv.status !== 'ARCHIVED'"
                            icon="pi pi-user-plus" severity="success" text
                            size="small" pTooltip="Ajouter un membre" tooltipPosition="left"
                            (onClick)="showAddMemberDialog=true"/>
                    </div>

                    <div *ngIf="!activeMembers.length" class="text-center py-6">
                        <div class="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700
                                    flex items-center justify-center mx-auto mb-3">
                            <i class="pi pi-users text-xl text-surface-300"></i>
                        </div>
                        <p class="text-surface-400 text-xs">Aucun membre dans l'équipe</p>
                        <p *ngIf="hasRole(['CGEA','ADMIN_DDIC'])"
                            class="text-primary-500 text-xs mt-1 cursor-pointer"
                            (click)="showAddMemberDialog=true">+ Ajouter un membre</p>
                    </div>

                    <div class="flex flex-col gap-2" *ngIf="activeMembers.length">
                        <div *ngFor="let m of activeMembers"
                            class="flex items-start gap-2 p-2.5 rounded-xl
                                   hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center
                                        text-xs font-bold flex-shrink-0 mt-0.5"
                                [style.background]="m.teamRole==='TEAM_LEADER' ? '#fef9c3' : '#dbeafe'"
                                [style.color]="m.teamRole==='TEAM_LEADER' ? '#854d0e' : '#1d4ed8'">
                                {{ getInitials(m.agent.firstName+' '+m.agent.lastName) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-semibold text-surface-900 dark:text-surface-0
                                            break-words leading-tight">
                                    {{ m.agent.firstName+' '+m.agent.lastName }}
                                </div>
                                <div class="text-xs text-surface-400 font-mono mt-0.5">{{ m.agent.matricule || '' }}</div>
                                <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                                    [style.background]="m.teamRole==='TEAM_LEADER' ? '#fef9c3' : '#dbeafe'"
                                    [style.color]="m.teamRole==='TEAM_LEADER' ? '#854d0e' : '#1d4ed8'">
                                    {{ getRoleLabel(m.teamRole) }}
                                </span>
                            </div>
                            <p-button
                                *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                       && inv.status!=='COMPLETED' && inv.status!=='ARCHIVED'"
                                icon="pi pi-times" severity="danger" text size="small"
                                pTooltip="Retirer" tooltipPosition="left"
                                (onClick)="executeRemoveMember(m.agent.id)"/>
                        </div>
                    </div>
                </div>
            </div>
        </ng-container>
    </div>
</div>

<ng-template #sk>
    <div class="flex flex-col gap-5">
        <p-skeleton height="3rem" borderRadius="16px"/>
        <div class="grid grid-cols-3 gap-5">
            <div class="col-span-2 flex flex-col gap-4">
                <p-skeleton height="160px" borderRadius="16px"/>
                <p-skeleton height="200px" borderRadius="16px"/>
            </div>
            <div class="flex flex-col gap-4">
                <p-skeleton height="200px" borderRadius="16px"/>
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
    get activeMembers(): InvestigationMemberResponse[] {
    const result = this.inv?.members ?? [];
    if (!environment.production) {
        console.log('[activeMembers] inv:', this.inv?.id?.substring(0,8),
                    '| length:', result.length);
    }
    return result;
}

    private readonly route                = inject(ActivatedRoute);
    private readonly router               = inject(Router);
    private readonly investigationService = inject(InvestigationService);
    private readonly agentService         = inject(AgentService);
    private readonly keycloakService      = inject(KeycloakService);
    private readonly messageService       = inject(MessageService);
    private readonly attachmentService    = inject(AttachmentService);
    private readonly transmissionAutoriteService = inject(TransmissionAutoriteService);
    private readonly requeteParquetService = inject(RequeteParquetService);
    private readonly constitutionPartieCivileService = inject(ConstitutionPartieCivileService);
    private readonly suiviProcedurePenaleService = inject(SuiviProcedurePenaleService);
    private readonly planActionsService = inject(PlanActionsService);
    private readonly missionSuiviService = inject(MissionSuiviService);
    private readonly demandeDocumentsService = inject(DemandeDocumentsService);
    private readonly inventairePiecesService = inject(InventairePiecesService);
    private readonly auditionService = inject(AuditionService);
    private readonly visiteTerrainService = inject(VisiteTerrainService);
    private readonly checklistDossierTravailService = inject(ChecklistDossierTravailService);
    private readonly rapportEnqueteService = inject(RapportEnqueteService);
    private readonly targetedPartyService = inject(TargetedPartyService);
    private readonly witnessService = inject(WitnessService);
    private readonly ficheRetexService = inject(FicheRetexService);
    private readonly typeInfractionService = inject(TypeInfractionService);
    private readonly cadrageService = inject(InvestigationCadrageService);
    private readonly destroy$             = new Subject<void>();

    inv:      InvestigationResponse | null = null;
    loading   = true;
    actioning = false;
    generatingPreview = false;

    safeReport:          string | null = null;
    safeConclusions:     string | null = null;
    safeRecommendations: string | null = null;

    showSuspendDialog   = false;
    showExtendDialog    = false;
    showReportDialog    = false;
    showCgeDialog       = false;
    showAddMemberDialog = false;

    transmission:        TransmissionAutoriteResponse | null = null;
    loadingTransmission  = false;
    showTransmissionDialog = false;
    creatingTransmission = false;
    transmissionForm: { autoriteDestinataire: string } = { autoriteDestinataire: '' };
    showRelanceDialog = false;
    addingRelance     = false;
    relanceContenu    = '';

    // ── Requête Parquet ──────────────────────────────────────
    requeteParquet:        RequeteParquetResponse | null = null;
    showRequeteParquetDialog = false;
    savingRequeteParquet   = false;
    requeteParquetContenu  = '';

    // ── Constitution de partie civile ────────────────────────
    constitutionPartieCivile: ConstitutionPartieCivileResponse | null = null;
    loadingConstitution    = false;
    showConstitutionDialog = false;
    creatingConstitution   = false;
    constitutionForm: { justification: string; montantReclame: number | null } =
        { justification: '', montantReclame: null };

    // ── Suivi de procédure pénale ─────────────────────────────
    suivisProcedurePenale: SuiviProcedurePenaleResponse[] = [];
    loadingSuiviPenal      = false;
    showSuiviPenalDialog   = false;
    addingSuiviPenal       = false;
    suiviPenalForm: { phaseAt: Date | null; phase: string; commentaire: string } =
        { phaseAt: new Date(), phase: '', commentaire: '' };

    // ── Plan d'actions ─────────────────────────────────────────
    planActions:           PlanActionsStatusResponse | null = null;
    loadingPlanActions     = false;
    showPlanActionsDialog  = false;
    creatingPlanActions    = false;
    planActionsForm: { entiteControlee: string; contenu: string } =
        { entiteControlee: '', contenu: '' };
    showAvancementDialog   = false;
    addingAvancement       = false;
    avancementContenu      = '';

    // ── Missions de suivi ──────────────────────────────────────
    missionsSuivi:         MissionSuiviResponse[] = [];
    missionSuiviDueAt:     string | null = null;
    missionSuiviOverdue    = false;
    loadingMissionsSuivi   = false;
    showMissionDialog      = false;
    addingMission          = false;
    missionForm: { missionDate: Date | null; objectifs: string; syntheseRecommandations: string; nouvellesRecommandations: string } =
        { missionDate: new Date(), objectifs: '', syntheseRecommandations: '', nouvellesRecommandations: '' };

    // ── Demandes de documents ─────────────────────────────────
    demandesDocuments:      DemandeDocumentsResponse[] = [];
    loadingDemandes         = false;
    showDemandeDocumentsDialog = false;
    creatingDemande          = false;
    demandeDocumentsForm: { recipientLabel: string; documentsRequested: string } =
        { recipientLabel: '', documentsRequested: '' };
    showAddressErrorDialog  = false;
    correctingAddress       = false;
    addressErrorForm: { correctedRecipientLabel: string } = { correctedRecipientLabel: '' };
    private demandeBeingCorrected: DemandeDocumentsResponse | null = null;

    // ── Inventaire des pièces ─────────────────────────────────
    inventairePieces:       InventairePieceItemResponse[] = [];
    loadingInventaire       = false;

    // ── Auditions ────────────────────────────────────────────
    auditions:               AuditionResponse[] = [];
    loadingAuditions         = false;
    pvByAudition:            Record<string, PvAuditionResponse | null> = {};
    targetedParties:         TargetedPartyResponse[] = [];
    witnesses:                WitnessResponse[] = [];

    showScheduleAuditionDialog = false;
    schedulingAudition       = false;
    scheduleAuditionForm: {
        intervieweeType: IntervieweeType | null;
        targetedPartyId: string | null;
        witnessId: string | null;
        scheduledAt: Date | null;
        location: string;
        investigatorIds: string[];
    } = { intervieweeType: null, targetedPartyId: null, witnessId: null, scheduledAt: new Date(), location: '', investigatorIds: [] };

    showConductAuditionDialog = false;
    conductingAudition       = false;
    conductSummary           = '';

    showCancelAuditionDialog = false;
    cancellingAudition       = false;
    cancelAuditionReason     = '';

    showNoShowDialog          = false;
    markingNoShow             = false;
    noShowNote                = '';

    showPvCreateDialog        = false;
    creatingPv                = false;
    pvCreateContent           = '';

    showPvFinalizeDialog      = false;
    finalizingPv               = false;
    pvFinalizeForm: { intervieweeSigned: boolean; intervieweeSignatureRefused: boolean } =
        { intervieweeSigned: false, intervieweeSignatureRefused: false };

    showPvCorrectionDialog    = false;
    correctingPv               = false;
    pvCorrectionForm: { content: string; motifCorrection: string } = { content: '', motifCorrection: '' };

    private actionAudition: AuditionResponse | null = null;

    readonly intervieweeTypeOptions: SelectOption<IntervieweeType>[] = [
        { label: 'Dénonciateur (déclarant)', value: 'DECLARANT' },
        { label: 'Témoin', value: 'WITNESS' },
        { label: 'Partie visée', value: 'TARGETED_PARTY' }
    ];

    // ── Visites terrain ──────────────────────────────────────
    visitesTerrain:          VisiteTerrainResponse[] = [];
    loadingVisites            = false;
    pvByVisite:               Record<string, PvConstatResponse | null> = {};

    showScheduleVisiteDialog = false;
    schedulingVisite          = false;
    scheduleVisiteForm: { location: string; scheduledAt: Date | null } = { location: '', scheduledAt: new Date() };

    showConductVisiteDialog  = false;
    conductingVisite          = false;
    conductVisiteSummary      = '';

    showCancelVisiteDialog   = false;
    cancellingVisite           = false;
    cancelVisiteReason         = '';

    showCarenceDialog          = false;
    markingCarence             = false;
    carenceReason               = '';

    showPvConstatCreateDialog = false;
    creatingPvConstat          = false;
    pvConstatContent           = '';

    private actionVisite: VisiteTerrainResponse | null = null;

    // ── Check-list du dossier de travail ──────────────────────
    checklistItems:          ChecklistDossierTravailItemResponse[] = [];
    loadingChecklist          = false;
    savingChecklistCode: string | null = null;
    showChecklistCommentDialog = false;
    checklistCommentValue     = '';
    private checklistItemBeingCommented: ChecklistDossierTravailItemResponse | null = null;

    // ── Rapport d'enquête officiel ─────────────────────────────
    rapportEnquete:           RapportEnqueteResponse | null = null;
    loadingRapportEnquete     = false;
    savingRapportEnquete      = false;
    showRapportEnqueteDialog  = false;
    rapportEnqueteForm: {
        titre: string; introduction: string; methodologie: string;
        informationsCollectees: string; exposeFactuelAnomalies: string;
        quantificationPrejudice: string; reserves: string; conclusions: string;
    } = {
        titre: '', introduction: '', methodologie: '', informationsCollectees: '',
        exposeFactuelAnomalies: '', quantificationPrejudice: '', reserves: '', conclusions: ''
    };

    noteRecommandations:      NoteRecommandationsResponse | null = null;
    savingNoteRecommandations = false;
    showNoteRecommandationsDialog = false;
    noteRecommandationsContent = '';

    // ── Fiche RETEX & leçon à partager ──────────────────────────
    ficheRetex:           FicheRetexResponse | null = null;
    loadingFicheRetex     = false;
    savingFicheRetex      = false;
    showFicheRetexDialog  = false;
    typesInfractionOptions: TypeInfraction[] = [];
    ficheRetexForm: FicheRetexRequest = this.emptyFicheRetexForm();

    savingPublierLecon    = false;
    showPublierLeconDialog = false;
    leconPubliee          = false;
    publierLeconForm: PublierLeconRequest = { titre: '', resume: '' };

    // ── Cadrage de l'enquête : mandat, engagement, plan, incidents, urgences, mesures ──
    currentAgentId: string | null = null;

    mandat:            MandatResponse | null = null;
    loadingMandat      = false;
    deliveringMandat   = false;

    myEngagement:      EngagementConfidentialiteResponse | null = null;
    loadingEngagement  = false;
    savingEngagement   = false;
    showEngagementDialog = false;
    engagementForm: { hasConflictOfInterest: boolean | null; conflictDetails: string } =
        { hasConflictOfInterest: null, conflictDetails: '' };

    plan:              PlanInvestigationResponse | null = null;
    planRevisions:     RevisionPlanResponse[] = [];
    loadingPlan        = false;
    savingPlan         = false;
    validatingPlan     = false;
    showPlanDialog     = false;
    planForm: { objectifs: string; methodologie: string; moyensMobilises: string; planningProcedures: string; motifRevision: string } =
        { objectifs: '', methodologie: '', moyensMobilises: '', planningProcedures: '', motifRevision: '' };
    showPlanRevisions  = false;

    incidents:         IncidentObjectiviteResponse[] = [];
    loadingIncidents   = false;
    savingIncident     = false;
    showIncidentDialog = false;
    incidentDescription = '';

    proceduresUrgence: ProcedureUrgenceResponse[] = [];
    loadingProcedures  = false;
    savingProcedure    = false;
    showProcedureDialog = false;
    procedureJustification = '';
    decidingProcedureId: string | null = null;
    showProcedureDecisionDialog = false;
    procedureDecisionMotif = '';
    private procedureDecisionAction: 'approuver' | 'rejeter' | null = null;

    mesuresConservatoires: MesureConservatoireResponse[] = [];
    loadingMesures     = false;
    savingMesure       = false;
    showMesureDialog   = false;
    mesureDescription  = '';

    suspendReason = '';

    extendDays             = 30;
    extendReason           = '';
    extendReasonError      = false;
    hierarchyApproved      = false;
    hierarchyApprovedError = false;
    computedNewDeadline:   Date | null = null;

    readonly extendOptions = [
        { label: '+15j', days: 15 }, { label: '+30j', days: 30 },
        { label: '+45j', days: 45 }, { label: '+60j', days: 60 },
        { label: '+90j', days: 90 }, { label: '+120j', days: 120 }
    ];

    cgeReason = '';

    newMemberAgentId = '';
    newMemberRole: TeamRole = 'MEMBER';
    availableAgents: AgentOption[] = [];

    reportMode: ReportMode = 'ONLINE';
    uploadedReportFile: File | null = null;
    isDragOver = false;

    reportRequest: SubmitReportRequest = {
        finalReport: '', conclusions: '',
        recommendations: '', outcome: 'ADMINISTRATIVE_SANCTIONS'
    };
    reportFiles:   File[] = [];
    uploadProgress = 0;

    openDays = 90;
    readonly quickDays: readonly number[] = [90, 120, 180];

    approvalSteps: ApprovalStep[] = [];

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
        this.resolveCurrentAgentId();
    }

    private resolveCurrentAgentId(): void {
        const email = this.keycloakService.getUserInfo().email;
        this.agentService.findActive()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: agents => {
                    this.currentAgentId = agents.find(a => a.email === email)?.id ?? null;
                    if (this.currentAgentId && this.inv) this.loadMyEngagement(this.inv.id);
                },
                error: () => {}
            });
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
                next: inv  => { this.setInv(inv); this.loading = false; },
                error: ()  => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error', summary: 'Erreur',
                        detail: 'Investigation introuvable'
                    });
                }
            });
    }

    private loadByDossier(dossierId: string): void {
        this.loading = true;
        this.investigationService.findByDossier(dossierId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => { this.setInv(inv); this.loading = false; },
                error: ()  => { this.inv = null; this.loading = false; }
            });
    }

    private loadAgents(): void {
        this.agentService.findAll(0, 100)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (page: any) => {
                    this.availableAgents = page.content.map((a: any) => ({
                        label: `${a.firstName} ${a.lastName} — ${a.matricule}`,
                        value: a.id
                    }));
                },
                error: () => {}
            });
    }

    private setInv(inv: InvestigationResponse | null): void {
        if (!environment.production) {
            console.log('[setInv] appelé :', inv?.id?.substring(0,8),
                    '| members:', inv?.members?.length ?? 'NULL');
        }
        this.inv = inv;
        if (inv) {
            this.buildApprovalSteps(inv);
            this.safeReport = inv.finalReport ?? null;
            this.safeConclusions = inv.conclusions ?? null;
            this.safeRecommendations = inv.recommendations ?? null;
            this.computeNewDeadline();
            if (inv.outcome === 'JUDICIAL_REFERRAL') {
                this.loadRequeteParquet(inv.id);
                if (inv.cgeApprovedAt) {
                    this.loadTransmission(inv.id);
                    this.loadConstitution(inv.id);
                    this.loadSuivisPenal(inv.id);
                } else {
                    this.transmission = null;
                    this.constitutionPartieCivile = null;
                    this.suivisProcedurePenale = [];
                }
            } else {
                this.transmission = null;
                this.requeteParquet = null;
                this.constitutionPartieCivile = null;
                this.suivisProcedurePenale = [];
            }
            if (inv.outcome === 'ADMINISTRATIVE_SANCTIONS' && inv.cgeApprovedAt) {
                this.loadPlanActions(inv.id);
                this.loadMissionsSuivi(inv.id);
            } else {
                this.planActions = null;
                this.missionsSuivi = [];
            }
            this.loadDemandesDocuments(inv.id);
            this.loadInventairePieces(inv.id);
            this.loadAuditions(inv.id);
            const dossierId = inv.dossier?.id ?? inv.dossierId;
            if (dossierId) {
                this.targetedPartyService.findAll(dossierId)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(list => { this.targetedParties = list; });
                this.witnessService.findAll(dossierId)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(list => { this.witnesses = list; });
            }
            this.loadVisitesTerrain(inv.id);
            this.loadChecklist(inv.id);
            this.loadRapportEnquete(inv.id);
            this.loadFicheRetex(inv.id);
            this.loadMandat(inv.id);
            this.loadPlan(inv.id);
            this.loadIncidents(inv.id);
            this.loadProcedures(inv.id);
            this.loadMesures(inv.id);
            if (this.currentAgentId) this.loadMyEngagement(inv.id);
        } else {
            this.safeReport = this.safeConclusions = this.safeRecommendations = null;
            this.transmission = null;
            this.requeteParquet = null;
            this.constitutionPartieCivile = null;
            this.suivisProcedurePenale = [];
            this.planActions = null;
            this.missionsSuivi = [];
            this.demandesDocuments = [];
            this.inventairePieces = [];
            this.ficheRetex = null;
            this.leconPubliee = false;
            this.mandat = null;
            this.myEngagement = null;
            this.plan = null;
            this.planRevisions = [];
            this.incidents = [];
            this.proceduresUrgence = [];
            this.mesuresConservatoires = [];
            this.auditions = [];
            this.pvByAudition = {};
            this.visitesTerrain = [];
            this.pvByVisite = {};
            this.checklistItems = [];
            this.rapportEnquete = null;
            this.noteRecommandations = null;
        }
    }

    // ── Transmission autorité ─────────────────────────────────
    private loadTransmission(investigationId: string): void {
        this.loadingTransmission = true;
        this.transmissionAutoriteService.get(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(t => {
                this.transmission = t;
                this.loadingTransmission = false;
            });
    }

    openTransmissionDialog(): void {
        this.transmissionForm = { autoriteDestinataire: '' };
        this.showTransmissionDialog = true;
    }

    executeCreerTransmission(): void {
        if (!this.inv || !this.transmissionForm.autoriteDestinataire.trim()) return;
        this.creatingTransmission = true;
        this.transmissionAutoriteService
            .creer(this.inv.id, { autoriteDestinataire: this.transmissionForm.autoriteDestinataire.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: t => {
                    this.transmission = t;
                    this.creatingTransmission = false;
                    this.showTransmissionDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Transmission enregistrée' });
                },
                error: (err: ApiError) => { this.creatingTransmission = false; this.showError(err); }
            });
    }

    openRelanceDialog(): void {
        this.relanceContenu = '';
        this.showRelanceDialog = true;
    }

    executeAjouterRelance(): void {
        if (!this.inv) return;
        this.addingRelance = true;
        this.transmissionAutoriteService
            .ajouterRelance(this.inv.id, { contenu: this.relanceContenu.trim() || undefined })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: t => {
                    this.transmission = t;
                    this.addingRelance = false;
                    this.showRelanceDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Relance ajoutée' });
                },
                error: (err: ApiError) => { this.addingRelance = false; this.showError(err); }
            });
    }

    // ── Requête Parquet ────────────────────────────────────────
    private loadRequeteParquet(investigationId: string): void {
        this.requeteParquetService.get(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(r => { this.requeteParquet = r; });
    }

    openRequeteParquetDialog(): void {
        this.requeteParquetContenu = this.requeteParquet?.contenu ?? '';
        this.showRequeteParquetDialog = true;
    }

    executeEnregistrerRequeteParquet(): void {
        if (!this.inv) return;
        this.savingRequeteParquet = true;
        this.requeteParquetService.enregistrer(this.inv.id, { contenu: this.requeteParquetContenu.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    this.requeteParquet = r;
                    this.savingRequeteParquet = false;
                    this.showRequeteParquetDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Requête Parquet enregistrée' });
                },
                error: (err: ApiError) => { this.savingRequeteParquet = false; this.showError(err); }
            });
    }

    // ── Constitution de partie civile ─────────────────────────
    private loadConstitution(investigationId: string): void {
        this.loadingConstitution = true;
        this.constitutionPartieCivileService.get(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(c => { this.constitutionPartieCivile = c; this.loadingConstitution = false; });
    }

    openConstitutionDialog(): void {
        this.constitutionForm = { justification: '', montantReclame: null };
        this.showConstitutionDialog = true;
    }

    executeCreerConstitution(): void {
        if (!this.inv || !this.constitutionForm.justification.trim()) return;
        this.creatingConstitution = true;
        this.constitutionPartieCivileService.creer(this.inv.id, {
            justification: this.constitutionForm.justification.trim(),
            montantReclame: this.constitutionForm.montantReclame ?? undefined
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: c => {
                    this.constitutionPartieCivile = c;
                    this.creatingConstitution = false;
                    this.showConstitutionDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Constitution de partie civile enregistrée' });
                },
                error: (err: ApiError) => { this.creatingConstitution = false; this.showError(err); }
            });
    }

    // ── Suivi de procédure pénale ──────────────────────────────
    private loadSuivisPenal(investigationId: string): void {
        this.loadingSuiviPenal = true;
        this.suiviProcedurePenaleService.lister(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(res => { this.suivisProcedurePenale = res.suivis; this.loadingSuiviPenal = false; });
    }

    openSuiviPenalDialog(): void {
        this.suiviPenalForm = { phaseAt: new Date(), phase: '', commentaire: '' };
        this.showSuiviPenalDialog = true;
    }

    executeAjouterSuiviPenal(): void {
        if (!this.inv || !this.suiviPenalForm.phaseAt || !this.suiviPenalForm.phase.trim()) return;
        this.addingSuiviPenal = true;
        this.suiviProcedurePenaleService.ajouter(this.inv.id, {
            phaseAt: this.suiviPenalForm.phaseAt.toISOString(),
            phase: this.suiviPenalForm.phase.trim(),
            commentaire: this.suiviPenalForm.commentaire.trim() || undefined
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: res => {
                    this.suivisProcedurePenale = res.suivis;
                    this.addingSuiviPenal = false;
                    this.showSuiviPenalDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Étape ajoutée' });
                },
                error: (err: ApiError) => { this.addingSuiviPenal = false; this.showError(err); }
            });
    }

    // ── Plan d'actions ───────────────────────────────────────────
    private loadPlanActions(investigationId: string): void {
        this.loadingPlanActions = true;
        this.planActionsService.getStatus(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(p => { this.planActions = p; this.loadingPlanActions = false; });
    }

    openPlanActionsDialog(): void {
        this.planActionsForm = { entiteControlee: '', contenu: '' };
        this.showPlanActionsDialog = true;
    }

    executeCreerPlanActions(): void {
        if (!this.inv || !this.planActionsForm.entiteControlee.trim() || !this.planActionsForm.contenu.trim()) return;
        this.creatingPlanActions = true;
        this.planActionsService.creer(this.inv.id, {
            entiteControlee: this.planActionsForm.entiteControlee.trim(),
            contenu: this.planActionsForm.contenu.trim()
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: p => {
                    this.planActions = p;
                    this.creatingPlanActions = false;
                    this.showPlanActionsDialog = false;
                    this.messageService.add({ severity: 'success', summary: "Plan d'actions déposé" });
                },
                error: (err: ApiError) => { this.creatingPlanActions = false; this.showError(err); }
            });
    }

    openAvancementDialog(): void {
        this.avancementContenu = '';
        this.showAvancementDialog = true;
    }

    executeAjouterAvancement(): void {
        if (!this.inv) return;
        this.addingAvancement = true;
        this.planActionsService.ajouterAvancement(this.inv.id, { contenu: this.avancementContenu.trim() || undefined })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: p => {
                    this.planActions = p;
                    this.addingAvancement = false;
                    this.showAvancementDialog = false;
                    this.messageService.add({ severity: 'success', summary: "Note d'avancement ajoutée" });
                },
                error: (err: ApiError) => { this.addingAvancement = false; this.showError(err); }
            });
    }

    // ── Missions de suivi ────────────────────────────────────────
    private loadMissionsSuivi(investigationId: string): void {
        this.loadingMissionsSuivi = true;
        this.missionSuiviService.lister(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(res => {
                this.missionsSuivi = res.missions;
                this.missionSuiviDueAt = res.missionSuiviDueAt ?? null;
                this.missionSuiviOverdue = res.missionSuiviOverdue;
                this.loadingMissionsSuivi = false;
            });
    }

    openMissionDialog(): void {
        this.missionForm = { missionDate: new Date(), objectifs: '', syntheseRecommandations: '', nouvellesRecommandations: '' };
        this.showMissionDialog = true;
    }

    executeAjouterMission(): void {
        if (!this.inv || !this.missionForm.missionDate
            || !this.missionForm.objectifs.trim() || !this.missionForm.syntheseRecommandations.trim()) return;
        this.addingMission = true;
        this.missionSuiviService.ajouter(this.inv.id, {
            missionDate: this.missionForm.missionDate.toISOString(),
            objectifs: this.missionForm.objectifs.trim(),
            syntheseRecommandations: this.missionForm.syntheseRecommandations.trim(),
            nouvellesRecommandations: this.missionForm.nouvellesRecommandations.trim() || undefined
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: res => {
                    this.missionsSuivi = res.missions;
                    this.missionSuiviDueAt = res.missionSuiviDueAt ?? null;
                    this.missionSuiviOverdue = res.missionSuiviOverdue;
                    this.addingMission = false;
                    this.showMissionDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Mission de suivi enregistrée' });
                },
                error: (err: ApiError) => { this.addingMission = false; this.showError(err); }
            });
    }

    // ── Demandes de documents ──────────────────────────────────
    private loadDemandesDocuments(investigationId: string): void {
        this.loadingDemandes = true;
        this.demandeDocumentsService.findAll(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => { this.demandesDocuments = list; this.loadingDemandes = false; });
    }

    openDemandeDocumentsDialog(): void {
        this.demandeDocumentsForm = { recipientLabel: '', documentsRequested: '' };
        this.showDemandeDocumentsDialog = true;
    }

    executeCreerDemandeDocuments(): void {
        if (!this.inv || !this.demandeDocumentsForm.recipientLabel.trim()
            || !this.demandeDocumentsForm.documentsRequested.trim()) return;
        this.creatingDemande = true;
        this.demandeDocumentsService.create(this.inv.id, {
            recipientLabel: this.demandeDocumentsForm.recipientLabel.trim(),
            documentsRequested: this.demandeDocumentsForm.documentsRequested.trim()
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: d => {
                    this.demandesDocuments = [d, ...this.demandesDocuments];
                    this.creatingDemande = false;
                    this.showDemandeDocumentsDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Demande envoyée' });
                },
                error: (err: ApiError) => { this.creatingDemande = false; this.showError(err); }
            });
    }

    executeMarkReceived(d: DemandeDocumentsResponse): void {
        if (!this.inv) return;
        this.demandeDocumentsService.markReceived(this.inv.id, d.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.demandesDocuments = this.demandesDocuments.map(x => x.id === updated.id ? updated : x);
                    this.messageService.add({ severity: 'success', summary: 'Demande marquée reçue' });
                },
                error: (err: ApiError) => this.showError(err)
            });
    }

    executeEscalate(d: DemandeDocumentsResponse): void {
        if (!this.inv) return;
        this.demandeDocumentsService.escalate(this.inv.id, d.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.demandesDocuments = this.demandesDocuments.map(x => x.id === updated.id ? updated : x);
                    this.messageService.add({ severity: 'warn', summary: 'Demande escaladée', detail: this.getEscalationLabel(updated.escalationLevel) });
                },
                error: (err: ApiError) => this.showError(err)
            });
    }

    openAddressErrorDialog(d: DemandeDocumentsResponse): void {
        this.demandeBeingCorrected = d;
        this.addressErrorForm = { correctedRecipientLabel: d.recipientLabel };
        this.showAddressErrorDialog = true;
    }

    executeReportAddressError(): void {
        if (!this.inv || !this.demandeBeingCorrected || !this.addressErrorForm.correctedRecipientLabel.trim()) return;
        this.correctingAddress = true;
        this.demandeDocumentsService.reportAddressError(
            this.inv.id, this.demandeBeingCorrected.id,
            { correctedRecipientLabel: this.addressErrorForm.correctedRecipientLabel.trim() }
        ).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.demandesDocuments = this.demandesDocuments.map(x => x.id === updated.id ? updated : x);
                    this.correctingAddress = false;
                    this.showAddressErrorDialog = false;
                    this.demandeBeingCorrected = null;
                    this.messageService.add({ severity: 'success', summary: 'Adresse corrigée, demande renvoyée' });
                },
                error: (err: ApiError) => { this.correctingAddress = false; this.showError(err); }
            });
    }

    getEscalationLabel(l: EscalationLevel): string {
        return ({
            INITIAL: 'Demande initiale',
            RELANCE: 'Relance',
            SOMMATION: 'Sommation',
            SAISINE_JUDICIAIRE: 'Saisine judiciaire'
        } as Record<string, string>)[l] ?? l;
    }

    // ── Inventaire des pièces ──────────────────────────────────
    private loadInventairePieces(investigationId: string): void {
        this.loadingInventaire = true;
        this.inventairePiecesService.getInventaire(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => { this.inventairePieces = list; this.loadingInventaire = false; });
    }

    getAttachmentSourceLabel(s: AttachmentSource): string {
        return ({
            INITIAL_SUBMISSION: 'Dépôt initial',
            FIELD_INVESTIGATION: 'Investigation terrain',
            SOCIAL_MEDIA: 'Réseaux sociaux',
            PRESS_MEDIA: 'Presse/média',
            EXTERNAL_AUDIT: 'Audit externe',
            OTHER: 'Autre'
        } as Record<string, string>)[s] ?? s;
    }

    getModeObtentionLabel(m: ModeObtention): string {
        return ({ VOLONTAIRE: 'Volontaire', REQUISITION: 'Réquisition' } as Record<string, string>)[m] ?? m;
    }

    getAttachmentStatusLabel(s: AttachmentStatus): string {
        return ({
            PENDING_VALIDATION: 'En attente',
            VALIDATED: 'Validée',
            REJECTED: 'Rejetée',
            ARCHIVED: 'Archivée'
        } as Record<string, string>)[s] ?? s;
    }

    // ── Auditions ────────────────────────────────────────────
    private loadAuditions(investigationId: string): void {
        this.loadingAuditions = true;
        this.auditionService.findAll(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => {
                this.auditions = list;
                this.loadingAuditions = false;
                list.filter(a => a.status === 'CONDUCTED').forEach(a => this.loadPv(investigationId, a.id));
            });
    }

    private loadPv(investigationId: string, auditionId: string): void {
        this.auditionService.getPv(investigationId, auditionId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(pv => { this.pvByAudition = { ...this.pvByAudition, [auditionId]: pv }; });
    }

    openScheduleAuditionDialog(): void {
        this.scheduleAuditionForm = {
            intervieweeType: null, targetedPartyId: null, witnessId: null,
            scheduledAt: new Date(), location: '', investigatorIds: []
        };
        this.showScheduleAuditionDialog = true;
    }

    canScheduleAudition(): boolean {
        const f = this.scheduleAuditionForm;
        if (!f.intervieweeType || !f.scheduledAt || f.investigatorIds.length < 2) return false;
        if (f.intervieweeType === 'TARGETED_PARTY') return !!f.targetedPartyId;
        if (f.intervieweeType === 'WITNESS') return !!f.witnessId;
        return true;
    }

    executeScheduleAudition(): void {
        if (!this.inv || !this.canScheduleAudition() || !this.scheduleAuditionForm.intervieweeType
            || !this.scheduleAuditionForm.scheduledAt) return;
        this.schedulingAudition = true;
        this.auditionService.schedule(this.inv.id, {
            intervieweeType: this.scheduleAuditionForm.intervieweeType,
            targetedPartyId: this.scheduleAuditionForm.targetedPartyId ?? undefined,
            witnessId: this.scheduleAuditionForm.witnessId ?? undefined,
            scheduledAt: this.scheduleAuditionForm.scheduledAt.toISOString(),
            location: this.scheduleAuditionForm.location.trim() || undefined,
            investigatorIds: this.scheduleAuditionForm.investigatorIds
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: a => {
                    this.auditions = [...this.auditions, a];
                    this.schedulingAudition = false;
                    this.showScheduleAuditionDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Audition planifiée' });
                },
                error: (err: ApiError) => { this.schedulingAudition = false; this.showError(err); }
            });
    }

    openConductAuditionDialog(a: AuditionResponse): void {
        this.actionAudition = a;
        this.conductSummary = '';
        this.showConductAuditionDialog = true;
    }

    executeConductAudition(): void {
        if (!this.inv || !this.actionAudition || !this.conductSummary.trim()) return;
        this.conductingAudition = true;
        this.auditionService.conduct(this.inv.id, this.actionAudition.id, { summary: this.conductSummary.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.auditions = this.auditions.map(x => x.id === updated.id ? updated : x);
                    this.conductingAudition = false;
                    this.showConductAuditionDialog = false;
                    if (this.inv) this.loadPv(this.inv.id, updated.id);
                    this.messageService.add({ severity: 'success', summary: 'Audition tenue' });
                },
                error: (err: ApiError) => { this.conductingAudition = false; this.showError(err); }
            });
    }

    openCancelAuditionDialog(a: AuditionResponse): void {
        this.actionAudition = a;
        this.cancelAuditionReason = '';
        this.showCancelAuditionDialog = true;
    }

    executeCancelAudition(): void {
        if (!this.inv || !this.actionAudition || !this.cancelAuditionReason.trim()) return;
        this.cancellingAudition = true;
        this.auditionService.cancel(this.inv.id, this.actionAudition.id, this.cancelAuditionReason.trim())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.auditions = this.auditions.map(x => x.id === updated.id ? updated : x);
                    this.cancellingAudition = false;
                    this.showCancelAuditionDialog = false;
                    this.messageService.add({ severity: 'info', summary: 'Audition annulée' });
                },
                error: (err: ApiError) => { this.cancellingAudition = false; this.showError(err); }
            });
    }

    openNoShowDialog(a: AuditionResponse): void {
        this.actionAudition = a;
        this.noShowNote = '';
        this.showNoShowDialog = true;
    }

    executeMarkNoShow(): void {
        if (!this.inv || !this.actionAudition) return;
        this.markingNoShow = true;
        this.auditionService.markNoShow(this.inv.id, this.actionAudition.id, this.noShowNote.trim() || undefined)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.auditions = this.auditions.map(x => x.id === updated.id ? updated : x);
                    this.markingNoShow = false;
                    this.showNoShowDialog = false;
                    this.messageService.add({ severity: 'warn', summary: 'Absence constatée' });
                },
                error: (err: ApiError) => { this.markingNoShow = false; this.showError(err); }
            });
    }

    openPvCreateDialog(a: AuditionResponse): void {
        this.actionAudition = a;
        this.pvCreateContent = '';
        this.showPvCreateDialog = true;
    }

    executeCreatePv(): void {
        if (!this.inv || !this.actionAudition || !this.pvCreateContent.trim()) return;
        this.creatingPv = true;
        this.auditionService.createPv(this.inv.id, this.actionAudition.id, { content: this.pvCreateContent.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: pv => {
                    this.pvByAudition = { ...this.pvByAudition, [pv.auditionId]: pv };
                    this.creatingPv = false;
                    this.showPvCreateDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Procès-verbal enregistré' });
                },
                error: (err: ApiError) => { this.creatingPv = false; this.showError(err); }
            });
    }

    executeMarkPvReadBack(a: AuditionResponse): void {
        if (!this.inv) return;
        this.auditionService.markPvReadBack(this.inv.id, a.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: pv => {
                    this.pvByAudition = { ...this.pvByAudition, [pv.auditionId]: pv };
                    this.messageService.add({ severity: 'success', summary: 'Relecture enregistrée' });
                },
                error: (err: ApiError) => this.showError(err)
            });
    }

    openPvFinalizeDialog(a: AuditionResponse): void {
        this.actionAudition = a;
        this.pvFinalizeForm = { intervieweeSigned: false, intervieweeSignatureRefused: false };
        this.showPvFinalizeDialog = true;
    }

    executeFinalizePv(): void {
        if (!this.inv || !this.actionAudition) return;
        this.finalizingPv = true;
        this.auditionService.finalizePv(this.inv.id, this.actionAudition.id, this.pvFinalizeForm)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: pv => {
                    this.pvByAudition = { ...this.pvByAudition, [pv.auditionId]: pv };
                    this.finalizingPv = false;
                    this.showPvFinalizeDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Procès-verbal finalisé' });
                },
                error: (err: ApiError) => { this.finalizingPv = false; this.showError(err); }
            });
    }

    openPvCorrectionDialog(a: AuditionResponse): void {
        this.actionAudition = a;
        const pv = this.pvByAudition[a.id];
        this.pvCorrectionForm = { content: pv?.content ?? '', motifCorrection: '' };
        this.showPvCorrectionDialog = true;
    }

    executeCorrectPv(): void {
        if (!this.inv || !this.actionAudition || !this.pvCorrectionForm.content.trim()
            || !this.pvCorrectionForm.motifCorrection.trim()) return;
        this.correctingPv = true;
        this.auditionService.correctPv(this.inv.id, this.actionAudition.id, {
            content: this.pvCorrectionForm.content.trim(),
            motifCorrection: this.pvCorrectionForm.motifCorrection.trim()
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: pv => {
                    this.pvByAudition = { ...this.pvByAudition, [pv.auditionId]: pv };
                    this.correctingPv = false;
                    this.showPvCorrectionDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Correction enregistrée' });
                },
                error: (err: ApiError) => { this.correctingPv = false; this.showError(err); }
            });
    }

    getAuditionStatusLabel(s: AuditionStatus): string {
        return ({
            SCHEDULED: 'Planifiée',
            CONDUCTED: 'Tenue',
            CANCELLED: 'Annulée',
            NO_SHOW: 'Absence'
        } as Record<string, string>)[s] ?? s;
    }

    getIntervieweeTypeLabel(t: IntervieweeType): string {
        return ({
            TARGETED_PARTY: 'Partie visée',
            WITNESS: 'Témoin',
            DECLARANT: 'Dénonciateur'
        } as Record<string, string>)[t] ?? t;
    }

    // ── Visites terrain ──────────────────────────────────────
    private loadVisitesTerrain(investigationId: string): void {
        this.loadingVisites = true;
        this.visiteTerrainService.findAll(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => {
                this.visitesTerrain = list;
                this.loadingVisites = false;
                list.filter(v => v.status === 'CONDUCTED').forEach(v => this.loadPvConstat(investigationId, v.id));
            });
    }

    private loadPvConstat(investigationId: string, visiteId: string): void {
        this.visiteTerrainService.getPv(investigationId, visiteId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(pv => { this.pvByVisite = { ...this.pvByVisite, [visiteId]: pv }; });
    }

    openScheduleVisiteDialog(): void {
        this.scheduleVisiteForm = { location: '', scheduledAt: new Date() };
        this.showScheduleVisiteDialog = true;
    }

    executeScheduleVisite(): void {
        if (!this.inv || !this.scheduleVisiteForm.location.trim() || !this.scheduleVisiteForm.scheduledAt) return;
        this.schedulingVisite = true;
        this.visiteTerrainService.schedule(this.inv.id, {
            location: this.scheduleVisiteForm.location.trim(),
            scheduledAt: this.scheduleVisiteForm.scheduledAt.toISOString()
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: v => {
                    this.visitesTerrain = [...this.visitesTerrain, v];
                    this.schedulingVisite = false;
                    this.showScheduleVisiteDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Visite planifiée' });
                },
                error: (err: ApiError) => { this.schedulingVisite = false; this.showError(err); }
            });
    }

    openConductVisiteDialog(v: VisiteTerrainResponse): void {
        this.actionVisite = v;
        this.conductVisiteSummary = '';
        this.showConductVisiteDialog = true;
    }

    executeConductVisite(): void {
        if (!this.inv || !this.actionVisite || !this.conductVisiteSummary.trim()) return;
        this.conductingVisite = true;
        this.visiteTerrainService.conduct(this.inv.id, this.actionVisite.id, { summary: this.conductVisiteSummary.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.visitesTerrain = this.visitesTerrain.map(x => x.id === updated.id ? updated : x);
                    this.conductingVisite = false;
                    this.showConductVisiteDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Visite tenue' });
                },
                error: (err: ApiError) => { this.conductingVisite = false; this.showError(err); }
            });
    }

    openCancelVisiteDialog(v: VisiteTerrainResponse): void {
        this.actionVisite = v;
        this.cancelVisiteReason = '';
        this.showCancelVisiteDialog = true;
    }

    executeCancelVisite(): void {
        if (!this.inv || !this.actionVisite || !this.cancelVisiteReason.trim()) return;
        this.cancellingVisite = true;
        this.visiteTerrainService.cancel(this.inv.id, this.actionVisite.id, this.cancelVisiteReason.trim())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.visitesTerrain = this.visitesTerrain.map(x => x.id === updated.id ? updated : x);
                    this.cancellingVisite = false;
                    this.showCancelVisiteDialog = false;
                    this.messageService.add({ severity: 'info', summary: 'Visite annulée' });
                },
                error: (err: ApiError) => { this.cancellingVisite = false; this.showError(err); }
            });
    }

    openCarenceDialog(v: VisiteTerrainResponse): void {
        this.actionVisite = v;
        this.carenceReason = '';
        this.showCarenceDialog = true;
    }

    executeMarkCarence(): void {
        if (!this.inv || !this.actionVisite || !this.carenceReason.trim()) return;
        this.markingCarence = true;
        this.visiteTerrainService.markCarence(this.inv.id, this.actionVisite.id, this.carenceReason.trim())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.visitesTerrain = this.visitesTerrain.map(x => x.id === updated.id ? updated : x);
                    this.markingCarence = false;
                    this.showCarenceDialog = false;
                    this.messageService.add({ severity: 'warn', summary: 'Carence constatée' });
                },
                error: (err: ApiError) => { this.markingCarence = false; this.showError(err); }
            });
    }

    openPvConstatCreateDialog(v: VisiteTerrainResponse): void {
        this.actionVisite = v;
        this.pvConstatContent = '';
        this.showPvConstatCreateDialog = true;
    }

    executeCreatePvConstat(): void {
        if (!this.inv || !this.actionVisite || !this.pvConstatContent.trim()) return;
        this.creatingPvConstat = true;
        this.visiteTerrainService.createPv(this.inv.id, this.actionVisite.id, { content: this.pvConstatContent.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: pv => {
                    this.pvByVisite = { ...this.pvByVisite, [pv.visiteTerrainId]: pv };
                    this.creatingPvConstat = false;
                    this.showPvConstatCreateDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Procès-verbal de constat enregistré' });
                },
                error: (err: ApiError) => { this.creatingPvConstat = false; this.showError(err); }
            });
    }

    getVisiteStatusLabel(s: VisiteStatus): string {
        return ({
            SCHEDULED: 'Planifiée',
            CONDUCTED: 'Tenue',
            CANCELLED: 'Annulée',
            CARENCE: 'Carence'
        } as Record<string, string>)[s] ?? s;
    }

    // ── Check-list du dossier de travail ──────────────────────
    private loadChecklist(investigationId: string): void {
        this.loadingChecklist = true;
        this.checklistDossierTravailService.getChecklist(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => { this.checklistItems = list; this.loadingChecklist = false; });
    }

    getChecklistCheckedCount(): number {
        return this.checklistItems.filter(i => i.coche).length;
    }

    executeToggleChecklist(item: ChecklistDossierTravailItemResponse): void {
        if (!this.inv) return;
        this.savingChecklistCode = item.code;
        this.checklistDossierTravailService.setCoche(this.inv.id, item.code, {
            coche: !item.coche, commentaire: item.commentaire
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.checklistItems = this.checklistItems.map(x => x.pointId === updated.pointId ? updated : x);
                    this.savingChecklistCode = null;
                },
                error: (err: ApiError) => { this.savingChecklistCode = null; this.showError(err); }
            });
    }

    openChecklistCommentDialog(item: ChecklistDossierTravailItemResponse): void {
        this.checklistItemBeingCommented = item;
        this.checklistCommentValue = item.commentaire ?? '';
        this.showChecklistCommentDialog = true;
    }

    executeSaveChecklistComment(): void {
        if (!this.inv || !this.checklistItemBeingCommented) return;
        const item = this.checklistItemBeingCommented;
        this.checklistDossierTravailService.setCoche(this.inv.id, item.code, {
            coche: item.coche, commentaire: this.checklistCommentValue.trim() || undefined
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.checklistItems = this.checklistItems.map(x => x.pointId === updated.pointId ? updated : x);
                    this.showChecklistCommentDialog = false;
                    this.checklistItemBeingCommented = null;
                    this.messageService.add({ severity: 'success', summary: 'Commentaire enregistré' });
                },
                error: (err: ApiError) => this.showError(err)
            });
    }

    // ── Rapport d'enquête officiel ─────────────────────────────
    private loadRapportEnquete(investigationId: string): void {
        this.loadingRapportEnquete = true;
        this.rapportEnqueteService.getRapport(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(r => {
                this.rapportEnquete = r;
                this.loadingRapportEnquete = false;
                if (r) {
                    this.rapportEnqueteService.getNote(investigationId)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(n => { this.noteRecommandations = n; });
                } else {
                    this.noteRecommandations = null;
                }
            });
    }

    openRapportEnqueteDialog(): void {
        this.rapportEnqueteForm = {
            titre: this.rapportEnquete?.titre ?? '',
            introduction: this.rapportEnquete?.introduction ?? '',
            methodologie: this.rapportEnquete?.methodologie ?? '',
            informationsCollectees: this.rapportEnquete?.informationsCollectees ?? '',
            exposeFactuelAnomalies: this.rapportEnquete?.exposeFactuelAnomalies ?? '',
            quantificationPrejudice: this.rapportEnquete?.quantificationPrejudice ?? '',
            reserves: this.rapportEnquete?.reserves ?? '',
            conclusions: this.rapportEnquete?.conclusions ?? ''
        };
        this.showRapportEnqueteDialog = true;
    }

    executeSaveRapportEnquete(): void {
        if (!this.inv) return;
        this.savingRapportEnquete = true;
        const f = this.rapportEnqueteForm;
        this.rapportEnqueteService.saveRapport(this.inv.id, {
            titre: f.titre.trim() || undefined,
            introduction: f.introduction.trim() || undefined,
            methodologie: f.methodologie.trim() || undefined,
            informationsCollectees: f.informationsCollectees.trim() || undefined,
            exposeFactuelAnomalies: f.exposeFactuelAnomalies.trim() || undefined,
            quantificationPrejudice: f.quantificationPrejudice.trim() || undefined,
            reserves: f.reserves.trim() || undefined,
            conclusions: f.conclusions.trim() || undefined
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    this.rapportEnquete = r;
                    this.savingRapportEnquete = false;
                    this.showRapportEnqueteDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Rapport enregistré' });
                },
                error: (err: ApiError) => { this.savingRapportEnquete = false; this.showError(err); }
            });
    }

    openNoteRecommandationsDialog(): void {
        this.noteRecommandationsContent = this.noteRecommandations?.contenu ?? '';
        this.showNoteRecommandationsDialog = true;
    }

    executeSaveNoteRecommandations(): void {
        if (!this.inv) return;
        this.savingNoteRecommandations = true;
        this.rapportEnqueteService.saveNote(this.inv.id, { contenu: this.noteRecommandationsContent.trim() || undefined })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: n => {
                    this.noteRecommandations = n;
                    this.savingNoteRecommandations = false;
                    this.showNoteRecommandationsDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Note de recommandations enregistrée' });
                },
                error: (err: ApiError) => { this.savingNoteRecommandations = false; this.showError(err); }
            });
    }

    // ── Fiche RETEX & leçon à partager ──────────────────────────
    private emptyFicheRetexForm(): FicheRetexRequest {
        return {
            typeInfractionId: undefined, lieu: '', difficultesRencontrees: '',
            origineSoupcons: '', impactFinancier: undefined, originaliteSchemas: '',
            collaborateursPlanifies: '', joursCharges: undefined, contexte: '',
            strategieMethodes: '', syntheseResultats: '', enseignementsAxesAmelioration: ''
        };
    }

    private loadFicheRetex(investigationId: string): void {
        this.loadingFicheRetex = true;
        this.ficheRetexService.getFicheRetex(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(f => {
                this.ficheRetex = f;
                this.loadingFicheRetex = false;
            });
    }

    openFicheRetexDialog(): void {
        this.ficheRetexForm = this.emptyFicheRetexForm();
        if (!this.typesInfractionOptions.length) {
            this.typeInfractionService.findAllActifs()
                .pipe(takeUntil(this.destroy$))
                .subscribe(list => { this.typesInfractionOptions = list; });
        }
        this.showFicheRetexDialog = true;
    }

    executeSaveFicheRetex(): void {
        if (!this.inv) return;
        const f = this.ficheRetexForm;
        if (!f.syntheseResultats.trim() || !f.enseignementsAxesAmelioration.trim()) return;
        this.savingFicheRetex = true;
        this.ficheRetexService.createFicheRetex(this.inv.id, {
            typeInfractionId: f.typeInfractionId || undefined,
            lieu: f.lieu?.trim() || undefined,
            difficultesRencontrees: f.difficultesRencontrees?.trim() || undefined,
            origineSoupcons: f.origineSoupcons?.trim() || undefined,
            impactFinancier: f.impactFinancier ?? undefined,
            originaliteSchemas: f.originaliteSchemas?.trim() || undefined,
            collaborateursPlanifies: f.collaborateursPlanifies?.trim() || undefined,
            joursCharges: f.joursCharges ?? undefined,
            contexte: f.contexte?.trim() || undefined,
            strategieMethodes: f.strategieMethodes?.trim() || undefined,
            syntheseResultats: f.syntheseResultats.trim(),
            enseignementsAxesAmelioration: f.enseignementsAxesAmelioration.trim()
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: r => {
                    this.ficheRetex = r;
                    this.savingFicheRetex = false;
                    this.showFicheRetexDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Fiche RETEX rédigée' });
                },
                error: (err: ApiError) => { this.savingFicheRetex = false; this.showError(err); }
            });
    }

    openPublierLeconDialog(): void {
        this.publierLeconForm = {
            titre: this.ficheRetex?.typeInfractionLibelle ?? '',
            resume: this.ficheRetex?.enseignementsAxesAmelioration ?? ''
        };
        this.showPublierLeconDialog = true;
    }

    executeSavePublierLecon(): void {
        if (!this.inv) return;
        const f = this.publierLeconForm;
        if (!f.titre.trim() || !f.resume.trim()) return;
        this.savingPublierLecon = true;
        this.ficheRetexService.publierLecon(this.inv.id, {
            titre: f.titre.trim(),
            resume: f.resume.trim()
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.savingPublierLecon = false;
                    this.showPublierLeconDialog = false;
                    this.leconPubliee = true;
                    this.messageService.add({ severity: 'success', summary: 'Leçon publiée', detail: 'Visible dans "Leçons à partager"' });
                },
                error: (err: ApiError) => { this.savingPublierLecon = false; this.showError(err); }
            });
    }

    // ── Mandat ───────────────────────────────────────────────
    private loadMandat(investigationId: string): void {
        this.loadingMandat = true;
        this.cadrageService.getMandat(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(m => { this.mandat = m; this.loadingMandat = false; });
    }

    executeDeliverMandat(): void {
        if (!this.inv) return;
        this.deliveringMandat = true;
        this.cadrageService.deliverMandat(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: m => {
                    this.mandat = m;
                    this.deliveringMandat = false;
                    this.messageService.add({ severity: 'success', summary: 'Mandat délivré' });
                },
                error: (err: ApiError) => { this.deliveringMandat = false; this.showError(err); }
            });
    }

    // ── Engagement préalable ────────────────────────────────
    private loadMyEngagement(investigationId: string): void {
        if (!this.currentAgentId) return;
        this.loadingEngagement = true;
        this.cadrageService.getEngagementPrealable(investigationId, this.currentAgentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(e => { this.myEngagement = e; this.loadingEngagement = false; });
    }

    openEngagementDialog(): void {
        this.engagementForm = { hasConflictOfInterest: null, conflictDetails: '' };
        this.showEngagementDialog = true;
    }

    executeSaveEngagement(): void {
        if (!this.inv || this.engagementForm.hasConflictOfInterest === null) return;
        this.savingEngagement = true;
        this.cadrageService.declareEngagementPrealable(this.inv.id, {
            hasConflictOfInterest: this.engagementForm.hasConflictOfInterest,
            conflictDetails: this.engagementForm.conflictDetails.trim() || undefined
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: e => {
                    this.myEngagement = e;
                    this.savingEngagement = false;
                    this.showEngagementDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Engagement enregistré' });
                },
                error: (err: ApiError) => { this.savingEngagement = false; this.showError(err); }
            });
    }

    // ── Plan d'investigation ─────────────────────────────────
    private loadPlan(investigationId: string): void {
        this.loadingPlan = true;
        this.cadrageService.getPlan(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(p => {
                this.plan = p;
                this.loadingPlan = false;
                if (p) {
                    this.cadrageService.getPlanRevisions(investigationId)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(r => { this.planRevisions = r; });
                }
            });
    }

    get planDialogHeader(): string {
        return this.plan ? "Réviser le plan d'investigation" : "Soumettre le plan d'investigation";
    }

    openPlanDialog(): void {
        this.planForm = this.plan
            ? {
                objectifs: this.plan.objectifs, methodologie: this.plan.methodologie,
                moyensMobilises: this.plan.moyensMobilises ?? '', planningProcedures: this.plan.planningProcedures ?? '',
                motifRevision: ''
              }
            : { objectifs: '', methodologie: '', moyensMobilises: '', planningProcedures: '', motifRevision: '' };
        this.showPlanDialog = true;
    }

    executeSavePlan(): void {
        if (!this.inv || !this.planForm.objectifs.trim() || !this.planForm.methodologie.trim()) return;
        if (this.plan && !this.planForm.motifRevision.trim()) return;
        this.savingPlan = true;
        const base = {
            objectifs: this.planForm.objectifs.trim(),
            methodologie: this.planForm.methodologie.trim(),
            moyensMobilises: this.planForm.moyensMobilises.trim() || undefined,
            planningProcedures: this.planForm.planningProcedures.trim() || undefined
        };
        const obs = this.plan
            ? this.cadrageService.revisePlan(this.inv.id, { ...base, motifRevision: this.planForm.motifRevision.trim() })
            : this.cadrageService.submitPlan(this.inv.id, base);
        obs.pipe(takeUntil(this.destroy$))
            .subscribe({
                next: p => {
                    this.plan = p;
                    this.savingPlan = false;
                    this.showPlanDialog = false;
                    this.messageService.add({ severity: 'success', summary: "Plan d'investigation enregistré" });
                    this.cadrageService.getPlanRevisions(this.inv!.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe(r => { this.planRevisions = r; });
                },
                error: (err: ApiError) => { this.savingPlan = false; this.showError(err); }
            });
    }

    executeValidatePlan(): void {
        if (!this.inv) return;
        this.validatingPlan = true;
        this.cadrageService.validatePlan(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: p => {
                    this.plan = p;
                    this.validatingPlan = false;
                    this.messageService.add({ severity: 'success', summary: "Plan d'investigation validé" });
                },
                error: (err: ApiError) => { this.validatingPlan = false; this.showError(err); }
            });
    }

    // ── Incidents d'objectivité ──────────────────────────────
    private loadIncidents(investigationId: string): void {
        this.loadingIncidents = true;
        this.cadrageService.getIncidents(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => { this.incidents = list; this.loadingIncidents = false; });
    }

    openIncidentDialog(): void {
        this.incidentDescription = '';
        this.showIncidentDialog = true;
    }

    executeDeclareIncident(): void {
        if (!this.inv || !this.incidentDescription.trim()) return;
        this.savingIncident = true;
        this.cadrageService.declareIncident(this.inv.id, { description: this.incidentDescription.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: i => {
                    this.incidents = [...this.incidents, i];
                    this.savingIncident = false;
                    this.showIncidentDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Incident déclaré' });
                },
                error: (err: ApiError) => { this.savingIncident = false; this.showError(err); }
            });
    }

    // ── Procédures d'urgence ─────────────────────────────────
    private loadProcedures(investigationId: string): void {
        this.loadingProcedures = true;
        this.cadrageService.getProcedures(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => { this.proceduresUrgence = list; this.loadingProcedures = false; });
    }

    openProcedureDialog(): void {
        this.procedureJustification = '';
        this.showProcedureDialog = true;
    }

    executeDemanderProcedure(): void {
        if (!this.inv || !this.procedureJustification.trim()) return;
        this.savingProcedure = true;
        this.cadrageService.demanderProcedureUrgence(this.inv.id, { justification: this.procedureJustification.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: p => {
                    this.proceduresUrgence = [...this.proceduresUrgence, p];
                    this.savingProcedure = false;
                    this.showProcedureDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Procédure d\'urgence demandée' });
                },
                error: (err: ApiError) => { this.savingProcedure = false; this.showError(err); }
            });
    }

    openProcedureDecisionDialog(procedureId: string, action: 'approuver' | 'rejeter'): void {
        this.decidingProcedureId = procedureId;
        this.procedureDecisionAction = action;
        this.procedureDecisionMotif = '';
        this.showProcedureDecisionDialog = true;
    }

    executeDecideProcedure(): void {
        if (!this.inv || !this.decidingProcedureId || !this.procedureDecisionAction) return;
        this.savingProcedure = true;
        const req = { motifDecision: this.procedureDecisionMotif.trim() || undefined };
        const obs = this.procedureDecisionAction === 'approuver'
            ? this.cadrageService.approuverProcedureUrgence(this.inv.id, this.decidingProcedureId, req)
            : this.cadrageService.rejeterProcedureUrgence(this.inv.id, this.decidingProcedureId, req);
        obs.pipe(takeUntil(this.destroy$))
            .subscribe({
                next: p => {
                    this.proceduresUrgence = this.proceduresUrgence.map(x => x.id === p.id ? p : x);
                    this.savingProcedure = false;
                    this.showProcedureDecisionDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Décision enregistrée' });
                },
                error: (err: ApiError) => { this.savingProcedure = false; this.showError(err); }
            });
    }

    getProcedureStatusLabel(s: StatutProcedureUrgence): string {
        return ({ EN_ATTENTE: 'En attente', APPROUVEE: 'Approuvée', REJETEE: 'Rejetée' } as Record<string, string>)[s] ?? s;
    }

    getProcedureStatusSeverity(s: StatutProcedureUrgence): TagSeverity {
        return ({ EN_ATTENTE: 'warn', APPROUVEE: 'success', REJETEE: 'danger' } as Record<string, TagSeverity>)[s] ?? 'info';
    }

    // ── Mesures conservatoires ────────────────────────────────
    private loadMesures(investigationId: string): void {
        this.loadingMesures = true;
        this.cadrageService.getMesures(investigationId)
            .pipe(takeUntil(this.destroy$))
            .subscribe(list => { this.mesuresConservatoires = list; this.loadingMesures = false; });
    }

    openMesureDialog(): void {
        this.mesureDescription = '';
        this.showMesureDialog = true;
    }

    executeDeclarerMesure(): void {
        if (!this.inv || !this.mesureDescription.trim()) return;
        this.savingMesure = true;
        this.cadrageService.declarerMesureConservatoire(this.inv.id, { description: this.mesureDescription.trim() })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: m => {
                    this.mesuresConservatoires = [...this.mesuresConservatoires, m];
                    this.savingMesure = false;
                    this.showMesureDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Mesure conservatoire déclarée' });
                },
                error: (err: ApiError) => { this.savingMesure = false; this.showError(err); }
            });
    }

    openReportDialog(): void {
        this.reportMode = 'ONLINE';
        this.uploadedReportFile = null;
        this.reportFiles = [];
        this.uploadProgress = 0;
        this.reportRequest = {
            finalReport: '', conclusions: '',
            recommendations: '', outcome: 'ADMINISTRATIVE_SANCTIONS'
        };
        this.showReportDialog = true;
    }

    setReportMode(mode: ReportMode): void {
        this.reportMode = mode;
        this.reportRequest.finalReport = mode === 'UPLOAD'
            ? '[RAPPORT IMPORTÉ — voir fichier joint]' : '';
    }

    canSubmitReport(): boolean {
        if (!this.reportRequest.outcome) return false;
        if (this.reportMode === 'ONLINE') {
            return !!(this.reportRequest.finalReport?.trim()
                && this.reportRequest.conclusions?.trim());
        }
        return !!(this.uploadedReportFile && this.reportRequest.conclusions?.trim());
    }

    onReportFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.[0]) this.uploadedReportFile = input.files[0];
    }

    onReportFileDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
        const files = event.dataTransfer?.files;
        if (files?.[0]) this.uploadedReportFile = files[0];
    }

    onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) { this.addReportFiles(Array.from(input.files)); input.value = ''; }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer?.files) this.addReportFiles(Array.from(event.dataTransfer.files));
    }

    private addReportFiles(files: File[]): void {
        const maxSize = 10 * 1024 * 1024;
        for (const f of files) {
            if (f.size > maxSize) {
                this.messageService.add({ severity: 'warn', summary: 'Fichier trop volumineux', detail: `${f.name} dépasse 10 Mo` });
            } else {
                this.reportFiles.push(f);
            }
        }
    }

    removeReportFile(index: number): void { this.reportFiles.splice(index, 1); }

    cancelReport(): void {
        this.showReportDialog   = false;
        this.reportFiles        = [];
        this.uploadProgress     = 0;
        this.uploadedReportFile = null;
    }

    async previewReportPdf(): Promise<void> {
        if (!this.inv || !this.reportRequest.finalReport) return;
        this.generatingPreview = true;
        try {
            const { default: jsPDF }     = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W   = doc.internal.pageSize.getWidth();
            let y = 0;
            doc.setFillColor(109, 40, 217);
            doc.rect(0, 0, W, 28, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(13); doc.setFont('helvetica', 'bold');
            doc.text('ASCE-LC — RAPPORT D\'INVESTIGATION', 14, 11);
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.text('Département d\'Enquête et d\'Investigation — BROUILLON', 14, 18);
            doc.setFontSize(7);
            doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR'), W - 14, 24, { align: 'right' });
            doc.setTextColor(0, 0, 0);
            y = 35;
            autoTable(doc, {
                startY: y,
                body: [
                    ['N° dossier', this.inv.dossierNumber || '—', 'Statut', 'EN COURS'],
                    ['Objet', this.inv.dossierObject || '—', 'Issue prévue', this.getOutcomeLabel(this.reportRequest.outcome || '')]
                ],
                theme: 'grid', bodyStyles: { fontSize: 8.5 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 38, fillColor: [248,250,252] },
                    1: { cellWidth: 52 },
                    2: { fontStyle: 'bold', cellWidth: 38, fillColor: [248,250,252] },
                    3: { cellWidth: 52 }
                },
                margin: { left: 14, right: 14 }
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            const stripped = (this.reportRequest.finalReport || '').replace(/<[^>]+>/g, '').trim();
            if (stripped) {
                doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(109, 40, 217);
                doc.text('RAPPORT', 14, y); y += 5;
                doc.setTextColor(0, 0, 0); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
                const lines = doc.splitTextToSize(stripped, W - 28);
                doc.text(lines, 14, y); y += lines.length * 5 + 6;
            }
            const conclStripped = (this.reportRequest.conclusions || '').replace(/<[^>]+>/g, '').trim();
            if (conclStripped) {
                doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(109, 40, 217);
                doc.text('CONCLUSIONS', 14, y); y += 5;
                doc.setTextColor(0, 0, 0); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
                const lines = doc.splitTextToSize(conclStripped, W - 28);
                doc.text(lines, 14, y);
            }
            doc.setFontSize(7); doc.setTextColor(150, 150, 150);
            doc.text('ASCE-LC — BROUILLON — Document confidentiel', 14, doc.internal.pageSize.getHeight() - 8);
            doc.text('Page 1/1', W - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
            const filename = `apercu_rapport_${this.inv.dossierNumber || this.inv.id.substring(0, 8)}.pdf`;
            doc.save(filename);
            this.messageService.add({ severity: 'info', summary: 'Aperçu généré', detail: filename + ' — version brouillon' });
        } catch (err) {
            this.messageService.add({ severity: 'error', summary: 'Erreur PDF', detail: 'Vérifiez que jspdf est installé.' });
        } finally {
            this.generatingPreview = false;
        }
    }

    executeSubmitReport(): void {
        if (!this.inv || !this.canSubmitReport()) return;
        this.actioning = true;
        const doSubmit = () => {
            if (!this.inv) return;
            this.uploadProgress = 90;
            this.investigationService.submitReport(this.inv.id, this.reportRequest)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: inv => {
                        this.setInv(inv);
                        this.actioning = false; this.uploadProgress = 100; this.showReportDialog = false;
                        this.reportRequest = { finalReport: '', conclusions: '', recommendations: '', outcome: 'ADMINISTRATIVE_SANCTIONS' };
                        this.reportFiles = []; this.uploadedReportFile = null;
                        setTimeout(() => { this.uploadProgress = 0; }, 1000);
                        this.messageService.add({
                            severity: 'success',
                            summary: this.reportMode === 'ONLINE' ? 'Rapport soumis — PDF généré' : 'Rapport importé et soumis',
                            detail: "En attente d'approbation DEI."
                        });
                    },
                    error: (err: ApiError) => { this.actioning = false; this.uploadProgress = 0; this.showError(err); }
                });
        };
        const filesToUpload: File[] = [];
        if (this.reportMode === 'UPLOAD' && this.uploadedReportFile) filesToUpload.push(this.uploadedReportFile);
        filesToUpload.push(...this.reportFiles);
        if (filesToUpload.length > 0) {
            this.uploadProgress = 10;
            const dossierId = this.inv.dossier?.id ?? this.inv.dossierId!;
            this.attachmentService.upload(dossierId, filesToUpload)
                .pipe(takeUntil(this.destroy$))
                .subscribe({ next: () => doSubmit(), error: () => doSubmit() });
        } else {
            doSubmit();
        }
    }

    // ── Prolongation ───────────────────────────────────────────
    openExtendDialog(): void {
        this.extendDays = 30; this.extendReason = '';
        this.extendReasonError = false;
        this.hierarchyApproved = false; this.hierarchyApprovedError = false;
        this.computeNewDeadline();
        this.showExtendDialog = true;
    }

    setExtendDays(days: number): void { this.extendDays = days; this.computeNewDeadline(); }
    onExtendDaysChange(): void { this.computeNewDeadline(); }

    private computeNewDeadline(): void {
        if (!this.inv) { this.computedNewDeadline = null; return; }
        const base = this.inv.extendedDeadline || this.inv.plannedEndDate;
        if (!base) { this.computedNewDeadline = null; return; }
        const d = new Date(base);
        d.setDate(d.getDate() + (this.extendDays || 0));
        this.computedNewDeadline = d;
    }

    cancelExtend(): void {
        this.showExtendDialog = false;
        this.extendReasonError = false;
        this.hierarchyApprovedError = false;
    }

    executeExtend(): void {
        this.extendReasonError      = !this.extendReason.trim();
        this.hierarchyApprovedError = !this.hierarchyApproved;
        if (this.extendReasonError || this.hierarchyApprovedError) return;
        if (!this.inv || !this.computedNewDeadline) return;
        this.actioning = true;
        const request: ExtendDeadlineRequest = {
            newDeadline: this.computedNewDeadline.toISOString(),
            reason:      this.extendReason.trim()
        };
        this.investigationService.extendDeadline(this.inv.id, request)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: updated => {
                    this.setInv(updated);
                    this.actioning = false; this.showExtendDialog = false;
                    this.extendReason = ''; this.hierarchyApproved = false;
                    this.messageService.add({
                        severity: 'success', summary: 'Investigation prolongée',
                        detail: `+${this.extendDays}j — échéance : ` + this.computedNewDeadline!.toLocaleDateString('fr-FR')
                    });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    // ── Actions principales ────────────────────────────────────
    openInvestigation(): void {
        if (!this.dossierId) return;
        this.actioning = true;
        this.investigationService
            .open(this.dossierId, { plannedDurationDays: this.openDays })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv); this.actioning = false;
                    this.messageService.add({ severity: 'success', summary: 'Investigation ouverte' });
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
                    this.setInv(inv); this.actioning = false;
                    this.messageService.add({
                        severity: 'success', summary: 'Investigation démarrée',
                        detail: `Échéance : ${new Date(inv.plannedEndDate!).toLocaleDateString('fr-FR')}`
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
                    this.setInv(inv); this.actioning = false;
                    this.showSuspendDialog = false; this.suspendReason = '';
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
                    this.setInv(inv); this.actioning = false;
                    this.messageService.add({ severity: 'success', summary: 'Reprise' });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeApproveDei(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.approveDei(this.inv.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: inv => {
                    this.setInv(inv); this.actioning = false;
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
                    this.setInv(inv); this.actioning = false;
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
                    this.setInv(inv); this.actioning = false;
                    this.showCgeDialog = false; this.cgeReason = '';
                    const archived = inv.outcome === 'ARCHIVED';
                    this.messageService.add({
                        severity: archived ? 'info' : 'success',
                        summary:  archived ? 'Dossier classé sans suite' : 'Décision CGE rendue',
                        detail:   archived ? 'Dossier → CLASSÉ' : 'Dossier → DÉCISION RENDUE'
                    });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeAddMember(): void {
        if (!this.inv || !this.newMemberAgentId) return;
        this.actioning = true;
        this.investigationService
            .addMember(this.inv.id, { agentId: this.newMemberAgentId, teamRole: this.newMemberRole })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updated) => {
                    this.setInv(updated);
                    this.actioning           = false;
                    this.showAddMemberDialog = false;
                    this.newMemberAgentId    = '';
                    this.newMemberRole       = 'MEMBER';
                    this.messageService.add({ severity: 'success', summary: 'Membre ajouté' });
                },
                error: (err: ApiError) => { this.actioning = false; this.showError(err); }
            });
    }

    executeRemoveMember(agentId: string): void {
        if (!this.inv) return;
        this.investigationService.removeMember(this.inv.id, agentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updated) => {
                    this.setInv(updated);
                    this.messageService.add({ severity: 'info', summary: 'Membre retiré' });
                },
                error: (err: ApiError) => this.showError(err)
            });
    }

    // ── Helpers ────────────────────────────────────────────────
    getProgress(): number {
        if (!this.inv?.startDate || !this.inv?.plannedEndDate) return 0;
        const start = new Date(this.inv.startDate).getTime();
        const end   = new Date(this.inv.extendedDeadline ?? this.inv.plannedEndDate).getTime();
        return Math.min(Math.max(Math.round(((Date.now() - start) / (end - start)) * 100), 0), 100);
    }

    getProgressGradient(): string {
        if (this.inv?.overdue)        return 'linear-gradient(90deg,#ef4444,#dc2626)';
        if (this.getProgress() >= 80) return 'linear-gradient(90deg,#f59e0b,#d97706)';
        return 'linear-gradient(90deg,#22c55e,#16a34a)';
    }

    private buildApprovalSteps(inv: InvestigationResponse): void {
        this.approvalSteps = [
            {
                label: "Rapport soumis par l'équipe", icon: 'pi-file',
                delay: '', done: !!inv.reportSubmittedAt,
                active: inv.status === 'IN_PROGRESS', date: inv.reportSubmittedAt
            },
            {
                label: 'Approbation DEI', icon: 'pi-user',
                delay: '(15 jours ouvrables)', done: !!inv.deiApprovedAt,
                active: !!inv.reportSubmittedAt && !inv.deiApprovedAt, date: inv.deiApprovedAt
            },
            {
                label: 'Conseiller Juridique', icon: 'pi-shield',
                delay: '(10 jours ouvrables)', done: !!inv.legalAdvisorApprovedAt,
                active: !!inv.deiApprovedAt && !inv.legalAdvisorApprovedAt, date: inv.legalAdvisorApprovedAt
            },
            {
                label: 'Décision finale CGE', icon: 'pi-hammer',
                delay: '(20 jours ouvrables)', done: !!inv.cgeApprovedAt,
                active: !!inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt, date: inv.cgeApprovedAt
            }
        ];
    }

    getCgeResultLabel(): string {
        if (!this.inv?.outcome) return 'Résultat non défini';
        const labels: Record<string, string> = {
            ADMINISTRATIVE_SANCTIONS: 'Sanctions administratives',
            JUDICIAL_REFERRAL: 'Saisine judiciaire',
            ARCHIVED: 'Classé sans suite',
            PRESS_RELEASE: 'Communiqué de presse',
            ANNUAL_REPORT: 'Rapport annuel'
        };
        return labels[this.inv.outcome] ?? this.inv.outcome;
    }

    getCgeResultDescription(): string {
        if (this.inv?.outcome === 'ARCHIVED') {
            return "Les investigations n'ont pas confirmé les présomptions initiales. "
                 + "Le dossier sera directement classé (CLASSÉ) sans décision formelle.";
        }
        return "Une décision formelle sera rendue. Le dossier passera en "
             + "DÉCISION RENDUE. Le CGE/CGEA pourra ensuite le clôturer (CLOS).";
    }

    getOutcomeLabel(outcome: string): string {
        const labels: Record<string, string> = {
            ADMINISTRATIVE_SANCTIONS: 'Sanctions admin.',
            JUDICIAL_REFERRAL: 'Saisine judiciaire',
            ARCHIVED: 'Classé s.s.',
            PRESS_RELEASE: 'Communiqué',
            ANNUAL_REPORT: 'Rapport annuel'
        };
        return labels[outcome] || outcome;
    }

    hasRole(roles: string[]): boolean { return this.keycloakService.hasAnyRole(roles); }

    getInitials(name: string): string {
        return (name || '').split(' ').map(n => n[0] ?? '')
            .join('').substring(0, 2).toUpperCase();
    }

    getRoleLabel(role: TeamRole): string {
        return role === 'TEAM_LEADER' ? 'Chef mission' : 'Investigateur';
    }

    getStatusLabel(status: string): string {
        const labels: Readonly<Record<string, string>> = {
            INITIATED: 'Initiée', IN_PROGRESS: 'En cours',
            SUSPENDED: 'Suspendue', COMPLETED: 'Rapport soumis', ARCHIVED: 'Archivée'
        };
        return labels[status] ?? status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Readonly<Record<string, TagSeverity>> = {
            INITIATED: 'info', IN_PROGRESS: 'success',
            SUSPENDED: 'warn', COMPLETED: 'info', ARCHIVED: 'secondary'
        };
        return map[status] ?? 'info';
    }

    formatFileSize(bytes: number): string {
        return this.attachmentService.formatSize(bytes);
    }

    private showError(err: ApiError): void {
        this.messageService.add({
            severity: 'error', summary: 'Erreur',
            detail: err.error?.message ?? "Une erreur s'est produite"
        });
    }
}