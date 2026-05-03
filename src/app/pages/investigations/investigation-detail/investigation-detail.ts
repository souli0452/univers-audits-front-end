import { Component, OnInit, OnChanges, Input,
         SimpleChanges, inject } from '@angular/core';
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
import { AvatarModule } from 'primeng/avatar';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import {
    InvestigationService,
    InvestigationResponse,
    TeamRole,
    SubmitReportRequest
} from '../../../core/services/investigation.service';
import { AgentService } from '../../../core/services/agent.service';
import { KeycloakService } from '../../../core/auth/keycloak.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-investigation-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, DialogModule,
        TextareaModule, SelectModule, ToastModule,
        SkeletonModule, AvatarModule, DatePickerModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<!-- ── Dialog suspension ──────────────────────────────── -->
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
    [modal]="true" [style]="{width:'600px'}">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Rapport complet *
            </label>
            <textarea pTextarea [(ngModel)]="reportRequest.finalReport"
                placeholder="Rapport détaillé de l'investigation..."
                rows="5" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Conclusions *
            </label>
            <textarea pTextarea [(ngModel)]="reportRequest.conclusions"
                placeholder="Conclusions principales..." rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Recommandations
            </label>
            <textarea pTextarea [(ngModel)]="reportRequest.recommendations"
                placeholder="Recommandations..." rows="3" class="w-full"></textarea>
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Issue / Résultat *
            </label>
            <p-select [(ngModel)]="reportRequest.outcome"
                [options]="outcomeOptions"
                optionLabel="label" optionValue="value"
                placeholder="Sélectionner..." styleClass="w-full" />
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showReportDialog = false" />
        <p-button label="Soumettre le rapport" icon="pi pi-send" severity="success"
            [loading]="actioning" (onClick)="executeSubmitReport()" />
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
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Agent *
            </label>
            <p-select [(ngModel)]="newMemberAgentId"
                [options]="availableAgents"
                optionLabel="label" optionValue="value"
                placeholder="Sélectionner un agent..."
                styleClass="w-full" [filter]="true" appendTo="body" />
        </div>
        <div>
            <label class="text-sm font-semibold text-surface-700 mb-2 block">
                Rôle *
            </label>
            <p-select [(ngModel)]="newMemberRole"
                [options]="roleOptions"
                optionLabel="label" optionValue="value"
                styleClass="w-full" />
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

    <!-- ── En-tête page standalone ───────────────────────── -->
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

    <!-- ── Actions page standalone ───────────────────────── -->
    <ng-container *ngIf="!isPanel && inv">
        <div class="flex gap-2 flex-wrap justify-end">
            <ng-container *ngTemplateOutlet="actionButtons; context: {inv: inv}" />
        </div>
    </ng-container>

    <!-- ── En-tête panel ─────────────────────────────────── -->
    <div *ngIf="isPanel"
        class="bg-white dark:bg-surface-800 rounded-2xl p-4
               border border-surface-100 dark:border-surface-700
               shadow-sm">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h3 class="font-bold text-surface-900 dark:text-surface-0
                       flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900
                            flex items-center justify-content:center">
                    <i class="pi pi-search text-primary-600 text-sm mx-auto" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;"></i>
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

    <!-- ── Template actions partagé ──────────────────────── -->
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
        <p-button *ngIf="inv.status === 'COMPLETED' && !inv.deiApprovedAt && hasRole(['CGEA','ADMIN_DDIC'])"
            label="Approuver DEI" icon="pi pi-check" severity="success" size="small"
            [loading]="actioning" (onClick)="executeApproveDei()" />
        <p-button *ngIf="inv.deiApprovedAt && !inv.legalAdvisorApprovedAt && hasRole(['CONSEILLER_JURIDIQUE','ADMIN_DDIC'])"
            label="Approuver Juridique" icon="pi pi-shield" severity="success" size="small"
            [loading]="actioning" (onClick)="executeApproveLegal()" />
        <p-button *ngIf="inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt && hasRole(['CGE','ADMIN_DDIC'])"
            label="Décision CGE" icon="pi pi-gavel" severity="success" size="small"
            (onClick)="showCgeDialog = true" />
    </ng-template>

    <!-- ── Grille principale ──────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Colonne gauche (2/3) -->
        <div class="lg:col-span-2 flex flex-col gap-5">

            <!-- Aucune investigation -->
            <div *ngIf="!inv && isPanel"
                class="bg-white dark:bg-surface-800 rounded-2xl p-6
                       border border-surface-100 dark:border-surface-700 shadow-sm">
                <div class="text-center mb-5">
                    <div class="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-700
                                flex items-center justify-center mx-auto mb-3">
                        <i class="pi pi-search text-2xl text-surface-300"></i>
                    </div>
                    <p class="font-semibold text-surface-600 dark:text-surface-300 text-sm">
                        Aucune investigation ouverte pour ce dossier
                    </p>
                </div>

                <!-- Dossier RECEVABLE + rôle CGEA -->
                <div *ngIf="dossierStatus === 'RECEVABLE' && hasRole(['CGEA','ADMIN_DDIC'])"
                    class="flex flex-col gap-3">
                    <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200
                                dark:border-green-800 rounded-xl text-sm text-green-700
                                dark:text-green-300 text-center">
                        <i class="pi pi-check-circle mr-2"></i>
                        Le CGE a déclaré ce dossier recevable. Vous pouvez ouvrir l'investigation.
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-semibold text-surface-500 uppercase tracking-wide">
                            Durée prévue (jours) — 90 minimum
                        </label>
                        <input type="number" [(ngModel)]="openDays"
                            min="90" max="180"
                            class="p-inputtext w-full text-sm" />
                    </div>
                    <p-button label="Ouvrir l'investigation" icon="pi pi-play"
                        severity="success" styleClass="w-full"
                        [loading]="actioning" (onClick)="openInvestigation()" />
                </div>

                <!-- Dossier RECEVABLE, pas CGEA -->
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

            <!-- Progression -->
            <div *ngIf="inv"
                class="bg-white dark:bg-surface-800 rounded-2xl p-5
                       border border-surface-100 dark:border-surface-700 shadow-sm">
                <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                           flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900
                                flex items-center justify-center">
                        <i class="pi pi-chart-line text-blue-600 text-xs"></i>
                    </div>
                    Progression de l'enquête
                </h3>

                <!-- Barre progression custom -->
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
                        [style.background]="inv.overdue ? '#fff5f5' : (inv.remainingDays || 0) <= 10 ? '#fffbeb' : '#f0fdf4'"
                        [style.border-color]="inv.overdue ? '#fca5a5' : (inv.remainingDays || 0) <= 10 ? '#fde68a' : '#86efac'">
                        <div class="text-xs mb-1"
                            [style.color]="inv.overdue ? '#ef4444' : '#9ca3af'">
                            Délai restant
                        </div>
                        <div class="font-bold"
                            [style.color]="inv.overdue ? '#dc2626' : (inv.remainingDays || 0) <= 10 ? '#d97706' : '#16a34a'">
                            {{ inv.overdue ? 'Dépassé' : (inv.remainingDays || 0) + 'j' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Circuit de validation -->
            <div *ngIf="inv"
                class="bg-white dark:bg-surface-800 rounded-2xl p-5
                       border border-surface-100 dark:border-surface-700 shadow-sm">
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
                        <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            [style.background]="step.done ? '#22c55e' : step.active ? '#3b82f6' : '#e5e7eb'">
                            <i class="pi text-white text-xs"
                                [class]="step.done ? 'pi-check' : step.icon"></i>
                        </div>
                        <div class="flex-1">
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
                        <span class="text-xs font-bold px-2 py-1 rounded-lg"
                            [style.background]="step.done ? '#dcfce7' : step.active ? '#dbeafe' : '#f3f4f6'"
                            [style.color]="step.done ? '#16a34a' : step.active ? '#2563eb' : '#9ca3af'">
                            {{ i + 1 }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Rapport d'investigation -->
            <div *ngIf="inv && (inv.finalReport || inv.conclusions)"
                class="bg-white dark:bg-surface-800 rounded-2xl p-5
                       border border-surface-100 dark:border-surface-700 shadow-sm">
                <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-4
                           flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900
                                flex items-center justify-center">
                        <i class="pi pi-file-edit text-amber-600 text-xs"></i>
                    </div>
                    Rapport d'investigation
                </h3>
                <div class="flex flex-col gap-4 text-sm">
                    <div *ngIf="inv.finalReport">
                        <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">
                            Rapport
                        </div>
                        <p class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 leading-relaxed
                                  text-surface-700 dark:text-surface-200 border border-surface-100">
                            {{ inv.finalReport }}
                        </p>
                    </div>
                    <div *ngIf="inv.conclusions">
                        <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">
                            Conclusions
                        </div>
                        <p class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 leading-relaxed
                                  text-surface-700 dark:text-surface-200 border border-surface-100">
                            {{ inv.conclusions }}
                        </p>
                    </div>
                    <div *ngIf="inv.recommendations">
                        <div class="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-2">
                            Recommandations
                        </div>
                        <p class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 leading-relaxed
                                  text-surface-700 dark:text-surface-200 border border-surface-100">
                            {{ inv.recommendations }}
                        </p>
                    </div>
                </div>
            </div>

        </div>

        <!-- Colonne droite (1/3) -->
        <div class="flex flex-col gap-5">

            <!-- Lien dossier associé -->
            <div *ngIf="!isPanel && inv"
                class="bg-white dark:bg-surface-800 rounded-2xl p-4
                       border border-surface-100 dark:border-surface-700 shadow-sm">
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

            <!-- Équipe d'investigation -->
            <div *ngIf="inv"
                class="bg-white dark:bg-surface-800 rounded-2xl p-5
                       border border-surface-100 dark:border-surface-700 shadow-sm">
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
                    <p-button *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                     && inv.status !== 'COMPLETED'
                                     && inv.status !== 'ARCHIVED'"
                        icon="pi pi-user-plus" severity="success" text size="small"
                        pTooltip="Ajouter un membre" tooltipPosition="left"
                        (onClick)="showAddMemberDialog = true" />
                </div>

                <div *ngIf="!inv.members?.length"
                    class="text-center py-6">
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
                        class="flex items-center gap-3 p-2.5 rounded-xl
                               hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                        <div class="w-9 h-9 rounded-xl flex items-center justify-center
                                    text-xs font-bold flex-shrink-0"
                            [style.background]="m.teamRole === 'TEAM_LEADER' ? '#fef9c3' : '#dbeafe'"
                            [style.color]="m.teamRole === 'TEAM_LEADER' ? '#854d0e' : '#1d4ed8'">
                            {{ getInitials(m.agentName) }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-xs font-semibold text-surface-900
                                        dark:text-surface-0 truncate">
                                {{ m.agentName }}
                            </div>
                            <div class="text-xs text-surface-400 font-mono">
                                {{ m.agentMatricule }}
                            </div>
                        </div>
                        <div class="flex items-center gap-1 flex-shrink-0">
                            <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                                [style.background]="m.teamRole === 'TEAM_LEADER' ? '#fef9c3' : '#dbeafe'"
                                [style.color]="m.teamRole === 'TEAM_LEADER' ? '#854d0e' : '#1d4ed8'">
                                {{ getRoleLabel(m.teamRole) }}
                            </span>
                            <p-button *ngIf="hasRole(['CGEA','ADMIN_DDIC'])
                                             && inv.status !== 'COMPLETED'
                                             && inv.status !== 'ARCHIVED'"
                                icon="pi pi-times" severity="danger" text size="small"
                                pTooltip="Retirer" tooltipPosition="left"
                                (onClick)="executeRemoveMember(m.agentId)" />
                        </div>
                    </div>
                </div>
            </div>

        </div>
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
export class InvestigationDetail implements OnInit, OnChanges {

    @Input() dossierId:     string | null = null;
    @Input() dossierStatus: string | null = null;

    get isPanel(): boolean { return !!this.dossierId; }

    private route                = inject(ActivatedRoute);
    private investigationService = inject(InvestigationService);
    private agentService         = inject(AgentService);
    private keycloakService      = inject(KeycloakService);
    private messageService       = inject(MessageService);

    inv:      InvestigationResponse | null = null;
    loading   = true;
    actioning = false;
    today     = new Date();

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

    availableAgents: any[] = [];
    approvalSteps:   any[] = [];

    readonly roleOptions = [
        { label: 'Chef de mission', value: 'TEAM_LEADER' },
        { label: 'Investigateur',   value: 'MEMBER'      }
    ];

    readonly outcomeOptions = [
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
        if (changes['dossierId'] && !changes['dossierId'].firstChange) {
            const newId = changes['dossierId'].currentValue;
            if (newId) this.loadByDossier(newId);
        }
    }

    private loadById(id: string): void {
        this.loading = true;
        this.investigationService.findById(id).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.loading = false; },
            error: ()  => {
                this.loading = false;
                this.messageService.add({ severity:'error', summary:'Erreur', detail:'Investigation introuvable' });
            }
        });
    }

    private loadByDossier(dossierId: string): void {
        this.loading = true;
        this.investigationService.findByDossier(dossierId).subscribe({
            next:  inv => { this.inv = inv; if (inv) this.buildApprovalSteps(inv); this.loading = false; },
            error: ()  => { this.inv = null; this.loading = false; }
        });
    }

    private loadAgents(): void {
        this.agentService.findAll(0, 100).subscribe({
            next:  page => {
                this.availableAgents = page.content.map((a: any) => ({
                    label: `${a.firstName} ${a.lastName} — ${a.matricule}`,
                    value: a.id
                }));
            },
            error: () => {}
        });
    }

    private buildApprovalSteps(inv: InvestigationResponse): void {
        this.approvalSteps = [
            { label:'Rapport soumis',        icon:'pi-file',   delay:'',                    done:!!inv.reportSubmittedAt,        active:inv.status==='IN_PROGRESS',                              date:inv.reportSubmittedAt        },
            { label:'Approbation DEI',        icon:'pi-user',   delay:'(15 jours ouvrables)', done:!!inv.deiApprovedAt,            active:!!inv.reportSubmittedAt && !inv.deiApprovedAt,            date:inv.deiApprovedAt            },
            { label:'Conseiller Juridique',   icon:'pi-shield', delay:'(10 jours ouvrables)', done:!!inv.legalAdvisorApprovedAt,   active:!!inv.deiApprovedAt && !inv.legalAdvisorApprovedAt,      date:inv.legalAdvisorApprovedAt   },
            { label:'Décision finale CGE',    icon:'pi-gavel',  delay:'(20 jours ouvrables)', done:!!inv.cgeApprovedAt,            active:!!inv.legalAdvisorApprovedAt && !inv.cgeApprovedAt,      date:inv.cgeApprovedAt            }
        ];
    }

    getProgress(): number {
        if (!this.inv?.startDate || !this.inv?.plannedEndDate) return 0;
        const start = new Date(this.inv.startDate).getTime();
        const end   = new Date(this.inv.extendedDeadline || this.inv.plannedEndDate).getTime();
        return Math.min(Math.max(Math.round(((Date.now() - start) / (end - start)) * 100), 0), 100);
    }

    getProgressGradient(): string {
        const p = this.getProgress();
        if (this.inv?.overdue) return 'linear-gradient(90deg, #ef4444, #dc2626)';
        if (p >= 80)           return 'linear-gradient(90deg, #f59e0b, #d97706)';
        return 'linear-gradient(90deg, #22c55e, #16a34a)';
    }

    openInvestigation(): void {
        if (!this.dossierId) return;
        this.actioning = true;
        this.investigationService.open(this.dossierId, { plannedDurationDays: this.openDays }).subscribe({
            next:  inv => { this.inv = inv; if (inv) this.buildApprovalSteps(inv); this.actioning = false; this.messageService.add({ severity:'success', summary:'Investigation ouverte', detail:'Ajoutez les membres puis démarrez' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeStart(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.start(this.inv.id).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.messageService.add({ severity:'success', summary:'Investigation démarrée', detail:`Échéance : ${new Date(inv.plannedEndDate!).toLocaleDateString('fr-FR')}` }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeSuspend(): void {
        if (!this.inv || !this.suspendReason.trim()) return;
        this.actioning = true;
        this.investigationService.suspend(this.inv.id, this.suspendReason).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.showSuspendDialog = false; this.suspendReason = ''; this.messageService.add({ severity:'warn', summary:'Suspendue' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeResume(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.resume(this.inv.id).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.messageService.add({ severity:'success', summary:'Reprise' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeExtend(): void {
        if (!this.inv || !this.extendDate || !this.extendReason.trim()) return;
        this.actioning = true;
        this.investigationService.extendDeadline(this.inv.id, { newDeadline: this.extendDate.toISOString(), reason: this.extendReason }).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.showExtendDialog = false; this.extendDate = null; this.extendReason = ''; this.messageService.add({ severity:'success', summary:'Délai prolongé' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeSubmitReport(): void {
        if (!this.inv || !this.reportRequest.finalReport || !this.reportRequest.conclusions) return;
        this.actioning = true;
        this.investigationService.submitReport(this.inv.id, this.reportRequest).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.showReportDialog = false; this.reportRequest = { finalReport:'', conclusions:'', recommendations:'', outcome:'ADMINISTRATIVE_SANCTIONS' }; this.messageService.add({ severity:'success', summary:'Rapport soumis', detail:"En attente d'approbation DEI" }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeApproveDei(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.approveDei(this.inv.id).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.messageService.add({ severity:'success', summary:'Approuvé DEI' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeApproveLegal(): void {
        if (!this.inv) return;
        this.actioning = true;
        this.investigationService.approveLegal(this.inv.id).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.messageService.add({ severity:'success', summary:'Approuvé juridique' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeApproveCge(): void {
        if (!this.inv || !this.cgeReason.trim()) return;
        this.actioning = true;
        this.investigationService.approveCge(this.inv.id, this.cgeReason).subscribe({
            next:  inv => { this.inv = inv; this.buildApprovalSteps(inv); this.actioning = false; this.showCgeDialog = false; this.cgeReason = ''; this.messageService.add({ severity:'success', summary:'Décision CGE rendue', detail:'Dossier → DÉCISION RENDUE' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeAddMember(): void {
        if (!this.inv || !this.newMemberAgentId) return;
        this.actioning = true;
        this.investigationService.addMember(this.inv.id, { agentId: this.newMemberAgentId, teamRole: this.newMemberRole }).subscribe({
            next:  inv => { this.inv = inv; this.actioning = false; this.showAddMemberDialog = false; this.newMemberAgentId = ''; this.newMemberRole = 'MEMBER'; this.messageService.add({ severity:'success', summary:'Membre ajouté' }); },
            error: err => { this.actioning = false; this.showError(err); }
        });
    }

    executeRemoveMember(agentId: string): void {
        if (!this.inv) return;
        this.investigationService.removeMember(this.inv.id, agentId).subscribe({
            next:  inv => { this.inv = inv; this.messageService.add({ severity:'info', summary:'Membre retiré' }); },
            error: err => this.showError(err)
        });
    }

    private showError(err: any): void {
        this.messageService.add({ severity:'error', summary:'Erreur', detail: err.error?.message || "Une erreur s'est produite" });
    }

    hasRole(roles: string[]): boolean      { return this.keycloakService.hasAnyRole(roles); }
    getInitials(name: string): string      { return (name||'').split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase(); }
    getRoleLabel(role: TeamRole): string   { return role === 'TEAM_LEADER' ? 'Chef mission' : 'Investigateur'; }

    getStatusLabel(status: string): string {
        const labels: Record<string,string> = { INITIATED:'Initiée', IN_PROGRESS:'En cours', SUSPENDED:'Suspendue', COMPLETED:'Rapport soumis', ARCHIVED:'Archivée' };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Record<string,TagSeverity> = { INITIATED:'info', IN_PROGRESS:'success', SUSPENDED:'warn', COMPLETED:'info', ARCHIVED:'secondary' };
        return map[status] ?? 'info';
    }
}