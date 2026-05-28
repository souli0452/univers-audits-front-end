import {
    Component, OnInit, OnChanges, OnDestroy,
    Input, SimpleChanges, inject
} from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule }                         from '@angular/forms';
import { DomSanitizer, SafeHtml }              from '@angular/platform-browser';
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
import { MessageService }   from 'primeng/api';

import {
    InvestigationService,
    InvestigationResponse,
    TeamRole,
    SubmitReportRequest,
    ExtendDeadlineRequest
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
        SkeletonModule, AvatarModule, TooltipModule, EditorModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<!-- ── Dialog suspension ─────────────────────────────────── -->
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

<!-- ── Dialog prolongation — Manuel Processus C §C.2.4.3 ─── -->
<p-dialog [(visible)]="showExtendDialog"
    header="Prolonger l'investigation"
    [modal]="true" [style]="{width:'540px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">

        <!-- Rappel règle Manuel -->
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl
                    flex items-start gap-2">
            <i class="pi pi-book text-blue-600 mt-0.5 flex-shrink-0"></i>
            <div>
                <div class="text-xs font-bold text-blue-700 mb-1">
                    Manuel des Procédures — §C.2.4.3
                </div>
                <p class="text-xs text-blue-600 leading-relaxed">
                    Durée normale : <strong>90 jours</strong>.
                    Toute prolongation doit être validée par
                    <strong>DEI → CGEA → CGE</strong> avant d'être saisie.
                </p>
            </div>
        </div>

        <!-- Échéances actuelle / nouvelle -->
        <div *ngIf="inv?.plannedEndDate || inv?.extendedDeadline"
            class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-surface-50 dark:bg-surface-700
                        rounded-xl border border-surface-100">
                <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">
                    Échéance actuelle
                </div>
                <div class="font-bold text-sm"
                    [class.text-red-600]="inv?.overdue"
                    [class.text-surface-900]="!inv?.overdue">
                    {{ (inv?.extendedDeadline || inv?.plannedEndDate)
                        | date:'dd/MM/yyyy' }}
                    <span *ngIf="inv?.overdue"
                        class="ml-1 text-xs font-normal text-red-500">
                        (dépassée)
                    </span>
                </div>
            </div>
            <div class="p-3 bg-green-50 rounded-xl border border-green-200">
                <div class="text-xs text-green-600 uppercase tracking-wide mb-1">
                    Nouvelle échéance
                </div>
                <div class="font-bold text-sm text-green-700">
                    {{ computedNewDeadline | date:'dd/MM/yyyy' }}
                </div>
            </div>
        </div>

        <!-- Jours supplémentaires -->
        <div>
            <label class="text-xs font-medium text-surface-500 mb-2 block
                          uppercase tracking-wide">
                Durée supplémentaire (jours)
                <span class="text-red-500 ml-1">*</span>
            </label>
            <div class="flex items-center gap-3 mb-2">
                <input type="number"
                    [(ngModel)]="extendDays"
                    (ngModelChange)="onExtendDaysChange()"
                    min="1" max="365"
                    class="p-inputtext w-28 text-center text-xl font-bold font-mono"/>
                <span class="text-sm text-surface-400">jours supplémentaires</span>
            </div>
            <div class="flex gap-2 flex-wrap">
                <button *ngFor="let opt of extendOptions"
                    class="text-xs px-3 py-1.5 rounded-lg border
                           transition-colors cursor-pointer"
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

        <!-- Motif -->
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block
                          uppercase tracking-wide">
                Motif de la prolongation
                <span class="text-red-500 ml-1">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="extendReason"
                rows="4" class="w-full resize-none"
                [class.border-red-400]="extendReasonError"
                placeholder="Ex: Complexité nécessitant des investigations complémentaires — accord hiérarchique obtenu le JJ/MM/AAAA...">
            </textarea>
            <p *ngIf="extendReasonError"
                class="text-xs text-red-500 mt-1 flex items-center gap-1">
                <i class="pi pi-exclamation-circle text-xs"></i>
                Le motif est obligatoire (§C.2.4.3).
            </p>
        </div>

        <!-- Confirmation accord hiérarchique -->
        <label class="flex items-start gap-2 cursor-pointer p-3
                       bg-amber-50 border border-amber-200 rounded-xl">
            <input type="checkbox" [(ngModel)]="hierarchyApproved"
                class="mt-0.5 flex-shrink-0"/>
            <span class="text-sm text-amber-800">
                <strong>Je confirme</strong> avoir obtenu l'accord de la hiérarchie
                (DEI, CGEA, CGE) conformément au §C.2.4.3 du Manuel des Procédures.
            </span>
        </label>
        <p *ngIf="hierarchyApprovedError"
            class="text-xs text-red-500 -mt-2 flex items-center gap-1">
            <i class="pi pi-exclamation-circle text-xs"></i>
            Vous devez confirmer l'accord hiérarchique.
        </p>

    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="cancelExtend()"/>
        <p-button label="Confirmer la prolongation"
            icon="pi pi-calendar-plus" severity="info"
            [loading]="actioning" (onClick)="executeExtend()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog rapport final ───────────────────────────────── -->
<p-dialog [(visible)]="showReportDialog"
    header="Soumettre le rapport final"
    [modal]="true" [style]="{width:'700px'}" [draggable]="false">
    <div class="flex flex-col gap-5 py-2">

        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Rapport complet <span class="text-red-500">*</span>
            </label>
            <p-editor [(ngModel)]="reportRequest.finalReport"
                [style]="{'height':'180px'}"
                placeholder="Rapport détaillé de l'investigation...">
                <ng-template pTemplate="header">
                    <span class="ql-formats">
                        <button class="ql-bold"></button>
                        <button class="ql-italic"></button>
                        <button class="ql-underline"></button>
                    </span>
                    <span class="ql-formats">
                        <select class="ql-align"></select>
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
                Conclusions <span class="text-red-500">*</span>
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
                Issue / Résultat <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="reportRequest.outcome"
                [options]="outcomeOptions"
                optionLabel="label" optionValue="value"
                placeholder="Sélectionner..." styleClass="w-full"
                appendTo="body"/>
        </div>

        <!-- Zone upload -->
        <div class="border-t border-surface-100 pt-4">
            <div class="flex items-center gap-2 mb-3">
                <div class="w-7 h-7 rounded-lg bg-amber-100 flex items-center
                            justify-center">
                    <i class="pi pi-paperclip text-amber-600 text-xs"></i>
                </div>
                <span class="text-sm font-semibold text-surface-700">
                    Documents joints
                </span>
                <span class="text-xs text-surface-400">(optionnel)</span>
            </div>
            <div class="border-2 border-dashed border-surface-200 rounded-xl p-4
                        hover:border-primary-300 transition-colors cursor-pointer"
                (dragover)="$event.preventDefault()"
                (drop)="onFileDrop($event)">
                <div class="flex flex-col items-center gap-2
                            text-surface-400 text-sm">
                    <i class="pi pi-upload text-2xl text-surface-300"></i>
                    <span>Glissez vos fichiers ici ou</span>
                    <label class="cursor-pointer">
                        <span class="text-primary-600 font-semibold
                                     hover:underline">Parcourir</span>
                        <input type="file" multiple class="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
                            (change)="onFileSelect($event)"/>
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
                        [class.bg-surface-200]="!f.type.includes('pdf')
                            && !f.type.startsWith('image/')">
                        <i class="pi text-xs"
                            [class.pi-file-pdf]="f.type.includes('pdf')"
                            [class.text-red-600]="f.type.includes('pdf')"
                            [class.pi-image]="f.type.startsWith('image/')"
                            [class.text-blue-600]="f.type.startsWith('image/')"
                            [class.pi-file]="!f.type.includes('pdf')
                                && !f.type.startsWith('image/')"
                            [class.text-surface-500]="!f.type.includes('pdf')
                                && !f.type.startsWith('image/')">
                        </i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium text-surface-900 truncate">
                            {{ f.name }}
                        </div>
                        <div class="text-xs text-surface-400">
                            {{ formatFileSize(f.size) }}
                        </div>
                    </div>
                    <p-button icon="pi pi-times" severity="danger" text
                        size="small" (onClick)="removeReportFile(i)"/>
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
            (onClick)="cancelReport()"/>
        <p-button label="Soumettre le rapport" icon="pi pi-send"
            severity="success" [loading]="actioning"
            [disabled]="!reportRequest.finalReport || !reportRequest.conclusions"
            (onClick)="executeSubmitReport()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog décision CGE — avec aperçu statut résultant ─── -->
<p-dialog [(visible)]="showCgeDialog"
    header="Décision finale CGE"
    [modal]="true" [style]="{width:'500px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">

        <!-- Aperçu outcome + statut résultant -->
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
                    [class.text-green-600]="inv?.outcome !== 'ARCHIVED'">
                </i>
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

        <!-- Décision / justification -->
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block
                          uppercase tracking-wide">
                Décision et justification <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="cgeReason"
                placeholder="Motivez la décision finale du CGE..."
                rows="4" class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showCgeDialog=false"/>
        <p-button
            [label]="inv?.outcome === 'ARCHIVED'
                ? 'Classer sans suite'
                : 'Valider la décision'"
            [icon]="inv?.outcome === 'ARCHIVED'
                ? 'pi pi-folder'
                : 'pi pi-hammer'"
            [severity]="inv?.outcome === 'ARCHIVED' ? 'secondary' : 'success'"
            [loading]="actioning"
            [disabled]="!cgeReason.trim()"
            (onClick)="executeApproveCge()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog ajouter membre ──────────────────────────────── -->
<p-dialog [(visible)]="showAddMemberDialog"
    header="Ajouter un membre à l'équipe"
    [modal]="true" [style]="{width:'500px'}">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Agent <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="newMemberAgentId"
                [options]="availableAgents"
                optionLabel="label" optionValue="value"
                placeholder="Sélectionner un agent..."
                styleClass="w-full" [filter]="true" appendTo="body"/>
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Rôle <span class="text-red-500">*</span>
            </label>
            <p-select [(ngModel)]="newMemberRole"
                [options]="roleOptions"
                optionLabel="label" optionValue="value"
                styleClass="w-full" appendTo="body"/>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showAddMemberDialog=false"/>
        <p-button label="Ajouter" icon="pi pi-user-plus"
            [loading]="actioning" (onClick)="executeAddMember()"/>
    </ng-template>
</p-dialog>

<!-- ════════════════════════════════════════════════════════
     PAGE PRINCIPALE
     ════════════════════════════════════════════════════════ -->
<div *ngIf="!loading; else sk" class="flex flex-col gap-5">

    <!-- En-tête page standalone -->
    <div *ngIf="!isPanel"
        class="flex items-start justify-between flex-wrap gap-3">
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

    <!-- Actions page standalone -->
    <ng-container *ngIf="!isPanel && inv">
        <div class="flex gap-2 flex-wrap justify-end">
            <ng-container *ngTemplateOutlet="actionButtons; context:{inv:inv}"/>
        </div>
    </ng-container>

    <!-- En-tête panel -->
    <div *ngIf="isPanel"
        class="bg-white dark:bg-surface-800 rounded-2xl p-4
               border border-surface-100 dark:border-surface-700">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h3 class="font-bold text-surface-900 dark:text-surface-0
                       flex items-center gap-2">
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

    <!-- Template actions partagé -->
    <ng-template #actionButtons let-inv="inv">
        <!-- Démarrer -->
        <p-button *ngIf="inv.status==='INITIATED' && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Démarrer" icon="pi pi-play" severity="success" size="small"
            [loading]="actioning" (onClick)="executeStart()"/>

        <!-- Suspendre -->
        <p-button *ngIf="inv.status==='IN_PROGRESS'
                         && hasRole(['CGEA','CGE','ADMIN_DDIC'])"
            label="Suspendre" icon="pi pi-pause" severity="warn" size="small"
            (onClick)="showSuspendDialog=true"/>

        <!-- Reprendre -->
        <p-button *ngIf="inv.status==='SUSPENDED'
                         && hasRole(['CGEA','CGE','ADMIN_DDIC'])"
            label="Reprendre" icon="pi pi-play" severity="info" size="small"
            [loading]="actioning" (onClick)="executeResume()"/>

        <!-- Prolonger — §C.2.4.3 : IN_PROGRESS ou SUSPENDED, accord hiérarchique requis -->
        <p-button *ngIf="(inv.status==='IN_PROGRESS' || inv.status==='SUSPENDED')
                         && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Prolonger" icon="pi pi-calendar-plus"
            severity="secondary" outlined size="small"
            pTooltip="§C.2.4.3 — Accord DEI+CGEA+CGE requis"
            tooltipPosition="top"
            (onClick)="openExtendDialog()"/>

        <!-- Soumettre rapport -->
        <p-button *ngIf="inv.status==='IN_PROGRESS'
                         && hasRole(['CONTROLEUR_ETAT','ADMIN_DDIC'])"
            label="Soumettre rapport" icon="pi pi-file-check" size="small"
            (onClick)="showReportDialog=true"/>

        <!-- Approuver DEI -->
        <p-button *ngIf="inv.status==='COMPLETED' && !inv.deiApprovedAt
                         && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Approuver DEI" icon="pi pi-check" severity="success"
            size="small" [loading]="actioning" (onClick)="executeApproveDei()"/>

        <!-- Approuver Juridique -->
        <p-button *ngIf="inv.deiApprovedAt && !inv.legalAdvisorApprovedAt
                         && hasRole(['CONSEILLER_JURIDIQUE','ADMIN_DDIC'])"
            label="Approuver Juridique" icon="pi pi-shield" severity="success"
            size="small" [loading]="actioning" (onClick)="executeApproveLegal()"/>

        <!-- Décision CGE -->
        <p-button *ngIf="inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt
                         && hasRole(['CGE','ADMIN_DDIC'])"
            label="Décision CGE" icon="pi pi-hammer" severity="success"
            size="small" (onClick)="showCgeDialog=true"/>
    </ng-template>

    <!-- ════════════════════════════════════════════════════
         GRILLE PRINCIPALE
         ════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- CAS 1 : pas d'investigation -->
        <div *ngIf="!inv && isPanel" class="lg:col-span-3">
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-8
                        border border-surface-100 dark:border-surface-700
                        max-w-2xl mx-auto">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 rounded-2xl bg-surface-100
                                dark:bg-surface-700 flex items-center
                                justify-center mx-auto mb-3">
                        <i class="pi pi-search text-2xl text-surface-300"></i>
                    </div>
                    <p class="font-semibold text-surface-600
                               dark:text-surface-300 text-sm">
                        Aucune investigation ouverte pour ce dossier
                    </p>
                </div>

                <div *ngIf="dossierStatus==='RECEVABLE'
                            && hasRole(['CGEA','ADMIN_DDIC'])"
                    class="flex flex-col gap-4">
                    <div class="p-4 bg-green-50 dark:bg-green-950 border
                                border-green-200 rounded-xl">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="pi pi-check-circle text-green-600"></i>
                            <span class="text-sm font-semibold text-green-700
                                         dark:text-green-300">
                                Dossier déclaré recevable
                            </span>
                        </div>
                        <p class="text-xs text-green-600 dark:text-green-400 ml-6">
                            Le CGE a validé ce dossier. Vous pouvez ouvrir
                            l'investigation.
                        </p>
                    </div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                border border-surface-100 dark:border-surface-600">
                        <label class="text-xs font-semibold text-surface-600
                                      uppercase tracking-wide mb-3 block">
                            Durée prévue (Manuel §C.2.4.3 : min 90 jours)
                        </label>
                        <div class="flex items-center gap-3 mb-3">
                            <input type="number" [(ngModel)]="openDays"
                                min="90" max="365"
                                class="p-inputtext w-28 text-sm text-center
                                       font-mono font-bold"/>
                            <span class="text-sm text-surface-400">jours</span>
                        </div>
                        <div class="flex gap-2">
                            <button *ngFor="let d of quickDays"
                                class="text-xs px-3 py-1.5 rounded-lg border
                                       transition-colors cursor-pointer"
                                [class.bg-primary-100]="openDays===d"
                                [class.text-primary-700]="openDays===d"
                                [class.border-primary-300]="openDays===d"
                                [class.bg-surface-100]="openDays!==d"
                                [class.text-surface-500]="openDays!==d"
                                [class.border-surface-200]="openDays!==d"
                                (click)="openDays=d">
                                {{ d }}j
                            </button>
                        </div>
                    </div>
                    <p-button label="Ouvrir l'investigation" icon="pi pi-play"
                        severity="success" styleClass="w-full justify-center"
                        [loading]="actioning" (onClick)="openInvestigation()"/>
                </div>

                <div *ngIf="dossierStatus==='RECEVABLE'
                            && !hasRole(['CGEA','ADMIN_DDIC'])"
                    class="p-3 bg-blue-50 border border-blue-200 rounded-xl
                           text-sm text-blue-700 text-center">
                    <i class="pi pi-info-circle mr-2"></i>
                    Dossier recevable. En attente d'ouverture par le CGEA.
                </div>
            </div>
        </div>

        <!-- CAS 2 : investigation existe -->
        <ng-container *ngIf="inv">

            <!-- Colonne gauche (2/3) -->
            <div class="lg:col-span-2 flex flex-col gap-5">

                <!-- Progression -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0
                               mb-4 flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-100
                                    dark:bg-blue-900 flex items-center
                                    justify-center">
                            <i class="pi pi-chart-line text-blue-600 text-xs"></i>
                        </div>
                        Progression de l'enquête
                    </h3>

                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-surface-400">Avancement temporel</span>
                            <span class="font-bold text-surface-700
                                         dark:text-surface-200">
                                {{ getProgress() }}%
                            </span>
                        </div>
                        <div class="h-3 bg-surface-100 dark:bg-surface-700
                                    rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-500"
                                [style.width]="getProgress()+'%'"
                                [style.background]="getProgressGradient()">
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-3 text-sm">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700
                                    rounded-xl text-center">
                            <div class="text-surface-400 text-xs mb-1">Début</div>
                            <div class="font-semibold text-surface-900
                                         dark:text-surface-0 text-xs">
                                {{ inv.startDate
                                    ? (inv.startDate | date:'dd/MM/yyyy')
                                    : 'Non démarrée' }}
                            </div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700
                                    rounded-xl text-center">
                            <div class="text-surface-400 text-xs mb-1">
                                Durée prévue
                            </div>
                            <div class="font-semibold text-surface-900
                                         dark:text-surface-0">
                                {{ inv.plannedDurationDays }}j
                            </div>
                        </div>
                        <div class="p-3 rounded-xl text-center border"
                            [style.background]="inv.overdue ? '#fff5f5'
                                : !inv.startDate ? '#f9fafb'
                                : (inv.remainingDays||0)<=10 ? '#fffbeb'
                                : '#f0fdf4'"
                            [style.border-color]="inv.overdue ? '#fca5a5'
                                : !inv.startDate ? '#e5e7eb'
                                : (inv.remainingDays||0)<=10 ? '#fde68a'
                                : '#86efac'">
                            <div class="text-xs mb-1"
                                [style.color]="inv.overdue ? '#ef4444' : '#9ca3af'">
                                Délai restant
                            </div>
                            <div class="font-bold"
                                [style.color]="inv.overdue ? '#dc2626'
                                    : !inv.startDate ? '#9ca3af'
                                    : (inv.remainingDays||0)<=10 ? '#d97706'
                                    : '#16a34a'">
                                {{ inv.overdue ? 'Dépassé'
                                    : !inv.startDate ? '—'
                                    : (inv.remainingDays||0)+'j' }}
                            </div>
                        </div>
                    </div>

                    <!-- Bandeau prolongation -->
                    <div *ngIf="inv.extendedDeadline"
                        class="mt-4 p-3 bg-amber-50 border border-amber-200
                               rounded-xl flex items-start gap-2">
                        <i class="pi pi-calendar-plus text-amber-600 mt-0.5
                                   flex-shrink-0"></i>
                        <div>
                            <div class="text-xs font-bold text-amber-800 mb-0.5">
                                Investigation prolongée
                            </div>
                            <div class="text-xs text-amber-700">
                                Nouvelle échéance :
                                <strong>
                                    {{ inv.extendedDeadline | date:'dd/MM/yyyy' }}
                                </strong>
                                <span *ngIf="inv.extensionReason"
                                    class="ml-1 text-amber-600">
                                    — {{ inv.extensionReason }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Circuit de validation -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <h3 class="font-bold text-surface-900 dark:text-surface-0
                               mb-4 flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-purple-100
                                    dark:bg-purple-900 flex items-center
                                    justify-center">
                            <i class="pi pi-list-check text-purple-600 text-xs"></i>
                        </div>
                        Circuit de validation
                        <span class="text-xs text-surface-400 font-normal ml-1">
                            (Manuel §C.3.10)
                        </span>
                    </h3>
                    <div class="flex flex-col gap-2">
                        <div *ngFor="let step of approvalSteps; let i=index"
                            class="flex items-center gap-3 p-3 rounded-xl
                                   border transition-all"
                            [style.background]="step.done ? '#f0fdf4'
                                : step.active ? '#eff6ff' : '#f9fafb'"
                            [style.border-color]="step.done ? '#86efac'
                                : step.active ? '#bfdbfe' : '#e5e7eb'">
                            <div class="w-9 h-9 rounded-full flex items-center
                                        justify-center flex-shrink-0"
                                [style.background]="step.done ? '#22c55e'
                                    : step.active ? '#3b82f6' : '#e5e7eb'">
                                <i class="pi text-white text-xs"
                                    [class]="step.done ? 'pi-check' : step.icon"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold"
                                    [style.color]="step.done ? '#16a34a'
                                        : step.active ? '#2563eb' : '#9ca3af'">
                                    {{ step.label }}
                                    <span class="text-xs font-normal ml-1"
                                        style="color:#9ca3af;">
                                        {{ step.delay }}
                                    </span>
                                </div>
                                <div *ngIf="step.date"
                                    class="text-xs text-green-600 mt-0.5">
                                    ✓ {{ step.date | date:'dd/MM/yyyy HH:mm' }}
                                </div>
                                <div *ngIf="step.active && !step.date"
                                    style="display:inline-flex;align-items:center;
                                           gap:4px;font-size:.7rem;color:#3b82f6;
                                           margin-top:3px;background:#eff6ff;
                                           padding:2px 8px;border-radius:20px;">
                                    <div style="width:5px;height:5px;border-radius:50%;
                                                background:#3b82f6;
                                                animation:pulse 1s infinite;"></div>
                                    En attente
                                </div>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 rounded-lg
                                          flex-shrink-0"
                                [style.background]="step.done ? '#dcfce7'
                                    : step.active ? '#dbeafe' : '#f3f4f6'"
                                [style.color]="step.done ? '#16a34a'
                                    : step.active ? '#2563eb' : '#9ca3af'">
                                {{ i+1 }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Rapport / Conclusions / Recommandations -->
                <div *ngIf="safeReport">
                    <div class="text-xs text-surface-400 uppercase tracking-wide
                                font-semibold mb-2">Rapport</div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                leading-relaxed text-surface-700 dark:text-surface-200
                                border border-surface-100 overflow-hidden"
                        [innerHTML]="safeReport"></div>
                </div>
                <div *ngIf="safeConclusions">
                    <div class="text-xs text-surface-400 uppercase tracking-wide
                                font-semibold mb-2">Conclusions</div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                leading-relaxed text-surface-700 dark:text-surface-200
                                border border-surface-100 overflow-hidden"
                        [innerHTML]="safeConclusions"></div>
                </div>
                <div *ngIf="safeRecommendations">
                    <div class="text-xs text-surface-400 uppercase tracking-wide
                                font-semibold mb-2">Recommandations</div>
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                leading-relaxed text-surface-700 dark:text-surface-200
                                border border-surface-100 overflow-hidden"
                        [innerHTML]="safeRecommendations"></div>
                </div>
            </div>

            <!-- Colonne droite (1/3) -->
            <div class="flex flex-col gap-5">

                <!-- Lien dossier (standalone) -->
                <div *ngIf="!isPanel"
                    class="bg-white dark:bg-surface-800 rounded-2xl p-4
                           border border-surface-100 dark:border-surface-700">
                    <h3 class="text-sm font-bold text-surface-700
                               dark:text-surface-200 mb-3 flex items-center gap-2">
                        <i class="pi pi-folder text-primary-600"></i>
                        Dossier associé
                    </h3>
                    <p-button
                        [label]="inv.dossierNumber || 'Voir le dossier'"
                        icon="pi pi-external-link" iconPos="right"
                        severity="info" text size="small"
                        [routerLink]="['/app/dossiers', inv.dossierId]"/>
                </div>

                <!-- Accès page investigation (panel) -->
                <div *ngIf="isPanel"
                    class="bg-gradient-to-br from-primary-50 to-primary-100
                           dark:from-primary-950 dark:to-primary-900
                           rounded-2xl p-4 border border-primary-200
                           dark:border-primary-800">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-primary-200
                                    dark:bg-primary-800 flex items-center
                                    justify-center">
                            <i class="pi pi-arrow-right text-primary-700
                                       dark:text-primary-200 text-xs"></i>
                        </div>
                        <span class="text-sm font-semibold text-primary-800
                                      dark:text-primary-200">
                            Gérer l'investigation
                        </span>
                    </div>
                    <p class="text-xs text-primary-600 dark:text-primary-300
                               mb-3 leading-relaxed">
                        Pour ajouter des membres, soumettre un rapport ou prolonger,
                        accédez à la page dédiée.
                    </p>
                    <p-button label="Ouvrir dans Investigations"
                        icon="pi pi-external-link" iconPos="right"
                        severity="info" size="small"
                        styleClass="w-full justify-center"
                        [routerLink]="['/app/investigations', inv.id]"/>
                </div>

                <!-- Équipe -->
                <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                            border border-surface-100 dark:border-surface-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-surface-900 dark:text-surface-0
                                   flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-green-100
                                        dark:bg-green-900 flex items-center
                                        justify-center">
                                <i class="pi pi-users text-green-600 text-xs"></i>
                            </div>
                            Équipe
                            <span class="text-xs bg-surface-100 dark:bg-surface-700
                                         text-surface-500 px-2 py-0.5 rounded-full
                                         font-normal">
                                {{ inv.members?.length || 0 }} membre(s)
                            </span>
                        </h3>
                        <p-button
                            *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                   && inv.status !== 'COMPLETED'
                                   && inv.status !== 'ARCHIVED'"
                            icon="pi pi-user-plus" severity="success" text
                            size="small" pTooltip="Ajouter un membre"
                            tooltipPosition="left"
                            (onClick)="showAddMemberDialog=true"/>
                    </div>

                    <div *ngIf="!inv.members?.length" class="text-center py-6">
                        <div class="w-12 h-12 rounded-xl bg-surface-100
                                    dark:bg-surface-700 flex items-center
                                    justify-center mx-auto mb-3">
                            <i class="pi pi-users text-xl text-surface-300"></i>
                        </div>
                        <p class="text-surface-400 text-xs">
                            Aucun membre dans l'équipe
                        </p>
                        <p *ngIf="hasRole(['CGEA','ADMIN_DDIC'])"
                            class="text-primary-500 text-xs mt-1 cursor-pointer"
                            (click)="showAddMemberDialog=true">
                            + Ajouter un membre
                        </p>
                    </div>

                    <div class="flex flex-col gap-2" *ngIf="inv.members?.length">
                        <div *ngFor="let m of inv.members"
                            class="flex items-start gap-2 p-2.5 rounded-xl
                                   hover:bg-surface-50 dark:hover:bg-surface-700
                                   transition-colors">
                            <div class="w-8 h-8 rounded-lg flex items-center
                                        justify-center text-xs font-bold
                                        flex-shrink-0 mt-0.5"
                                [style.background]="m.teamRole==='TEAM_LEADER'
                                    ? '#fef9c3' : '#dbeafe'"
                                [style.color]="m.teamRole==='TEAM_LEADER'
                                    ? '#854d0e' : '#1d4ed8'">
                                {{ getInitials(m.agent.firstName+' '+m.agent.lastName) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-semibold text-surface-900
                                            dark:text-surface-0 break-words
                                            leading-tight">
                                    {{ m.agent.firstName+' '+m.agent.lastName }}
                                </div>
                                <div class="text-xs text-surface-400 font-mono mt-0.5">
                                    {{ m.agent.matricule || '' }}
                                </div>
                                <span class="inline-block mt-1 text-xs px-2 py-0.5
                                             rounded-full font-semibold"
                                    [style.background]="m.teamRole==='TEAM_LEADER'
                                        ? '#fef9c3' : '#dbeafe'"
                                    [style.color]="m.teamRole==='TEAM_LEADER'
                                        ? '#854d0e' : '#1d4ed8'">
                                    {{ getRoleLabel(m.teamRole) }}
                                </span>
                            </div>
                            <p-button
                                *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                       && inv.status!=='COMPLETED'
                                       && inv.status!=='ARCHIVED'"
                                icon="pi pi-times" severity="danger" text
                                size="small" pTooltip="Retirer"
                                tooltipPosition="left"
                                (onClick)="executeRemoveMember(m.agent.id)"/>
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

    private readonly route                = inject(ActivatedRoute);
    private readonly router               = inject(Router);
    private readonly investigationService = inject(InvestigationService);
    private readonly agentService         = inject(AgentService);
    private readonly keycloakService      = inject(KeycloakService);
    private readonly messageService       = inject(MessageService);
    private readonly attachmentService    = inject(AttachmentService);
    private readonly sanitizer            = inject(DomSanitizer);
    private readonly destroy$             = new Subject<void>();

    inv:      InvestigationResponse | null = null;
    loading   = true;
    actioning = false;

    safeReport:          SafeHtml | null = null;
    safeConclusions:     SafeHtml | null = null;
    safeRecommendations: SafeHtml | null = null;

    showSuspendDialog   = false;
    showExtendDialog    = false;
    showReportDialog    = false;
    showCgeDialog       = false;
    showAddMemberDialog = false;

    suspendReason = '';

    extendDays             = 30;
    extendReason           = '';
    extendReasonError      = false;
    hierarchyApproved      = false;
    hierarchyApprovedError = false;
    computedNewDeadline:   Date | null = null;

    readonly extendOptions = [
        { label: '+15 jours',  days: 15  },
        { label: '+30 jours',  days: 30  },
        { label: '+45 jours',  days: 45  },
        { label: '+60 jours',  days: 60  },
        { label: '+90 jours',  days: 90  },
        { label: '+120 jours', days: 120 }
    ];

    cgeReason = '';

    newMemberAgentId = '';
    newMemberRole: TeamRole = 'MEMBER';
    availableAgents: AgentOption[] = [];

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
        this.inv = inv;
        if (inv) {
            this.buildApprovalSteps(inv);
            this.safeReport = inv.finalReport
                ? this.sanitizer.bypassSecurityTrustHtml(inv.finalReport) : null;
            this.safeConclusions = inv.conclusions
                ? this.sanitizer.bypassSecurityTrustHtml(inv.conclusions) : null;
            this.safeRecommendations = inv.recommendations
                ? this.sanitizer.bypassSecurityTrustHtml(inv.recommendations) : null;
            this.computeNewDeadline();
        } else {
            this.safeReport = this.safeConclusions = this.safeRecommendations = null;
        }
    }

   

    openExtendDialog(): void {
        this.extendDays              = 30;
        this.extendReason            = '';
        this.extendReasonError       = false;
        this.hierarchyApproved       = false;
        this.hierarchyApprovedError  = false;
        this.computeNewDeadline();
        this.showExtendDialog = true;
    }

    setExtendDays(days: number): void {
        this.extendDays = days;
        this.computeNewDeadline();
    }

    onExtendDaysChange(): void { this.computeNewDeadline(); }

    private computeNewDeadline(): void {
        if (!this.inv) { this.computedNewDeadline = null; return; }
        const base = this.inv.extendedDeadline || this.inv.plannedEndDate;
        if (!base)    { this.computedNewDeadline = null; return; }
        const d = new Date(base);
        d.setDate(d.getDate() + (this.extendDays || 0));
        this.computedNewDeadline = d;
    }

    cancelExtend(): void {
        this.showExtendDialog       = false;
        this.extendReasonError      = false;
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
                    this.actioning         = false;
                    this.showExtendDialog  = false;
                    this.extendReason      = '';
                    this.hierarchyApproved = false;
                    this.messageService.add({
                        severity: 'success',
                        summary:  'Investigation prolongée',
                        detail:   `+${this.extendDays} jours — nouvelle échéance : `
                                  + this.computedNewDeadline!
                                      .toLocaleDateString('fr-FR')
                    });
                },
                error: (err: ApiError) => {
                    this.actioning = false;
                    this.showError(err);
                }
            });
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
                        detail:   'Redirection...'
                    });
                    setTimeout(() => {
                        this.router.navigate(['/app/investigations', inv.id]);
                    }, 800);
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
                        detail:   `Échéance : ${new Date(inv.plannedEndDate!)
                                    .toLocaleDateString('fr-FR')}`
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

    executeSubmitReport(): void {
        if (!this.inv || !this.reportRequest.finalReport
            || !this.reportRequest.conclusions) return;
        this.actioning = true;

        const doSubmit = () => {
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
                            recommendations: '',
                            outcome: 'ADMINISTRATIVE_SANCTIONS'
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
                        this.actioning = false;
                        this.uploadProgress = 0;
                        this.showError(err);
                    }
                });
        };

        if (this.reportFiles.length > 0) {
            this.uploadProgress = 10;
            this.attachmentService.upload(this.inv.dossierId, this.reportFiles)
                .pipe(takeUntil(this.destroy$))
                .subscribe({ next: () => doSubmit(), error: () => doSubmit() });
        } else {
            doSubmit();
        }
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
                    this.messageService.add({
                        severity: 'success', summary: 'Approuvé juridique'
                    });
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
                   
                    const archived = inv.outcome === 'ARCHIVED';
                    this.messageService.add({
                        severity: archived ? 'info' : 'success',
                        summary:  archived ? 'Dossier classé sans suite'
                                           : 'Décision CGE rendue',
                        detail:   archived ? 'Dossier → CLASSÉ'
                                           : 'Dossier → DÉCISION RENDUE'
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
                            next: fresh => {
                                this.setInv(fresh);
                                this.actioning           = false;
                                this.showAddMemberDialog = false;
                                this.newMemberAgentId    = '';
                                this.newMemberRole       = 'MEMBER';
                                this.messageService.add({
                                    severity: 'success', summary: 'Membre ajouté'
                                });
                            },
                            error: () => {
                                this.actioning           = false;
                                this.showAddMemberDialog = false;
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
                            next: fresh => {
                                this.setInv(fresh);
                                this.messageService.add({
                                    severity: 'info', summary: 'Membre retiré'
                                });
                            },
                            error: () => {}
                        });
                },
                error: (err: ApiError) => this.showError(err)
            });
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
                    severity: 'warn', summary: 'Fichier trop volumineux',
                    detail: `${f.name} dépasse 10 Mo`
                });
            } else {
                this.reportFiles.push(f);
            }
        }
    }

    removeReportFile(index: number): void { this.reportFiles.splice(index, 1); }

    cancelReport(): void {
        this.showReportDialog = false;
        this.reportFiles      = [];
        this.uploadProgress   = 0;
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


    private buildApprovalSteps(inv: InvestigationResponse): void {
        this.approvalSteps = [
            {
                label:  "Rapport soumis par l'équipe",
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
                icon:   'pi-hammer',
                delay:  '(20 jours ouvrables)',
                done:   !!inv.cgeApprovedAt,
                active: !!inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt,
                date:   inv.cgeApprovedAt
            }
        ];
    }


    getCgeResultLabel(): string {
        if (!this.inv?.outcome) return 'Résultat non défini';
        const labels: Record<string, string> = {
            ADMINISTRATIVE_SANCTIONS: 'Sanctions administratives',
            JUDICIAL_REFERRAL:        'Saisine judiciaire',
            ARCHIVED:                 'Classé sans suite',
            PRESS_RELEASE:            'Communiqué de presse',
            ANNUAL_REPORT:            'Rapport annuel'
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


    hasRole(roles: string[]): boolean {
        return this.keycloakService.hasAnyRole(roles);
    }

    getInitials(name: string): string {
        return (name || '').split(' ').map(n => n[0] ?? '')
            .join('').substring(0, 2).toUpperCase();
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

    formatFileSize(bytes: number): string {
        return this.attachmentService.formatSize(bytes);
    }

    private showError(err: ApiError): void {
        this.messageService.add({
            severity: 'error',
            summary:  'Erreur',
            detail:   err.error?.message ?? "Une erreur s'est produite"
        });
    }
}