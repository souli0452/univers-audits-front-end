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
        :host {
            --primary:#009640; --primary-dark:#007a34;
            --text:#1f2933; --muted:#6b7480; --line:#dfe4e1; --danger:#b3261e;
            --font: 'Lato', system-ui, sans-serif;
            display:block; font-family:var(--font); color:var(--text);
        }

        .page {
            min-height:100vh; background:#fff;
            display:flex; align-items:center; justify-content:center;
            padding:2rem 1rem;
        }
        .wrap { width:100%; max-width:420px; }

        .head { text-align:center; margin-bottom:2.25rem; }
        .head img { height:84px; width:auto; object-fit:contain; display:block; margin:0 auto 1.25rem; }
        .head h1 { font-size:1.5rem; font-weight:700; color:var(--text); margin:0; }

        .intro { text-align:center; font-size:.95rem; line-height:1.6; color:var(--muted); margin:0 0 1.25rem; }

        .code-input {
            display:block; width:100%; box-sizing:border-box; margin-bottom:1rem;
            font:700 1.5rem var(--font); letter-spacing:.35em; text-align:center; text-transform:uppercase;
            padding:.9rem 1rem; color:var(--text); background:#fff;
            border:1px solid var(--line); border-radius:8px; outline:none;
        }
        .code-input::placeholder { color:#b6bdb9; font-weight:400; letter-spacing:.15em; font-size:1.1rem; }
        .code-input:focus { border-color:var(--primary); }

        .btn {
            width:100%; padding:.85rem 1rem; border-radius:8px; border:none;
            background:var(--primary); color:#fff; font:700 .95rem var(--font);
            cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem;
            text-decoration:none;
        }
        .btn:hover:not(:disabled) { background:var(--primary-dark); }
        .btn:disabled { opacity:.45; cursor:not-allowed; }
        .btn + .btn { margin-top:.75rem; }
        .btn-outline { background:#fff; color:var(--primary); border:1px solid var(--primary); }
        .btn-outline:hover:not(:disabled) { background:#f2faf5; }

        .error { margin:1rem 0 0; text-align:center; font-size:.9rem; color:var(--danger); }

        .result { text-align:center; }
        .result-code { font-size:.9rem; color:var(--muted); }
        .result-code strong { color:var(--text); letter-spacing:.12em; margin-left:.35rem; }
        .result-title { font-size:1.75rem; line-height:1.25; font-weight:700; color:var(--primary); margin:1rem 0 .5rem; }
        .result-msg { font-size:1rem; line-height:1.6; color:var(--muted); margin:0 0 1.75rem; }

        .link-reset {
            background:none; border:none; cursor:pointer; color:var(--muted);
            font:600 .9rem var(--font); padding:.5rem;
        }
        .link-reset:hover { color:var(--primary); }

        .btn:focus-visible, .link-reset:focus-visible, .foot a:focus-visible, .code-input:focus-visible {
            outline:2px solid var(--primary); outline-offset:2px;
        }

        .foot { text-align:center; margin-top:2.5rem; font-size:.85rem; color:var(--muted); }
        .foot a { color:var(--primary); text-decoration:none; font-weight:700; display:inline-block; padding:.4rem .75rem; }

        @media (max-width:440px) { .code-input { font-size:1.25rem; letter-spacing:.25em; } }
    `],
    template: `
<p-toast />

<div class="page">
<div class="wrap">

    <div style="display:flex;justify-content:flex-end;margin-bottom:.5rem;color:var(--text);"><app-taille-texte /></div>

    <div class="head">
        <img src="assets/logo-asce.png" alt="ASCE-LC" />
        <h1>Suivi de dossier</h1>
    </div>

    <div *ngIf="!dossier">
        <p class="intro">Saisissez le code de suivi indiqué sur votre récépissé.</p>

        <input class="code-input"
            [(ngModel)]="accessCode"
            placeholder="Code de suivi"
            maxlength="8"
            aria-label="Code de suivi"
            (keyup.enter)="search()"
            (ngModelChange)="accessCode=$event?.toUpperCase(); notFound=false" />

        <button class="btn" (click)="search()"
            [disabled]="loading || !accessCode || accessCode.length < 6">
            <i [class]="loading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"></i>
            {{ loading ? 'Recherche...' : 'Rechercher' }}
        </button>

        <p *ngIf="notFound" class="error" role="alert">
            Code introuvable. Vérifiez le code sur votre récépissé.
        </p>
    </div>

    <section *ngIf="dossier" class="result" aria-live="polite">
        <div class="result-code">Code de suivi <strong>{{ dossier.accessCode }}</strong></div>

        <h2 class="result-title">{{ getStatusLabel(dossier.status) }}</h2>
        <p class="result-msg">{{ getShortMessage(dossier.status) }}</p>

        <a *ngIf="dossier.status === 'EN_ATTENTE_COMPLEMENT'"
           [routerLink]="['/portail/complement']"
           [queryParams]="{code: dossier.accessCode}"
           class="btn">
            <i class="pi pi-upload"></i>
            Envoyer mon complément
        </a>

        <button class="btn" [class.btn-outline]="dossier.status === 'EN_ATTENTE_COMPLEMENT'"
            (click)="downloadRecepisse()" [disabled]="downloadingRecepisse">
            <i [class]="downloadingRecepisse ? 'pi pi-spin pi-spinner' : 'pi pi-download'"></i>
            Télécharger mon récépissé
        </button>

        <div style="margin-top:1rem;">
            <button class="link-reset" (click)="reset()">Suivre un autre dossier</button>
        </div>
    </section>

    <div class="foot">
        <div>Numéro vert</div>
        <a [href]="lienTel">
            <i class="pi pi-phone" style="font-size:.75rem;margin-right:4px;"></i>{{ numeroVert }}
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