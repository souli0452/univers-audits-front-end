import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse } from '../../../core/models/dossier.model';

@Component({
    selector: 'app-portail-suivi',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, InputTextModule, ToastModule
    ],
    providers: [MessageService],
    styles: [`
        @keyframes slide-up {
            from { opacity:0; transform:translateY(20px); }
            to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulse-ring {
            0%   { transform:scale(1);   opacity:.6; }
            100% { transform:scale(1.8); opacity:0; }
        }
        @keyframes result-in {
            from { opacity:0; transform:scale(.96); }
            to   { opacity:1; transform:scale(1); }
        }

        :host { display:block; }

        .page {
            min-height:100vh;
            background:
                radial-gradient(ellipse 800px 600px at 20% 0%, #dcfce7 0%, transparent 55%),
                radial-gradient(ellipse 600px 400px at 80% 100%, #dbeafe 0%, transparent 55%),
                #f8fafc;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:2rem 1rem;
        }

        .wrap { width:100%; max-width:420px; }

        /* ── Carte recherche ──────── */
        .search-card {
            background:#fff;
            border-radius:24px;
            padding:1.75rem;
            border:1.5px solid rgba(22,163,74,.15);
            box-shadow:0 4px 24px rgba(22,163,74,.08);
            animation:slide-up .35s ease;
        }

        .code-input {
            font-family:'Courier New',monospace;
            font-size:1.6rem;
            font-weight:900;
            letter-spacing:.45em;
            text-align:center;
            text-transform:uppercase;
            border:2.5px solid #e5e7eb;
            border-radius:16px;
            padding:1rem;
            width:100%;
            outline:none;
            transition:all .2s;
            color:#111827;
            background:#fafafa;
            box-sizing:border-box;
        }
        .code-input:focus {
            border-color:#16a34a;
            background:#fff;
            box-shadow:0 0 0 4px rgba(22,163,74,.1);
        }

        .search-btn {
            width:100%;
            padding:.9rem;
            border-radius:14px;
            border:none;
            background:linear-gradient(135deg,#16a34a,#22c55e);
            color:#fff;
            font-weight:800;
            font-size:.95rem;
            cursor:pointer;
            transition:all .2s;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:.625rem;
            box-shadow:0 4px 14px rgba(22,163,74,.3);
        }
        .search-btn:hover:not(:disabled) {
            transform:translateY(-2px);
            box-shadow:0 8px 20px rgba(22,163,74,.4);
        }
        .search-btn:disabled { opacity:.45; cursor:not-allowed; }

        /* ── Résultat ─────────────── */
        .result-card {
            border-radius:24px;
            padding:2rem 1.75rem;
            animation:result-in .4s ease;
            text-align:center;
            position:relative;
            overflow:hidden;
        }
        .result-card::before {
            content:'';
            position:absolute;
            top:-60px; right:-60px;
            width:200px; height:200px;
            border-radius:50%;
            opacity:.06;
            background:currentColor;
            pointer-events:none;
        }

        /* Indicateur pulsant */
        .pulse-wrap {
            position:relative;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            margin-bottom:1.25rem;
        }
        .pulse-ring {
            position:absolute;
            inset:-12px;
            border-radius:50%;
            border:3px solid currentColor;
            animation:pulse-ring 2s ease-out infinite;
        }
        .status-icon-circle {
            width:72px;
            height:72px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            position:relative;
            z-index:1;
        }

        /* Étape courante */
        .current-step {
            display:inline-flex;
            align-items:center;
            gap:.5rem;
            font-size:.78rem;
            font-weight:700;
            padding:5px 14px;
            border-radius:20px;
            margin-bottom:1.5rem;
            letter-spacing:.04em;
            text-transform:uppercase;
        }

        /* Barre de progression simple */
        .progress-bar-track {
            height:8px;
            background:rgba(0,0,0,.08);
            border-radius:4px;
            overflow:hidden;
            margin-bottom:.5rem;
        }
        .progress-bar-fill {
            height:100%;
            border-radius:4px;
            transition:width .8s ease;
        }
        .progress-labels {
            display:flex;
            justify-content:space-between;
            font-size:.72rem;
            font-weight:600;
            opacity:.6;
        }

        /* Action complément */
        .complement-btn {
            display:flex;
            align-items:center;
            justify-content:center;
            gap:.5rem;
            padding:.8rem 1.5rem;
            border-radius:12px;
            background:linear-gradient(135deg,#f59e0b,#d97706);
            color:#fff;
            font-weight:700;
            font-size:.875rem;
            text-decoration:none;
            cursor:pointer;
            border:none;
            width:100%;
            margin-top:1.25rem;
            box-shadow:0 4px 12px rgba(245,158,11,.3);
            transition:all .2s;
        }
        .complement-btn:hover {
            transform:translateY(-1px);
            box-shadow:0 6px 18px rgba(245,158,11,.4);
        }

        /* Boutons bas */
        .btn-reset {
            padding:.7rem 1.5rem;
            border-radius:12px;
            border:1.5px solid #e5e7eb;
            background:#fff;
            color:#374151;
            font-weight:600;
            font-size:.875rem;
            cursor:pointer;
            display:flex;
            align-items:center;
            gap:.5rem;
            transition:all .2s;
        }
        .btn-reset:hover { border-color:#d1d5db; background:#f9fafb; }

        @media (max-width:440px) {
            .code-input { font-size:1.3rem; letter-spacing:.3em; }
        }
    `],
    template: `
<p-toast />

<div class="page">
<div class="wrap">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:1.75rem;animation:slide-up .3s ease;">
        <div style="width:80px;height:80px;border-radius:50%;
            border:3px solid #16a34a;overflow:hidden;
            margin:0 auto .875rem;background:#fff;
            box-shadow:0 6px 24px rgba(22,163,74,.18);">
            <img src="assets/logo-integrite.png" alt="ASCE-LC"
                style="width:100%;height:100%;object-fit:contain;" />
        </div>
        <h1 style="font-size:1.4rem;font-weight:900;color:#111827;
                   margin:0 0 .25rem;letter-spacing:-.4px;">
            Suivi de dossier
        </h1>
        <p style="color:#9ca3af;font-size:.8rem;margin:0;">ASCE-LC — Intégrité+</p>
    </div>

    <div *ngIf="!dossier" class="search-card">

        <p style="text-align:center;font-size:.85rem;color:#6b7280;
                  margin:0 0 1.25rem;line-height:1.6;">
            Entrez le code de suivi reçu lors de votre dépôt
            <strong style="color:#374151;">(formulaire B4)</strong>
        </p>

        <input class="code-input"
            [(ngModel)]="accessCode"
            placeholder="EX: BCS5XHRG"
            maxlength="8"
            (keyup.enter)="search()"
            (ngModelChange)="accessCode=$event?.toUpperCase(); notFound=false"
            style="display:block;margin-bottom:.875rem;" />

        <!-- Indicateur 8 cases -->
        <div style="display:flex;justify-content:center;gap:4px;margin-bottom:1.25rem;">
            <div *ngFor="let i of codeSlots"
                style="width:30px;height:5px;border-radius:3px;transition:all .2s;"
                [style.background]="accessCode.length > i
                    ? 'linear-gradient(90deg,#16a34a,#22c55e)' : '#e5e7eb'">
            </div>
        </div>

        <button class="search-btn"
            (click)="search()"
            [disabled]="loading || !accessCode || accessCode.length < 6">
            <i [class]="loading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"></i>
            {{ loading ? 'Recherche...' : 'Rechercher' }}
        </button>

        <!-- Erreur -->
        <div *ngIf="notFound"
            style="margin-top:.875rem;padding:.875rem;
                   background:#fff5f5;border-radius:12px;
                   border:1.5px solid #fca5a5;
                   display:flex;align-items:center;gap:.75rem;">
            <i class="pi pi-times-circle" style="color:#ef4444;font-size:1.1rem;flex-shrink:0;"></i>
            <div>
                <div style="font-weight:700;color:#b91c1c;font-size:.875rem;">
                    Code introuvable
                </div>
                <div style="font-size:.775rem;color:#ef4444;margin-top:2px;">
                    Vérifiez le code sur votre reçu B4.
                </div>
            </div>
        </div>
    </div>

    <ng-container *ngIf="dossier">

        <!-- Carte statut principal -->
        <div class="result-card"
            [style.background]="getCardBg(dossier.status)"
            [style.border]="'2px solid ' + getCardBorder(dossier.status)"
            style="margin-bottom:1rem;"
            [style.color]="getCardColor(dossier.status)">

            <!-- Icône pulsante -->
            <div class="pulse-wrap"
                [style.color]="getCardColor(dossier.status)">
                <div *ngIf="isActive(dossier.status)" class="pulse-ring"></div>
                <div class="status-icon-circle"
                    [style.background]="getIconBg(dossier.status)">
                    <i [class]="getStatusIcon(dossier.status)"
                        style="font-size:1.75rem;"
                        [style.color]="getCardColor(dossier.status)"></i>
                </div>
            </div>

            <!-- Niveau actuel -->
            <div style="font-size:1.2rem;font-weight:900;margin-bottom:.375rem;
                        letter-spacing:-.3px;">
                {{ getStatusLabel(dossier.status) }}
            </div>

            <!-- Message unique et court -->
            <p style="font-size:.875rem;line-height:1.6;margin:0 0 1.5rem;
                      opacity:.85;">
                {{ getShortMessage(dossier.status) }}
            </p>

            <!-- Barre de progression -->
            <div class="progress-bar-track">
                <div class="progress-bar-fill"
                    [style.width]="getProgress(dossier.status) + '%'"
                    [style.background]="getProgressColor(dossier.status)">
                </div>
            </div>
            <div class="progress-labels">
                <span>Dépôt</span>
                <span style="opacity:.9;font-size:.7rem;">
                    Étape {{ getStepNumber(dossier.status) }}
                    / {{ totalSteps }}
                </span>
                <span>Clôture</span>
            </div>

            <!-- CTA complément -->
            <a *ngIf="dossier.status === 'EN_ATTENTE_COMPLEMENT'"
               [routerLink]="['/portail/complement']"
               [queryParams]="{code: dossier.accessCode}"
               class="complement-btn">
                <i class="pi pi-upload"></i>
                Soumettre mon complément
                <i class="pi pi-arrow-right"
                    style="font-size:.75rem;margin-left:auto;"></i>
            </a>
        </div>

        <!-- Code de suivi discret -->
        <div style="text-align:center;margin-bottom:1.25rem;">
            <span style="font-family:monospace;font-size:.8rem;font-weight:700;
                         color:#9ca3af;letter-spacing:.2em;">
                CODE : {{ dossier.accessCode }}
            </span>
        </div>

        <!-- Bouton nouvelle recherche -->
        <div style="display:flex;justify-content:center;">
            <button class="btn-reset" (click)="reset()">
                <i class="pi pi-refresh"></i>
                Nouvelle recherche
            </button>
        </div>

    </ng-container>

    <!-- Footer -->
    <div style="text-align:center;margin-top:2rem;
                color:#9ca3af;font-size:.75rem;">
        <p style="margin:0 0 3px;">ASCE-LC — Numéro vert</p>
        <a href="tel:80001157"
            style="color:#16a34a;text-decoration:none;font-weight:700;font-size:.875rem;">
            <i class="pi pi-phone" style="font-size:.7rem;margin-right:4px;"></i>
            80 00 11 57
        </a>
    </div>

</div>
</div>
    `
})
export class PortailSuivi {

    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);

    accessCode = '';
    loading    = false;
    notFound   = false;
    dossier: DossierResponse | null = null;

    readonly codeSlots   = [0,1,2,3,4,5,6,7];
    readonly totalSteps  = 10;

    private readonly stepOrder = [
        'SOUMIS', 'RECU', 'EN_ETUDE_OPPORTUNITE',
        'EN_ATTENTE_COMPLEMENT', 'EN_REVUE_CTADP',
        'RECEVABLE', 'EN_INVESTIGATION',
        'RAPPORT_PRODUIT', 'DECISION_RENDUE', 'CLOS'
    ];

    search(): void {
        if (!this.accessCode || this.accessCode.length < 6) return;
        this.loading  = true;
        this.notFound = false;
        this.dossier  = null;
        this.dossierService
            .trackByAccessCode(this.accessCode.toUpperCase())
            .subscribe({
                next: d  => { this.dossier = d; this.loading = false; },
                error: () => { this.notFound = true; this.loading = false; }
            });
    }

    reset(): void { this.dossier = null; this.accessCode = ''; this.notFound = false; }

    getStepNumber(status: string): number {
        const i = this.stepOrder.indexOf(status);
        return i >= 0 ? i + 1 : 1;
    }

    getProgress(status: string): number {
        if (['IRRECEVABLE', 'CLASSE'].includes(status)) return 100;
        if (status === 'TRANSFERE') return 50;
        const i = this.stepOrder.indexOf(status);
        if (i < 0) return 5;
        return Math.round(((i + 1) / this.stepOrder.length) * 100);
    }

    isActive(status: string): boolean {
        return !['CLOS', 'CLASSE', 'IRRECEVABLE', 'TRANSFERE'].includes(status);
    }

    getCardBg(s: string): string {
        const m: Record<string, string> = {
            SOUMIS:'linear-gradient(135deg,#eff6ff,#dbeafe)',
            RECU:'linear-gradient(135deg,#eff6ff,#dbeafe)',
            EN_ETUDE_OPPORTUNITE:'linear-gradient(135deg,#fffbeb,#fef3c7)',
            EN_ATTENTE_COMPLEMENT:'linear-gradient(135deg,#fff7ed,#fef3c7)',
            EN_REVUE_CTADP:'linear-gradient(135deg,#fffbeb,#fef3c7)',
            RECEVABLE:'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            IRRECEVABLE:'linear-gradient(135deg,#fff5f5,#fee2e2)',
            TRANSFERE:'linear-gradient(135deg,#f9fafb,#f3f4f6)',
            EN_INVESTIGATION:'linear-gradient(135deg,#faf5ff,#ede9fe)',
            RAPPORT_PRODUIT:'linear-gradient(135deg,#eff6ff,#dbeafe)',
            DECISION_RENDUE:'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            CLOS:'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            CLASSE:'linear-gradient(135deg,#f9fafb,#f3f4f6)'
        };
        return m[s] || 'linear-gradient(135deg,#eff6ff,#dbeafe)';
    }

    getCardBorder(s: string): string {
        const m: Record<string,string> = {
            SOUMIS:'#93c5fd', RECU:'#93c5fd',
            EN_ETUDE_OPPORTUNITE:'#fcd34d', EN_ATTENTE_COMPLEMENT:'#fbbf24',
            EN_REVUE_CTADP:'#fcd34d', RECEVABLE:'#86efac',
            IRRECEVABLE:'#fca5a5', TRANSFERE:'#e5e7eb',
            EN_INVESTIGATION:'#c4b5fd', RAPPORT_PRODUIT:'#93c5fd',
            DECISION_RENDUE:'#86efac', CLOS:'#86efac', CLASSE:'#e5e7eb'
        };
        return m[s] || '#93c5fd';
    }

    getCardColor(s: string): string {
        const m: Record<string,string> = {
            SOUMIS:'#1e40af', RECU:'#1e40af',
            EN_ETUDE_OPPORTUNITE:'#92400e', EN_ATTENTE_COMPLEMENT:'#9a3412',
            EN_REVUE_CTADP:'#92400e', RECEVABLE:'#166534',
            IRRECEVABLE:'#991b1b', TRANSFERE:'#374151',
            EN_INVESTIGATION:'#5b21b6', RAPPORT_PRODUIT:'#1e40af',
            DECISION_RENDUE:'#166534', CLOS:'#166534', CLASSE:'#374151'
        };
        return m[s] || '#1e40af';
    }

    getIconBg(s: string): string {
        const m: Record<string,string> = {
            SOUMIS:'#dbeafe', RECU:'#dbeafe',
            EN_ETUDE_OPPORTUNITE:'#fde68a', EN_ATTENTE_COMPLEMENT:'#fef3c7',
            EN_REVUE_CTADP:'#fde68a', RECEVABLE:'#bbf7d0',
            IRRECEVABLE:'#fee2e2', TRANSFERE:'#e5e7eb',
            EN_INVESTIGATION:'#ddd6fe', RAPPORT_PRODUIT:'#dbeafe',
            DECISION_RENDUE:'#bbf7d0', CLOS:'#bbf7d0', CLASSE:'#e5e7eb'
        };
        return m[s] || '#dbeafe';
    }

    getProgressColor(s: string): string {
        const m: Record<string,string> = {
            SOUMIS:'#3b82f6', RECU:'#3b82f6',
            EN_ETUDE_OPPORTUNITE:'#f59e0b', EN_ATTENTE_COMPLEMENT:'#f59e0b',
            EN_REVUE_CTADP:'#f59e0b', RECEVABLE:'#22c55e',
            IRRECEVABLE:'#ef4444', TRANSFERE:'#6b7280',
            EN_INVESTIGATION:'#8b5cf6', RAPPORT_PRODUIT:'#3b82f6',
            DECISION_RENDUE:'#16a34a', CLOS:'#16a34a', CLASSE:'#6b7280'
        };
        return m[s] || '#3b82f6';
    }

    getStatusLabel(s: string): string {
        const m: Record<string,string> = {
            SOUMIS:'Dossier déposé',
            RECU:'Dossier enregistré',
            EN_ETUDE_OPPORTUNITE:'Étude en cours',
            EN_ATTENTE_COMPLEMENT:'Complément requis',
            EN_REVUE_CTADP:'Examen CTADP',
            RECEVABLE:'Dossier recevable',
            IRRECEVABLE:'Dossier irrecevable',
            TRANSFERE:'Dossier transféré',
            EN_INVESTIGATION:'Enquête en cours',
            RAPPORT_PRODUIT:'Rapport en validation',
            DECISION_RENDUE:'Décision rendue',
            CLOS:'Dossier clôturé',
            CLASSE:'Dossier classé'
        };
        return m[s] || s;
    }

    getShortMessage(s: string): string {
        const m: Record<string,string> = {
            SOUMIS:
                "Votre signalement a bien été reçu. Il sera enregistré sous 7 jours ouvrables.",
            RECU:
                "Votre dossier est officiellement enregistré. Une étude de recevabilité va débuter.",
            EN_ETUDE_OPPORTUNITE:
                "Votre dossier est examiné par un conseiller juridique.",
            EN_ATTENTE_COMPLEMENT:
                "Des informations supplémentaires sont nécessaires. Merci de soumettre votre complément.",
            EN_REVUE_CTADP:
                "Votre dossier est en délibération au Comité de Traitement.",
            RECEVABLE:
                "Votre dossier a été déclaré recevable. Une investigation va être ouverte.",
            IRRECEVABLE:
                "Votre dossier a été déclaré irrecevable. Une réponse motivée vous sera envoyée.",
            TRANSFERE:
                "Votre dossier a été transmis à l'institution compétente.",
            EN_INVESTIGATION:
                "Une équipe enquête activement sur votre dossier.",
            RAPPORT_PRODUIT:
                "L'enquête est terminée. Le rapport est en cours de validation.",
            DECISION_RENDUE:
                "La décision finale a été rendue. Vous serez informé des suites.",
            CLOS:
                "Votre dossier a été traité et clôturé. Merci pour votre signalement.",
            CLASSE:
                "Votre dossier a été classé sans suite."
        };
        return m[s] || 'Votre dossier est en cours de traitement.';
    }

    getStatusIcon(s: string): string {
        const m: Record<string,string> = {
            SOUMIS:'pi pi-upload', RECU:'pi pi-inbox',
            EN_ETUDE_OPPORTUNITE:'pi pi-search',
            EN_ATTENTE_COMPLEMENT:'pi pi-exclamation-triangle',
            EN_REVUE_CTADP:'pi pi-users', RECEVABLE:'pi pi-check-circle',
            IRRECEVABLE:'pi pi-times-circle', TRANSFERE:'pi pi-send',
            EN_INVESTIGATION:'pi pi-eye', RAPPORT_PRODUIT:'pi pi-file',
            DECISION_RENDUE:'pi pi-hammer', CLOS:'pi pi-lock',
            CLASSE:'pi pi-folder'
        };
        return m[s] || 'pi pi-info-circle';
    }
}