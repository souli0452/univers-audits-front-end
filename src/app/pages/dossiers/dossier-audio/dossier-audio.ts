import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';

const MAX_DURATION_SECONDS = 600; 

@Component({
    selector: 'app-dossier-audio',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ReactiveFormsModule, ButtonModule, SelectModule,
        InputTextModule, TextareaModule, ToastModule,
        DatePickerModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div *ngIf="createdDossier" class="flex flex-col items-center justify-center
     min-h-96 gap-6 p-8">
    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center
                justify-center">
        <i class="pi pi-check-circle text-green-600 text-4xl"></i>
    </div>
    <div class="text-center">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-2">
            Dossier créé avec succès
        </h2>
        <p class="text-surface-500 text-sm">
            {{ createdDossier.number }}
        </p>
    </div>

    <!-- Code B4 — à remettre physiquement au déclarant -->
    <div class="bg-primary-50 dark:bg-primary-950 border-2 border-primary-200
                dark:border-primary-800 rounded-2xl p-6 text-center w-full max-w-sm">
        <div class="text-xs text-primary-400 uppercase tracking-widest mb-2">
            Code de suivi B4 — À remettre au déclarant
        </div>
        <div class="font-mono text-4xl font-bold text-primary-700
                    dark:text-primary-300 tracking-widest mb-3">
            {{ createdDossier.accessCode }}
        </div>
        <div class="text-xs text-primary-500 flex items-center justify-center gap-1">
            <i class="pi pi-info-circle text-xs"></i>
            Notez ce code avant de continuer
        </div>
    </div>

    <div class="flex gap-3">
        <p-button label="Imprimer le B4" icon="pi pi-print"
            severity="secondary" outlined
            (onClick)="printB4()" />
        <p-button label="Voir le dossier" icon="pi pi-arrow-right"
            iconPos="right"
            (onClick)="goToDossier()" />
    </div>
</div>

<!-- ══ FORMULAIRE PRINCIPAL ════════════════════════════════ -->
<div *ngIf="!createdDossier" class="flex flex-col gap-6">

    <!-- En-tête -->
    <div class="flex items-center gap-4">
        <p-button icon="pi pi-arrow-left" severity="secondary"
            text routerLink="/app/dossiers" />
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Dépôt audio
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Enregistrez le témoignage oral puis constituez le dossier
            </p>
        </div>
    </div>

    <!-- Alerte durée max -->
    <div *ngIf="isRecording && recordingDuration >= MAX_DURATION_SECONDS - 60
                && recordingDuration < MAX_DURATION_SECONDS"
        class="flex items-center gap-3 p-3 bg-amber-50 border border-amber-300
               rounded-xl text-amber-700 text-sm">
        <i class="pi pi-exclamation-triangle flex-shrink-0"></i>
        Moins d'une minute avant la limite d'enregistrement (10 min max).
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- ── Enregistrement ──────────────────────────────── -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl border
                    border-surface-100 dark:border-surface-700 overflow-hidden">

            <div class="px-6 py-4 border-b border-surface-100 dark:border-surface-700
                        flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <i class="pi pi-microphone text-primary-600 text-sm"></i>
                </div>
                <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                    Enregistrement du témoignage
                </h3>
            </div>

            <div class="p-6">

                <!-- État initial -->
                <div *ngIf="!audioUrl && !isRecording"
                    class="flex flex-col items-center py-10">
                    <div class="w-32 h-32 bg-primary-50 dark:bg-primary-950
                                rounded-full flex items-center justify-center mb-6
                                border-4 border-primary-100 dark:border-primary-900">
                        <i class="pi pi-microphone text-primary-500 text-5xl"></i>
                    </div>
                    <h4 class="font-bold text-xl text-surface-900 dark:text-surface-0 mb-2">
                        Prêt à enregistrer
                    </h4>
                    <p class="text-surface-400 text-sm text-center mb-2 max-w-xs">
                        Invitez le déclarant à s'exprimer, puis démarrez l'enregistrement
                    </p>
                    <p class="text-xs text-surface-300 text-center mb-8 max-w-xs">
                        Durée maximum : 10 minutes
                    </p>
                    <p-button label="Démarrer l'enregistrement"
                        icon="pi pi-microphone" size="large"
                        (onClick)="startRecording()" />
                    <div class="mt-4 flex items-center gap-2 text-xs text-surface-400">
                        <i class="pi pi-lock text-xs"></i>
                        Enregistrement local — aucune donnée transmise avant validation
                    </div>
                </div>

                <!-- En cours -->
                <div *ngIf="isRecording" class="flex flex-col items-center py-8">
                    <div class="relative mb-6">
                        <div class="w-32 h-32 bg-red-500 rounded-full flex items-center
                                    justify-center animate-pulse">
                            <i class="pi pi-microphone text-white text-4xl"></i>
                        </div>
                        <div class="absolute inset-0 rounded-full border-4 border-red-300
                                    animate-ping opacity-30"></div>
                    </div>
                    <div class="text-5xl font-bold font-mono mb-1"
                        [class.text-red-500]="recordingDuration < MAX_DURATION_SECONDS - 60"
                        [class.text-amber-500]="recordingDuration >= MAX_DURATION_SECONDS - 60">
                        {{ formatDuration(recordingDuration) }}
                    </div>
                    <div class="text-xs text-surface-400 mb-1">
                        / {{ formatDuration(MAX_DURATION_SECONDS) }} max
                    </div>
                    <div class="flex items-center gap-2 text-red-400 text-sm mb-2">
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Enregistrement en cours...
                    </div>
                    <!-- Barre de progression durée -->
                    <div class="w-full max-w-xs h-1.5 bg-surface-100 rounded-full
                                overflow-hidden mb-6">
                        <div class="h-full rounded-full transition-all"
                            [style.width]="(recordingDuration / MAX_DURATION_SECONDS * 100) + '%'"
                            [class.bg-red-400]="recordingDuration < MAX_DURATION_SECONDS - 60"
                            [class.bg-amber-400]="recordingDuration >= MAX_DURATION_SECONDS - 60">
                        </div>
                    </div>
                    <div class="flex items-end gap-1 h-10 mb-8">
                        <div *ngFor="let b of audioBars"
                            class="w-1.5 bg-red-400 rounded-full transition-all duration-150"
                            [style.height]="b + 'px'"></div>
                    </div>
                    <p-button label="Arrêter l'enregistrement"
                        icon="pi pi-stop-circle" severity="danger" size="large"
                        (onClick)="stopRecording()" />
                </div>

                <!-- Audio enregistré -->
                <div *ngIf="audioUrl && !isRecording" class="flex flex-col gap-4">
                    <div class="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950
                                rounded-xl border border-green-200 dark:border-green-800">
                        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl
                                    flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-check-circle text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <div class="font-bold text-green-800 dark:text-green-200">
                                Témoignage enregistré
                            </div>
                            <div class="text-sm text-green-600 dark:text-green-400
                                        flex items-center gap-2 mt-0.5">
                                <i class="pi pi-clock text-xs"></i>
                                Durée : {{ formatDuration(recordingDuration) }}
                            </div>
                        </div>
                    </div>

                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                                border border-surface-100 dark:border-surface-600">
                        <div class="text-xs text-surface-400 uppercase tracking-wide
                                    mb-3 flex items-center gap-2">
                            <i class="pi pi-volume-up"></i>
                            Écoute du témoignage
                        </div>
                        <audio [src]="audioUrl" controls class="w-full"
                            style="height:40px;"></audio>
                    </div>

                    <div class="grid grid-cols-3 gap-3">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl
                                    text-center border border-surface-100 dark:border-surface-600">
                            <div class="text-lg font-bold text-primary-600">
                                {{ formatDuration(recordingDuration) }}
                            </div>
                            <div class="text-xs text-surface-400 mt-0.5">Durée</div>
                        </div>
                        <div class="p-3 bg-green-50 dark:bg-green-950 rounded-xl
                                    text-center border border-green-100 dark:border-green-900">
                            <div class="text-lg font-bold text-green-600">WebM</div>
                            <div class="text-xs text-surface-400 mt-0.5">Format</div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl
                                    text-center border border-surface-100 dark:border-surface-600">
                            <div class="text-lg font-bold text-surface-700 dark:text-surface-200">
                                {{ formatSize(audioBlob?.size || 0) }}
                            </div>
                            <div class="text-xs text-surface-400 mt-0.5">Taille</div>
                        </div>
                    </div>

                    <p-button label="Recommencer l'enregistrement"
                        icon="pi pi-refresh" severity="secondary" outlined
                        styleClass="w-full" (onClick)="deleteAudio()" />
                </div>
            </div>
        </div>

        <!-- ── Constitution du dossier ─────────────────────── -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl border
                    border-surface-100 dark:border-surface-700 overflow-hidden">

            <div class="px-6 py-4 border-b border-surface-100 dark:border-surface-700
                        flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <i class="pi pi-file-edit text-amber-600 text-sm"></i>
                </div>
                <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                    Constitution du dossier
                </h3>
            </div>

            <div class="p-6 flex flex-col gap-4">

                <!-- Avertissement audio manquant -->
                <div *ngIf="!audioUrl"
                    class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950
                           rounded-xl border border-amber-200 dark:border-amber-800">
                    <i class="pi pi-exclamation-triangle text-amber-500 flex-shrink-0"></i>
                    <p class="text-sm text-amber-700 dark:text-amber-300">
                        Enregistrez d'abord le témoignage audio.
                    </p>
                </div>

                <!-- Type + Canal -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-surface-600
                                      dark:text-surface-300 uppercase tracking-wide">
                            Type *
                        </label>
                        <p-select [formControl]="f['type']"
                            [options]="typeOptions" optionLabel="label"
                            optionValue="value" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-surface-600
                                      dark:text-surface-300 uppercase tracking-wide">
                            Canal
                        </label>
                        <p-select [formControl]="f['submissionMode']"
                            [options]="modeOptions" optionLabel="label"
                            optionValue="value" styleClass="w-full" />
                    </div>
                </div>

                <!-- Objet -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-semibold text-surface-600
                                  dark:text-surface-300 uppercase tracking-wide">
                        Objet *
                    </label>
                    <input pInputText [formControl]="f['object']"
                        placeholder="Résumé de la dénonciation..."
                        class="w-full" />
                    <small *ngIf="f['object'].invalid && f['object'].touched"
                        class="text-red-500 text-xs">Champ obligatoire</small>
                </div>

                <!-- Description / Transcription -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-semibold text-surface-600
                                  dark:text-surface-300 uppercase tracking-wide">
                        Transcription / Résumé *
                    </label>
                    <textarea pTextarea [formControl]="f['description']"
                        placeholder="Transcrivez ou résumez le témoignage oral..."
                        rows="3" class="w-full resize-none"></textarea>
                    <div class="flex justify-between">
                        <small *ngIf="f['description'].invalid && f['description'].touched"
                            class="text-red-500 text-xs">Champ obligatoire</small>
                        <small class="text-surface-400 text-xs ml-auto">
                            {{ f['description'].value?.length || 0 }} caractères
                        </small>
                    </div>
                </div>

                <!-- Lieu + Date des faits -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-surface-600
                                      dark:text-surface-300 uppercase tracking-wide">
                            Lieu des faits
                        </label>
                        <input pInputText [formControl]="f['incidentLocation']"
                            placeholder="Ex: Mairie de Koudougou"
                            class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-surface-600
                                      dark:text-surface-300 uppercase tracking-wide">
                            Date des faits
                        </label>
                        <p-datepicker [formControl]="f['incidentDate']"
                            dateFormat="dd/mm/yy"
                            [maxDate]="today"
                            placeholder="jj/mm/aaaa"
                            styleClass="w-full"
                            appendTo="body" />
                    </div>
                </div>

                <!-- Montant estimé -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-semibold text-surface-600
                                  dark:text-surface-300 uppercase tracking-wide">
                        Montant estimé du préjudice (FCFA)
                        <span class="font-normal text-surface-400 normal-case ml-1">
                            optionnel
                        </span>
                    </label>
                    <input pInputText [formControl]="f['estimatedLoss']"
                        type="number" placeholder="Ex: 5000000"
                        class="w-full" />
                </div>

                <!-- Déclarant -->
                <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4
                            border border-surface-100 dark:border-surface-600">
                    <h4 class="text-xs font-semibold text-surface-500 uppercase
                               tracking-wide mb-3 flex items-center gap-2">
                        <i class="pi pi-user text-surface-400"></i>
                        Déclarant
                        <span class="font-normal normal-case text-surface-400">
                            (optionnel)
                        </span>
                    </h4>
                    <div class="grid grid-cols-2 gap-3">
                        <input pInputText [formControl]="fd['firstName']"
                            placeholder="Prénom" class="w-full text-sm" />
                        <input pInputText [formControl]="fd['lastName']"
                            placeholder="Nom" class="w-full text-sm" />
                        <input pInputText [formControl]="fd['phoneNumber']"
                            placeholder="Téléphone" class="w-full text-sm" />
                        <input pInputText [formControl]="fd['commune']"
                            placeholder="Commune" class="w-full text-sm" />
                    </div>
                    <!-- Consentement -->
                    <label class="flex items-start gap-2 mt-3 cursor-pointer">
                        <input type="checkbox" [formControl]="fd['dataProcessingConsent']"
                            class="mt-0.5 flex-shrink-0" />
                        <span class="text-xs text-surface-500 leading-relaxed">
                            Le déclarant consent au traitement de ses données personnelles
                            dans le cadre de cette procédure anti-corruption.
                        </span>
                    </label>
                </div>

                <!-- Bouton créer -->
                <p-button
                    label="Créer le dossier avec audio"
                    icon="pi pi-save"
                    [loading]="submitting"
                    [disabled]="!audioUrl || dossierForm.invalid"
                    styleClass="w-full justify-center"
                    (onClick)="createDossier()" />

                <div *ngIf="!audioUrl"
                    class="text-center text-xs text-surface-400
                           flex items-center justify-center gap-1">
                    <i class="pi pi-microphone text-xs"></i>
                    Enregistrement audio requis avant de soumettre
                </div>

            </div>
        </div>
    </div>
</div>
    `
})
export class DossierAudio implements OnDestroy {

    private fb                = inject(FormBuilder);
    private dossierService    = inject(DossierService);
    private attachmentService = inject(AttachmentService);
    private router            = inject(Router);
    private messageService    = inject(MessageService);

    readonly MAX_DURATION_SECONDS = MAX_DURATION_SECONDS;
    today = new Date();

    isRecording       = false;
    audioBlob: Blob | null  = null;
    audioUrl:  string | null = null;
    mediaRecorder: MediaRecorder | null = null;
    recordingDuration = 0;
    recordingTimer:  any = null;
    submitting        = false;
    createdDossier:   any = null;

    audioBars: number[] = Array(12).fill(10);
    barsTimer: any = null;

    private boundUnload = this.onBeforeUnload.bind(this);

    dossierForm = this.fb.group({
        type:             ['DENUNCIATION', Validators.required],
        object:           ['', Validators.required],
        description:      ['', Validators.required],
        submissionMode:   ['AUDIO_COUNTER'],
        incidentLocation: [''],
        incidentDate:     [null as Date | null],
        estimatedLoss:    [null as number | null]
    });

    declarantForm = this.fb.group({
        firstName:             [''],
        lastName:              [''],
        phoneNumber:           [''],
        commune:               [''],
        anonymous:             [false],
        dataProcessingConsent: [true],
        notificationsAccepted: [true],
        protectionRequested:   [false]
    });

    get f()  { return this.dossierForm.controls;   }
    get fd() { return this.declarantForm.controls; }

    readonly typeOptions = [
        { label: 'Dénonciation', value: 'DENUNCIATION' },
        { label: 'Plainte',      value: 'COMPLAINT'    },
        { label: 'Anonyme',      value: 'ANONYMOUS'    }
    ];

    readonly modeOptions = [
        { label: 'Comptoir Audio', value: 'AUDIO_COUNTER' },
        { label: 'Téléphone',      value: 'PHONE'         },
        { label: 'Numéro Vert',    value: 'GREEN_NUMBER'  }
    ];

    ngOnDestroy(): void {
        clearInterval(this.recordingTimer);
        clearInterval(this.barsTimer);
        window.removeEventListener('beforeunload', this.boundUnload);
        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.stop();
        }
    }

    private onBeforeUnload(e: BeforeUnloadEvent): void {
        if (this.isRecording || this.audioUrl) {
            e.preventDefault();
        }
    }



    async startRecording(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            this.mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(chunks, { type: 'audio/webm' });
                this.audioUrl  = URL.createObjectURL(this.audioBlob);
                stream.getTracks().forEach(t => t.stop());
                this.stopBarsAnimation();
                window.removeEventListener('beforeunload', this.boundUnload);
            };

            this.mediaRecorder.start();
            this.isRecording       = true;
            this.recordingDuration = 0;

            window.addEventListener('beforeunload', this.boundUnload);

            this.recordingTimer = setInterval(() => {
                this.recordingDuration++;
              
                if (this.recordingDuration >= MAX_DURATION_SECONDS) {
                    this.stopRecording();
                    this.messageService.add({
                        severity: 'warn',
                        summary:  'Durée maximale atteinte',
                        detail:   'L\'enregistrement a été arrêté automatiquement (10 min)'
                    });
                }
            }, 1000);

            this.startBarsAnimation();

        } catch {
            this.messageService.add({
                severity: 'error',
                summary:  'Microphone',
                detail:   'Impossible d\'accéder au microphone'
            });
        }
    }

    stopRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        this.isRecording = false;
        clearInterval(this.recordingTimer);
    }

    deleteAudio(): void {
        if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
        this.audioBlob         = null;
        this.audioUrl          = null;
        this.recordingDuration = 0;
    }

    private startBarsAnimation(): void {
        this.barsTimer = setInterval(() => {
            this.audioBars = Array(12).fill(0).map(
                () => Math.floor(Math.random() * 32) + 8
            );
        }, 120);
    }

    private stopBarsAnimation(): void {
        clearInterval(this.barsTimer);
        this.audioBars = Array(12).fill(10);
    }


    createDossier(): void {
        if (!this.audioBlob || this.dossierForm.invalid) {
            this.dossierForm.markAllAsTouched();
            return;
        }

        this.submitting = true;

        const incidentDate = this.f['incidentDate'].value as Date | null;

        const request = {
            type:             this.f['type'].value as any,
            submissionMode:   this.f['submissionMode'].value as any,
            object:           this.f['object'].value!,
            description:      this.f['description'].value || undefined,
            incidentLocation: this.f['incidentLocation'].value || undefined,
            incidentDate:     incidentDate ? incidentDate.toISOString().split('T')[0] : undefined,
            estimatedLoss:    this.f['estimatedLoss'].value || undefined,
            declarantData: {
                typeDeclarant:         'CITIZEN' as any,
                firstName:             this.fd['firstName'].value  || undefined,
                lastName:              this.fd['lastName'].value   || undefined,
                phoneNumber:           this.fd['phoneNumber'].value || undefined,
                commune:               this.fd['commune'].value    || undefined,
                anonymous:             false,
                dataProcessingConsent: !!this.fd['dataProcessingConsent'].value,
                notificationsAccepted: true,
                protectionRequested:   false
            }
        };

        this.dossierService.create(request).subscribe({
            next: dossier => {
                const audioFile = new File(
                    [this.audioBlob!],
                    `temoignage_${Date.now()}.webm`,
                    { type: 'audio/webm' }
                );
                this.attachmentService.upload(dossier.id, [audioFile]).subscribe({
                    next: () => {
                        this.submitting     = false;
                        this.createdDossier = dossier;
                        window.removeEventListener('beforeunload', this.boundUnload);
                    },
                    error: () => {
                        
                        this.submitting     = false;
                        this.createdDossier = dossier;
                        this.messageService.add({
                            severity: 'warn',
                            summary:  'Dossier créé',
                            detail:   'L\'audio n\'a pas pu être joint automatiquement'
                        });
                    }
                });
            },
            error: err => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   err.error?.message || 'Erreur lors de la création'
                });
            }
        });
    }


    goToDossier(): void {
        this.router.navigate(['/app/dossiers', this.createdDossier.id]);
    }

    printB4(): void {
        window.print();
    }


    formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    formatSize(bytes: number): string {
        if (bytes < 1024)        return bytes + ' o';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
        return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    }
}