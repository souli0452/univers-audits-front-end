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
import { ToastModule } from 'primeng/toast';
import { StepperModule } from 'primeng/stepper';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';

@Component({
    selector: 'app-depot-plainte',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ReactiveFormsModule, ButtonModule, InputTextModule,
        TextareaModule, SelectModule, CheckboxModule,
        InputNumberModule, ToastModule, StepperModule, DialogModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<!-- Dialog succès -->
<p-dialog
    [(visible)]="showSuccess"
    header="Dossier soumis avec succès"
    [modal]="true"
    [closable]="false"
    [style]="{width: '480px'}">
    <div class="text-center py-4">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-check-circle text-green-600 text-4xl"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">
            Merci pour votre signalement
        </h3>
        <p class="text-gray-500 mb-4">
            Votre dossier a été enregistré avec succès.
            Conservez précieusement votre code d'accès.
        </p>
        <div class="bg-green-50 rounded-xl p-4 border border-green-200 mb-4">
            <div class="text-xs text-green-600 font-medium mb-1">
                Votre code de suivi (B4)
            </div>
            <div class="font-mono text-3xl font-bold text-green-700 tracking-widest">
                {{ createdAccessCode }}
            </div>
            <div class="text-xs text-green-500 mt-2">
                Notez ce code — il vous permettra de suivre
                votre dossier en ligne
            </div>
        </div>
        <div class="text-sm text-gray-500 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <i class="pi pi-info-circle text-yellow-600 mr-2"></i>
            Vous recevrez un accusé de réception officiel
            dans les 7 jours ouvrables.
        </div>
    </div>
    <ng-template pTemplate="footer">
        <div class="flex gap-2 justify-center">
            <p-button
                label="Suivre mon dossier"
                icon="pi pi-search"
                routerLink="/portail/suivi"
                (onClick)="showSuccess = false" />
            <p-button
                label="Retour à l'accueil"
                severity="secondary"
                outlined
                routerLink="/portail"
                (onClick)="showSuccess = false" />
        </div>
    </ng-template>
</p-dialog>

<div class="min-h-screen bg-gray-50">

    <!-- Navigation -->
    <nav class="bg-green-700 text-white px-6 py-4 shadow-lg">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <p-button
                    icon="pi pi-arrow-left"
                    severity="contrast"
                    text
                    routerLink="/portail" />
                <div class="flex items-center gap-2">
                    <i class="pi pi-shield text-xl"></i>
                    <span class="font-bold">ASCE-LC</span>
                    <span class="text-green-300 hidden sm:block">
                        — Dépôt de plainte en ligne
                    </span>
                </div>
            </div>
            <p-button
                label="Suivre un dossier"
                icon="pi pi-search"
                severity="contrast"
                outlined
                size="small"
                routerLink="/portail/suivi" />
        </div>
    </nav>

    <div class="max-w-3xl mx-auto px-4 py-8">

        <!-- En-tête -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
                Déposer une plainte ou dénonciation
            </h1>
            <p class="text-gray-500">
                Formulaire sécurisé — vos données sont protégées
            </p>
        </div>

        <!-- Indicateur de progression -->
        <div class="flex items-center justify-center mb-8">
            <div *ngFor="let s of [1,2,3]; let i = index"
                 class="flex items-center">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                         [class]="currentStep > s
                            ? 'bg-green-500 text-white'
                            : currentStep === s
                                ? 'bg-green-700 text-white'
                                : 'bg-gray-200 text-gray-500'">
                        <i *ngIf="currentStep > s" class="pi pi-check text-xs"></i>
                        <span *ngIf="currentStep <= s">{{ s }}</span>
                    </div>
                    <span class="text-sm hidden sm:block"
                          [class]="currentStep >= s ? 'text-gray-900 font-medium' : 'text-gray-400'">
                        {{ stepLabels[i] }}
                    </span>
                </div>
                <div *ngIf="s < 3"
                     class="w-12 h-0.5 mx-2"
                     [class]="currentStep > s ? 'bg-green-500' : 'bg-gray-200'">
                </div>
            </div>
        </div>

        <!-- Étape 1 — Les faits -->
        <div *ngIf="currentStep === 1"
             class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i class="pi pi-file-edit text-green-600"></i>
                Décrivez les faits
            </h2>

            <div class="flex flex-col gap-4">

                <!-- Type -->
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium text-gray-700">
                        Type de signalement *
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <div *ngFor="let type of typeOptions"
                             class="border-2 rounded-xl p-3 cursor-pointer transition-all"
                             [class]="f['type'].value === type.value
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'"
                             (click)="f['type'].setValue(type.value)">
                            <div class="font-medium text-sm">{{ type.label }}</div>
                            <div class="text-xs text-gray-400 mt-0.5">
                                {{ type.description }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Objet -->
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium text-gray-700">
                        Résumé de votre signalement *
                    </label>
                    <input
                        pInputText
                        [formControl]="f['object']"
                        placeholder="Ex: Détournement de fonds à la mairie de..."
                        class="w-full" />
                    <small class="text-gray-400">
                        {{ f['object'].value?.length || 0 }}/200 caractères
                    </small>
                </div>

                <!-- Description -->
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium text-gray-700">
                        Description détaillée des faits *
                    </label>
                    <textarea
                        pTextarea
                        [formControl]="f['description']"
                        placeholder="Décrivez les faits avec précision : qui, quoi, quand, où, comment. Plus votre description est détaillée, plus votre dossier sera traité efficacement."
                        rows="6"
                        class="w-full">
                    </textarea>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- Lieu -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">
                            Lieu des faits
                        </label>
                        <input
                            pInputText
                            [formControl]="f['incidentLocation']"
                            placeholder="Service, ville, région..."
                            class="w-full" />
                    </div>

                    <!-- Période -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">
                            Période approximative
                        </label>
                        <input
                            pInputText
                            [formControl]="f['incidentPeriod']"
                            placeholder="Ex: Janvier 2024"
                            class="w-full" />
                    </div>
                </div>

                <!-- Montant -->
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-medium text-gray-700">
                        Montant estimé du préjudice (FCFA)
                        <span class="text-gray-400 font-normal ml-1">optionnel</span>
                    </label>
                    <p-inputnumber
                        [formControl]="f['estimatedLoss']"
                        [useGrouping]="true"
                        placeholder="0"
                        styleClass="w-full" />
                </div>

            </div>

            <div class="flex justify-end mt-6">
                <p-button
                    label="Continuer"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    [disabled]="!f['object'].value || !f['description'].value"
                    (onClick)="currentStep = 2" />
            </div>
        </div>

        <!-- Étape 2 — Vos coordonnées -->
        <div *ngIf="currentStep === 2"
             class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 class="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <i class="pi pi-user text-green-600"></i>
                Vos coordonnées
            </h2>
            <p class="text-gray-500 text-sm mb-6">
                Ces informations sont strictement confidentielles.
                Vous pouvez rester anonyme.
            </p>

            <!-- Choix anonymat -->
            <div class="flex flex-col gap-3 mb-6">
                <div class="border-2 rounded-xl p-4 cursor-pointer transition-all"
                     [class]="!fd['anonymous'].value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'"
                     (click)="fd['anonymous'].setValue(false)">
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                             [class]="!fd['anonymous'].value
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'">
                            <div *ngIf="!fd['anonymous'].value"
                                 class="w-2 h-2 bg-white rounded-full">
                            </div>
                        </div>
                        <div>
                            <div class="font-medium text-sm">
                                Je fournis mes coordonnées
                            </div>
                            <div class="text-xs text-gray-400">
                                Recommandé pour un meilleur suivi de votre dossier
                            </div>
                        </div>
                    </div>
                </div>

                <div class="border-2 rounded-xl p-4 cursor-pointer transition-all"
                     [class]="fd['anonymous'].value
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200'"
                     (click)="fd['anonymous'].setValue(true)">
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                             [class]="fd['anonymous'].value
                                ? 'border-yellow-500 bg-yellow-500'
                                : 'border-gray-300'">
                            <div *ngIf="fd['anonymous'].value"
                                 class="w-2 h-2 bg-white rounded-full">
                            </div>
                        </div>
                        <div>
                            <div class="font-medium text-sm">
                                Je reste anonyme
                            </div>
                            <div class="text-xs text-gray-400">
                                Votre identité ne sera pas enregistrée
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Formulaire coordonnées -->
            <div *ngIf="!fd['anonymous'].value" class="flex flex-col gap-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">Prénom</label>
                        <input
                            pInputText
                            [formControl]="fd['firstName']"
                            placeholder="Votre prénom"
                            class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">Nom</label>
                        <input
                            pInputText
                            [formControl]="fd['lastName']"
                            placeholder="Votre nom"
                            class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">Téléphone</label>
                        <input
                            pInputText
                            [formControl]="fd['phoneNumber']"
                            placeholder="+226 XX XX XX XX"
                            class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">Email</label>
                        <input
                            pInputText
                            [formControl]="fd['email']"
                            placeholder="votre@email.com"
                            class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">Commune</label>
                        <input
                            pInputText
                            [formControl]="fd['commune']"
                            placeholder="Votre commune"
                            class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium text-gray-700">Province</label>
                        <input
                            pInputText
                            [formControl]="fd['province']"
                            placeholder="Votre province"
                            class="w-full" />
                    </div>
                </div>

                <!-- Protection lanceur d'alerte -->
                <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p-checkbox
                        [formControl]="fd['protectionRequested']"
                        [binary]="true"
                        inputId="protection" />
                    <label for="protection" class="text-sm text-blue-800 cursor-pointer">
                        <span class="font-medium">
                            Je demande une protection en tant que lanceur d'alerte
                        </span>
                        <br>
                        <span class="text-blue-600">
                            Loi N°010-2004/AN — protection garantie par l'État
                        </span>
                    </label>
                </div>
            </div>

            <!-- Consentement -->
            <div class="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div class="flex items-start gap-3">
                    <p-checkbox
                        [formControl]="fd['dataProcessingConsent']"
                        [binary]="true"
                        inputId="consent" />
                    <label for="consent" class="text-sm text-gray-700 cursor-pointer">
                        J'accepte que mes données soient traitées
                        par l'ASCE-LC dans le cadre exclusif du traitement
                        de ce dossier, conformément à la réglementation
                        en vigueur. *
                    </label>
                </div>
            </div>

            <div class="flex justify-between mt-6">
                <p-button
                    label="Précédent"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    outlined
                    (onClick)="currentStep = 1" />
                <p-button
                    label="Continuer"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    [disabled]="!fd['dataProcessingConsent'].value"
                    (onClick)="currentStep = 3" />
            </div>
        </div>

        <!-- Étape 3 — Confirmation -->
        <div *ngIf="currentStep === 3"
             class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                Confirmer votre signalement
            </h2>

            <div class="flex flex-col gap-4">

                <!-- Résumé dossier -->
                <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 class="font-semibold text-sm text-gray-700 mb-3">
                        Votre signalement
                    </h3>
                    <div class="flex flex-col gap-2 text-sm">
                        <div class="flex gap-2">
                            <span class="text-gray-400 w-24 flex-shrink-0">Type :</span>
                            <span class="font-medium">
                                {{ getTypeLabel(f['type'].value) }}
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <span class="text-gray-400 w-24 flex-shrink-0">Objet :</span>
                            <span class="font-medium">{{ f['object'].value }}</span>
                        </div>
                        <div class="flex gap-2" *ngIf="f['incidentLocation'].value">
                            <span class="text-gray-400 w-24 flex-shrink-0">Lieu :</span>
                            <span>{{ f['incidentLocation'].value }}</span>
                        </div>
                        <div class="flex gap-2" *ngIf="f['estimatedLoss'].value">
                            <span class="text-gray-400 w-24 flex-shrink-0">Montant :</span>
                            <span class="text-red-600 font-medium">
                                {{ f['estimatedLoss'].value | number }} FCFA
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Résumé déclarant -->
                <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 class="font-semibold text-sm text-gray-700 mb-3">
                        Déclarant
                    </h3>
                    <div class="text-sm">
                        <span *ngIf="fd['anonymous'].value"
                              class="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                            <i class="pi pi-eye-slash"></i> Anonyme
                        </span>
                        <span *ngIf="!fd['anonymous'].value">
                            {{ fd['firstName'].value }}
                            {{ fd['lastName'].value }}
                            <span class="text-gray-400 ml-2">
                                {{ fd['phoneNumber'].value }}
                            </span>
                        </span>
                    </div>
                </div>

                <!-- Avertissement final -->
                <div class="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-exclamation-triangle text-amber-600 mt-0.5"></i>
                        <p class="text-sm text-amber-800">
                            En soumettant ce formulaire, vous certifiez
                            que les informations fournies sont exactes
                            et sincères. Toute fausse déclaration est
                            passible de poursuites judiciaires.
                        </p>
                    </div>
                </div>

            </div>

            <div class="flex justify-between mt-6">
                <p-button
                    label="Précédent"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    outlined
                    (onClick)="currentStep = 2" />
                <p-button
                    label="Soumettre mon signalement"
                    icon="pi pi-send"
                    [loading]="submitting"
                    styleClass="bg-green-600 border-green-600 font-bold"
                    (onClick)="submit()" />
            </div>
        </div>

    </div>
</div>
    `
})
export class DepotPlainte {

    private fb = inject(FormBuilder);
    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);

    currentStep = 1;
    submitting = false;
    showSuccess = false;
    createdAccessCode = '';

    stepLabels = ['Les faits', 'Vos coordonnées', 'Confirmation'];

    dossierForm = this.fb.group({
        type: ['COMPLAINT'],
        object: ['', [Validators.required, Validators.minLength(10)]],
        description: ['', Validators.required],
        incidentLocation: [''],
        incidentPeriod: [''],
        estimatedLoss: [null]
    });

    declarantForm = this.fb.group({
        typeDeclarant: ['CITIZEN'],
        firstName: [''],
        lastName: [''],
        email: [''],
        phoneNumber: [''],
        commune: [''],
        province: [''],
        anonymous: [false],
        dataProcessingConsent: [false],
        notificationsAccepted: [true],
        protectionRequested: [false]
    });

    get f() { return this.dossierForm.controls; }
    get fd() { return this.declarantForm.controls; }

    typeOptions = [
        {
            label: 'Plainte',
            value: 'COMPLAINT',
            description: 'Je suis victime ou témoin de corruption'
        },
        {
            label: 'Dénonciation',
            value: 'DENUNCIATION',
            description: 'Je signale des faits dont j\'ai connaissance'
        }
    ];

    submit(): void {
        this.submitting = true;

        const request = {
            type: this.f['type'].value as any,
            submissionMode: 'WEB_FORM' as any,
            object: this.f['object'].value!,
            description: this.f['description'].value || undefined,
            incidentLocation: this.f['incidentLocation'].value || undefined,
            incidentPeriod: this.f['incidentPeriod'].value || undefined,
            estimatedLoss: this.f['estimatedLoss'].value || undefined,
            declarantData: {
                typeDeclarant: this.fd['anonymous'].value
                    ? 'ANONYMOUS' as any
                    : 'CITIZEN' as any,
                firstName: this.fd['firstName'].value || undefined,
                lastName: this.fd['lastName'].value || undefined,
                email: this.fd['email'].value || undefined,
                phoneNumber: this.fd['phoneNumber'].value || undefined,
                commune: this.fd['commune'].value || undefined,
                province: this.fd['province'].value || undefined,
                anonymous: this.fd['anonymous'].value || false,
                dataProcessingConsent: this.fd['dataProcessingConsent'].value || true,
                notificationsAccepted: this.fd['notificationsAccepted'].value || true,
                protectionRequested: this.fd['protectionRequested'].value || false
            }
        };

        this.dossierService.submit(request).subscribe({
            next: dossier => {
                this.createdAccessCode = dossier.accessCode;
                this.submitting = false;
                this.showSuccess = true;
            },
            error: err => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message
                        || 'Impossible de soumettre le dossier. Réessayez.'
                });
            }
        });
    }

    getTypeLabel(type: string | null): string {
        if (!type) return '';
        return this.typeOptions.find(o => o.value === type)
            ?.label || type;
    }
}