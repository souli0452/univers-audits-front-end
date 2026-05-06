import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';

@Component({
    selector: 'app-portail-vocal',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, InputTextModule, ToastModule,
        DialogModule, TagModule, DividerModule, MessageModule
    ],
    providers: [MessageService],
    styles: [`
        @keyframes pulse-ring {
            0%   { transform: scale(1);    opacity: .6; }
            100% { transform: scale(1.55); opacity: 0;  }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes bars  { 0%,100%{height:8px} 50%{height:28px} }
        @keyframes slide-up {
            from { opacity:0; transform: translateY(16px); }
            to   { opacity:1; transform: translateY(0);    }
        }

        :host { display:block; font-family: var(--font-family); }

        .page-wrapper {
            min-height: 100vh;
            background: linear-gradient(160deg, #f0fdf4 0%, #f8fafc 60%);
        }

        .top-nav {
            height: 56px;
            background: #16a34a;
            padding: 0 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,.15);
        }
        .nav-left { display:flex; align-items:center; gap:.75rem; }
        .nav-logo  {
            width:34px; height:34px; border-radius:50%;
            overflow:hidden; background:#fff;
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0;
        }
        .nav-logo img { width:100%; height:100%; object-fit:contain; }
        .nav-brand {
            font-weight:900; font-size:.95rem;
            letter-spacing:1.5px; color:#fff;
        }

        .content { max-width:560px; margin:0 auto; padding:1.5rem 1rem 3rem; }

        .page-header { text-align:center; margin-bottom:2rem; animation: slide-up .5s ease; }
        .header-icon {
            width:96px; height:96px; border-radius:50%;
            background: linear-gradient(135deg, #16a34a, #22c55e);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1rem; box-shadow:0 8px 24px rgba(22,163,74,.3);
        }
        .header-icon i { font-size:3rem; color:#fff; }
        .page-title {
            font-size:1.75rem; font-weight:900;
            color:#111827; margin-bottom:.5rem;
        }
        .page-subtitle {
            color:#6b7280; font-size:.9rem; line-height:1.7;
        }

        .steps-bar {
            display:flex; align-items:center;
            justify-content:center; gap:6px;
            margin-bottom:1.75rem;
        }
        .step-dot {
            width:40px; height:40px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-weight:800; font-size:.875rem;
            border:2.5px solid #e5e7eb;
            background:#fff; color:#9ca3af;
            transition:all .3s;
        }
        .step-dot.active {
            background:#16a34a; border-color:#16a34a;
            color:#fff; box-shadow:0 0 0 5px rgba(22,163,74,.15);
        }
        .step-dot.done {
            background:#22c55e; border-color:#22c55e; color:#fff;
        }
        .step-line {
            width:40px; height:3px; border-radius:2px;
            background:#e5e7eb; transition:background .3s;
        }
        .step-line.done { background:#22c55e; }

        .step-card {
            background:#fff; border-radius:20px;
            padding:1.75rem; border:1px solid #f0fdf4;
            box-shadow:0 4px 24px rgba(0,0,0,.06);
            animation: slide-up .3s ease;
        }
        .step-card-title {
            text-align:center; font-size:1.05rem;
            font-weight:800; color:#111827;
            margin-bottom:1.5rem;
            display:flex; align-items:center;
            justify-content:center; gap:.5rem;
        }

        .record-idle {
            text-align:center; padding:2.5rem 1.5rem;
            border-radius:16px; border:2.5px dashed #86efac;
            background:#f0fdf4; margin-bottom:1.5rem;
        }
        .idle-icon {
            width:96px; height:96px; border-radius:50%;
            background:linear-gradient(135deg,#16a34a,#22c55e);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1.25rem;
            box-shadow:0 8px 20px rgba(22,163,74,.25);
        }
        .idle-icon i { font-size:2.75rem; color:#fff; }

        .record-active {
            text-align:center; padding:2rem 1.5rem;
            border-radius:16px; border:2.5px solid #ef4444;
            background:#fff5f5; margin-bottom:1.5rem;
        }
        .pulse-wrap { position:relative; display:inline-block; margin-bottom:1rem; }
        .pulse-ring {
            position:absolute; inset:-12px; border-radius:50%;
            border:3px solid #ef4444;
            animation:pulse-ring 1.4s ease-out infinite;
        }
        .active-icon {
            width:88px; height:88px; border-radius:50%;
            background:#ef4444; display:flex;
            align-items:center; justify-content:center;
            position:relative; z-index:1;
        }
        .active-icon i { font-size:2.5rem; color:#fff; }
        .chrono {
            font-family:monospace; font-size:3.5rem;
            font-weight:900; color:#dc2626;
            line-height:1; margin-bottom:.75rem;
        }
        .rec-badge {
            display:inline-flex; align-items:center; gap:8px;
            background:#fee2e2; border-radius:20px;
            padding:5px 16px; margin-bottom:1.25rem;
        }
        .rec-dot {
            width:9px; height:9px; border-radius:50%;
            background:#ef4444; animation:blink 1s infinite;
        }
        .rec-label {
            color:#b91c1c; font-weight:900;
            font-size:.8rem; letter-spacing:2px;
        }

        .bars-row {
            display:flex; align-items:flex-end;
            gap:4px; height:36px; justify-content:center;
            margin-bottom:1.25rem;
        }
        .bar {
            width:5px; background:#ef4444;
            border-radius:3px; min-height:5px;
            transition:height .12s ease;
        }

        .audio-done {
            display:flex; align-items:center; gap:1rem;
            padding:.875rem 1rem; border-radius:14px;
            background:#f0fdf4; border:1.5px solid #86efac;
            margin-bottom:.75rem;
        }
        .done-icon {
            width:48px; height:48px; border-radius:12px;
            background:#22c55e; display:flex;
            align-items:center; justify-content:center; flex-shrink:0;
        }
        .done-icon i { color:#fff; font-size:1.25rem; }

        .photos-grid {
            display:grid; grid-template-columns:repeat(3,1fr); gap:8px;
        }
        .photo-thumb { position:relative; }
        .photo-thumb img {
            width:100%; height:90px; object-fit:cover;
            border-radius:10px; border:1.5px solid #e5e7eb;
        }
        .photo-remove {
            position:absolute; top:4px; right:4px;
            width:22px; height:22px; border-radius:50%;
            background:#ef4444; color:#fff; border:none;
            cursor:pointer; font-size:14px;
            display:flex; align-items:center; justify-content:center;
        }

        .phone-hero { text-align:center; margin-bottom:1.5rem; }
        .phone-icon {
            width:80px; height:80px; border-radius:50%;
            background:linear-gradient(135deg,#0ea5e9,#38bdf8);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1rem;
            box-shadow:0 8px 20px rgba(14,165,233,.25);
        }
        .phone-icon i { font-size:2.25rem; color:#fff; }

        .recap-item {
            display:flex; align-items:center; gap:.875rem;
            padding:.875rem 1rem; border-radius:14px;
            border:1.5px solid #e5e7eb; background:#f9fafb;
            transition:all .2s;
        }
        .recap-item.ok   { background:#f0fdf4; border-color:#86efac; }
        .recap-item.info { background:#eff6ff; border-color:#93c5fd; }
        .recap-icon {
            width:42px; height:42px; border-radius:12px;
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0;
        }
        .recap-title { font-weight:700; font-size:.875rem; color:#111827; }
        .recap-sub   { font-size:.775rem; color:#6b7280; margin-top:2px; }

        .step-footer {
            display:flex; justify-content:space-between;
            align-items:center; gap:.75rem;
            margin-top:1.5rem; flex-wrap:wrap;
        }
        .footer-right { display:flex; gap:.5rem; align-items:center; }

        .success-wrap { padding:.5rem; text-align:center; }
        .success-icon-wrap {
            width:88px; height:88px; border-radius:50%;
            background:linear-gradient(135deg,#16a34a,#22c55e);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1.25rem;
            box-shadow:0 8px 24px rgba(22,163,74,.3);
        }
        .success-icon-wrap i { font-size:2.75rem; color:#fff; }
        .code-box {
            background:linear-gradient(135deg,#f0fdf4,#dcfce7);
            border:2px solid #86efac; border-radius:16px;
            padding:1.25rem; margin:1.25rem 0;
        }
        .code-label {
            font-size:.65rem; font-weight:900; color:#16a34a;
            letter-spacing:2px; text-transform:uppercase; margin-bottom:.5rem;
        }
        .code-value {
            font-family:monospace; font-size:2.5rem;
            font-weight:900; color:#166534; letter-spacing:6px;
        }
        .code-hint { font-size:.75rem; color:#15803d; margin-top:.5rem; }

        .page-foot {
            text-align:center; margin-top:2rem;
            color:#9ca3af; font-size:.75rem;
        }

        @media (max-width:600px) {
            .step-footer { flex-direction:column; align-items:stretch; }
            .footer-right { justify-content:flex-end; }
        }
    `],
    template: `
<p-toast />

<!-- ── Dialog succès ──────────────────────────────────────── -->
<p-dialog
    [(visible)]="showSuccess"
    header=" "
    [modal]="true"
    [closable]="false"
    [style]="{width:'360px'}">

    <div class="success-wrap">
        <div class="success-icon-wrap">
            <i class="pi pi-check-circle"></i>
        </div>
        <h3 style="font-size:1.4rem;font-weight:900;color:#111827;margin-bottom:.5rem;">
            Merci pour votre témoignage !
        </h3>
        <p style="font-size:.875rem;color:#6b7280;line-height:1.7;margin-bottom:0;">
            Un agent va écouter votre message<br>et créer votre dossier officiel.
        </p>

        <div class="code-box">
            <div class="code-label">Votre code de suivi</div>
            <div class="code-value">{{ createdAccessCode }}</div>
            <div class="code-hint">
                <i class="pi pi-camera" style="font-size:.75rem;"></i>
                Notez ce code ou prenez une photo de cet écran
            </div>
        </div>

        <p-message *ngIf="phoneNumber" severity="info"
            [text]="'SMS envoyé au ' + phoneNumber" styleClass="w-full" />
    </div>

    <ng-template pTemplate="footer">
        <div style="display:flex;gap:.5rem;justify-content:center;">
            <p-button label="Suivre mon dossier" icon="pi pi-search"
                severity="success"
                (onClick)="goToSuivi()" />
            <p-button label="Accueil" severity="secondary" outlined
                (onClick)="goToAccueil()" />
        </div>
    </ng-template>
</p-dialog>

<!-- ── Page ───────────────────────────────────────────────── -->
<div class="page-wrapper">

    <nav class="top-nav">
        <div class="nav-left">
            <p-button icon="pi pi-arrow-left" severity="contrast"
                text (onClick)="router.navigate(['/portail'])" />
            <div class="nav-logo">
                <img src="/assets/logo-integrite.png" alt="Intégrité+" />
            </div>
            <span class="nav-brand">INTÉGRITÉ+</span>
        </div>
        <p-button label="Suivre" icon="pi pi-search" severity="contrast"
            outlined size="small"
            (onClick)="router.navigate(['/portail/suivi'])" />
    </nav>

    <div class="content">

        <div class="page-header">
            <div class="header-icon">
                <i class="pi pi-microphone"></i>
            </div>
            <h1 class="page-title">Parlez, nous écoutons</h1>
            <p class="page-subtitle">
                Enregistrez votre témoignage.<br>
                Un agent va l'écouter et traiter votre dossier.
            </p>
        </div>

        <!-- Steps indicator -->
        <div class="steps-bar">
            <div class="step-dot"
                [class.active]="currentStep === 1"
                [class.done]="currentStep > 1">
                <i *ngIf="currentStep > 1" class="pi pi-check" style="font-size:.75rem;"></i>
                <span *ngIf="currentStep <= 1">1</span>
            </div>
            <div class="step-line" [class.done]="currentStep > 1"></div>
            <div class="step-dot"
                [class.active]="currentStep === 2"
                [class.done]="currentStep > 2">
                <i *ngIf="currentStep > 2" class="pi pi-check" style="font-size:.75rem;"></i>
                <span *ngIf="currentStep <= 2">2</span>
            </div>
            <div class="step-line" [class.done]="currentStep > 2"></div>
            <div class="step-dot" [class.active]="currentStep === 3">
                <span>3</span>
            </div>
        </div>

        <!-- ═══ Étape 1 ═══ -->
        <div *ngIf="currentStep === 1" class="step-card">

            <div class="step-card-title">
                <span style="background:#dcfce7;color:#16a34a;font-size:.7rem;
                    font-weight:900;padding:3px 10px;border-radius:20px;
                    letter-spacing:1px;">ÉTAPE 1</span>
                Enregistrez votre témoignage
            </div>

            <!-- Idle -->
            <div *ngIf="!audioUrl && !isRecording" class="record-idle">
                <div class="idle-icon">
                    <i class="pi pi-microphone"></i>
                </div>
                <p style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:.5rem;">
                    Appuyez pour parler
                </p>
                <p style="color:#6b7280;font-size:.85rem;margin-bottom:1.5rem;line-height:1.6;">
                    Parlez dans votre langue<br>Moore, Dioula, Fulfuldé…
                </p>
                <p-button label="COMMENCER À PARLER"
                    icon="pi pi-microphone" size="large"
                    (onClick)="startRecording()" />
            </div>

            <!-- En cours -->
            <div *ngIf="isRecording" class="record-active">
                <div class="pulse-wrap">
                    <div class="pulse-ring"></div>
                    <div class="active-icon">
                        <i class="pi pi-microphone"></i>
                    </div>
                </div>
                <div class="chrono">{{ formatDuration(recordingDuration) }}</div>
                <div class="rec-badge">
                    <span class="rec-dot"></span>
                    <span class="rec-label">REC</span>
                </div>
                <div class="bars-row">
                    <div *ngFor="let b of audioBars" class="bar"
                        [style.height]="b + 'px'"></div>
                </div>
                <p-button label="ARRÊTER" icon="pi pi-stop-circle"
                    severity="danger" size="large" (onClick)="stopRecording()" />
            </div>

            <!-- Enregistré -->
            <div *ngIf="audioUrl && !isRecording">
                <div class="audio-done">
                    <div class="done-icon">
                        <i class="pi pi-check"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:800;color:#166534;font-size:.9rem;">
                            Témoignage enregistré ✓
                        </div>
                        <div style="font-size:.8rem;color:#16a34a;margin-top:3px;">
                            <i class="pi pi-clock" style="font-size:.75rem;"></i>
                            Durée : {{ formatDuration(recordingDuration) }}
                        </div>
                    </div>
                    <span style="background:#dcfce7;color:#166534;font-size:.75rem;
                        font-weight:700;padding:4px 10px;border-radius:20px;">OK</span>
                </div>
                <audio [src]="audioUrl" controls
                    style="width:100%;margin-bottom:.75rem;border-radius:8px;"></audio>
                <p-button label="Recommencer" icon="pi pi-refresh"
                    severity="secondary" outlined (onClick)="deleteAudio()" />
            </div>

            <p-divider />

            <!-- Photos -->
            <div>
                <p style="font-weight:700;color:#111827;margin-bottom:.75rem;
                    display:flex;align-items:center;gap:8px;font-size:.875rem;">
                    <i class="pi pi-camera" style="color:#16a34a;"></i>
                    Ajouter des preuves
                    <span style="background:#f3f4f6;color:#6b7280;font-size:.7rem;
                        padding:2px 8px;border-radius:12px;font-weight:600;">
                        Optionnel
                    </span>
                </p>
                <div style="display:flex;gap:.75rem;margin-bottom:1rem;">
                    <input #cameraInput type="file" accept="image/*"
                        capture="user" style="display:none;"
                        (change)="onPhotoSelect($event)" />
                    <p-button label="Photo" icon="pi pi-camera"
                        severity="secondary" outlined styleClass="flex-1"
                        (onClick)="cameraInput.click()" />
                    <input #galleryInput type="file"
                        accept="image/*,video/*,.pdf" multiple
                        style="display:none;" (change)="onFileSelect($event)" />
                    <p-button label="Galerie" icon="pi pi-images"
                        severity="secondary" outlined styleClass="flex-1"
                        (onClick)="galleryInput.click()" />
                </div>
                <div *ngIf="photos.length > 0" class="photos-grid">
                    <div *ngFor="let photo of photos; let i = index"
                        class="photo-thumb">
                        <img [src]="getPhotoPreview(photo)" alt="Photo" />
                        <button class="photo-remove" (click)="removePhoto(i)">×</button>
                    </div>
                </div>
            </div>

            <div class="step-footer">
                <span style="font-size:.78rem;color:#9ca3af;">
                    <i class="pi pi-info-circle"></i>
                    L'audio est obligatoire
                </span>
                <p-button label="Continuer" icon="pi pi-arrow-right"
                    iconPos="right" [disabled]="!audioUrl"
                    (onClick)="currentStep = 2" />
            </div>
        </div>

        <!-- ═══ Étape 2 ═══ -->
        <div *ngIf="currentStep === 2" class="step-card">

            <div class="step-card-title">
                <span style="background:#dbeafe;color:#1d4ed8;font-size:.7rem;
                    font-weight:900;padding:3px 10px;border-radius:20px;
                    letter-spacing:1px;">ÉTAPE 2</span>
                Votre numéro de téléphone
            </div>

            <div class="phone-hero">
                <div class="phone-icon">
                    <i class="pi pi-mobile"></i>
                </div>
                <p style="color:#6b7280;font-size:.875rem;line-height:1.7;
                    max-width:320px;margin:0 auto;">
                    Pour recevoir votre code de suivi par SMS.<br>
                    <strong style="color:#374151;">
                        Vous pouvez passer cette étape.
                    </strong>
                </p>
            </div>

            <div style="margin-bottom:1.25rem;">
                <label style="display:block;font-weight:700;color:#374151;
                    font-size:.875rem;margin-bottom:.5rem;">
                    <i class="pi pi-phone" style="color:#0ea5e9;margin-right:6px;"></i>
                    Numéro de téléphone
                </label>
                <input pInputText [(ngModel)]="phoneNumber"
                    placeholder="+226 XX XX XX XX" type="tel" class="w-full"
                    style="font-size:1.1rem;padding:.75rem;border-radius:12px;" />
            </div>

            <p-message severity="info"
                text="Votre numéro reste strictement confidentiel et ne sera pas partagé."
                styleClass="w-full" />

            <div class="step-footer">
                <p-button label="Retour" icon="pi pi-arrow-left"
                    severity="secondary" outlined (onClick)="currentStep = 1" />
                <div class="footer-right">
                    <p-button label="Passer" severity="secondary"
                        text (onClick)="currentStep = 3" />
                    <p-button label="Continuer" icon="pi pi-arrow-right"
                        iconPos="right" (onClick)="currentStep = 3" />
                </div>
            </div>
        </div>

        <!-- ═══ Étape 3 ═══ -->
        <div *ngIf="currentStep === 3" class="step-card">

            <div class="step-card-title">
                <span style="background:#fef9c3;color:#854d0e;font-size:.7rem;
                    font-weight:900;padding:3px 10px;border-radius:20px;
                    letter-spacing:1px;">ÉTAPE 3</span>
                Vérification et envoi
            </div>

            <div style="display:flex;flex-direction:column;gap:.625rem;margin-bottom:1.5rem;">

                <div class="recap-item" [class.ok]="audioUrl">
                    <div class="recap-icon"
                        [style.background]="audioUrl ? '#dcfce7' : '#f3f4f6'">
                        <i class="pi text-xl"
                            [class.pi-check-circle]="audioUrl"
                            [class.pi-times-circle]="!audioUrl"
                            [style.color]="audioUrl ? '#16a34a' : '#d1d5db'"></i>
                    </div>
                    <div style="flex:1;">
                        <div class="recap-title">Témoignage audio</div>
                        <div class="recap-sub">
                            {{ audioUrl
                                ? 'Enregistré — ' + formatDuration(recordingDuration)
                                : 'Manquant (obligatoire)' }}
                        </div>
                    </div>
                    <span [style.background]="audioUrl ? '#dcfce7' : '#fee2e2'"
                        [style.color]="audioUrl ? '#166534' : '#dc2626'"
                        style="font-size:.75rem;font-weight:700;
                            padding:4px 10px;border-radius:20px;">
                        {{ audioUrl ? 'OK' : 'Requis' }}
                    </span>
                </div>

                <div class="recap-item" [class.ok]="photos.length > 0">
                    <div class="recap-icon"
                        [style.background]="photos.length > 0 ? '#dcfce7' : '#f3f4f6'">
                        <i class="pi text-xl"
                            [class.pi-images]="photos.length > 0"
                            [class.pi-minus-circle]="photos.length === 0"
                            [style.color]="photos.length > 0 ? '#16a34a' : '#d1d5db'"></i>
                    </div>
                    <div style="flex:1;">
                        <div class="recap-title">Fichiers joints</div>
                        <div class="recap-sub">
                            {{ photos.length > 0
                                ? photos.length + ' fichier(s) sélectionné(s)'
                                : 'Aucun (optionnel)' }}
                        </div>
                    </div>
                    <span style="background:#f3f4f6;color:#6b7280;font-size:.75rem;
                        font-weight:700;padding:4px 10px;border-radius:20px;">
                        {{ photos.length > 0 ? photos.length + ' fichier(s)' : 'Aucun' }}
                    </span>
                </div>

                <div class="recap-item" [class.info]="phoneNumber">
                    <div class="recap-icon"
                        [style.background]="phoneNumber ? '#dbeafe' : '#f3f4f6'">
                        <i class="pi text-xl"
                            [class.pi-mobile]="phoneNumber"
                            [class.pi-minus-circle]="!phoneNumber"
                            [style.color]="phoneNumber ? '#2563eb' : '#d1d5db'"></i>
                    </div>
                    <div style="flex:1;">
                        <div class="recap-title">SMS de confirmation</div>
                        <div class="recap-sub">
                            {{ phoneNumber || 'Pas de numéro fourni (optionnel)' }}
                        </div>
                    </div>
                    <span [style.background]="phoneNumber ? '#dbeafe' : '#f3f4f6'"
                        [style.color]="phoneNumber ? '#1d4ed8' : '#9ca3af'"
                        style="font-size:.75rem;font-weight:700;
                            padding:4px 10px;border-radius:20px;">
                        {{ phoneNumber ? 'SMS prévu' : 'Ignoré' }}
                    </span>
                </div>

            </div>

            <p-message severity="success"
                text="Un agent va écouter votre témoignage et créer votre dossier officiel. Vous recevrez un code de suivi."
                styleClass="w-full" />

            <div class="step-footer" style="margin-top:1.25rem;">
                <p-button label="Retour" icon="pi pi-arrow-left"
                    severity="secondary" outlined (onClick)="currentStep = 2" />
                <p-button label="ENVOYER MON TÉMOIGNAGE"
                    icon="pi pi-send" severity="success"
                    [loading]="submitting" [disabled]="!audioUrl"
                    (onClick)="submit()" />
            </div>
        </div>

        <div class="page-foot">
            <i class="pi pi-shield"></i>
            ASCE-LC — Plateforme sécurisée — Burkina Faso
        </div>

    </div>
</div>
    `
})
export class PortailVocal {

    // ✅ Router public pour accès depuis le template
    router = inject(Router);

    private dossierService    = inject(DossierService);
    private attachmentService = inject(AttachmentService);
    private messageService    = inject(MessageService);

    currentStep       = 1;
    submitting        = false;
    showSuccess       = false;
    createdAccessCode = '';
    phoneNumber       = '';

    isRecording       = false;
    audioBlob:        Blob | null   = null;
    audioUrl:         string | null = null;
    mediaRecorder:    MediaRecorder | null = null;
    recordingDuration = 0;
    recordingTimer:   any = null;
    barsTimer:        any = null;
    audioBars:        number[] = Array(14).fill(8);

    photos:        File[]   = [];
    photoPreviews: string[] = [];

    // ── Navigation depuis le dialog ───────────────────────────

    goToSuivi(): void {
        this.showSuccess = false;
        setTimeout(() => this.router.navigate(['/portail/suivi']), 150);
    }

    goToAccueil(): void {
        this.showSuccess = false;
        setTimeout(() => this.router.navigate(['/portail']), 150);
    }

    // ── Enregistrement ────────────────────────────────────────

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
                this.stopBars();
            };

            this.mediaRecorder.start();
            this.isRecording       = true;
            this.recordingDuration = 0;
            this.recordingTimer    = setInterval(() => this.recordingDuration++, 1000);
            this.startBars();

        } catch {
            this.messageService.add({
                severity: 'error',
                summary:  'Microphone',
                detail:   "Veuillez autoriser l'accès au microphone"
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
        if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
        this.audioBlob         = null;
        this.audioUrl          = null;
        this.recordingDuration = 0;
    }

    private startBars(): void {
        this.barsTimer = setInterval(() => {
            this.audioBars = Array(14).fill(0).map(
                () => Math.floor(Math.random() * 28) + 5
            );
        }, 120);
    }

    private stopBars(): void {
        clearInterval(this.barsTimer);
        this.audioBars = Array(14).fill(8);
    }

    formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ── Photos ────────────────────────────────────────────────

    onPhotoSelect(event: any): void {
        this.addPhotos(Array.from(event.target.files));
    }
    onFileSelect(event: any): void {
        this.addPhotos(Array.from(event.target.files));
    }

    private addPhotos(files: File[]): void {
        files.forEach((f: File) => {
            if (this.photos.length < 10) {
                this.photos.push(f);
                const reader = new FileReader();
                reader.onload = e =>
                    this.photoPreviews.push(e.target?.result as string);
                reader.readAsDataURL(f);
            }
        });
    }

    getPhotoPreview(photo: File): string {
        return this.photoPreviews[this.photos.indexOf(photo)] || '';
    }

    removePhoto(index: number): void {
        this.photos.splice(index, 1);
        this.photoPreviews.splice(index, 1);
    }

    // ── Soumission ────────────────────────────────────────────

    submit(): void {
        if (!this.audioBlob) return;
        this.submitting = true;

        const request = {
            type:           'DENUNCIATION' as any,
            submissionMode: 'AUDIO_COUNTER' as any,
            object:         'Témoignage vocal en attente de traitement',
            description:    'Témoignage audio soumis via le portail citoyen.',
            declarantData: {
                typeDeclarant:         'CITIZEN' as any,
                phoneNumber:           this.phoneNumber || undefined,
                anonymous:             !this.phoneNumber,
                dataProcessingConsent: true,
                notificationsAccepted: true,
                protectionRequested:   false
            }
        };

        this.dossierService.submit(request).subscribe({
            next: dossier => {
                this.createdAccessCode = dossier.accessCode;

                const allFiles: File[] = [];
                if (this.audioBlob) {
                    allFiles.push(new File(
                        [this.audioBlob],
                        `temoignage_vocal_${Date.now()}.webm`,
                        { type: 'audio/webm' }
                    ));
                }
                allFiles.push(...this.photos);

                if (allFiles.length > 0) {
                    this.attachmentService.upload(dossier.id, allFiles).subscribe({
                        next:  () => { this.submitting = false; this.showSuccess = true; },
                        error: () => { this.submitting = false; this.showSuccess = true; }
                    });
                } else {
                    this.submitting  = false;
                    this.showSuccess = true;
                }
            },
            error: () => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   "Impossible d'envoyer. Réessayez."
                });
            }
        });
    }
}