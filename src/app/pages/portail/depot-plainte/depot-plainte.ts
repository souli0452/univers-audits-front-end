import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { AttachmentService } from '../../../core/services/attachment.service';

@Component({
    selector: 'app-depot-plainte',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ReactiveFormsModule, ButtonModule, InputTextModule,
        TextareaModule, CheckboxModule, InputNumberModule,
        ToastModule, DialogModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    styles: [`
        @keyframes slide-up {
            from { opacity:0; transform:translateY(20px); }
            to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes pulse-ring {
            0%   { transform:scale(1);    opacity:.5; }
            100% { transform:scale(1.6);  opacity:0;  }
        }

        :host { display:block; font-family:var(--font-family); }

        .page { min-height:100vh; background:linear-gradient(160deg,#f0fdf4 0%,#f8fafc 70%); }

        .navbar {
            background:#16a34a; padding:0 1.5rem; height:60px;
            display:flex; align-items:center; justify-content:space-between;
            position:sticky; top:0; z-index:100;
            box-shadow:0 2px 12px rgba(0,0,0,.15);
        }
        .nav-left { display:flex; align-items:center; gap:.875rem; }
        .nav-logo  {
            width:38px; height:38px; border-radius:50%;
            overflow:hidden; background:#fff; flex-shrink:0;
            display:flex; align-items:center; justify-content:center;
        }
        .nav-logo img { width:100%; height:100%; object-fit:contain; }
        .nav-title { color:#fff; font-weight:900; font-size:1rem; letter-spacing:1px; }
        .nav-sub   { color:#bbf7d0; font-size:.72rem; }

        .content { max-width:700px; margin:0 auto; padding:2rem 1rem 3rem; }

        .hero { text-align:center; margin-bottom:2.5rem; animation:slide-up .4s ease; }
        .hero-icon {
            width:80px; height:80px; border-radius:50%;
            background:linear-gradient(135deg,#16a34a,#22c55e);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1.25rem;
            box-shadow:0 8px 24px rgba(22,163,74,.3);
        }
        .hero-icon i { font-size:2.25rem; color:#fff; }
        .hero h1 { font-size:1.75rem; font-weight:900; color:#111827; margin-bottom:.5rem; }
        .hero p  { color:#6b7280; font-size:.875rem; }

        .steps-bar {
            display:flex; align-items:center;
            justify-content:center; gap:0; margin-bottom:2rem;
        }
        .step-item { display:flex; align-items:center; }
        .step-circle {
            width:44px; height:44px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            font-weight:800; font-size:.875rem;
            border:2.5px solid #e5e7eb; background:#fff; color:#9ca3af;
            transition:all .3s; flex-shrink:0;
        }
        .step-circle.active {
            background:#16a34a; border-color:#16a34a; color:#fff;
            box-shadow:0 0 0 5px rgba(22,163,74,.15);
        }
        .step-circle.done { background:#22c55e; border-color:#22c55e; color:#fff; }
        .step-label {
            font-size:.78rem; font-weight:600; color:#9ca3af;
            margin:0 .5rem; white-space:nowrap;
        }
        .step-label.active { color:#16a34a; }
        .step-label.done   { color:#22c55e; }
        .step-line {
            width:48px; height:3px; background:#e5e7eb;
            border-radius:2px; transition:background .3s; flex-shrink:0;
        }
        .step-line.done { background:#22c55e; }

        .card {
            background:#fff; border-radius:20px; padding:2rem;
            border:1px solid #f0fdf4;
            box-shadow:0 4px 24px rgba(0,0,0,.06);
            animation:slide-up .3s ease;
        }
        .card-title {
            font-size:1.1rem; font-weight:800; color:#111827;
            margin-bottom:1.5rem; display:flex; align-items:center; gap:.75rem;
        }
        .card-title-icon {
            width:36px; height:36px; border-radius:10px;
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0;
        }

        .type-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
        .type-card {
            border:2.5px solid #e5e7eb; border-radius:14px; padding:1rem;
            cursor:pointer; transition:all .2s; background:#fff;
        }
        .type-card:hover   { border-color:#86efac; background:#f9fffe; }
        .type-card.selected { border-color:#16a34a; background:#f0fdf4; }
        .type-icon {
            width:36px; height:36px; border-radius:10px;
            display:flex; align-items:center; justify-content:center;
            margin-bottom:.625rem;
        }
        .type-name { font-weight:700; font-size:.875rem; color:#111827; }
        .type-desc { font-size:.75rem; color:#9ca3af; margin-top:2px; }

        .field { display:flex; flex-direction:column; gap:.375rem; }
        .field label { font-size:.875rem; font-weight:700; color:#374151; }
        .field-hint { font-size:.75rem; color:#9ca3af; }
        .char-count { text-align:right; font-size:.75rem; color:#9ca3af; }

        .req { color:#ef4444; margin-left:2px; }
        .error-msg { color:#ef4444; font-size:.75rem; display:flex; align-items:center; gap:4px; margin-top:2px; }

        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }

        .audio-idle {
            text-align:center; padding:2rem 1.5rem; border-radius:14px;
            border:2px dashed #86efac; background:#f0fdf4;
        }
        .audio-idle-icon {
            width:64px; height:64px; border-radius:50%;
            background:#dcfce7; display:flex; align-items:center;
            justify-content:center; margin:0 auto .875rem;
        }
        .audio-idle-icon i { font-size:1.75rem; color:#16a34a; }

        .audio-recording {
            text-align:center; padding:1.5rem;
            border-radius:14px; border:2px solid #ef4444; background:#fff5f5;
        }
        .rec-pulse-wrap { position:relative; display:inline-block; margin-bottom:.875rem; }
        .rec-ring {
            position:absolute; inset:-10px; border-radius:50%;
            border:3px solid #ef4444; animation:pulse-ring 1.4s ease-out infinite;
        }
        .rec-icon {
            width:72px; height:72px; border-radius:50%; background:#ef4444;
            display:flex; align-items:center; justify-content:center;
            position:relative; z-index:1;
        }
        .rec-icon i { font-size:2rem; color:#fff; }
        .rec-timer {
            font-family:monospace; font-size:2.5rem;
            font-weight:900; color:#dc2626; line-height:1;
        }
        .rec-label-badge {
            display:inline-flex; align-items:center; gap:6px;
            background:#fee2e2; border-radius:20px;
            padding:4px 14px; margin:.625rem 0 1rem;
        }
        .rec-dot {
            width:8px; height:8px; border-radius:50%;
            background:#ef4444; animation:blink 1s infinite;
        }
        .rec-text { color:#b91c1c; font-weight:900; font-size:.75rem; letter-spacing:2px; }

        .audio-done {
            display:flex; align-items:center; gap:.875rem; padding:.875rem;
            border-radius:12px; background:#f0fdf4; border:1.5px solid #86efac;
            margin-bottom:.75rem;
        }
        .done-icon {
            width:44px; height:44px; border-radius:12px; background:#22c55e;
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .done-icon i { color:#fff; font-size:1.1rem; }

        .upload-zone {
            border:2.5px dashed #d1d5db; border-radius:14px;
            padding:1.5rem; text-align:center; cursor:pointer;
            transition:all .2s; background:#fafafa;
        }
        .upload-zone:hover { border-color:#86efac; background:#f0fdf4; }
        .file-item {
            display:flex; align-items:center; gap:.75rem; padding:.75rem;
            border-radius:12px; background:#f9fafb; border:1.5px solid #e5e7eb;
        }
        .file-icon {
            width:40px; height:40px; border-radius:10px;
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .anon-option {
            border:2.5px solid #e5e7eb; border-radius:14px;
            padding:1rem 1.25rem; cursor:pointer; transition:all .2s;
        }
        .anon-option.selected-id   { border-color:#16a34a; background:#f0fdf4; }
        .anon-option.selected-anon { border-color:#f59e0b; background:#fffbeb; }
        .radio-dot {
            width:20px; height:20px; border-radius:50%; border:2px solid #d1d5db;
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0; transition:all .2s;
        }
        .radio-dot.active-id   { border-color:#16a34a; background:#16a34a; }
        .radio-dot.active-anon { border-color:#f59e0b; background:#f59e0b; }
        .radio-inner { width:8px; height:8px; border-radius:50%; background:#fff; }

        /* ── Protection lanceur d'alerte ─────────────────────────────── */
        .protection-trigger {
            border:2.5px solid #e5e7eb; border-radius:14px;
            padding:1rem 1.25rem; cursor:pointer; transition:all .2s; background:#fff;
        }
        .protection-trigger.selected {
            border-color:#1d4ed8; background:#eff6ff;
        }

        .protection-info-box {
            border-radius:14px; padding:1rem 1.25rem;
            background:#eff6ff; border:1.5px solid #93c5fd;
            margin-top:.75rem;
        }
        .protection-warning {
            background:#fff5f5; border:1.5px solid #fca5a5;
            border-radius:12px; padding:.875rem 1rem; margin-top:.625rem;
        }
        .protection-conditions {
            background:#f8faff; border:1.5px solid #bfdbfe;
            border-radius:12px; padding:1rem; margin-top:.75rem;
            display:flex; flex-direction:column; gap:.625rem;
        }
        .condition-row {
            display:flex; align-items:flex-start; gap:.75rem; cursor:pointer;
        }
        .condition-check {
            width:20px; height:20px; border-radius:6px; border:2px solid #93c5fd;
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0; transition:all .2s; margin-top:1px;
        }
        .condition-check.checked { background:#2563eb; border-color:#2563eb; }
        .protection-acknowledged {
            background:#f0fdf4; border:2px solid #22c55e;
            border-radius:12px; padding:.875rem 1rem; margin-top:.75rem;
            display:flex; align-items:center; gap:.75rem;
        }

        .recap-section {
            background:#f9fafb; border-radius:14px; padding:1rem 1.25rem;
            border:1.5px solid #e5e7eb;
        }
        .recap-row { display:flex; gap:.5rem; font-size:.875rem; padding:.25rem 0; }
        .recap-key { color:#9ca3af; width:100px; flex-shrink:0; }
        .recap-val { font-weight:600; color:#111827; }

        .step-footer {
            display:flex; justify-content:space-between;
            align-items:center; margin-top:1.75rem; gap:.75rem;
        }

        .success-body { padding:.5rem .25rem; text-align:center; }
        .success-icon {
            width:88px; height:88px; border-radius:50%;
            background:linear-gradient(135deg,#16a34a,#22c55e);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1.25rem; box-shadow:0 8px 24px rgba(22,163,74,.3);
        }
        .success-icon i { font-size:2.75rem; color:#fff; }
        .code-box {
            background:linear-gradient(135deg,#f0fdf4,#dcfce7);
            border:2px solid #86efac; border-radius:16px;
            padding:1.25rem; margin:1.25rem 0;
        }
        .code-label {
            font-size:.65rem; font-weight:900; color:#16a34a;
            letter-spacing:2px; text-transform:uppercase;
        }
        .code-value {
            font-family:monospace; font-size:2.5rem;
            font-weight:900; color:#166534; letter-spacing:6px;
        }
        .code-hint  { font-size:.75rem; color:#15803d; margin-top:.375rem; }

        .notif-row {
            display:flex; flex-direction:column; gap:.5rem; margin-top:.75rem;
        }
        .notif-badge {
            display:inline-flex; align-items:center; gap:.5rem;
            font-size:.8rem; padding:6px 14px; border-radius:20px;
            font-weight:600;
        }
        .notif-badge.sms {
            background:#dbeafe; color:#1d4ed8; border:1px solid #bfdbfe;
        }
        .notif-badge.email {
            background:#fef9c3; color:#854d0e; border:1px solid #fde68a;
        }

        .page-foot {
            text-align:center; margin-top:2rem;
            color:#9ca3af; font-size:.75rem; padding-bottom:1rem;
        }

        .consent-box-error {
            border:1.5px solid #ef4444 !important;
            background:#fff5f5 !important;
        }

        @media (max-width:520px) {
            .grid2 { grid-template-columns:1fr; }
            .type-grid { grid-template-columns:1fr; }
            .step-label { display:none; }
        }
    `],
    template: `
<p-toast />
<p-confirmDialog />

<p-dialog [(visible)]="showSuccess" header=" " [modal]="true"
    [closable]="false" [style]="{width:'400px'}">
    <div class="success-body">
        <div class="success-icon"><i class="pi pi-check-circle"></i></div>
        <h3 style="font-size:1.35rem;font-weight:900;color:#111827;margin-bottom:.5rem;">
            Merci pour votre signalement !
        </h3>
        <p style="font-size:.875rem;color:#6b7280;line-height:1.7;margin-bottom:0;">
            Votre dossier a été enregistré.<br>
            Conservez précieusement votre code d'accès.
        </p>
        <div class="code-box">
            <div class="code-label">Votre code de suivi (B4)</div>
            <div class="code-value">{{ createdAccessCode }}</div>
            <div class="code-hint">
                <i class="pi pi-camera" style="font-size:.7rem;"></i>
                Notez ce code ou prenez une photo
            </div>
        </div>
        <div class="notif-row" *ngIf="fd['phoneNumber'].value || fd['email'].value">
            <div *ngIf="fd['phoneNumber'].value" class="notif-badge sms">
                <i class="pi pi-mobile" style="font-size:.85rem;"></i>
                SMS envoyé au {{ fd['phoneNumber'].value }}
            </div>
            <div *ngIf="fd['email'].value" class="notif-badge email">
                <i class="pi pi-envelope" style="font-size:.85rem;"></i>
                Email envoyé à {{ fd['email'].value }}
            </div>
        </div>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;
                    padding:.875rem;font-size:.8rem;color:#92400e;text-align:left;
                    margin-top:.75rem;">
            <i class="pi pi-info-circle" style="color:#d97706;margin-right:6px;"></i>
            Vous recevrez un accusé de réception officiel dans les 7 jours ouvrables.
        </div>
    </div>
    <ng-template pTemplate="footer">
        <div style="display:flex;gap:.5rem;justify-content:center;">
            <p-button label="Suivre mon dossier" icon="pi pi-search"
                severity="success" (onClick)="goToSuivi()" />
            <p-button label="Accueil" severity="secondary" outlined
                (onClick)="goToAccueil()" />
        </div>
    </ng-template>
</p-dialog>

<div class="page">

    <nav class="navbar">
        <div class="nav-left">
            <p-button icon="pi pi-arrow-left" severity="contrast"
                text (onClick)="router.navigate(['/portail'])" />
            <div class="nav-logo">
                <img src="assets/logo-integrite.png" alt="Intégrité+" />
            </div>
            <div>
                <div class="nav-title">INTÉGRITÉ+</div>
                <div class="nav-sub">Dépôt de plainte sécurisé</div>
            </div>
        </div>
        <p-button label="Suivre" icon="pi pi-search" severity="contrast"
            outlined size="small"
            (onClick)="router.navigate(['/portail/suivi'])" />
    </nav>

    <div class="content">

        <div class="hero">
            <div class="hero-icon"><i class="pi pi-file-edit"></i></div>
            <h1>Déposer un signalement</h1>
            <p>Formulaire sécurisé — vos données sont strictement protégées</p>
        </div>

        <div class="steps-bar">
            <div class="step-item"
                *ngFor="let s of steps; let i = index; let last = last">
                <div class="step-circle"
                    [class.active]="currentStep === s.id"
                    [class.done]="currentStep > s.id">
                    <i *ngIf="currentStep > s.id" class="pi pi-check"
                        style="font-size:.75rem;"></i>
                    <span *ngIf="currentStep <= s.id">{{ s.id }}</span>
                </div>
                <span class="step-label"
                    [class.active]="currentStep === s.id"
                    [class.done]="currentStep > s.id">
                    {{ s.label }}
                </span>
                <div *ngIf="!last" class="step-line"
                    [class.done]="currentStep > s.id"></div>
            </div>
        </div>

        <div *ngIf="currentStep === 1" class="card">
            <div class="card-title">
                <div class="card-title-icon" style="background:#dcfce7;">
                    <i class="pi pi-file-edit" style="color:#16a34a;"></i>
                </div>
                Décrivez les faits
            </div>

            <div style="display:flex;flex-direction:column;gap:1.25rem;">

                <!-- Type -->
                <div class="field">
                    <label>Type de signalement <span class="req">*</span></label>
                    <div class="type-grid">
                        <div *ngFor="let type of typeOptions"
                            class="type-card"
                            [class.selected]="f['type'].value === type.value"
                            (click)="f['type'].setValue(type.value)">
                            <div class="type-icon"
                                [style.background]="f['type'].value === type.value ? '#dcfce7' : '#f3f4f6'">
                                <i [class]="type.icon"
                                    [style.color]="f['type'].value === type.value ? '#16a34a' : '#9ca3af'"
                                    style="font-size:1.1rem;"></i>
                            </div>
                            <div class="type-name">{{ type.label }}</div>
                            <div class="type-desc">{{ type.description }}</div>
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label>Résumé du signalement <span class="req">*</span></label>
                    <input pInputText [formControl]="f['object']"
                        placeholder="Ex: Détournement de fonds à la mairie de..."
                        class="w-full"
                        [class.ng-invalid]="f['object'].invalid && f['object'].touched"
                        [class.ng-dirty]="f['object'].invalid && f['object'].touched" />
                    <small class="error-msg"
                        *ngIf="f['object'].invalid && f['object'].touched">
                        <i class="pi pi-exclamation-circle" style="font-size:.75rem;"></i>
                        Minimum 10 caractères requis
                    </small>
                </div>

                <div class="field">
                    <label>Description détaillée <span class="req">*</span></label>
                    <textarea pTextarea [formControl]="f['description']"
                        placeholder="Décrivez les faits : qui, quoi, quand, où, comment..."
                        rows="5" class="w-full resize-none"
                        [class.ng-invalid]="f['description'].invalid && f['description'].touched"
                        [class.ng-dirty]="f['description'].invalid && f['description'].touched">
                    </textarea>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <small class="error-msg"
                            *ngIf="f['description'].invalid && f['description'].touched">
                            <i class="pi pi-exclamation-circle" style="font-size:.75rem;"></i>
                            Ce champ est obligatoire
                        </small>
                        <span class="char-count" style="margin-left:auto;">
                            {{ f['description'].value?.length || 0 }} caractères
                        </span>
                    </div>
                </div>

                <div class="grid2">
                    <div class="field">
                        <label>Lieu des faits</label>
                        <div style="display:flex;align-items:center;gap:8px;
                            border:1.5px solid #e5e7eb;border-radius:8px;padding:0 12px;">
                            <i class="pi pi-map-marker" style="color:#9ca3af;font-size:.875rem;"></i>
                            <input pInputText [formControl]="f['incidentLocation']"
                                placeholder="Service, ville..."
                                style="border:none;outline:none;background:transparent;
                                       padding:.625rem 0;flex:1;font-size:.875rem;" />
                        </div>
                    </div>
                    <div class="field">
                        <label>Période approximative</label>
                        <div style="display:flex;align-items:center;gap:8px;
                            border:1.5px solid #e5e7eb;border-radius:8px;padding:0 12px;">
                            <i class="pi pi-calendar" style="color:#9ca3af;font-size:.875rem;"></i>
                            <input pInputText [formControl]="f['incidentPeriod']"
                                placeholder="Ex: Janvier 2024"
                                style="border:none;outline:none;background:transparent;
                                       padding:.625rem 0;flex:1;font-size:.875rem;" />
                        </div>
                    </div>
                </div>

                <!-- Montant -->
                <div class="field">
                    <label>
                        Montant estimé (FCFA)
                        <span style="color:#9ca3af;font-weight:400;"> — optionnel</span>
                    </label>
                    <p-inputnumber [formControl]="f['estimatedLoss']"
                        [useGrouping]="true" placeholder="0" styleClass="w-full" />
                    <span class="field-hint">Laissez vide si inconnu</span>
                </div>

                <!-- Audio -->
                <div class="field">
                    <label>
                        Témoignage audio
                        <span style="color:#9ca3af;font-weight:400;"> — optionnel</span>
                    </label>
                    <div *ngIf="!audioUrl && !isRecording" class="audio-idle">
                        <div class="audio-idle-icon">
                            <i class="pi pi-microphone"></i>
                        </div>
                        <p style="font-size:.875rem;color:#374151;font-weight:600;margin-bottom:.375rem;">
                            Enregistrez votre témoignage vocal
                        </p>
                        <p style="font-size:.8rem;color:#9ca3af;margin-bottom:1rem;">
                            Complément utile à votre déclaration écrite
                        </p>
                        <p-button label="Démarrer l'enregistrement"
                            icon="pi pi-microphone" severity="secondary" outlined
                            (onClick)="startRecording()" />
                    </div>
                    <div *ngIf="isRecording" class="audio-recording">
                        <div class="rec-pulse-wrap">
                            <div class="rec-ring"></div>
                            <div class="rec-icon"><i class="pi pi-microphone"></i></div>
                        </div>
                        <div class="rec-timer">{{ formatDuration(recordingDuration) }}</div>
                        <div class="rec-label-badge">
                            <span class="rec-dot"></span>
                            <span class="rec-text">REC</span>
                        </div>
                        <p-button label="Arrêter" icon="pi pi-stop-circle"
                            severity="danger" (onClick)="stopRecording()" />
                    </div>
                    <div *ngIf="audioUrl && !isRecording">
                        <div class="audio-done">
                            <div class="done-icon"><i class="pi pi-check"></i></div>
                            <div style="flex:1;">
                                <div style="font-weight:700;color:#166534;font-size:.875rem;">Audio enregistré ✓</div>
                                <div style="font-size:.8rem;color:#16a34a;margin-top:2px;">
                                    Durée : {{ formatDuration(recordingDuration) }}
                                </div>
                            </div>
                        </div>
                        <audio [src]="audioUrl" controls
                            style="width:100%;border-radius:8px;margin-bottom:.625rem;"></audio>
                        <p-button label="Supprimer et recommencer" icon="pi pi-trash"
                            severity="danger" text size="small" (onClick)="deleteAudio()" />
                    </div>
                </div>

                <!-- Pièces jointes -->
                <div class="field">
                    <label>
                        Pièces jointes
                        <span style="color:#9ca3af;font-weight:400;">
                            — max {{ maxFiles }} fichiers, {{ maxSizeMB }}MB chacun
                        </span>
                    </label>
                    <div class="upload-zone" (click)="fileInput.click()"
                        (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
                        <input #fileInput type="file" multiple style="display:none;"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3,.mp4,.avi,.mov"
                            (change)="onFileSelect($event)" />
                        <i class="pi pi-cloud-upload"
                            style="font-size:2rem;color:#9ca3af;margin-bottom:.5rem;display:block;"></i>
                        <p style="font-size:.875rem;font-weight:600;color:#374151;margin-bottom:.25rem;">
                            Cliquez ou glissez vos fichiers ici
                        </p>
                        <p style="font-size:.75rem;color:#9ca3af;">
                            PDF, Word, Images, Audio, Vidéo
                        </p>
                    </div>
                    <div *ngIf="attachments.length > 0"
                        style="display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem;">
                        <div *ngFor="let file of attachments; let i = index" class="file-item">
                            <div class="file-icon" [style.background]="getFileBg(file)">
                                <i [class]="getFileIcon(file)"
                                    [style.color]="getFileColor(file)" style="font-size:1rem;"></i>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:.875rem;font-weight:600;color:#111827;
                                            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                    {{ file.name }}
                                </div>
                                <div style="font-size:.75rem;color:#9ca3af;">{{ formatFileSize(file.size) }}</div>
                            </div>
                            <p-button icon="pi pi-times" severity="danger"
                                text size="small" (onClick)="removeAttachment(i)" />
                        </div>
                        <div style="text-align:right;font-size:.75rem;color:#9ca3af;">
                            {{ attachments.length }}/{{ maxFiles }} fichiers
                        </div>
                    </div>
                </div>

            </div>

            <div class="step-footer">
                <span style="font-size:.78rem;color:#9ca3af;">
                    <i class="pi pi-lock"></i> Données chiffrées
                </span>
                <p-button label="Continuer" icon="pi pi-arrow-right" iconPos="right"
                    (onClick)="goToStep2()" />
            </div>
        </div>

        <!-- ═══ Étape 2 — Coordonnées ═══ -->
        <div *ngIf="currentStep === 2" class="card">

            <div class="card-title">
                <div class="card-title-icon" style="background:#dbeafe;">
                    <i class="pi pi-user" style="color:#2563eb;"></i>
                </div>
                Vos coordonnées
            </div>
            <p style="font-size:.875rem;color:#6b7280;margin-bottom:1.5rem;margin-top:-.75rem;">
                Informations strictement confidentielles. Vous pouvez rester anonyme.
            </p>

            <!-- Choix identité -->
            <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.5rem;">
                <div class="anon-option"
                    [class.selected-id]="!fd['anonymous'].value"
                    (click)="fd['anonymous'].setValue(false)">
                    <div style="display:flex;align-items:center;gap:.875rem;">
                        <div class="radio-dot" [class.active-id]="!fd['anonymous'].value">
                            <div *ngIf="!fd['anonymous'].value" class="radio-inner"></div>
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:700;font-size:.875rem;color:#111827;">
                                Je fournis mes coordonnées
                            </div>
                            <div style="font-size:.75rem;color:#6b7280;margin-top:2px;">
                                Recommandé pour un meilleur suivi de votre dossier
                            </div>
                        </div>
                        <div style="width:32px;height:32px;border-radius:8px;
                            background:#dcfce7;display:flex;align-items:center;justify-content:center;">
                            <i class="pi pi-id-card" style="color:#16a34a;font-size:.875rem;"></i>
                        </div>
                    </div>
                </div>

                <div class="anon-option"
                    [class.selected-anon]="fd['anonymous'].value"
                    (click)="setAnonymous()">
                    <div style="display:flex;align-items:center;gap:.875rem;">
                        <div class="radio-dot" [class.active-anon]="fd['anonymous'].value">
                            <div *ngIf="fd['anonymous'].value" class="radio-inner"></div>
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:700;font-size:.875rem;color:#111827;">
                                Je reste anonyme
                            </div>
                            <div style="font-size:.75rem;color:#6b7280;margin-top:2px;">
                                Votre identité ne sera pas enregistrée
                            </div>
                        </div>
                        <div style="width:32px;height:32px;border-radius:8px;
                            background:#fef9c3;display:flex;align-items:center;justify-content:center;">
                            <i class="pi pi-eye-slash" style="color:#ca8a04;font-size:.875rem;"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Champs coordonnées -->
            <div *ngIf="!fd['anonymous'].value"
                style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.25rem;">
                <div class="grid2">
                    <div class="field">
                        <label>Prénom</label>
                        <input pInputText [formControl]="fd['firstName']"
                            placeholder="Votre prénom" class="w-full" />
                    </div>
                    <div class="field">
                        <label>Nom</label>
                        <input pInputText [formControl]="fd['lastName']"
                            placeholder="Votre nom" class="w-full" />
                    </div>
                    <div class="field">
                        <label>Téléphone
                            <span style="color:#9ca3af;font-weight:400;font-size:.8rem;">
                                (pour recevoir le code par SMS)
                            </span>
                        </label>
                        <input pInputText [formControl]="fd['phoneNumber']"
                            placeholder="+226 XX XX XX XX" class="w-full" />
                    </div>
                    <div class="field">
                        <label>Email
                            <span style="color:#9ca3af;font-weight:400;font-size:.8rem;">
                                (pour recevoir le code par email)
                            </span>
                        </label>
                        <input pInputText [formControl]="fd['email']"
                            placeholder="votre@email.com" type="email" class="w-full" />
                    </div>
                    <div class="field">
                        <label>Commune</label>
                        <input pInputText [formControl]="fd['commune']"
                            placeholder="Votre commune" class="w-full" />
                    </div>
                    <div class="field">
                        <label>Province</label>
                        <input pInputText [formControl]="fd['province']"
                            placeholder="Votre province" class="w-full" />
                    </div>
                </div>

                <!-- ══ PROTECTION LANCEUR D'ALERTE — Avec friction ══════════ -->
                <div>
                    <!-- Case déclencheur -->
                    <div class="protection-trigger"
                        [class.selected]="fd['protectionRequested'].value"
                        (click)="toggleProtectionRequested()">
                        <div style="display:flex;align-items:center;gap:.875rem;">
                            <div style="width:22px;height:22px;border-radius:6px;
                                border:2.5px solid #93c5fd;display:flex;align-items:center;
                                justify-content:center;flex-shrink:0;transition:all .2s;"
                                [style.background]="fd['protectionRequested'].value ? '#2563eb' : 'transparent'"
                                [style.border-color]="fd['protectionRequested'].value ? '#2563eb' : '#93c5fd'">
                                <i *ngIf="fd['protectionRequested'].value"
                                    class="pi pi-check"
                                    style="font-size:.65rem;color:#fff;"></i>
                            </div>
                            <div style="flex:1;">
                                <div style="font-weight:700;font-size:.875rem;color:#1e40af;">
                                    Je demande une protection lanceur d'alerte
                                </div>
                                <div style="font-size:.75rem;color:#3b82f6;margin-top:2px;">
                                    Loi N°010-2004/AN — Protection garantie par l'État
                                </div>
                            </div>
                            <div style="width:32px;height:32px;border-radius:8px;
                                background:#eff6ff;display:flex;align-items:center;justify-content:center;">
                                <i class="pi pi-shield" style="color:#2563eb;font-size:.875rem;"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Bloc étendu — affiché si case cochée et pas encore confirmé -->
                    <div *ngIf="fd['protectionRequested'].value && !protectionAcknowledged">

                        <!-- Information légale -->
                        <div class="protection-info-box">
                            <div style="font-weight:800;color:#1e40af;font-size:.875rem;
                                display:flex;align-items:center;gap:.5rem;margin-bottom:.625rem;">
                                <i class="pi pi-info-circle"></i>
                                À qui s'adresse cette protection ?
                            </div>
                            <p style="font-size:.8rem;color:#1d4ed8;line-height:1.7;margin:0 0 .625rem 0;">
                                Cette protection est réservée aux personnes qui signalent
                                des faits de <strong>corruption, détournement de fonds publics
                                ou abus de pouvoir</strong> dont elles ont eu connaissance
                                <strong>dans le cadre de leurs fonctions ou activités</strong>.
                            </p>
                            <p style="font-size:.8rem;color:#1d4ed8;line-height:1.7;margin:0;">
                                Elle garantit la <strong>confidentialité totale de votre identité</strong>
                                et vous protège contre toute représaille, licenciement
                                ou sanction liée à votre signalement.
                            </p>
                        </div>

                        <!-- Avertissement pénal -->
                        <div class="protection-warning">
                            <div style="display:flex;align-items:flex-start;gap:.75rem;">
                                <i class="pi pi-exclamation-triangle"
                                    style="color:#ef4444;font-size:1rem;flex-shrink:0;margin-top:1px;"></i>
                                <p style="font-size:.8rem;color:#dc2626;margin:0;line-height:1.6;">
                                    <strong>Attention :</strong> invoquer cette protection de manière abusive
                                    ou pour masquer une fausse déclaration est passible de
                                    <strong>sanctions pénales</strong> en vertu de la Loi N°010-2004/AN.
                                </p>
                            </div>
                        </div>

                        <!-- 3 conditions à cocher -->
                        <div class="protection-conditions">
                            <div style="font-size:.78rem;font-weight:800;color:#1e40af;
                                text-transform:uppercase;letter-spacing:1px;margin-bottom:.25rem;">
                                Je confirme les 3 conditions suivantes :
                            </div>

                            <div class="condition-row" (click)="cond1 = !cond1">
                                <div class="condition-check" [class.checked]="cond1">
                                    <i *ngIf="cond1" class="pi pi-check"
                                        style="font-size:.6rem;color:#fff;"></i>
                                </div>
                                <span style="font-size:.8rem;color:#1e40af;line-height:1.5;">
                                    J'ai eu connaissance de ces faits dans le cadre
                                    de mes fonctions, de mon travail ou de mes activités professionnelles.
                                </span>
                            </div>

                            <div class="condition-row" (click)="cond2 = !cond2">
                                <div class="condition-check" [class.checked]="cond2">
                                    <i *ngIf="cond2" class="pi pi-check"
                                        style="font-size:.6rem;color:#fff;"></i>
                                </div>
                                <span style="font-size:.8rem;color:#1e40af;line-height:1.5;">
                                    Je crains des représailles directes si mon identité
                                    est révélée (licenciement, menaces, sanctions...).
                                </span>
                            </div>

                            <div class="condition-row" (click)="cond3 = !cond3">
                                <div class="condition-check" [class.checked]="cond3">
                                    <i *ngIf="cond3" class="pi pi-check"
                                        style="font-size:.6rem;color:#fff;"></i>
                                </div>
                                <span style="font-size:.8rem;color:#1e40af;line-height:1.5;">
                                    Je comprends qu'invoquer cette protection
                                    de manière abusive constitue une infraction pénale.
                                </span>
                            </div>

                            <!-- Bouton confirmation sur l'honneur — actif seulement si 3/3 -->
                            <p-button
                                label="Je confirme sur l'honneur"
                                icon="pi pi-shield"
                                severity="info"
                                styleClass="w-full justify-center mt-2"
                                [disabled]="!cond1 || !cond2 || !cond3"
                                (onClick)="confirmProtection()" />

                            <small *ngIf="protectionCondTouched && (!cond1 || !cond2 || !cond3)"
                                class="error-msg" style="justify-content:center;">
                                <i class="pi pi-exclamation-circle" style="font-size:.75rem;"></i>
                                Veuillez cocher les 3 conditions pour continuer
                            </small>
                        </div>
                    </div>

                    <!-- Badge de confirmation — affiché une fois les 3 conditions validées -->
                    <div *ngIf="fd['protectionRequested'].value && protectionAcknowledged"
                        class="protection-acknowledged">
                        <i class="pi pi-shield" style="color:#16a34a;font-size:1.25rem;flex-shrink:0;"></i>
                        <div style="flex:1;">
                            <div style="font-weight:800;color:#166534;font-size:.875rem;">
                                Protection lanceur d'alerte confirmée
                            </div>
                            <div style="font-size:.75rem;color:#16a34a;margin-top:2px;">
                                Votre identité sera strictement protégée — Loi N°010-2004/AN
                            </div>
                        </div>
                        <p-button icon="pi pi-times" severity="secondary" text size="small"
                            pTooltip="Annuler la demande" (onClick)="cancelProtection()" />
                    </div>
                </div>
                <!-- ══ FIN PROTECTION ══════════════════════════════════════ -->

            </div>

            <!-- Consentement obligatoire -->
            <div [class.consent-box-error]="consentTouched && !fd['dataProcessingConsent'].value"
                style="display:flex;align-items:flex-start;gap:.875rem;
                padding:.875rem;border-radius:12px;background:#f9fafb;
                border:1.5px solid #e5e7eb;">
                <p-checkbox [formControl]="fd['dataProcessingConsent']"
                    [binary]="true" inputId="consent" />
                <label for="consent" style="font-size:.875rem;color:#374151;cursor:pointer;">
                    J'accepte le traitement de mes données personnelles par l'ASCE-LC.
                    <span class="req">*</span>
                </label>
            </div>
            <small class="error-msg"
                *ngIf="consentTouched && !fd['dataProcessingConsent'].value"
                style="margin-top:4px;">
                <i class="pi pi-exclamation-circle" style="font-size:.75rem;"></i>
                Vous devez accepter pour continuer
            </small>

            <div class="step-footer">
                <p-button label="Précédent" icon="pi pi-arrow-left"
                    severity="secondary" outlined (onClick)="currentStep = 1" />
                <p-button label="Continuer" icon="pi pi-arrow-right" iconPos="right"
                    (onClick)="goToStep3()" />
            </div>
        </div>

        <!-- ═══ Étape 3 — Confirmation ═══ -->
        <div *ngIf="currentStep === 3" class="card">

            <div class="card-title">
                <div class="card-title-icon" style="background:#fef9c3;">
                    <i class="pi pi-check-circle" style="color:#ca8a04;"></i>
                </div>
                Confirmer votre signalement
            </div>

            <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem;">

                <!-- Résumé dossier -->
                <div class="recap-section">
                    <div style="font-size:.75rem;font-weight:800;color:#6b7280;
                        letter-spacing:1px;text-transform:uppercase;margin-bottom:.75rem;">
                        Votre signalement
                    </div>
                    <div class="recap-row">
                        <span class="recap-key">Type</span>
                        <span class="recap-val">{{ getTypeLabel(f['type'].value) }}</span>
                    </div>
                    <div class="recap-row">
                        <span class="recap-key">Objet</span>
                        <span class="recap-val"
                            style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                            {{ f['object'].value }}
                        </span>
                    </div>
                    <div *ngIf="f['incidentLocation'].value" class="recap-row">
                        <span class="recap-key">Lieu</span>
                        <span class="recap-val">{{ f['incidentLocation'].value }}</span>
                    </div>
                    <div *ngIf="audioUrl" class="recap-row">
                        <span class="recap-key">Audio</span>
                        <span class="recap-val" style="color:#16a34a;">
                            ✓ {{ formatDuration(recordingDuration) }}
                        </span>
                    </div>
                    <div *ngIf="attachments.length > 0" class="recap-row">
                        <span class="recap-key">Fichiers</span>
                        <span class="recap-val">{{ attachments.length }} pièce(s)</span>
                    </div>
                </div>

                <!-- Déclarant -->
                <div class="recap-section">
                    <div style="font-size:.75rem;font-weight:800;color:#6b7280;
                        letter-spacing:1px;text-transform:uppercase;margin-bottom:.75rem;">
                        Déclarant
                    </div>
                    <div *ngIf="fd['anonymous'].value"
                        style="display:inline-flex;align-items:center;gap:.5rem;
                            background:#fef9c3;color:#92400e;padding:.375rem .875rem;
                            border-radius:20px;font-size:.8rem;font-weight:700;">
                        <i class="pi pi-eye-slash" style="font-size:.75rem;"></i>
                        Anonyme
                    </div>
                    <div *ngIf="!fd['anonymous'].value">
                        <div class="recap-row">
                            <span class="recap-key">Identité</span>
                            <span class="recap-val">
                                {{ fd['firstName'].value }} {{ fd['lastName'].value }}
                            </span>
                        </div>
                        <div *ngIf="fd['phoneNumber'].value" class="recap-row">
                            <span class="recap-key">Téléphone</span>
                            <span class="recap-val">{{ fd['phoneNumber'].value }}</span>
                        </div>
                        <div *ngIf="fd['email'].value" class="recap-row">
                            <span class="recap-key">Email</span>
                            <span class="recap-val">{{ fd['email'].value }}</span>
                        </div>
                        <!-- Récap protection lanceur d'alerte -->
                        <div *ngIf="protectionAcknowledged" class="recap-row">
                            <span class="recap-key">Protection</span>
                            <span class="recap-val" style="color:#1d4ed8;display:flex;align-items:center;gap:.375rem;">
                                <i class="pi pi-shield" style="font-size:.75rem;"></i>
                                Lanceur d'alerte confirmée
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Notifications prévues -->
                <div *ngIf="!fd['anonymous'].value
                            && (fd['phoneNumber'].value || fd['email'].value)"
                    style="background:#f0fdf4;border:1.5px solid #86efac;
                           border-radius:12px;padding:.875rem;">
                    <div style="font-size:.75rem;font-weight:800;color:#16a34a;
                        letter-spacing:1px;text-transform:uppercase;margin-bottom:.5rem;">
                        <i class="pi pi-send" style="margin-right:4px;"></i>
                        Notifications prévues
                    </div>
                    <div *ngIf="fd['phoneNumber'].value"
                        style="font-size:.8rem;color:#166534;display:flex;align-items:center;gap:.5rem;">
                        <i class="pi pi-mobile" style="font-size:.8rem;"></i>
                        SMS → {{ fd['phoneNumber'].value }}
                    </div>
                    <div *ngIf="fd['email'].value"
                        style="font-size:.8rem;color:#166534;display:flex;align-items:center;gap:.5rem;margin-top:4px;">
                        <i class="pi pi-envelope" style="font-size:.8rem;"></i>
                        Email → {{ fd['email'].value }}
                    </div>
                </div>

                <!-- Avertissement -->
                <div style="display:flex;align-items:flex-start;gap:.875rem;
                    padding:.875rem;border-radius:12px;background:#fffbeb;
                    border:1.5px solid #fde68a;">
                    <i class="pi pi-exclamation-triangle" style="color:#d97706;margin-top:1px;"></i>
                    <p style="font-size:.8rem;color:#92400e;line-height:1.6;">
                        En soumettant, vous certifiez l'exactitude des informations.
                        Toute fausse déclaration est passible de poursuites.
                    </p>
                </div>

            </div>

            <div class="step-footer">
                <p-button label="Précédent" icon="pi pi-arrow-left"
                    severity="secondary" outlined (onClick)="currentStep = 2" />
                <p-button label="Soumettre mon signalement" icon="pi pi-send"
                    severity="success" [loading]="submitting" (onClick)="submit()" />
            </div>
        </div>

        <div class="page-foot">
            <i class="pi pi-shield"></i>
            ASCE-LC — Autorité Supérieure de Contrôle d'État — Burkina Faso
        </div>

    </div>
</div>
    `
})
export class DepotPlainte {

    router = inject(Router);

    private fb                  = inject(FormBuilder);
    private dossierService      = inject(DossierService);
    private messageService      = inject(MessageService);
    private attachmentService   = inject(AttachmentService);
    private confirmationService = inject(ConfirmationService);

    currentStep       = 1;
    submitting        = false;
    showSuccess       = false;
    createdAccessCode = '';
    consentTouched    = false;
    cond1 = false;
    cond2 = false;
    cond3 = false;
    protectionAcknowledged    = false;
    protectionCondTouched     = false;

    readonly steps = [
        { id: 1, label: 'Les faits'    },
        { id: 2, label: 'Coordonnées'  },
        { id: 3, label: 'Confirmation' }
    ];

    isRecording       = false;
    audioBlob:        Blob | null   = null;
    audioUrl:         string | null = null;
    mediaRecorder:    MediaRecorder | null = null;
    recordingDuration = 0;
    recordingTimer:   any = null;

    attachments: File[] = [];
    maxFiles  = 5;
    maxSizeMB = 25;

    dossierForm = this.fb.group({
        type:             ['COMPLAINT'],
        object:           ['', [Validators.required, Validators.minLength(10)]],
        description:      ['', Validators.required],
        incidentLocation: [''],
        incidentPeriod:   [''],
        estimatedLoss:    [null]
    });

    declarantForm = this.fb.group({
        typeDeclarant:         ['CITIZEN'],
        firstName:             [''],
        lastName:              [''],
        email:                 [''],
        phoneNumber:           [''],
        commune:               [''],
        province:              [''],
        anonymous:             [false],
        dataProcessingConsent: [false],
        notificationsAccepted: [true],
        protectionRequested:   [false]
    });

    get f()  { return this.dossierForm.controls;   }
    get fd() { return this.declarantForm.controls; }

    typeOptions = [
        { label: 'Plainte',       value: 'COMPLAINT',    description: 'Je suis victime ou témoin', icon: 'pi pi-exclamation-circle' },
        { label: 'Dénonciation',  value: 'DENUNCIATION', description: 'Je signale des faits',      icon: 'pi pi-megaphone'          }
    ];

    // ── Gestion protection lanceur d'alerte ──────────────────────

    toggleProtectionRequested(): void {
        if (this.fd['protectionRequested'].value) {
            // Si déjà cochée → décocher et tout réinitialiser
            this.cancelProtection();
        } else {
            // Cocher : affiche le bloc d'information + conditions
            this.fd['protectionRequested'].setValue(true);
            this.protectionAcknowledged = false;
            this.cond1 = this.cond2 = this.cond3 = false;
        }
    }

    confirmProtection(): void {
        this.protectionCondTouched = true;
        if (!this.cond1 || !this.cond2 || !this.cond3) return;

        // Modal "sur l'honneur" — dernier rempart avant validation
        this.confirmationService.confirm({
            header:       'Confirmation sur l\'honneur',
            message:      'En confirmant, vous attestez sur l\'honneur que votre demande '
                        + 'de protection lanceur d\'alerte est justifiée et que vous '
                        + 'avez bien pris connaissance de ses conditions légales '
                        + '(Loi N°010-2004/AN).',
            acceptLabel:  'Je confirme sur l\'honneur',
            rejectLabel:  'Annuler',
            acceptIcon:   'pi pi-shield',
            rejectButtonProps: { severity: 'secondary', outlined: true },
            accept: () => {
                this.protectionAcknowledged = true;
            },
            reject: () => {
                
            }
        });
    }

    cancelProtection(): void {
        this.fd['protectionRequested'].setValue(false);
        this.protectionAcknowledged    = false;
        this.protectionCondTouched     = false;
        this.cond1 = this.cond2 = this.cond3 = false;
    }

  
    setAnonymous(): void {
        this.fd['anonymous'].setValue(true);
        this.cancelProtection();
    }

    

    goToStep2(): void {
        this.dossierForm.markAllAsTouched();
        if (this.f['object'].invalid || this.f['description'].invalid) {
            this.messageService.add({
                severity: 'warn', summary: 'Champs requis',
                detail: 'Veuillez remplir tous les champs obligatoires.'
            });
            return;
        }
        this.currentStep = 2;
    }

    goToStep3(): void {
        this.consentTouched = true;
        if (!this.fd['dataProcessingConsent'].value) {
            this.messageService.add({
                severity: 'warn', summary: 'Consentement requis',
                detail: 'Vous devez accepter le traitement de vos données.'
            });
            return;
        }

        if (this.fd['protectionRequested'].value && !this.protectionAcknowledged) {
            this.protectionCondTouched = true;
            this.messageService.add({
                severity: 'warn',
                summary:  'Protection lanceur d\'alerte',
                detail:   'Vous devez confirmer les 3 conditions et valider sur l\'honneur '
                        + 'avant de continuer.'
            });
            return;
        }

        this.currentStep = 3;
    }

    goToSuivi(): void {
        this.showSuccess = false;
        setTimeout(() => this.router.navigate(['/portail/suivi']), 150);
    }

    goToAccueil(): void {
        this.showSuccess = false;
        setTimeout(() => this.router.navigate(['/portail']), 150);
    }


    async startRecording(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            this.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(chunks, { type: 'audio/webm' });
                this.audioUrl  = URL.createObjectURL(this.audioBlob);
                stream.getTracks().forEach(t => t.stop());
            };
            this.mediaRecorder.start();
            this.isRecording       = true;
            this.recordingDuration = 0;
            this.recordingTimer    = setInterval(() => this.recordingDuration++, 1000);
        } catch {
            this.messageService.add({
                severity: 'error', summary: 'Microphone',
                detail: "Impossible d'accéder au microphone"
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
        this.audioBlob = null; this.audioUrl = null; this.recordingDuration = 0;
    }

    formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }


    onFileSelect(event: any): void { this.addFiles(Array.from(event.target.files)); }
    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.addFiles(Array.from(event.dataTransfer?.files || []));
    }

    private addFiles(files: File[]): void {
        const valid = files.filter(f => {
            if (f.size > this.maxSizeMB * 1024 * 1024) {
                this.messageService.add({
                    severity: 'warn', summary: 'Fichier trop volumineux',
                    detail: `${f.name} dépasse ${this.maxSizeMB}MB`
                });
                return false;
            }
            return true;
        });
        this.attachments = [...this.attachments, ...valid].slice(0, this.maxFiles);
    }

    removeAttachment(index: number): void { this.attachments.splice(index, 1); }

    getFileIcon(file: File): string {
        if (file.type.includes('image')) return 'pi pi-image';
        if (file.type.includes('pdf'))   return 'pi pi-file-pdf';
        if (file.type.includes('word'))  return 'pi pi-file-word';
        if (file.type.includes('video')) return 'pi pi-video';
        if (file.type.includes('audio')) return 'pi pi-volume-up';
        return 'pi pi-file';
    }

    getFileBg(file: File): string {
        if (file.type.includes('image')) return '#dbeafe';
        if (file.type.includes('pdf'))   return '#fee2e2';
        if (file.type.includes('video')) return '#ede9fe';
        if (file.type.includes('audio')) return '#fce7f3';
        return '#f3f4f6';
    }

    getFileColor(file: File): string {
        if (file.type.includes('image')) return '#2563eb';
        if (file.type.includes('pdf'))   return '#dc2626';
        if (file.type.includes('video')) return '#7c3aed';
        if (file.type.includes('audio')) return '#db2777';
        return '#6b7280';
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    getTypeLabel(type: string | null): string {
        if (!type) return '';
        return this.typeOptions.find(o => o.value === type)?.label || type;
    }


    submit(): void {
        this.submitting = true;

        const request = {
            type:             this.f['type'].value as any,
            submissionMode:   'WEB_FORM' as any,
            object:           this.f['object'].value!,
            description:      this.f['description'].value     || undefined,
            incidentLocation: this.f['incidentLocation'].value || undefined,
            incidentPeriod:   this.f['incidentPeriod'].value   || undefined,
            estimatedLoss:    this.f['estimatedLoss'].value    || undefined,
            declarantData: {
                typeDeclarant:          this.fd['anonymous'].value ? 'ANONYMOUS' as any : 'CITIZEN' as any,
                firstName:              this.fd['firstName'].value   || undefined,
                lastName:               this.fd['lastName'].value    || undefined,
                email:                  this.fd['email'].value       || undefined,
                phoneNumber:            this.fd['phoneNumber'].value || undefined,
                commune:                this.fd['commune'].value     || undefined,
                province:               this.fd['province'].value    || undefined,
                anonymous:              this.fd['anonymous'].value             || false,
                dataProcessingConsent:  this.fd['dataProcessingConsent'].value || true,
                notificationsAccepted:  this.fd['notificationsAccepted'].value || true,
                protectionRequested:    this.fd['protectionRequested'].value   || false,
                protectionAcknowledged: this.protectionAcknowledged
            }
        };

        this.dossierService.submit(request).subscribe({
            next: dossier => {
                this.createdAccessCode = dossier.accessCode;
                const allFiles = [...this.attachments];
                if (this.audioBlob) {
                    allFiles.push(new File(
                        [this.audioBlob],
                        `temoignage_audio_${Date.now()}.webm`,
                        { type: 'audio/webm' }
                    ));
                }
                if (allFiles.length > 0) {
                    this.attachmentService.upload(dossier.id, allFiles).subscribe({
                        next:  () => { this.submitting = false; this.showSuccess = true; },
                        error: () => { this.submitting = false; this.showSuccess = true; }
                    });
                } else {
                    this.submitting = false; this.showSuccess = true;
                }
            },
            error: err => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de soumettre. Réessayez.'
                });
            }
        });
    }
}