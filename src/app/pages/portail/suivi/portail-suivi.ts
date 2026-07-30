import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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

        :host {
            --green:#009640; --red:#E30613; --yellow:#FFD800;
            --ink:#003617; --paper:#FFFFFF; --mist:#F2F8F4;
            --ink-60:rgba(0,54,23,.62); --ink-40:rgba(0,54,23,.4);
            --hair:#E4E9E6;
            --font: 'Lato', system-ui, sans-serif;
            --font-display: ui-serif, Georgia, 'Times New Roman', serif;
            --mono: ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, monospace;
            display:block; font-family:var(--font);
        }

        .page {
            min-height:100vh;
            background: var(--paper);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:2rem 1rem;
        }

        .wrap { width:100%; max-width:420px; }

        /* ── Carte recherche ──────── */
        .search-card {
            background:#fff;
            border-radius:16px;
            padding:1.75rem;
            border:1.5px solid var(--hair);
            box-shadow:0 4px 24px rgba(0,0,0,.05);
            animation:slide-up .35s ease;
        }

        .code-input {
            font-family:var(--mono);
            font-size:1.6rem;
            font-weight:900;
            letter-spacing:.45em;
            text-align:center;
            text-transform:uppercase;
            border:2.5px solid var(--hair);
            border-radius:12px;
            padding:1rem;
            width:100%;
            outline:none;
            transition:all .2s;
            color:var(--ink);
            background:var(--mist);
            box-sizing:border-box;
        }
        .code-input:focus {
            border-color:var(--green);
            background:#fff;
            box-shadow:0 0 0 4px rgba(0,150,64,.1);
        }

        .search-btn {
            width:100%;
            padding:.9rem;
            border-radius:10px;
            border:none;
            background:var(--green);
            color:#fff;
            font-weight:800;
            font-size:.95rem;
            cursor:pointer;
            transition:all .2s;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:.625rem;
            box-shadow:0 4px 14px rgba(0,150,64,.3);
        }
        .search-btn:hover:not(:disabled) {
            transform:translateY(-2px);
            box-shadow:0 8px 20px rgba(0,150,64,.4);
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
            border-radius:10px;
            background:var(--red);
            color:#fff;
            font-weight:700;
            font-size:.875rem;
            text-decoration:none;
            cursor:pointer;
            border:none;
            width:100%;
            margin-top:1.25rem;
            box-shadow:0 4px 12px rgba(227,6,19,.3);
            transition:all .2s;
        }
        .complement-btn:hover {
            transform:translateY(-1px);
            background:#c00511;
            box-shadow:0 6px 18px rgba(227,6,19,.4);
        }

        /* Boutons bas */
        .btn-reset {
            padding:.7rem 1.5rem;
            border-radius:10px;
            border:1.5px solid var(--hair);
            background:#fff;
            color:var(--ink);
            font-weight:600;
            font-size:.875rem;
            cursor:pointer;
            display:flex;
            align-items:center;
            gap:.5rem;
            transition:all .2s;
        }
        .btn-reset:hover { border-color:var(--ink-40); background:var(--mist); }

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
        <div style="height:96px;margin:0 auto .875rem;display:flex;align-items:center;justify-content:center;">
            <img src="assets/logo-asce.png" alt="ASCE-LC"
                style="height:100%;width:auto;object-fit:contain;" />
        </div>
        <h1 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--ink);
                   margin:0 0 .25rem;letter-spacing:-.2px;">
            Suivi de dossier
        </h1>
        <p style="color:var(--ink-40);font-size:.8rem;margin:0;">BURKINA FASO</p>
    </div>

    <div *ngIf="!dossier" class="search-card">

        <p style="text-align:center;font-size:.85rem;color:var(--ink-60);
                  margin:0 0 1.25rem;line-height:1.6;">
            Entrez le code de suivi reçu lors de votre dépôt
            <strong style="color:var(--ink);">(formulaire B4)</strong>
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
                    ? 'var(--green)' : 'var(--hair)'">
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
                   background:#FDEBEC;border-radius:10px;
                   border:1.5px solid var(--red);
                   display:flex;align-items:center;gap:.75rem;">
            <i class="pi pi-times-circle" style="color:var(--red);font-size:1.1rem;flex-shrink:0;"></i>
            <div>
                <div style="font-weight:700;color:var(--red);font-size:.875rem;">
                    Code introuvable
                </div>
                <div style="font-size:.775rem;color:var(--red);margin-top:2px;">
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
            <span style="font-family:var(--mono);font-size:.8rem;font-weight:700;
                         color:var(--ink-40);letter-spacing:.2em;">
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
                color:var(--ink-40);font-size:.75rem;">
        <p style="margin:0 0 3px;">ASCE-LC — Numéro vert</p>
        <a href="tel:80001157"
            style="color:var(--green);text-decoration:none;font-weight:700;font-size:.875rem;">
            <i class="pi pi-phone" style="font-size:.7rem;margin-right:4px;"></i>
            80 00 11 57
        </a>
    </div>

</div>
</div>
    `
})
export class PortailSuivi implements OnInit {

    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);
    private route          = inject(ActivatedRoute);

    accessCode = '';
    loading    = false;
    notFound   = false;
    dossier: DossierResponse | null = null;

    ngOnInit(): void {
        const code = this.route.snapshot.queryParamMap.get('code');
        if (code) {
            this.accessCode = code.toUpperCase();
            this.search();
        }
    }

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

    /**
     * Chaque statut est rattaché à l'une des 4 teintes de la charte :
     * noir (neutre/informatif), jaune (attention requise), vert (progression
     * positive), rouge (rejeté) — pas de couleur hors charte.
     */
    private readonly statusTone: Record<string, 'ink' | 'yellow' | 'green' | 'red'> = {
        SOUMIS: 'ink', RECU: 'ink', RAPPORT_PRODUIT: 'ink',
        TRANSFERE: 'ink', CLASSE: 'ink',
        EN_ETUDE_OPPORTUNITE: 'yellow', EN_ATTENTE_COMPLEMENT: 'yellow', EN_REVUE_CTADP: 'yellow',
        RECEVABLE: 'green', EN_INVESTIGATION: 'green', DECISION_RENDUE: 'green', CLOS: 'green',
        IRRECEVABLE: 'red'
    };

    private tone(s: string): 'ink' | 'yellow' | 'green' | 'red' {
        return this.statusTone[s] || 'ink';
    }

    getCardBg(s: string): string {
        const m = {
            ink:    'rgba(0,54,23,.05)',
            yellow: 'rgba(255,216,0,.14)',
            green:  'var(--mist)',
            red:    '#FDEBEC'
        };
        return m[this.tone(s)];
    }

    getCardBorder(s: string): string {
        const m = {
            ink:    'rgba(0,54,23,.18)',
            yellow: 'rgba(255,216,0,.5)',
            green:  'rgba(0,150,64,.35)',
            red:    'rgba(227,6,19,.35)'
        };
        return m[this.tone(s)];
    }

    getCardColor(s: string): string {
        const m = {
            ink: 'var(--ink)', yellow: 'var(--ink)',
            green: 'var(--green)', red: 'var(--red)'
        };
        return m[this.tone(s)];
    }

    getIconBg(s: string): string {
        const m = {
            ink:    'rgba(0,54,23,.09)',
            yellow: 'rgba(255,216,0,.28)',
            green:  'rgba(0,150,64,.16)',
            red:    'rgba(227,6,19,.16)'
        };
        return m[this.tone(s)];
    }

    getProgressColor(s: string): string {
        const m = {
            ink: 'var(--ink)', yellow: 'var(--yellow)',
            green: 'var(--green)', red: 'var(--red)'
        };
        return m[this.tone(s)];
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