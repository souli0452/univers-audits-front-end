import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { StepperModule } from 'primeng/stepper';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { timer } from 'rxjs';
import { DossierService } from '../../../core/services/dossier.service';

@Component({
    selector: 'app-dossier-form',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ReactiveFormsModule, ButtonModule, InputTextModule,
        TextareaModule, SelectModule, CheckboxModule,
        InputNumberModule, StepperModule, ToastModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <!-- En-tête -->
    <div class="flex items-center gap-4">
        <p-button icon="pi pi-arrow-left" severity="secondary"
            text routerLink="/app/dossiers" />
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Nouveau Dossier
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Enregistrement d'une plainte ou dénonciation
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Formulaire principal -->
        <div class="lg:col-span-2">

            <p-stepper [value]="currentStep">
                <p-step-list>
                    <p-step [value]="1">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-file text-sm"></i>
                            Dossier
                        </div>
                    </p-step>
                    <p-step [value]="2">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-user text-sm"></i>
                            Déclarant
                        </div>
                    </p-step>
                    <p-step [value]="3">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-check text-sm"></i>
                            Confirmation
                        </div>
                    </p-step>
                </p-step-list>

                <p-step-panels>

                    <!-- Étape 1 -->
                    <p-step-panel [value]="1">
                        <ng-template #content let-activateCallback="activateCallback">
                        <div class="flex flex-col gap-5 pt-4">

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold
                                                  text-surface-700 dark:text-surface-200">
                                        Type de saisine *
                                    </label>
                                    <p-select [formControl]="f['type']"
                                        [options]="typeOptions"
                                        optionLabel="label" optionValue="value"
                                        placeholder="Sélectionner" styleClass="w-full" />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold
                                                  text-surface-700 dark:text-surface-200">
                                        Canal de réception *
                                    </label>
                                    <p-select [formControl]="f['submissionMode']"
                                        [options]="modeOptions"
                                        optionLabel="label" optionValue="value"
                                        placeholder="Sélectionner" styleClass="w-full" />
                                </div>
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold
                                              text-surface-700 dark:text-surface-200">
                                    Objet de la plainte *
                                </label>
                                <input pInputText [formControl]="f['object']"
                                    placeholder="Résumé en quelques mots" class="w-full" />
                                <small class="text-red-500 text-xs"
                                    *ngIf="f['object'].invalid && f['object'].touched">
                                    Champ obligatoire (min 10 caractères)
                                </small>
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold
                                              text-surface-700 dark:text-surface-200">
                                    Description détaillée *
                                </label>
                                <textarea pTextarea [formControl]="f['description']"
                                    placeholder="Décrivez les faits en détail..."
                                    rows="5" class="w-full resize-none"></textarea>
                                <div class="flex items-center justify-between">
                                    <small class="text-red-500 text-xs"
                                        *ngIf="f['description'].invalid
                                               && f['description'].touched">
                                        Champ obligatoire
                                    </small>
                                    <small class="text-surface-400 text-xs ml-auto">
                                        {{ f['description'].value?.length || 0 }} caractères
                                    </small>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold
                                                  text-surface-700 dark:text-surface-200">
                                        Lieu des faits
                                    </label>
                                    <div class="flex items-center gap-2 border
                                                border-surface-200 rounded-lg px-3">
                                        <i class="pi pi-map-marker
                                                   text-surface-300 text-sm"></i>
                                        <input pInputText
                                            [formControl]="f['incidentLocation']"
                                            placeholder="Ex: Mairie de Koudougou"
                                            class="flex-1 border-none shadow-none
                                                   outline-none bg-transparent
                                                   py-2 text-sm" />
                                    </div>
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label class="text-sm font-semibold
                                                  text-surface-700 dark:text-surface-200">
                                        Période des faits
                                    </label>
                                    <div class="flex items-center gap-2 border
                                                border-surface-200 rounded-lg px-3">
                                        <i class="pi pi-calendar
                                                   text-surface-300 text-sm"></i>
                                        <input pInputText
                                            [formControl]="f['incidentPeriod']"
                                            placeholder="Ex: Janvier - Juin 2024"
                                            class="flex-1 border-none shadow-none
                                                   outline-none bg-transparent
                                                   py-2 text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <label class="text-sm font-semibold
                                              text-surface-700 dark:text-surface-200">
                                    Montant estimé du préjudice (FCFA)
                                </label>
                                <p-inputnumber [formControl]="f['estimatedLoss']"
                                    [useGrouping]="true" placeholder="0"
                                    styleClass="w-full" />
                                <small class="text-surface-400 text-xs">
                                    Laisser vide si inconnu
                                </small>
                            </div>

                            <div class="flex items-center gap-3 p-3 bg-surface-50
                                        dark:bg-surface-700 rounded-xl border
                                        border-surface-100 dark:border-surface-600">
                                <p-checkbox [formControl]="f['isConfidential']"
                                    [binary]="true" inputId="confidential" />
                                <label for="confidential"
                                    class="flex items-center gap-2 cursor-pointer">
                                    <i class="pi pi-lock text-surface-400 text-sm"></i>
                                    <span class="text-sm font-medium
                                                 text-surface-700 dark:text-surface-200">
                                        Marquer ce dossier comme confidentiel
                                    </span>
                                </label>
                            </div>

                            <div class="flex justify-end pt-2">
                                <p-button label="Suivant" icon="pi pi-arrow-right"
                                    iconPos="right"
                                    (onClick)="nextStep(activateCallback, 2)" />
                            </div>
                        </div>
                        </ng-template>
                    </p-step-panel>

                    <!-- Étape 2 -->
                    <p-step-panel [value]="2">
                        <ng-template #content let-activateCallback="activateCallback">
                        <div class="flex flex-col gap-5 pt-4">

                            <div class="flex items-center gap-3 p-4 bg-amber-50
                                        dark:bg-amber-950 rounded-xl border
                                        border-amber-200 dark:border-amber-800
                                        cursor-pointer"
                                (click)="toggleAnonymous()">
                                <p-checkbox [formControl]="fd['anonymous']"
                                    [binary]="true" inputId="anonymous"
                                    (click)="$event.stopPropagation()" />
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-eye-slash text-amber-600"></i>
                                    <div>
                                        <div class="text-sm font-semibold
                                                     text-amber-800 dark:text-amber-200">
                                            Déclarant anonyme
                                        </div>
                                        <div class="text-xs text-amber-600
                                                     dark:text-amber-400">
                                            L'identité du déclarant sera masquée
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="!fd['anonymous'].value"
                                class="flex flex-col gap-4">

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Type de déclarant
                                        </label>
                                        <p-select [formControl]="fd['typeDeclarant']"
                                            [options]="declarantTypeOptions"
                                            optionLabel="label" optionValue="value"
                                            placeholder="Sélectionner"
                                            styleClass="w-full" />
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Qualité par rapport aux faits
                                        </label>
                                        <p-select [formControl]="fd['quality']"
                                            [options]="qualityOptions"
                                            optionLabel="label" optionValue="value"
                                            placeholder="Sélectionner"
                                            styleClass="w-full" [showClear]="true" />
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Prénom
                                        </label>
                                        <input pInputText [formControl]="fd['firstName']"
                                            placeholder="Prénom" class="w-full" />
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Nom
                                        </label>
                                        <input pInputText [formControl]="fd['lastName']"
                                            placeholder="Nom de famille" class="w-full" />
                                    </div>

                                    <!-- ✅ Email -->
                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Email
                                            <span class="text-surface-400 font-normal
                                                         text-xs ml-1">
                                                (code envoyé par email)
                                            </span>
                                        </label>
                                        <input pInputText [formControl]="fd['email']"
                                            placeholder="email@exemple.bf"
                                            type="email" class="w-full" />
                                    </div>

                                    <!-- ✅ Téléphone -->
                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Téléphone
                                            <span class="text-surface-400 font-normal
                                                         text-xs ml-1">
                                                (code envoyé par SMS)
                                            </span>
                                        </label>
                                        <input pInputText [formControl]="fd['phoneNumber']"
                                            placeholder="+226 XX XX XX XX"
                                            class="w-full" />
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Commune
                                        </label>
                                        <input pInputText [formControl]="fd['commune']"
                                            placeholder="Commune" class="w-full" />
                                    </div>

                                    <div class="flex flex-col gap-1.5">
                                        <label class="text-sm font-semibold
                                                      text-surface-700 dark:text-surface-200">
                                            Province
                                        </label>
                                        <input pInputText [formControl]="fd['province']"
                                            placeholder="Province" class="w-full" />
                                    </div>

                                </div>

                                <div class="flex flex-col gap-3 p-4 bg-surface-50
                                            dark:bg-surface-700 rounded-xl border
                                            border-surface-100 dark:border-surface-600">
                                    <h4 class="text-sm font-semibold text-surface-600
                                               dark:text-surface-300 flex items-center gap-2">
                                        <i class="pi pi-shield text-primary-500"></i>
                                        Consentements
                                    </h4>
                                    <div class="flex items-start gap-2">
                                        <p-checkbox [formControl]="fd['dataProcessingConsent']"
                                            [binary]="true" inputId="consent" />
                                        <label for="consent"
                                            class="text-sm text-surface-700
                                                   dark:text-surface-200 cursor-pointer
                                                   leading-relaxed">
                                            J'accepte le traitement de mes données personnelles
                                            <span class="text-red-500">*</span>
                                        </label>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <p-checkbox [formControl]="fd['notificationsAccepted']"
                                            [binary]="true" inputId="notif" />
                                        <label for="notif"
                                            class="text-sm text-surface-700
                                                   dark:text-surface-200 cursor-pointer
                                                   leading-relaxed">
                                            J'accepte de recevoir des notifications
                                            sur l'avancement
                                        </label>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <p-checkbox [formControl]="fd['protectionRequested']"
                                            [binary]="true" inputId="protection" />
                                        <label for="protection"
                                            class="text-sm text-surface-700
                                                   dark:text-surface-200 cursor-pointer
                                                   leading-relaxed">
                                            Je demande une protection en tant que
                                            lanceur d'alerte
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="fd['anonymous'].value"
                                class="flex items-center gap-3 p-4 bg-blue-50
                                       dark:bg-blue-950 rounded-xl border
                                       border-blue-200 dark:border-blue-800">
                                <i class="pi pi-info-circle text-blue-500 text-xl"></i>
                                <div>
                                    <div class="text-sm font-semibold
                                                 text-blue-800 dark:text-blue-200">
                                        Mode anonyme activé
                                    </div>
                                    <div class="text-xs text-blue-600
                                                 dark:text-blue-400 mt-0.5">
                                        Votre identité sera protégée. Conservez votre
                                        code d'accès B4 pour suivre votre dossier.
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-between pt-2">
                                <p-button label="Précédent" icon="pi pi-arrow-left"
                                    severity="secondary" outlined
                                    (onClick)="prevStep(activateCallback, 1)" />
                                <p-button label="Suivant" icon="pi pi-arrow-right"
                                    iconPos="right"
                                    (onClick)="nextStep(activateCallback, 3)" />
                            </div>
                        </div>
                        </ng-template>
                    </p-step-panel>

                    <!-- Étape 3 -->
                    <p-step-panel [value]="3">
                        <ng-template #content let-activateCallback="activateCallback">
                        <div class="flex flex-col gap-5 pt-4">

                            <!-- Récapitulatif -->
                            <div class="bg-surface-50 dark:bg-surface-700 rounded-xl
                                        border border-surface-100 dark:border-surface-600
                                        overflow-hidden">
                                <div class="px-4 py-3 bg-primary-50 dark:bg-primary-950
                                            border-b border-primary-100
                                            dark:border-primary-900">
                                    <h3 class="font-semibold text-primary-800
                                               dark:text-primary-200 flex items-center gap-2">
                                        <i class="pi pi-list-check text-primary-600"></i>
                                        Récapitulatif du dossier
                                    </h3>
                                </div>

                                <div class="p-4 grid grid-cols-1 gap-3">

                                    <div class="flex items-start gap-3 pb-3 border-b
                                                border-surface-100 dark:border-surface-600">
                                        <div class="w-8 h-8 rounded-lg bg-blue-100
                                                    flex items-center justify-center
                                                    flex-shrink-0">
                                            <i class="pi pi-tag text-blue-600 text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-xs text-surface-400
                                                         uppercase tracking-wide">Type</div>
                                            <div class="font-medium text-surface-900
                                                         dark:text-surface-0 text-sm mt-0.5">
                                                {{ getTypeLabel(f['type'].value) }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-3 pb-3 border-b
                                                border-surface-100 dark:border-surface-600">
                                        <div class="w-8 h-8 rounded-lg bg-green-100
                                                    flex items-center justify-center
                                                    flex-shrink-0">
                                            <i class="pi pi-share-alt text-green-600
                                                       text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-xs text-surface-400
                                                         uppercase tracking-wide">Canal</div>
                                            <div class="font-medium text-surface-900
                                                         dark:text-surface-0 text-sm mt-0.5">
                                                {{ getModeLabel(f['submissionMode'].value) }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-3 pb-3 border-b
                                                border-surface-100 dark:border-surface-600">
                                        <div class="w-8 h-8 rounded-lg bg-purple-100
                                                    flex items-center justify-center
                                                    flex-shrink-0">
                                            <i class="pi pi-file-edit text-purple-600
                                                       text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-xs text-surface-400
                                                         uppercase tracking-wide">Objet</div>
                                            <div class="font-medium text-surface-900
                                                         dark:text-surface-0 text-sm mt-0.5">
                                                {{ f['object'].value }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-3 pb-3 border-b
                                                border-surface-100 dark:border-surface-600">
                                        <div class="w-8 h-8 rounded-lg bg-amber-100
                                                    flex items-center justify-center
                                                    flex-shrink-0">
                                            <i class="pi pi-align-left text-amber-600
                                                       text-sm"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="text-xs text-surface-400
                                                         uppercase tracking-wide">
                                                Description
                                            </div>
                                            <div class="font-medium text-surface-900
                                                         dark:text-surface-0 text-sm
                                                         mt-0.5 line-clamp-2">
                                                {{ f['description'].value }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-3 pb-3 border-b
                                                border-surface-100 dark:border-surface-600">
                                        <div class="w-8 h-8 rounded-lg bg-teal-100
                                                    flex items-center justify-center
                                                    flex-shrink-0">
                                            <i class="pi pi-map-marker text-teal-600
                                                       text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-xs text-surface-400
                                                         uppercase tracking-wide">
                                                Lieu / Période
                                            </div>
                                            <div class="font-medium text-surface-900
                                                         dark:text-surface-0 text-sm mt-0.5">
                                                {{ f['incidentLocation'].value || '—' }}
                                                <span *ngIf="f['incidentPeriod'].value"
                                                    class="text-surface-400">
                                                    · {{ f['incidentPeriod'].value }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex items-start gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-surface-200
                                                    flex items-center justify-center
                                                    flex-shrink-0">
                                            <i class="pi pi-user text-surface-600
                                                       text-sm"></i>
                                        </div>
                                        <div>
                                            <div class="text-xs text-surface-400
                                                         uppercase tracking-wide">
                                                Déclarant
                                            </div>
                                            <div class="font-medium text-surface-900
                                                         dark:text-surface-0 text-sm mt-0.5">
                                                {{ fd['anonymous'].value ? 'Anonyme' :
                                                    (((fd['firstName'].value || '')
                                                    + ' ' + (fd['lastName'].value || ''))
                                                    .trim() || 'Non renseigné') }}
                                            </div>
                                            <!-- ✅ Notifications prévues -->
                                            <div *ngIf="!fd['anonymous'].value
                                                        && fd['phoneNumber'].value"
                                                class="text-xs text-green-600 mt-1
                                                       flex items-center gap-1">
                                                <i class="pi pi-mobile text-xs"></i>
                                                SMS → {{ fd['phoneNumber'].value }}
                                            </div>
                                            <div *ngIf="!fd['anonymous'].value
                                                        && fd['email'].value"
                                                class="text-xs text-green-600 mt-0.5
                                                       flex items-center gap-1">
                                                <i class="pi pi-envelope text-xs"></i>
                                                Email → {{ fd['email'].value }}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <!-- Succès inline -->
                            <div *ngIf="submitSuccess"
                                class="flex items-center gap-4 p-5 bg-green-50
                                       dark:bg-green-950 rounded-xl border
                                       border-green-200 dark:border-green-800">
                                <div class="w-12 h-12 rounded-xl bg-green-100
                                            flex items-center justify-center flex-shrink-0">
                                    <i class="pi pi-check-circle text-green-600 text-2xl"></i>
                                </div>
                                <div>
                                    <div class="font-bold text-green-800 dark:text-green-200">
                                        Dossier enregistré avec succès !
                                    </div>
                                    <div class="text-sm text-green-700
                                                 dark:text-green-300 mt-1">
                                        Code d'accès B4 :
                                        <span class="font-mono font-bold bg-green-100
                                                     dark:bg-green-900 px-2 py-0.5
                                                     rounded ml-1">
                                            {{ accessCode }}
                                        </span>
                                    </div>
                                    <!-- ✅ Confirmation envoi -->
                                    <div *ngIf="fd['phoneNumber'].value"
                                        class="text-xs text-green-600 mt-1
                                               flex items-center gap-1">
                                        <i class="pi pi-mobile text-xs"></i>
                                        SMS envoyé au {{ fd['phoneNumber'].value }}
                                    </div>
                                    <div *ngIf="fd['email'].value"
                                        class="text-xs text-green-600 mt-0.5
                                               flex items-center gap-1">
                                        <i class="pi pi-envelope text-xs"></i>
                                        Email envoyé à {{ fd['email'].value }}
                                    </div>
                                    <div class="text-xs text-green-600
                                                 dark:text-green-400 mt-1
                                                 flex items-center gap-1">
                                        <i class="pi pi-spin pi-spinner text-xs"></i>
                                        Redirection vers la liste...
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-between pt-2">
                                <p-button label="Précédent" icon="pi pi-arrow-left"
                                    severity="secondary" outlined
                                    [disabled]="submitting || submitSuccess"
                                    (onClick)="prevStep(activateCallback, 2)" />
                                <p-button label="Soumettre le Dossier"
                                    icon="pi pi-check"
                                    [loading]="submitting"
                                    [disabled]="submitSuccess"
                                    (onClick)="submit()" />
                            </div>
                        </div>
                        </ng-template>
                    </p-step-panel>

                </p-step-panels>
            </p-stepper>

        </div>

        <!-- Aide contextuelle -->
        <div class="flex flex-col gap-4">

            <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border
                        border-surface-100 dark:border-surface-700">
                <h4 class="text-sm font-semibold text-surface-600
                           dark:text-surface-300 mb-4 flex items-center gap-2">
                    <i class="pi pi-list-check text-primary-500"></i>
                    Progression
                </h4>
                <div class="flex flex-col gap-3">
                    <div *ngFor="let step of steps"
                        class="flex items-center gap-3 p-2 rounded-lg transition-all"
                        [class.bg-primary-50]="currentStep === step.id"
                        [class.dark:bg-primary-950]="currentStep === step.id">
                        <div class="w-7 h-7 rounded-full flex items-center
                                    justify-center text-xs font-bold flex-shrink-0"
                            [class.bg-primary-600]="currentStep === step.id"
                            [class.text-white]="currentStep === step.id"
                            [class.bg-green-100]="currentStep > step.id"
                            [class.text-green-600]="currentStep > step.id"
                            [class.bg-surface-100]="currentStep < step.id"
                            [class.text-surface-400]="currentStep < step.id">
                            <i *ngIf="currentStep > step.id"
                                class="pi pi-check text-xs"></i>
                            <span *ngIf="currentStep <= step.id">{{ step.id }}</span>
                        </div>
                        <span class="text-sm"
                            [class.font-semibold]="currentStep === step.id"
                            [class.text-primary-700]="currentStep === step.id"
                            [class.dark:text-primary-300]="currentStep === step.id"
                            [class.text-surface-500]="currentStep !== step.id">
                            {{ step.label }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="bg-green-50 dark:bg-green-950 rounded-2xl p-5 border
                        border-green-200 dark:border-green-800">
                <h4 class="font-semibold text-green-800 dark:text-green-200
                           mb-3 flex items-center gap-2 text-sm">
                    <i class="pi pi-info-circle text-green-600"></i>
                    Après soumission
                </h4>
                <div class="flex flex-col gap-2">
                    <div *ngFor="let item of afterSubmitItems"
                        class="flex items-center gap-2 text-sm
                               text-green-700 dark:text-green-300">
                        <i class="pi pi-check-circle text-green-500
                                   text-xs flex-shrink-0"></i>
                        {{ item }}
                    </div>
                </div>
            </div>

            <div class="bg-amber-50 dark:bg-amber-950 rounded-2xl p-5 border
                        border-amber-200 dark:border-amber-800">
                <h4 class="font-semibold text-amber-800 dark:text-amber-200
                           mb-2 flex items-center gap-2 text-sm">
                    <i class="pi pi-shield text-amber-600"></i>
                    Confidentialité garantie
                </h4>
                <p class="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                    Toutes les informations sont protégées conformément à la loi
                    N°010-2004/AN sur la protection des lanceurs d'alerte.
                </p>
            </div>

        </div>

    </div>
</div>
    `
})
export class DossierForm {

    private fb             = inject(FormBuilder);
    private dossierService = inject(DossierService);
    private router         = inject(Router);
    private messageService = inject(MessageService);

    currentStep   = 1;
    submitting    = false;
    submitSuccess = false;
    accessCode    = '';

    readonly steps = [
        { id: 1, label: 'Informations du dossier'   },
        { id: 2, label: 'Informations du déclarant' },
        { id: 3, label: 'Confirmation et soumission' }
    ];

    readonly afterSubmitItems = [
        'Code d\'accès B4 généré',
        'SMS / Email envoyé au déclarant',
        'Numéro officiel attribué',
        'Récépissé remis au déclarant',
        'Délai de traitement : 7 jours'
    ];

    dossierForm = this.fb.group({
        type:             ['COMPLAINT',  Validators.required],
        submissionMode:   ['IN_PERSON',  Validators.required],
        object:           ['',           [Validators.required, Validators.minLength(10)]],
        description:      ['',           Validators.required],
        incidentLocation: [''],
        incidentPeriod:   [''],
        estimatedLoss:    [null as number | null],
        isConfidential:   [false]
    });

    declarantForm = this.fb.group({
        typeDeclarant:         ['CITIZEN'],
        quality:               [''],
        firstName:             [''],
        lastName:              [''],
        email:                 [''],       // ✅
        phoneNumber:           [''],       // ✅
        commune:               [''],
        province:              [''],
        anonymous:             [false],
        dataProcessingConsent: [true],
        notificationsAccepted: [true],
        protectionRequested:   [false]
    });

    get f()  { return this.dossierForm.controls;   }
    get fd() { return this.declarantForm.controls; }

    typeOptions = [
        { label: 'Plainte',      value: 'COMPLAINT'    },
        { label: 'Dénonciation', value: 'DENUNCIATION' },
        { label: 'Auto-saisine', value: 'AUTO_REFERRAL'},
        { label: 'Anonyme',      value: 'ANONYMOUS'    }
    ];

    modeOptions = [
        { label: 'Guichet BRPD',      value: 'IN_PERSON'     },
        { label: 'Formulaire Web',    value: 'WEB_FORM'      },
        { label: 'Email',             value: 'EMAIL'         },
        { label: 'SMS',               value: 'SMS'           },
        { label: 'Téléphone',         value: 'PHONE'         },
        { label: 'Numéro Vert',       value: 'GREEN_NUMBER'  },
        { label: 'Réseaux Sociaux',   value: 'SOCIAL_MEDIA'  },
        { label: 'Comptoir Audio',    value: 'AUDIO_COUNTER' },
        { label: 'Formulaire Papier', value: 'PAPER_FORM'    },
        { label: 'Courrier Postal',   value: 'POSTAL_MAIL'   },
        { label: 'Fax',               value: 'FAX'           }
    ];

    declarantTypeOptions = [
        { label: 'Citoyen',           value: 'CITIZEN'          },
        { label: 'Entreprise',        value: 'COMPANY'          },
        { label: 'Association',       value: 'ASSOCIATION'      },
        { label: 'Autorité publique', value: 'PUBLIC_AUTHORITY' }
    ];

    qualityOptions = [
        { label: 'Victime',      value: 'VICTIM'         },
        { label: 'Témoin',       value: 'WITNESS'        },
        { label: 'Représentant', value: 'REPRESENTATIVE' }
    ];

    nextStep(activateCallback: any, step: number): void {
        if (step === 2 && this.dossierForm.invalid) {
            this.dossierForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn', summary: 'Validation',
                detail:   'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }
        this.currentStep = step;
        activateCallback(step);
    }

    prevStep(activateCallback: any, step: number): void {
        this.currentStep = step;
        activateCallback(step);
    }

    toggleAnonymous(): void {
        const current = this.fd['anonymous'].value;
        this.fd['anonymous'].setValue(!current);
        if (!current) {
            this.fd['dataProcessingConsent'].setValue(true);
        }
    }

    submit(): void {
        if (this.dossierForm.invalid) {
            this.dossierForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn', summary: 'Validation',
                detail:   'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        this.submitting = true;

        const request = {
            ...this.dossierForm.value,
            declarantData: {
                ...this.declarantForm.value,
                // ✅ Email et téléphone inclus pour envoi auto backend
                email:        this.fd['email'].value       || undefined,
                phoneNumber:  this.fd['phoneNumber'].value || undefined,
                typeDeclarant: this.fd['anonymous'].value
                    ? 'ANONYMOUS'
                    : (this.fd['typeDeclarant'].value ?? 'CITIZEN')
            }
        } as any;

        if (!request.estimatedLoss)    delete request.estimatedLoss;
        if (!request.incidentLocation) delete request.incidentLocation;
        if (!request.incidentPeriod)   delete request.incidentPeriod;

        this.dossierService.submit(request).subscribe({
            next: dossier => {
                this.submitting    = false;
                this.submitSuccess = true;
                this.accessCode    = dossier.accessCode;

                this.messageService.add({
                    severity: 'success',
                    summary:  'Dossier enregistré',
                    detail:   `Code B4 : ${dossier.accessCode}`,
                    life:     3000
                });

                timer(3000).subscribe(() =>
                    this.router.navigate(['/app/dossiers'])
                );
            },
            error: err => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message
                        || 'Impossible de créer le dossier'
                });
            }
        });
    }

    getTypeLabel(type: string | null): string {
        if (!type) return '';
        return this.typeOptions.find(o => o.value === type)?.label || type;
    }

    getModeLabel(mode: string | null): string {
        if (!mode) return '';
        return this.modeOptions.find(o => o.value === mode)?.label || mode;
    }
}