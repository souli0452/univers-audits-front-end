import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { NUMERO_VERT, lienTelephone } from '../../../core/constants/numero-vert';
import { TailleTexte } from '../shared/taille-texte';
import { PdfService } from '../../../core/services/pdf.service';
import { DossierResponse } from '../../../core/models/dossier.model';

@Component({
    selector: 'app-portail-suivi',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, InputTextModule, ToastModule, TailleTexte
    ],
    providers: [MessageService],
    styles: [`
        @keyframes slide-up {
            from { opacity:0; transform:translateY(20px); }
            to   { opacity:1; transform:translateY(0); }
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
        .result {
            background:#fff;
            border:1px solid var(--hair);
            border-radius:12px;
            overflow:hidden;
            animation:result-in .3s ease;
        }
        .result-head { padding:1.5rem 1.5rem 1.25rem; }
        .result-label { font-size:.8rem; font-weight:700; color:var(--accent, var(--green)); }
        .result-title {
            font-family:var(--font-display); font-size:1.75rem; line-height:1.2;
            font-weight:700; color:var(--ink); margin:.35rem 0 .6rem;
        }
        .result-msg { font-size:.975rem; line-height:1.6; color:var(--ink-60); margin:0; }

        .result-details { margin:0; padding:1.1rem 1.5rem; background:var(--mist); }
        .result-details .row { display:flex; justify-content:space-between; align-items:baseline; gap:1rem; padding:.4rem 0; }
        .result-details dt { font-size:.82rem; color:var(--ink-60); flex-shrink:0; }
        .result-details dd { margin:0; font-size:.92rem; font-weight:600; color:var(--ink); text-align:right; overflow-wrap:anywhere; }
        .result-details dd.code { font-family:var(--mono); letter-spacing:.14em; }

        .result-actions { padding:1.25rem 1.5rem 1.5rem; display:flex; flex-direction:column; gap:.75rem; }

        .btn-main {
            width:100%; padding:.8rem 1rem; border-radius:10px; border:none;
            background:var(--ink); color:#fff; font-weight:700; font-size:.95rem;
            cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem;
            transition:background .15s;
        }
        .btn-main:hover:not(:disabled) { background:#00280f; }
        .btn-main:disabled { opacity:.55; cursor:default; }
        .complement-btn {
            display:flex; align-items:center; justify-content:center; gap:.5rem;
            padding:.8rem 1rem; border-radius:10px;
            background:var(--red); color:#fff; font-weight:700; font-size:.95rem; text-decoration:none;
        }
        .complement-btn:hover { background:#c00511; }
        .link-reset {
            background:none; border:none; cursor:pointer; color:var(--ink-60);
            font:600 .875rem var(--font); text-decoration:underline; text-underline-offset:3px; padding:.5rem;
        }
        .link-reset:hover { color:var(--ink); }
        .btn-main:focus-visible, .complement-btn:focus-visible, .link-reset:focus-visible {
            outline:3px solid var(--yellow); outline-offset:2px;
        }
        @media (prefers-reduced-motion: reduce) { .result { animation:none; } }

        @media (max-width:440px) {
            .code-input { font-size:1.3rem; letter-spacing:.3em; }
        }
    `],
    template: `
<p-toast />

<div class="page">
<div class="wrap">

    <div style="display:flex;justify-content:flex-end;margin-bottom:.5rem;color:var(--ink);"><app-taille-texte /></div>

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
            <strong style="color:var(--ink);">(sur votre récépissé)</strong>
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
                    Vérifiez le code sur votre récépissé.
                </div>
            </div>
        </div>
    </div>

    <ng-container *ngIf="dossier">

        <section class="result" [style.--accent]="accent(dossier.status)" aria-live="polite">

            <div class="result-head">
                <div class="result-label">Statut de votre dossier</div>
                <h2 class="result-title">{{ getStatusLabel(dossier.status) }}</h2>
                <p class="result-msg">{{ getShortMessage(dossier.status) }}</p>
            </div>

            <dl class="result-details">
                <div class="row">
                    <dt>Code de suivi</dt>
                    <dd class="code">{{ dossier.accessCode }}</dd>
                </div>
                <div class="row" *ngIf="dossier.number">
                    <dt>Numéro d'enregistrement</dt>
                    <dd>{{ dossier.number }}</dd>
                </div>
                <div class="row" *ngIf="dossier.object">
                    <dt>Objet</dt>
                    <dd>{{ dossier.object }}</dd>
                </div>
                <div class="row" *ngIf="dossier.createdAt">
                    <dt>Date de dépôt</dt>
                    <dd>{{ dossier.createdAt | date:'dd/MM/yyyy' }}</dd>
                </div>
                <div class="row" *ngIf="dossier.updatedAt">
                    <dt>Dernière mise à jour</dt>
                    <dd>{{ dossier.updatedAt | date:'dd/MM/yyyy' }}</dd>
                </div>
            </dl>

            <div class="result-actions">
                <a *ngIf="dossier.status === 'EN_ATTENTE_COMPLEMENT'"
                   [routerLink]="['/portail/complement']"
                   [queryParams]="{code: dossier.accessCode}"
                   class="complement-btn">
                    <i class="pi pi-upload"></i>
                    Envoyer mon complément
                </a>

                <button class="btn-main" (click)="downloadRecepisse()" [disabled]="downloadingRecepisse">
                    <i [class]="downloadingRecepisse ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
                    Télécharger mon récépissé
                </button>
            </div>
        </section>

        <div style="text-align:center;margin-top:1rem;">
            <button class="link-reset" (click)="reset()">Suivre un autre dossier</button>
        </div>

    </ng-container>

    <!-- Footer -->
    <div style="text-align:center;margin-top:2rem;
                color:var(--ink-40);font-size:.75rem;">
        <p style="margin:0 0 3px;">ASCE-LC — Numéro vert</p>
        <a [href]="lienTel"
            style="color:var(--green);text-decoration:none;font-weight:700;font-size:.875rem;display:inline-block;padding:.6rem 1rem;">
            <i class="pi pi-phone" style="font-size:.7rem;margin-right:4px;"></i>
            {{ numeroVert }}
        </a>
    </div>

</div>
</div>
    `
})
export class PortailSuivi implements OnInit {

    readonly numeroVert = NUMERO_VERT;
    readonly lienTel = lienTelephone(NUMERO_VERT);

    private dossierService = inject(DossierService);
    private pdfService     = inject(PdfService);
    private messageService = inject(MessageService);
    private route          = inject(ActivatedRoute);

    accessCode = '';
    loading    = false;
    notFound   = false;
    dossier: DossierResponse | null = null;
    downloadingRecepisse = false;

    ngOnInit(): void {
        const code = this.route.snapshot.queryParamMap.get('code');
        if (code) {
            this.accessCode = code.toUpperCase();
            this.search();
        }
    }

    readonly codeSlots   = [0,1,2,3,4,5,6,7];

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

    downloadRecepisse(): void {
        if (!this.dossier) return;
        this.downloadingRecepisse = true;
        this.pdfService.downloadPublicRecepisse(this.dossier.accessCode).subscribe({
            next: blob => {
                this.pdfService.triggerDownload(blob, `recepisse-${this.dossier!.accessCode}.pdf`);
                this.downloadingRecepisse = false;
            },
            error: () => {
                this.downloadingRecepisse = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Téléchargement du récépissé impossible'
                });
            }
        });
    }

    /** Filet latéral : vert par défaut, jaune si une action est attendue, rouge si rejeté. */
    accent(s: string): string {
        if (s === 'EN_ATTENTE_COMPLEMENT') return 'var(--yellow)';
        if (s === 'IRRECEVABLE') return 'var(--red)';
        return 'var(--green)';
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