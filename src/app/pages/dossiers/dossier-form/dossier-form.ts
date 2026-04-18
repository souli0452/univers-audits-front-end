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
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';

@Component({
    selector: 'app-dossier-form',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ReactiveFormsModule, ButtonModule, InputTextModule,
        TextareaModule, SelectModule, CheckboxModule,
        InputNumberModule, StepperModule, CardModule, ToastModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-4">

    <!-- En-tête -->
    <div class="flex items-center gap-3">
        <p-button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            routerLink="/dossiers" />
        <div>
            <h1 class="text-2xl font-bold">Nouveau Dossier</h1>
            <p class="text-surface-500 text-sm">
                Enregistrement d'une plainte ou dénonciation
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Formulaire principal -->
        <div class="lg:col-span-2">
            <p-stepper [value]="currentStep" styleClass="mb-4">

                <!-- Étape 1 — Informations du dossier -->
                <p-step-list>
                    <p-step [value]="1">Dossier</p-step>
                    <p-step [value]="2">Déclarant</p-step>
                    <p-step [value]="3">Confirmation</p-step>
                </p-step-list>

                <p-step-panels>

                    <!-- Panel 1 -->
                    <p-step-panel [value]="1">
                        <ng-template #content let-activateCallback="activateCallback">
                        <div class="flex flex-col gap-4 p-2">

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <!-- Type de saisine -->
                                <div class="flex flex-col gap-1">
                                    <label class="text-sm font-medium">
                                        Type de saisine *
                                    </label>
                                    <p-select
                                        [formControl]="f['type']"
                                        [options]="typeOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Sélectionner"
                                        styleClass="w-full" />
                                    <small class="text-red-500"
                                           *ngIf="f['type'].invalid && f['type'].touched">
                                        Champ obligatoire
                                    </small>
                                </div>

                                <!-- Canal de réception -->
                                <div class="flex flex-col gap-1">
                                    <label class="text-sm font-medium">
                                        Canal de réception *
                                    </label>
                                    <p-select
                                        [formControl]="f['submissionMode']"
                                        [options]="modeOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="Sélectionner"
                                        styleClass="w-full" />
                                    <small class="text-red-500"
                                           *ngIf="f['submissionMode'].invalid && f['submissionMode'].touched">
                                        Champ obligatoire
                                    </small>
                                </div>

                            </div>

                            <!-- Objet -->
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">
                                    Objet de la plainte *
                                </label>
                                <input
                                    pInputText
                                    [formControl]="f['object']"
                                    placeholder="Résumé en quelques mots"
                                    class="w-full" />
                                <small class="text-red-500"
                                       *ngIf="f['object'].invalid && f['object'].touched">
                                    Champ obligatoire (min 10 caractères)
                                </small>
                            </div>

                            <!-- Description -->
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">
                                    Description détaillée *
                                </label>
                                <textarea
                                    pTextarea
                                    [formControl]="f['description']"
                                    placeholder="Décrivez les faits en détail..."
                                    rows="5"
                                    class="w-full">
                                </textarea>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <!-- Lieu -->
                                <div class="flex flex-col gap-1">
                                    <label class="text-sm font-medium">
                                        Lieu des faits
                                    </label>
                                    <input
                                        pInputText
                                        [formControl]="f['incidentLocation']"
                                        placeholder="Ex: Mairie de Koudougou"
                                        class="w-full" />
                                </div>

                                <!-- Période -->
                                <div class="flex flex-col gap-1">
                                    <label class="text-sm font-medium">
                                        Période des faits
                                    </label>
                                    <input
                                        pInputText
                                        [formControl]="f['incidentPeriod']"
                                        placeholder="Ex: Janvier - Juin 2024"
                                        class="w-full" />
                                </div>

                            </div>

                            <!-- Montant estimé -->
                            <div class="flex flex-col gap-1">
                                <label class="text-sm font-medium">
                                    Montant estimé du préjudice (FCFA)
                                </label>
                                <p-inputnumber
                                    [formControl]="f['estimatedLoss']"
                                    [useGrouping]="true"
                                    placeholder="0"
                                    styleClass="w-full" />
                            </div>

                            <!-- Confidentiel -->
                            <div class="flex items-center gap-2">
                                <p-checkbox
                                    [formControl]="f['isConfidential']"
                                    [binary]="true"
                                    inputId="confidential" />
                                <label for="confidential" class="text-sm">
                                    Dossier confidentiel
                                </label>
                            </div>

                            <div class="flex justify-end gap-2 pt-2">
                                <p-button
                                    label="Suivant"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    (onClick)="nextStep(activateCallback, 2)" />
                            </div>
                        </div>
                        </ng-template>
                    </p-step-panel>

                    <!-- Panel 2 — Déclarant -->
                    <p-step-panel [value]="2">
                        <ng-template #content let-activateCallback="activateCallback">
                        <div class="flex flex-col gap-4 p-2">

                            <!-- Anonyme -->
                            <div class="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p-checkbox
                                    [formControl]="fd['anonymous']"
                                    [binary]="true"
                                    inputId="anonymous"
                                    (onChange)="onAnonymousChange()" />
                                <label for="anonymous" class="text-sm font-medium text-yellow-800">
                                    Déclarant anonyme — identité masquée
                                </label>
                            </div>

                            <div *ngIf="!fd['anonymous'].value">

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <!-- Type déclarant -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">
                                            Type de déclarant *
                                        </label>
                                        <p-select
                                            [formControl]="fd['typeDeclarant']"
                                            [options]="declarantTypeOptions"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Sélectionner"
                                            styleClass="w-full" />
                                    </div>

                                    <!-- Qualité -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">
                                            Qualité par rapport aux faits
                                        </label>
                                        <p-select
                                            [formControl]="fd['quality']"
                                            [options]="qualityOptions"
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder="Sélectionner"
                                            styleClass="w-full"
                                            [showClear]="true" />
                                    </div>

                                    <!-- Prénom -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">Prénom</label>
                                        <input
                                            pInputText
                                            [formControl]="fd['firstName']"
                                            placeholder="Prénom"
                                            class="w-full" />
                                    </div>

                                    <!-- Nom -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">Nom</label>
                                        <input
                                            pInputText
                                            [formControl]="fd['lastName']"
                                            placeholder="Nom de famille"
                                            class="w-full" />
                                    </div>

                                    <!-- Email -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">Email</label>
                                        <input
                                            pInputText
                                            [formControl]="fd['email']"
                                            placeholder="email@exemple.bf"
                                            type="email"
                                            class="w-full" />
                                    </div>

                                    <!-- Téléphone -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">Téléphone</label>
                                        <input
                                            pInputText
                                            [formControl]="fd['phoneNumber']"
                                            placeholder="+226 XX XX XX XX"
                                            class="w-full" />
                                    </div>

                                    <!-- Commune -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">Commune</label>
                                        <input
                                            pInputText
                                            [formControl]="fd['commune']"
                                            placeholder="Commune"
                                            class="w-full" />
                                    </div>

                                    <!-- Province -->
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-medium">Province</label>
                                        <input
                                            pInputText
                                            [formControl]="fd['province']"
                                            placeholder="Province"
                                            class="w-full" />
                                    </div>

                                </div>

                                <!-- Consentements -->
                                <div class="flex flex-col gap-2 mt-4 p-3 bg-surface-50 rounded-lg">
                                    <div class="flex items-center gap-2">
                                        <p-checkbox
                                            [formControl]="fd['dataProcessingConsent']"
                                            [binary]="true"
                                            inputId="consent" />
                                        <label for="consent" class="text-sm">
                                            J'accepte le traitement de mes données personnelles *
                                        </label>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <p-checkbox
                                            [formControl]="fd['notificationsAccepted']"
                                            [binary]="true"
                                            inputId="notif" />
                                        <label for="notif" class="text-sm">
                                            J'accepte de recevoir des notifications
                                        </label>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <p-checkbox
                                            [formControl]="fd['protectionRequested']"
                                            [binary]="true"
                                            inputId="protection" />
                                        <label for="protection" class="text-sm">
                                            Je demande une protection (lanceur d'alerte)
                                        </label>
                                    </div>
                                </div>

                            </div>

                            <div class="flex justify-between gap-2 pt-2">
                                <p-button
                                    label="Précédent"
                                    icon="pi pi-arrow-left"
                                    severity="secondary"
                                    outlined
                                    (onClick)="activateCallback(1)" />
                                <p-button
                                    label="Suivant"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    (onClick)="activateCallback(3)" />
                            </div>
                        </div>
                        </ng-template>
                    </p-step-panel>

                    <!-- Panel 3 — Confirmation -->
                    <p-step-panel [value]="3">
                        <ng-template #content let-activateCallback="activateCallback">
                        <div class="flex flex-col gap-4 p-2">

                            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 class="font-semibold text-blue-900 mb-3">
                                    Récapitulatif du dossier
                                </h3>
                                <div class="grid grid-cols-2 gap-2 text-sm">
                                    <span class="text-blue-600 font-medium">Type :</span>
                                    <span>{{ getTypeLabel(f['type'].value) }}</span>
                                    <span class="text-blue-600 font-medium">Canal :</span>
                                    <span>{{ getModeLabel(f['submissionMode'].value) }}</span>
                                    <span class="text-blue-600 font-medium">Objet :</span>
                                    <span>{{ f['object'].value }}</span>
                                    <span class="text-blue-600 font-medium">Déclarant :</span>
                                    <span>
                                        {{ fd['anonymous'].value ? 'Anonyme' :
                                           (fd['firstName'].value + ' ' + fd['lastName'].value) || 'Non renseigné' }}
                                    </span>
                                </div>
                            </div>

                            <div class="flex justify-between gap-2 pt-2">
                                <p-button
                                    label="Précédent"
                                    icon="pi pi-arrow-left"
                                    severity="secondary"
                                    outlined
                                    (onClick)="activateCallback(2)" />
                                <p-button
                                    label="Soumettre le Dossier"
                                    icon="pi pi-check"
                                    [loading]="submitting"
                                    (onClick)="submit()" />
                            </div>
                        </div>
                        </ng-template>
                    </p-step-panel>

                </p-step-panels>
            </p-stepper>
        </div>

        <!-- Aide contextuelle -->
        <div class="flex flex-col gap-3">

            <div class="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 class="font-semibold text-green-800 mb-2">
                    <i class="pi pi-info-circle mr-2"></i>
                    Après soumission
                </h4>
                <ul class="text-sm text-green-700 flex flex-col gap-1">
                    <li>✅ Code d'accès B4 généré</li>
                    <li>✅ Numéro officiel attribué</li>
                    <li>✅ Récépissé remis au déclarant</li>
                    <li>✅ Délai de traitement : 7 jours</li>
                </ul>
            </div>

            <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 class="font-semibold text-yellow-800 mb-2">
                    <i class="pi pi-shield mr-2"></i>
                    Confidentialité
                </h4>
                <p class="text-sm text-yellow-700">
                    Toutes les informations sont protégées
                    conformément à la loi N°010-2004/AN
                    sur la protection des lanceurs d'alerte.
                </p>
            </div>

        </div>

    </div>

</div>
    `
})
export class DossierForm {

    private fb = inject(FormBuilder);
    private dossierService = inject(DossierService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    currentStep = 1;
    submitting = false;

    // Formulaire dossier
    dossierForm = this.fb.group({
        type: ['COMPLAINT', Validators.required],
        submissionMode: ['IN_PERSON', Validators.required],
        object: ['', [Validators.required, Validators.minLength(10)]],
        description: [''],
        incidentLocation: [''],
        incidentPeriod: [''],
        estimatedLoss: [null],
        isConfidential: [false]
    });

    // Formulaire déclarant
    declarantForm = this.fb.group({
        typeDeclarant: ['CITIZEN'],
        quality: [''],
        firstName: [''],
        lastName: [''],
        email: [''],
        phoneNumber: [''],
        commune: [''],
        province: [''],
        anonymous: [false],
        dataProcessingConsent: [true],
        notificationsAccepted: [true],
        protectionRequested: [false]
    });

    // Accès rapide aux controls
    get f() { return this.dossierForm.controls; }
    get fd() { return this.declarantForm.controls; }

    typeOptions = [
        { label: 'Plainte', value: 'COMPLAINT' },
        { label: 'Dénonciation', value: 'DENUNCIATION' },
        { label: 'Auto-saisine', value: 'AUTO_REFERRAL' },
        { label: 'Anonyme', value: 'ANONYMOUS' }
    ];

    modeOptions = [
        { label: 'Guichet BRPD', value: 'IN_PERSON' },
        { label: 'Formulaire Web', value: 'WEB_FORM' },
        { label: 'Email', value: 'EMAIL' },
        { label: 'SMS', value: 'SMS' },
        { label: 'Téléphone', value: 'PHONE' },
        { label: 'Numéro Vert', value: 'GREEN_NUMBER' },
        { label: 'Réseaux Sociaux', value: 'SOCIAL_MEDIA' },
        { label: 'Comptoir Audio', value: 'AUDIO_COUNTER' },
        { label: 'Formulaire Papier', value: 'PAPER_FORM' },
        { label: 'Courrier Postal', value: 'POSTAL_MAIL' },
        { label: 'Fax', value: 'FAX' }
    ];

    declarantTypeOptions = [
        { label: 'Citoyen', value: 'CITIZEN' },
        { label: 'Entreprise', value: 'COMPANY' },
        { label: 'Association', value: 'ASSOCIATION' },
        { label: 'Autorité publique', value: 'PUBLIC_AUTHORITY' }
    ];

    qualityOptions = [
        { label: 'Victime', value: 'VICTIM' },
        { label: 'Témoin', value: 'WITNESS' },
        { label: 'Représentant', value: 'REPRESENTATIVE' }
    ];

    nextStep(activateCallback: any, step: number): void {
        if (step === 2 && this.dossierForm.invalid) {
            this.dossierForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Veuillez remplir les champs obligatoires'
            });
            return;
        }
        this.currentStep = step;
        activateCallback(step);
    }

    onAnonymousChange(): void {
        const isAnon = this.fd['anonymous'].value;
        if (isAnon) {
            this.fd['dataProcessingConsent'].setValue(true);
        }
    }

    submit(): void {
        if (this.dossierForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Formulaire incomplet'
            });
            return;
        }

        this.submitting = true;

        const request = {
            ...this.dossierForm.value,
            declarantData: {
                ...this.declarantForm.value,
                typeDeclarant: this.fd['anonymous'].value
                    ? 'ANONYMOUS'
                    : this.fd['typeDeclarant'].value
            }
        } as any;

        this.dossierService.create(request).subscribe({
            next: dossier => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Dossier créé',
                    detail: `Code d'accès : ${dossier.accessCode}`
                });
                setTimeout(() => {
                    this.router.navigate(['/dossiers', dossier.id]);
                }, 2000);
            },
            error: err => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de créer le dossier'
                });
            }
        });
    }
    
    getTypeLabel(type: string | null): string {
    if (!type) return '';
    return this.typeOptions.find(o => o.value === type)
        ?.label || type;
}

getModeLabel(mode: string | null): string {
    if (!mode) return '';
    return this.modeOptions.find(o => o.value === mode)
        ?.label || mode;
}
}