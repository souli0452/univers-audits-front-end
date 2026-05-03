import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';

@Component({
    selector: 'app-dossier-audio',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ReactiveFormsModule, ButtonModule, SelectModule,
        InputTextModule, TextareaModule, ToastModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <!-- ── En-tête ─────────────────────────────────────────── -->
    <div class="flex items-center gap-4">
        <p-button icon="pi pi-arrow-left" severity="secondary"
            text routerLink="/app/dossiers" />
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Dénonciation Audio
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Enregistrez le témoignage oral puis constituez le dossier
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- ── Enregistrement ──────────────────────────────── -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden">

            <div class="px-6 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center gap-2">
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
                    <div class="w-32 h-32 bg-primary-50 dark:bg-primary-950 rounded-full flex items-center justify-center mb-6 border-4 border-primary-100 dark:border-primary-900">
                        <i class="pi pi-microphone text-primary-500 text-5xl"></i>
                    </div>
                    <h4 class="font-bold text-xl text-surface-900 dark:text-surface-0 mb-2">
                        Prêt à enregistrer
                    </h4>
                    <p class="text-surface-400 text-sm text-center mb-8 max-w-xs">
                        Invitez le déclarant à s'exprimer, puis démarrez l'enregistrement
                    </p>
                    <p-button label="Démarrer l'enregistrement"
                        icon="pi pi-microphone" size="large"
                        (onClick)="startRecording()" />
                    <div class="mt-4 flex items-center gap-2 text-xs text-surface-400">
                        <i class="pi pi-lock text-xs"></i>
                        Enregistrement local — aucune donnée transmise
                    </div>
                </div>

                <!-- En cours d'enregistrement -->
                <div *ngIf="isRecording" class="flex flex-col items-center py-8">

                    <!-- Cercle animé -->
                    <div class="relative mb-6">
                        <div class="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <i class="pi pi-microphone text-white text-4xl"></i>
                        </div>
                        <div class="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-30"></div>
                    </div>

                    <!-- Durée -->
                    <div class="text-5xl font-bold font-mono text-red-500 mb-2">
                        {{ formatDuration(recordingDuration) }}
                    </div>
                    <div class="flex items-center gap-2 text-red-400 text-sm mb-2">
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Enregistrement en cours...
                    </div>

                    <!-- Barres audio animées -->
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

                    <!-- Succès -->
                    <div class="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800">
                        <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-check-circle text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <div class="font-bold text-green-800 dark:text-green-200">
                                Témoignage enregistré
                            </div>
                            <div class="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 mt-0.5">
                                <i class="pi pi-clock text-xs"></i>
                                Durée : {{ formatDuration(recordingDuration) }}
                            </div>
                        </div>
                    </div>

                    <!-- Player -->
                    <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-100 dark:border-surface-600">
                        <div class="text-xs text-surface-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <i class="pi pi-volume-up"></i>
                            Écoute du témoignage
                        </div>
                        <audio [src]="audioUrl" controls
                            class="w-full" style="height: 40px;">
                        </audio>
                    </div>

                    <!-- Qualité -->
                    <div class="grid grid-cols-3 gap-3">
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl text-center border border-surface-100 dark:border-surface-600">
                            <div class="text-lg font-bold text-primary-600">
                                {{ formatDuration(recordingDuration) }}
                            </div>
                            <div class="text-xs text-surface-400 mt-0.5">Durée</div>
                        </div>
                        <div class="p-3 bg-green-50 dark:bg-green-950 rounded-xl text-center border border-green-100 dark:border-green-900">
                            <div class="text-lg font-bold text-green-600">WebM</div>
                            <div class="text-xs text-surface-400 mt-0.5">Format</div>
                        </div>
                        <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl text-center border border-surface-100 dark:border-surface-600">
                            <div class="text-lg font-bold text-surface-700 dark:text-surface-200">
                                {{ formatSize(audioBlob?.size || 0) }}
                            </div>
                            <div class="text-xs text-surface-400 mt-0.5">Taille</div>
                        </div>
                    </div>

                    <!-- Action -->
                    <p-button label="Recommencer l'enregistrement"
                        icon="pi pi-refresh" severity="secondary" outlined
                        styleClass="w-full" (onClick)="deleteAudio()" />

                </div>
            </div>
        </div>

        <!-- ── Constitution du dossier ─────────────────────── -->
        <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden">

            <div class="px-6 py-4 border-b border-surface-100 dark:border-surface-700 flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <i class="pi pi-file-edit text-amber-600 text-sm"></i>
                </div>
                <h3 class="font-semibold text-surface-900 dark:text-surface-0">
                    Constitution du dossier
                </h3>
            </div>

            <div class="p-6 flex flex-col gap-5">

                <!-- Statut audio requis -->
                <div *ngIf="!audioUrl"
                    class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800">
                    <i class="pi pi-exclamation-triangle text-amber-500"></i>
                    <p class="text-sm text-amber-700 dark:text-amber-300">
                        Veuillez d'abord enregistrer le témoignage audio.
                    </p>
                </div>

                <!-- Objet -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">
                        Objet de la dénonciation *
                    </label>
                    <input pInputText [formControl]="f['object']"
                        placeholder="Résumé de la dénonciation..."
                        class="w-full" />
                    <small *ngIf="f['object'].invalid && f['object'].touched"
                        class="text-red-500 text-xs">
                        Champ obligatoire
                    </small>
                </div>

                <!-- Description -->
                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">
                        Description / Transcription *
                    </label>
                    <textarea pTextarea [formControl]="f['description']"
                        placeholder="Transcrivez ou résumez le témoignage oral..."
                        rows="4" class="w-full resize-none">
                    </textarea>
                    <div class="flex justify-end">
                        <small class="text-surface-400 text-xs">
                            {{ f['description'].value?.length || 0 }} caractères
                        </small>
                    </div>
                </div>

                <!-- Canal + Lieu -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">
                            Canal
                        </label>
                        <p-select [formControl]="f['submissionMode']"
                            [options]="modeOptions" optionLabel="label"
                            optionValue="value" styleClass="w-full" />
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">
                            Lieu des faits
                        </label>
                        <div class="flex items-center gap-2 border border-surface-200 dark:border-surface-600 rounded-lg px-3">
                            <i class="pi pi-map-marker text-surface-300 text-sm"></i>
                            <input pInputText [formControl]="f['incidentLocation']"
                                placeholder="Lieu..."
                                class="flex-1 border-none shadow-none outline-none bg-transparent py-2 text-sm" />
                        </div>
                    </div>
                </div>

                <!-- Déclarant -->
                <div class="bg-surface-50 dark:bg-surface-700 rounded-xl p-4 border border-surface-100 dark:border-surface-600">
                    <h4 class="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-3 flex items-center gap-2">
                        <i class="pi pi-user text-surface-400"></i>
                        Informations du déclarant
                        <span class="text-surface-400 font-normal">(optionnel)</span>
                    </h4>
                    <div class="grid grid-cols-2 gap-3">
                        <input pInputText [formControl]="fd['firstName']"
                            placeholder="Prénom" class="w-full text-sm" />
                        <input pInputText [formControl]="fd['lastName']"
                            placeholder="Nom" class="w-full text-sm" />
                        <div class="flex items-center gap-2 border border-surface-200 dark:border-surface-500 rounded-lg px-3">
                            <i class="pi pi-phone text-surface-300 text-xs"></i>
                            <input pInputText [formControl]="fd['phoneNumber']"
                                placeholder="Téléphone"
                                class="flex-1 border-none shadow-none outline-none bg-transparent py-2 text-sm" />
                        </div>
                        <input pInputText [formControl]="fd['commune']"
                            placeholder="Commune" class="w-full text-sm" />
                    </div>
                </div>

                <!-- Bouton créer -->
                <div class="pt-2">
                    <p-button
                        label="Créer le dossier avec audio"
                        icon="pi pi-save"
                        [loading]="submitting"
                        [disabled]="!audioUrl || dossierForm.invalid"
                        styleClass="w-full"
                        (onClick)="createDossier()" />

                    <div *ngIf="!audioUrl"
                        class="text-center text-xs text-surface-400 mt-2 flex items-center justify-center gap-1">
                        <i class="pi pi-microphone text-xs"></i>
                        Enregistrement audio requis avant de soumettre
                    </div>
                </div>

            </div>
        </div>

    </div>
</div>
    `
})
export class DossierAudio {

    private fb                = inject(FormBuilder);
    private dossierService    = inject(DossierService);
    private attachmentService = inject(AttachmentService);
    private router            = inject(Router);
    private messageService    = inject(MessageService);

    isRecording      = false;
    audioBlob: Blob | null   = null;
    audioUrl: string | null  = null;
    mediaRecorder: MediaRecorder | null = null;
    recordingDuration = 0;
    recordingTimer: any = null;
    submitting       = false;

    // Barres audio animées
    audioBars: number[] = Array(12).fill(10);
    barsTimer: any = null;

    dossierForm = this.fb.group({
        object:           ['', Validators.required],
        description:      ['', Validators.required],
        submissionMode:   ['AUDIO_COUNTER'],
        incidentLocation: ['']
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

    modeOptions = [
        { label: 'Comptoir Audio', value: 'AUDIO_COUNTER' },
        { label: 'Téléphone',      value: 'PHONE'         },
        { label: 'Numéro Vert',    value: 'GREEN_NUMBER'  }
    ];

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
            };

            this.mediaRecorder.start();
            this.isRecording      = true;
            this.recordingDuration = 0;

            this.recordingTimer = setInterval(() => {
                this.recordingDuration++;
            }, 1000);

            this.startBarsAnimation();

        } catch {
            this.messageService.add({
                severity: 'error',
                summary:  'Microphone',
                detail:   "Impossible d'accéder au microphone"
            });
        }
    }

    stopRecording(): void {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            clearInterval(this.recordingTimer);
        }
    }

    deleteAudio(): void {
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

    createDossier(): void {
        if (!this.audioBlob || this.dossierForm.invalid) {
            this.dossierForm.markAllAsTouched();
            return;
        }

        this.submitting = true;

        const request = {
            type:             'DENUNCIATION' as any,
            submissionMode:   this.f['submissionMode'].value as any,
            object:           this.f['object'].value!,
            description:      this.f['description'].value || undefined,
            incidentLocation: this.f['incidentLocation'].value || undefined,
            declarantData: {
                typeDeclarant:         'CITIZEN' as any,
                firstName:             this.fd['firstName'].value  || undefined,
                lastName:              this.fd['lastName'].value   || undefined,
                phoneNumber:           this.fd['phoneNumber'].value || undefined,
                commune:               this.fd['commune'].value    || undefined,
                anonymous:             false,
                dataProcessingConsent: true,
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
                        this.submitting = false;
                        this.messageService.add({
                            severity: 'success',
                            summary:  'Dossier créé',
                            detail:   `Code d'accès B4 : ${dossier.accessCode}`,
                            life:     3000
                        });
                        setTimeout(() => {
                            this.router.navigate(['/app/dossiers', dossier.id]);
                        }, 2000);
                    },
                    error: () => {
                        this.submitting = false;
                        this.router.navigate(['/app/dossiers', dossier.id]);
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
}