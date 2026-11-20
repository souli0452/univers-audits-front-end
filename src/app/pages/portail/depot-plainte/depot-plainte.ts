import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
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
import { TailleTexte } from '../shared/taille-texte';
import { COMPLEMENT_ACCEPT, LIBELLE_EXTENSIONS, isAllowedExtension } from '../../../core/utils/complement-form';
import { typeAudioEnregistre } from '../../../core/utils/audio-enregistre';
import { extraireDuRecit, formaterHeure, formaterJour, resumeDuRecit } from '../../../core/utils/extraction-recit';
import { OrigineSaisie } from '../../../core/models/geographie.model';
import { OrigineGeographique } from '../../../shared/origine-geographique/origine-geographique';
import { DureeAudio } from '../../../shared/duree-audio/duree-audio';
import { AideNumeroVert } from '../shared/aide-numero-vert';
import { AvantDeSignaler } from '../shared/avant-de-signaler';

/** Un récit plus court que cela ne dit presque rien : on invite à en dire davantage (ou à parler). */
const RECIT_MINIMUM = 20;
const OBJET_MESSAGE_VOCAL = 'Signalement déposé par message vocal';

type Volet = 'precisions' | 'preuves' | 'coordonnees';

@Component({
    selector: 'app-depot-plainte',
    standalone: true,
    imports: [
        RouterModule, FormsModule,
        ReactiveFormsModule, ButtonModule, InputTextModule,
        TextareaModule, CheckboxModule, InputNumberModule,
        ToastModule, DialogModule, ConfirmDialogModule,
        TailleTexte, AideNumeroVert, AvantDeSignaler, OrigineGeographique, DureeAudio
    ],
    providers: [MessageService, ConfirmationService],
    styles: [`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes pulse-ring {
            0%   { transform:scale(1);    opacity:.5; }
            100% { transform:scale(1.6);  opacity:0;  }
        }

        :host {
            /* Vert de marque pour les aplats ; vert foncé pour tout texte blanc ou vert sur fond clair (contraste AA) */
            --green:#009640; --green-text:#00753a; --red:#C40510; --yellow:#FFD800;
            --ink:#003617; --paper:#FFFFFF; --mist:#F2F8F4;
            --ink-60:#3f5c4b; --hint:#4a6556;
            --hair:#C9D5CE;
            --font: 'Lato', system-ui, sans-serif;
            --mono: ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, monospace;
            /* La racine du site est à 14 px : on part de 16 px (1,1429 rem), qui suit les boutons A− / A+. */
            display:block; font-family:var(--font); color:var(--ink); font-size:1.1429rem;
        }

        .page { min-height:100vh; background:var(--paper); }

        .navbar {
            background:var(--green-text); padding:0 1.5em; height:60px;
            display:flex; align-items:center; justify-content:space-between;
            position:sticky; top:0; z-index:100;
            box-shadow:0 2px 12px rgba(0,0,0,.15);
        }
        .nav-left { display:flex; align-items:center; gap:.875em; }
        .nav-logo  {
            flex-shrink:0; display:flex; align-items:center; justify-content:center;
            background:rgba(255,255,255,.94); border-radius:9px;
            padding:6px 11px; box-shadow:0 2px 10px rgba(0,0,0,.15);
        }
        .nav-logo img { height:28px; width:auto; object-fit:contain; display:block; }
        .nav-sub   { color:#fff; font-size:.95em; font-weight:700; }
        .nav-right { display:flex; align-items:center; gap:.75em; color:#fff; flex-wrap:wrap; justify-content:flex-end; }
        .skip { position:absolute; left:-9999px; top:0; background:#fff; color:var(--ink); padding:.6em 1em; z-index:10000; font-weight:700; }
        .skip:focus { left:.5em; top:.5em; }

        .content { max-width:760px; margin:0 auto; padding:2.25em 1em 3em; }

        h1 { font-size:2em; line-height:1.2; font-weight:800; color:var(--ink); margin:0 0 .75em; }
        .intro { font-size:1.15em; line-height:1.6; color:var(--ink-60); margin:0 0 .75em; }
        .lien {
            background:none; border:0; padding:.5em 0; min-height:44px; cursor:pointer;
            font:inherit; font-size:1.05em; font-weight:700; color:var(--green-text); text-decoration:underline;
        }
        .lien:focus-visible, .acc-titre:focus-visible, .btn:focus-visible { outline:3px solid var(--ink); outline-offset:3px; }

        .field { display:flex; flex-direction:column; gap:.5em; }
        label, .label { font-size:1.15em; font-weight:800; color:var(--ink); }
        .req { color:var(--red); font-weight:900; margin-left:.2em; }
        .opt { color:var(--hint); font-weight:400; font-size:.95em; }
        .hint { font-size:.95em; line-height:1.5; color:var(--hint); margin:0; }
        .error-msg { color:var(--red); font-size:.95em; font-weight:700; display:flex; align-items:center; gap:.35em; margin:0; }
        .repere { font-size:.95em; font-weight:700; color:var(--green-text); margin:0; display:flex; align-items:center; gap:.35em; }

        .champ {
            width:100%; font-size:1.1em; line-height:1.5; color:var(--ink);
            padding:.8em 1em; border:2px solid var(--hair); border-radius:12px; background:#fff;
        }
        .champ:focus { outline:3px solid var(--green); outline-offset:1px; border-color:var(--green-text); }
        .champ-recit { min-height:13em; font-size:1.15em; line-height:1.6; resize:vertical; }

        .recit-bloc { display:flex; flex-direction:column; gap:.75em; margin-top:1.5em; }
        /* Composants internes (montant, origine géographique) : leurs styles viennent d'ailleurs, on les aligne ici seulement. */
        :host ::ng-deep p-inputnumber { display:block; width:100%; }
        :host ::ng-deep p-inputnumber .p-inputnumber { display:flex; width:100%; }
        :host ::ng-deep p-inputnumber input {
            width:100%; font-size:1.1em; line-height:1.5; color:var(--ink);
            padding:.8em 1em; border:2px solid var(--hair); border-radius:12px; background:#fff;
        }
        :host ::ng-deep p-inputnumber input:focus { outline:3px solid var(--green); outline-offset:1px; border-color:var(--green-text); }
        :host ::ng-deep app-origine-geographique label { font-size:1em; font-weight:700; color:var(--ink); }
        :host ::ng-deep app-origine-geographique select,
        :host ::ng-deep app-origine-geographique input {
            font-size:1.1em; line-height:1.5; padding:.8em 1em; border:2px solid var(--hair); border-radius:12px; min-height:3em;
        }
        .compteur { text-align:right; font-size:.95em; color:var(--hint); }

        .btn {
            display:inline-flex; align-items:center; justify-content:center; gap:.6em;
            min-height:3.25em; padding:0 1.5em; border-radius:12px; cursor:pointer;
            font:inherit; font-size:1.1em; font-weight:800; border:2px solid var(--green-text);
            background:#fff; color:var(--green-text); transition:background .15s, color .15s;
        }
        .btn:hover { background:var(--mist); }
        .btn-envoyer { background:var(--green-text); color:#fff; flex:1 1 16em; }
        .btn-envoyer:hover { background:#005f2e; }
        .btn-effacer { border-color:var(--hair); color:var(--ink-60); }
        .mode-choix { display:grid; grid-template-columns:1fr 1fr; gap:.75em; margin-bottom:.5em; }
        .mode-choix button {
            min-height:3.5em; padding:.5em 1em; border:2px solid var(--hair); border-radius:12px; background:#fff; cursor:pointer;
            font:inherit; font-size:1.1em; font-weight:800; color:var(--ink); display:flex; align-items:center; justify-content:center; gap:.5em;
        }
        .mode-choix button:hover { background:var(--mist); }
        .mode-choix button.actif { border-color:var(--green-text); background:var(--mist); box-shadow:inset 0 0 0 1px var(--green-text); color:var(--green-text); }
        .mode-choix button:focus-visible { outline:3px solid var(--ink); outline-offset:3px; }
        .btn-parler { width:100%; min-height:5em; font-size:1.3em; background:var(--green-text); color:#fff; }
        .btn-parler:hover { background:#005f2e; }
        .langues { display:flex; flex-direction:column; gap:.5em; }
        .puces { display:flex; flex-wrap:wrap; gap:.5em; }
        .puce {
            min-height:2.75em; padding:0 1.1em; border:2px solid var(--hair); border-radius:999px; background:#fff;
            font:inherit; font-size:1em; font-weight:700; color:var(--ink); cursor:pointer;
        }
        .puce.choisie { border-color:var(--green-text); background:var(--mist); color:var(--green-text); }
        .puce:focus-visible { outline:3px solid var(--ink); outline-offset:2px; }
        .lien-ecrire { align-self:flex-start; }
        .preuves-boutons { display:grid; grid-template-columns:repeat(auto-fit, minmax(13em, 1fr)); gap:.75em; }
        .btn-preuve { text-align:center; }
        .miniature { width:48px; height:48px; border-radius:9px; object-fit:cover; flex-shrink:0; }
        .btn-danger { border-color:var(--red); color:var(--red); }
        .btn:disabled { opacity:.5; cursor:default; }

        .audio-recording {
            display:flex; align-items:center; gap:1em; flex-wrap:wrap;
            padding:1em 1.25em; border-radius:12px; border:2px solid var(--red); background:#FDEBEC;
        }
        .rec-timer { font-family:var(--mono); font-size:1.75em; font-weight:900; color:var(--red); line-height:1; }
        .rec-dot { width:12px; height:12px; border-radius:50%; background:var(--red); animation:blink 1s infinite; }
        .rec-text { color:var(--red); font-weight:900; font-size:1em; letter-spacing:2px; }
        .audio-done {
            padding:1em 1.25em; border-radius:12px; background:var(--mist); border:2px solid var(--green-text);
            display:flex; flex-direction:column; gap:.6em;
        }
        .audio-done b { color:var(--green-text); font-size:1.05em; }

        .acc { border:2px solid var(--hair); border-radius:14px; margin-top:1em; background:#fff; overflow:hidden; }
        .acc-titre {
            width:100%; min-height:3.5em; padding:.6em 1.25em; background:#fff; border:0; cursor:pointer;
            display:flex; align-items:center; justify-content:space-between; gap:1em; text-align:left;
            font:inherit; font-size:1.15em; font-weight:800; color:var(--ink);
        }
        .acc-titre:hover { background:var(--mist); }
        .acc-corps { padding:.25em 1.25em 1.5em; display:flex; flex-direction:column; gap:1.25em; }
        .sous-label { font-size:1em; font-weight:700; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1em; }

        .file-item {
            display:flex; align-items:center; gap:.75em; padding:.75em; border-radius:10px;
            background:var(--mist); border:1.5px solid var(--hair);
        }
        .file-icon { width:40px; height:40px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .anonyme-carte {
            display:flex; align-items:center; gap:1em; flex-wrap:wrap; padding:1em 1.25em;
        }
        .anonyme-carte p { flex:1 1 16em; margin:0; font-size:1.05em; line-height:1.5; color:var(--ink-60); }
        .anonyme-carte p b { color:var(--ink); }

        .type-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75em; }
        .type-card {
            border:2px solid var(--hair); border-radius:12px; padding:1em; cursor:pointer;
            background:#fff; text-align:left; font:inherit; color:var(--ink);
        }
        .type-card:hover, .type-card.selected { border-color:var(--green-text); background:var(--mist); }
        .type-card.selected { box-shadow:inset 0 0 0 1px var(--green-text); }
        .type-name { font-weight:800; font-size:1.1em; }
        .type-desc { font-size:.95em; color:var(--hint); margin-top:.25em; }

        .protection-section { border:2px solid var(--hair); border-radius:12px; padding:1em 1.25em; background:#fff; }
        .protection-info-box { border-radius:12px; padding:1em 1.25em; background:var(--mist); border:1.5px solid var(--hair); }
        .protection-warning { background:#FDEBEC; border:1.5px solid var(--red); border-radius:10px; padding:.875em 1em; margin-top:.75em; }
        .protection-conditions {
            background:#fff; border:1.5px solid var(--hair); border-radius:10px; padding:1em; margin-top:.75em;
            display:flex; flex-direction:column; gap:.75em;
        }
        .condition-row { display:flex; align-items:flex-start; gap:.75em; cursor:pointer; font-size:1em; line-height:1.5; }
        .condition-check {
            width:22px; height:22px; border-radius:6px; border:2px solid var(--ink-60);
            display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;
        }
        .condition-check.checked { background:var(--green-text); border-color:var(--green-text); }
        .protection-acknowledged {
            background:var(--mist); border:2px solid var(--green-text); border-radius:10px;
            padding:.875em 1em; display:flex; align-items:center; gap:.75em;
        }
        .protection-liste { margin:0; padding-left:1.1em; font-size:1em; line-height:1.7; color:var(--ink-60); display:flex; flex-direction:column; gap:.3em; }
        .consent-box { display:flex; align-items:flex-start; gap:.875em; padding:1em; border-radius:12px; background:var(--mist); border:1.5px solid var(--hair); }
        .consent-box-error { border:2px solid var(--red) !important; background:#FDEBEC !important; }

        .actions { display:flex; gap:.75em; flex-wrap:wrap; margin-top:2em; }
        .mention { font-size:.95em; line-height:1.5; color:var(--hint); margin:1em 0 0; }
        .mention a, .mention button { color:var(--green-text); font-weight:700; text-decoration:underline; background:none; border:0; padding:0; font:inherit; cursor:pointer; }

        .recap-section { background:var(--mist); border-radius:12px; padding:1em 1.25em; border:1.5px solid var(--hair); }
        .recap-titre { font-size:.95em; font-weight:800; color:var(--ink-60); margin-bottom:.5em; }
        .recap-row { display:flex; gap:.75em; font-size:1.05em; padding:.25em 0; }
        .recap-key { color:var(--hint); width:7.5em; flex-shrink:0; }
        .recap-val { font-weight:700; color:var(--ink); min-width:0; overflow-wrap:anywhere; }
        .recap-recit { font-size:1.05em; line-height:1.6; color:var(--ink); margin:0; white-space:pre-line; }

        .success-body { padding:.5em .25em; text-align:center; }
        .success-icon {
            width:88px; height:88px; border-radius:50%; background:var(--green-text);
            display:flex; align-items:center; justify-content:center; margin:0 auto 1.25em;
        }
        .success-icon i { font-size:2.75em; color:#fff; }
        .code-box { background:var(--mist); border:2px solid var(--green-text); border-radius:14px; padding:1.25em; margin:1.25em 0; }
        .code-label { font-size:.95em; font-weight:900; color:var(--green-text); letter-spacing:1px; text-transform:uppercase; }
        .code-value { font-family:var(--mono); font-size:2.25em; font-weight:900; color:var(--ink); letter-spacing:6px; overflow-wrap:anywhere; }
        .code-hint  { font-size:.95em; color:var(--ink-60); margin-top:.375em; }
        .notif-badge {
            display:inline-flex; align-items:center; gap:.5em; font-size:1em; padding:6px 14px;
            border-radius:20px; font-weight:700; background:#fff; color:var(--ink); border:1px solid var(--hair);
        }

        .secu-liste { list-style:none; margin:0 0 1em; padding:0; display:flex; flex-direction:column; gap:.875em; }
        .secu-liste li { display:flex; gap:.875em; align-items:flex-start; font-size:1em; line-height:1.6; color:var(--ink-60); }
        .secu-liste li > i { color:var(--green-text); font-size:1.1em; margin-top:4px; flex-shrink:0; width:1.25em; text-align:center; }
        .secu-liste strong { color:var(--ink); }

        .page-foot { text-align:center; margin-top:2.5em; color:var(--hint); font-size:.95em; padding-bottom:1em; }

        @media (max-width:520px) {
            h1 { font-size:1.65em; }
            .grid2, .type-grid { grid-template-columns:1fr; }
            .navbar { height:auto; flex-wrap:wrap; padding:.5em 1em; gap:.5em; }
            .nav-right { width:100%; justify-content:space-between; }
            .actions .btn { flex:1 1 100%; }
        }
        @media (prefers-reduced-motion:reduce) { .rec-dot { animation:none; } }
    `],
    template: `
<p-toast />
<p-confirmDialog />

<!-- Récapitulatif avant l'envoi : une vérification, pas un écran de plus -->
<p-dialog [(visible)]="showRecap" header="Vérifiez avant d'envoyer" [modal]="true" [draggable]="false"
    [style]="{ width: 'min(38em, 94vw)' }">
    <div style="display:flex;flex-direction:column;gap:1em;">
        <div class="recap-section">
            <div class="recap-titre">Votre signalement</div>
            @if (f['description'].value) {
                <p class="recap-recit" style="margin-bottom:.75em;">{{ f['description'].value }}</p>
            }
            @if (audioUrl) {
                <div class="recap-row"><span class="recap-key">Message vocal</span>
                    <span class="recap-val">✓ {{ formatDuration(recordingDuration) }}</span></div>
            }
            @if (attachments.length > 0) {
                <div class="recap-row"><span class="recap-key">Pièces jointes</span>
                    <span class="recap-val">{{ attachments.length }} pièce{{ attachments.length > 1 ? 's' : '' }}</span></div>
            }
            @if (f['incidentLocation'].value) {
                <div class="recap-row"><span class="recap-key">Lieu</span><span class="recap-val">{{ f['incidentLocation'].value }}</span></div>
            }
            @if (f['incidentPeriod'].value) {
                <div class="recap-row"><span class="recap-key">Période</span><span class="recap-val">{{ f['incidentPeriod'].value }}</span></div>
            }
            @if (f['estimatedLoss'].value) {
                <div class="recap-row"><span class="recap-key">Montant</span><span class="recap-val">{{ formatMontant(f['estimatedLoss'].value) }} FCFA</span></div>
            }
            @if (aDesIndicesRepere) {
                <p class="repere" style="margin-top:.5em;"><i class="pi pi-sparkles"></i> Repéré dans votre récit : choisissez « Modifier » pour corriger.</p>
            }
        </div>

        <div class="recap-section">
            <div class="recap-titre">Qui signale</div>
            @if (fd['anonymous'].value) {
                <div class="recap-val"><i class="pi pi-eye-slash"></i> Anonyme</div>
                <p class="hint" style="margin-top:.5em;">Sans coordonnées, nous ne pouvons pas vous écrire : vous suivez le dossier avec votre code de suivi.</p>
            } @else {
                <div class="recap-row"><span class="recap-key">Identité</span>
                    <span class="recap-val">{{ fd['firstName'].value }} {{ fd['lastName'].value }}</span></div>
                @if (fd['phoneNumber'].value) {
                    <div class="recap-row"><span class="recap-key">Téléphone</span><span class="recap-val">{{ fd['phoneNumber'].value }}</span></div>
                }
                @if (fd['email'].value) {
                    <div class="recap-row"><span class="recap-key">E-mail</span><span class="recap-val">{{ fd['email'].value }}</span></div>
                }
                @if (protectionAcknowledged) {
                    <div class="recap-row"><span class="recap-key">Protection</span>
                        <span class="recap-val"><i class="pi pi-shield"></i> Lanceur d'alerte confirmée</span></div>
                }
            }
        </div>

        @if (!fd['anonymous'].value && !fd['email'].value) {
            <p class="hint"><strong>Aucune notification</strong> ne vous sera envoyée, faute d'adresse e-mail.
                Conservez bien votre <strong>code de suivi</strong> : c'est lui qui permet de suivre votre dossier.</p>
        }
        @if (!fd['anonymous'].value && fd['email'].value) {
            <p class="hint"><strong>Notifications prévues</strong> : e-mail → {{ fd['email'].value }}</p>
        }

        <p class="hint">En envoyant, vous certifiez l'exactitude des informations. Toute fausse déclaration est passible de poursuites.</p>
    </div>
    <ng-template pTemplate="footer">
        <div style="display:flex;gap:.75em;flex-wrap:wrap;justify-content:flex-end;">
            <button type="button" class="btn" (click)="showRecap = false">Modifier</button>
            <button type="button" class="btn btn-envoyer" style="flex:0 1 auto;" [disabled]="submitting" (click)="confirmerEnvoi()">
                <i class="pi pi-send"></i> Envoyer mon signalement
            </button>
        </div>
    </ng-template>
</p-dialog>

<!-- Détail de la protection : à la demande, jamais bloquant -->
<p-dialog [(visible)]="showSecurite" header="Comment vos données sont protégées" [modal]="true" [draggable]="false"
    [style]="{ width: 'min(40em, 94vw)' }">
    <ul class="secu-liste">
        <li>
            <i class="pi pi-eye-slash"></i>
            <div><strong>Rester anonyme est possible.</strong> Aucun nom ni contact n'est demandé.
                En contrepartie, l'ASCE-LC ne peut pas vous recontacter : seul votre code de suivi
                vous permet de suivre le dossier. Votre adresse de connexion (adresse IP) n'est pas
                conservée dans le dossier. Comme sur tout site, les journaux techniques du serveur
                peuvent en garder une trace : si cela vous inquiète, utilisez une connexion qui n'est
                pas celle de votre bureau ou de votre domicile.</div>
        </li>
        <li>
            <i class="pi pi-shield"></i>
            <div><strong>La protection de lanceur d'alerte est différente de l'anonymat.</strong>
                Vous donnez votre identité à l'ASCE-LC, qui la cache aux agents qui n'ont pas à la
                connaître et enregistre chaque consultation. Elle est réservée aux faits connus dans
                le cadre de votre travail. Vous pouvez la demander en laissant vos coordonnées, après
                avoir lu ses conditions. Rien ne vous y oblige.</div>
        </li>
        <li>
            <i class="pi pi-microphone"></i>
            <div><strong>Votre voix peut vous identifier.</strong> Si vous voulez rester anonyme,
                préférez écrire plutôt qu'enregistrer un message vocal.</div>
        </li>
        <li>
            <i class="pi pi-paperclip"></i>
            <div><strong>Les fichiers contiennent des informations cachées</strong> (auteur, date,
                parfois le lieu d'une photo). Envoyez des copies, jamais un original que vous êtes
                seul à posséder.</div>
        </li>
        <li>
            <i class="pi pi-key"></i>
            <div><strong>Votre code de suivi est la seule clé de votre dossier.</strong> Notez-le à la
                fin, gardez-le pour vous et ne le partagez pas.</div>
        </li>
        <li>
            <i class="pi pi-desktop"></i>
            <div><strong>Pensez à votre appareil.</strong> Évitez un ordinateur de travail ou partagé,
                et fermez la page une fois le dépôt terminé.</div>
        </li>
        <li>
            <i class="pi pi-lock"></i>
            <div><strong>Rien n'est envoyé avant votre confirmation.</strong> La connexion est chiffrée.</div>
        </li>
    </ul>
    <app-avant-de-signaler />
</p-dialog>

<p-dialog [(visible)]="showSuccess" header=" " [modal]="true"
    [closable]="false" [style]="{ width: 'min(26em, 94vw)' }">
    <div class="success-body">
        <div class="success-icon"><i class="pi pi-check-circle"></i></div>
        <h2 style="font-size:1.5em;font-weight:800;color:var(--ink);margin:0 0 .5em;">Merci pour votre signalement !</h2>
        <p style="font-size:1.05em;color:var(--ink-60);line-height:1.6;margin:0;">
            Votre dossier a été enregistré.<br>
            Conservez précieusement votre code de suivi.
        </p>
        <div class="code-box">
            <div class="code-label">Votre code de suivi</div>
            <div class="code-value">{{ createdAccessCode }}</div>
            <div class="code-hint"><i class="pi pi-camera"></i> Notez ce code ou prenez une photo</div>
        </div>
        @if (fd['email'].value && !fd['anonymous'].value) {
            <div class="notif-badge"><i class="pi pi-envelope"></i> E-mail envoyé à {{ fd['email'].value }}</div>
        } @else {
            <p class="hint" style="text-align:center;">Aucune notification ne vous sera envoyée : conservez bien votre code de suivi.</p>
        }
        <p class="hint" style="margin-top:.75em;">Vous recevrez un accusé de réception officiel dans les 7 jours ouvrables.</p>
    </div>
    <ng-template pTemplate="footer">
        <div style="display:flex;gap:.5em;justify-content:center;flex-wrap:wrap;">
            <button type="button" class="btn btn-envoyer" style="flex:0 1 auto;" (click)="goToSuivi()">
                <i class="pi pi-search"></i> Suivre mon dossier
            </button>
            <button type="button" class="btn" (click)="goToAccueil()">Accueil</button>
        </div>
    </ng-template>
</p-dialog>

<div class="page">

    <a class="skip" href="#contenu">Aller au contenu</a>
    <nav class="navbar">
        <div class="nav-left">
            <p-button icon="pi pi-arrow-left" severity="contrast" text aria-label="Retour à l'accueil"
                (onClick)="router.navigate(['/portail'])" />
            <div class="nav-logo"><img src="assets/logo-asce.png" alt="ASCE-LC" /></div>
            <div class="nav-sub">Dépôt de signalement</div>
        </div>
        <div class="nav-right">
            <app-aide-numero-vert />
            <app-taille-texte />
            <p-button label="Suivre" icon="pi pi-search" severity="contrast" outlined
                (onClick)="router.navigate(['/portail/suivi'])" />
        </div>
    </nav>

    <main class="content" id="contenu">

        <h1>Racontez-nous ce qui s'est passé</h1>
        <p class="intro">Vous restez anonyme. Dites les faits comme vous le diriez à quelqu'un : nous nous occupons du reste.</p>
        <button type="button" class="lien" (click)="showSecurite = true">Comment vos données sont protégées</button>

        <div class="recit-bloc">
            <div class="mode-choix" role="group" aria-label="Comment voulez-vous raconter ?">
                <button type="button" [class.actif]="mode === 'ecrit'" [attr.aria-pressed]="mode === 'ecrit'"
                    (click)="choisirMode('ecrit')"><i class="pi pi-pencil"></i> Écrire mon récit</button>
                <button type="button" [class.actif]="mode === 'vocal'" [attr.aria-pressed]="mode === 'vocal'"
                    (click)="choisirMode('vocal')"><i class="pi pi-microphone"></i> Parler dans ma langue</button>
            </div>

            @if (mode === 'ecrit') {
                <label for="recit">Votre récit <span class="req" aria-hidden="true">*</span></label>
                <textarea pTextarea id="recit" #recitChamp class="champ champ-recit"
                    [formControl]="f['description']"
                    placeholder="Exemple : À la mairie de ..., un agent m'a demandé 50 000 FCFA pour un acte de naissance, en mars dernier."
                    (blur)="recitTouche = true; analyserRecit()"></textarea>
                <div style="display:flex;justify-content:space-between;gap:1em;align-items:flex-start;">
                    @if (recitTouche && !recitSuffisant) {
                        <p class="error-msg"><i class="pi pi-exclamation-circle"></i> Racontez les faits en quelques phrases, ou parlez dans votre langue.</p>
                    } @else {
                        <p class="hint">Qui, quoi, où, quand : écrivez ce que vous savez, même incomplet. Un soupçon raisonnable suffit.</p>
                    }
                    <span class="compteur">{{ f['description'].value?.length || 0 }}</span>
                </div>
            } @else if (!audioUrl && !isRecording) {
                <button type="button" class="btn btn-parler" (click)="startRecording()">
                    <i class="pi pi-microphone"></i> Appuyez ici pour parler
                </button>
                <p class="hint">Parlez dans votre langue, comme vous le diriez à quelqu'un. Un agent écoutera votre message.</p>
                @if (recitTouche && !recitSuffisant) {
                    <p class="error-msg"><i class="pi pi-exclamation-circle"></i> Appuyez sur le bouton pour enregistrer votre message.</p>
                }
                <div class="langues" role="group" aria-label="Langue parlée (facultatif)">
                    <span class="label sous-label">Quelle langue parlez-vous ? <span class="opt">(facultatif)</span></span>
                    <div class="puces">
                        @for (langue of langues; track langue) {
                            <button type="button" class="puce" [class.choisie]="langueParlee === langue"
                                [attr.aria-pressed]="langueParlee === langue" (click)="choisirLangue(langue)">{{ langue }}</button>
                        }
                    </div>
                </div>
                @if (fd['anonymous'].value) {
                    <p class="hint">Votre voix peut vous identifier : préférez écrire si vous voulez rester anonyme.</p>
                }
                <button type="button" class="lien lien-ecrire" (click)="choisirMode('ecrit')">Je préfère écrire</button>
            }

            @if (isRecording) {
                <div class="audio-recording" role="status">
                    <span class="rec-dot"></span><span class="rec-text">REC</span>
                    <span class="rec-timer">{{ formatDuration(recordingDuration) }}</span>
                    <button type="button" class="btn btn-danger" style="margin-left:auto;" (click)="stopRecording()">
                        <i class="pi pi-stop-circle"></i> Arrêter
                    </button>
                </div>
            }
            @if (audioUrl && !isRecording) {
                <div class="audio-done">
                    <b><i class="pi pi-check"></i> {{ mode === 'ecrit' ? 'Message vocal joint' : 'Message vocal enregistré' }} · {{ formatDuration(recordingDuration) }}</b>
                    <audio appDureeAudio [src]="audioUrl" controls style="width:100%;"></audio>
                    <button type="button" class="btn btn-danger btn-supprimer-audio" style="align-self:flex-start;" (click)="deleteAudio()">
                        <i class="pi pi-trash"></i> Supprimer et recommencer
                    </button>
                </div>
            }
        </div>

        <!-- Précisions : repérées dans le récit, corrigeables, jamais obligatoires -->
        <section class="acc">
            <button type="button" class="acc-titre" [attr.aria-expanded]="ouvert.precisions"
                aria-controls="acc-precisions" (click)="basculer('precisions')">
                <span><i class="pi pi-sliders-h"></i> Ajouter des précisions <span class="opt">(facultatif)</span></span>
                <i class="pi" [class.pi-chevron-down]="!ouvert.precisions" [class.pi-chevron-up]="ouvert.precisions"></i>
            </button>
            @if (ouvert.precisions) {
                <div id="acc-precisions" class="acc-corps">
                    <div class="field">
                        <label for="lieu">Service, organisme ou lieu</label>
                        <input pInputText id="lieu" class="champ" [formControl]="f['incidentLocation']"
                            placeholder="Ex. : Mairie de Koudougou" />
                        @if (suggere.lieu && !f['incidentLocation'].dirty) {
                            <p class="repere"><i class="pi pi-sparkles"></i> Repéré dans votre récit : corrigez si besoin.</p>
                        }
                    </div>
                    <div class="field">
                        <label for="periode">Période</label>
                        <input pInputText id="periode" class="champ" [formControl]="f['incidentPeriod']"
                            placeholder="Ex. : Mars 2025, depuis 6 mois, ou le 15 mars 2025 à 14h30" />
                        <p class="hint">Écrivez librement, ou choisissez le jour exact (jj/mm/aaaa) et, si vous le souhaitez, l'heure.</p>
                        @if (suggere.periode && !f['incidentPeriod'].dirty) {
                            <p class="repere"><i class="pi pi-sparkles"></i> Repéré dans votre récit : corrigez si besoin.</p>
                        }
                    </div>
                    <div class="grid2">
                        <div class="field">
                            <label for="jour" class="sous-label">Jour précis</label>
                            <input id="jour" type="date" class="champ" [max]="jourMaximum" [value]="jourChoisi"
                                (change)="onJour($any($event.target).value)" />
                        </div>
                        <div class="field">
                            <label for="heure" class="sous-label">Heure <span class="opt">(facultatif)</span></label>
                            <input id="heure" type="time" class="champ" [value]="heureChoisie" [disabled]="!jourChoisi"
                                (change)="onHeure($any($event.target).value)" />
                        </div>
                    </div>
                    <div class="field">
                        <label for="montant">Montant estimé (FCFA)</label>
                        <p-inputnumber inputId="montant" [formControl]="f['estimatedLoss']" [useGrouping]="true"
                            placeholder="0" styleClass="champ-nombre" inputStyleClass="champ" />
                        <p class="hint">Laissez vide si inconnu.</p>
                        @if (suggere.montant && !f['estimatedLoss'].dirty) {
                            <p class="repere"><i class="pi pi-sparkles"></i> Repéré dans votre récit : corrigez si besoin.</p>
                        }
                    </div>
                    <div class="field">
                        <span class="label">D'où nous écrivez-vous ?</span>
                        <app-origine-geographique (origineChange)="onOrigine($event)" />
                    </div>
                </div>
            }
        </section>

        <section class="acc">
            <button type="button" class="acc-titre" [attr.aria-expanded]="ouvert.preuves"
                aria-controls="acc-preuves" (click)="basculer('preuves')">
                <span><i class="pi pi-paperclip"></i> Ajouter des preuves <span class="opt">(facultatif)</span></span>
                <i class="pi" [class.pi-chevron-down]="!ouvert.preuves" [class.pi-chevron-up]="ouvert.preuves"></i>
            </button>
            @if (ouvert.preuves) {
                <div id="acc-preuves" class="acc-corps">
                    <p class="hint">Un document ou une photo aide l'instruction, mais n'est jamais exigé pour signaler.
                        Envoyez des copies : un fichier peut contenir des informations cachées (auteur, date, lieu d'une photo).
                        {{ maxFiles }} fichiers au plus, {{ maxSizeMB }} Mo chacun.</p>
                    <input #photoInput type="file" accept="image/*" capture="environment" style="display:none;"
                        (change)="onFileSelect($event)" />
                    <input #videoInput type="file" accept="video/*" capture="environment" style="display:none;"
                        (change)="onFileSelect($event)" />
                    <input #galerieInput type="file" multiple style="display:none;"
                        [attr.accept]="acceptFichiers"
                        (change)="onFileSelect($event)" />
                    <div class="preuves-boutons">
                        <button type="button" class="btn btn-preuve" (click)="photoInput.click()">
                            <i class="pi pi-camera"></i> Prendre une photo
                        </button>
                        <button type="button" class="btn btn-preuve" (click)="videoInput.click()">
                            <i class="pi pi-video"></i> Filmer une vidéo
                        </button>
                        <button type="button" class="btn btn-preuve" (click)="galerieInput.click()">
                            <i class="pi pi-images"></i> Choisir dans la galerie ou mes fichiers
                        </button>
                    </div>
                    <p class="hint">Formats acceptés : {{ extensionsLibelle }}</p>
                    @if (attachments.length > 0) {
                        <div style="display:flex;flex-direction:column;gap:.5em;">
                            @for (file of attachments; track $index) {
                                <div class="file-item">
                                    @if (apercu(file); as source) {
                                        <img class="miniature" [src]="source" alt="" />
                                    } @else {
                                        <div class="file-icon" [style.background]="getFileBg(file)">
                                            <i [class]="getFileIcon(file)" [style.color]="getFileColor(file)"></i>
                                        </div>
                                    }
                                    <div style="flex:1;min-width:0;">
                                        <div style="font-size:1.05em;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ file.name }}</div>
                                        <div class="hint">{{ formatFileSize(file.size) }}</div>
                                    </div>
                                    <p-button icon="pi pi-times" severity="danger" text
                                        [attr.aria-label]="'Retirer ' + file.name" (onClick)="removeAttachment($index)" />
                                </div>
                            }
                            <p class="hint" style="text-align:right;">{{ attachments.length }}/{{ maxFiles }} fichiers</p>
                        </div>
                    }
                </div>
            }
        </section>

        <section class="acc">
            @if (!avecCoordonnees) {
                <div class="anonyme-carte">
                    <i class="pi pi-eye-slash" style="font-size:1.5em;color:var(--green-text);"></i>
                    <p><b>Vous restez anonyme.</b> Votre message est traité de la même façon. Sans coordonnées, nous ne pouvons pas vous écrire.</p>
                    <button type="button" class="btn" (click)="laisserCoordonnees()">
                        <i class="pi pi-user"></i> Laisser mes coordonnées <span class="opt">(facultatif)</span>
                    </button>
                </div>
            } @else {
                <div class="acc-titre" style="cursor:default;">
                    <span><i class="pi pi-user"></i> Vos coordonnées</span>
                    <button type="button" class="lien" (click)="setAnonymous()">Je préfère rester anonyme</button>
                </div>
                <div class="acc-corps">
                    <p class="hint">Réservées aux agents habilités. Tous les champs sont facultatifs : avec une adresse e-mail,
                        vous recevez votre code et les nouvelles de votre dossier.</p>

                    <div class="field">
                        <span class="label">Vous êtes</span>
                        <div class="type-grid">
                            @for (type of typeOptions; track type.value) {
                                <button type="button" class="type-card" [class.selected]="f['type'].value === type.value"
                                    [attr.aria-pressed]="f['type'].value === type.value" (click)="selectType(type.value)">
                                    <div class="type-name">{{ type.label }}</div>
                                    <div class="type-desc">{{ type.description }}</div>
                                </button>
                            }
                        </div>
                    </div>

                    <div class="grid2">
                        <div class="field">
                            <label for="prenom">Prénom</label>
                            <input pInputText id="prenom" class="champ" [formControl]="fd['firstName']" autocomplete="given-name" />
                        </div>
                        <div class="field">
                            <label for="nom">Nom</label>
                            <input pInputText id="nom" class="champ" [formControl]="fd['lastName']" autocomplete="family-name" />
                        </div>
                        <div class="field">
                            <label for="telephone">Téléphone</label>
                            <input pInputText id="telephone" class="champ" [formControl]="fd['phoneNumber']"
                                placeholder="+226 XX XX XX XX" inputmode="tel" autocomplete="tel" />
                        </div>
                        <div class="field">
                            <label for="email">E-mail</label>
                            <input pInputText id="email" class="champ" type="email" [formControl]="fd['email']"
                                placeholder="votre@email.com" autocomplete="email" />
                            @if (fd['email'].invalid && fd['email'].touched) {
                                <p class="error-msg"><i class="pi pi-exclamation-circle"></i> Adresse e-mail invalide</p>
                            }
                        </div>
                    </div>
                    <div class="field">
                        <label for="organisation">Entreprise ou association <span class="opt">(si vous écrivez en son nom)</span></label>
                        <input pInputText id="organisation" class="champ" [formControl]="fd['organizationName']"
                            (input)="fd['typeDeclarant'].setValue(fd['organizationName'].value ? 'COMPANY' : 'CITIZEN')" />
                    </div>

                    <div class="protection-section">
                        <div style="display:flex;align-items:flex-start;gap:.875em;">
                            <i class="pi pi-shield" style="color:var(--green-text);font-size:1.4em;margin-top:2px;"></i>
                            <div style="flex:1;display:flex;flex-direction:column;gap:.6em;">
                                <div style="font-weight:800;font-size:1.1em;">Protection de lanceur d'alerte</div>
                                <p class="hint">Elle concerne les personnes qui signalent des faits connus dans le cadre de
                                    leur travail, et elle a des conséquences. Lisez ses conditions avant de décider.
                                    Vous n'êtes pas obligé de la demander pour déposer un signalement.</p>
                                @if (!fd['protectionRequested'].value) {
                                    <button type="button" class="btn" style="align-self:flex-start;" (click)="ouvrirProtection()">
                                        <i class="pi pi-book"></i> Lire les conditions et demander la protection
                                    </button>
                                }
                                @if (fd['protectionRequested'].value && protectionAcknowledged) {
                                    <div class="protection-acknowledged">
                                        <i class="pi pi-shield" style="color:var(--green-text);font-size:1.25em;"></i>
                                        <div style="flex:1;">
                                            <div style="font-weight:800;color:var(--green-text);">Protection demandée</div>
                                            <div class="hint">Votre identité sera protégée selon les conditions que vous avez lues.</div>
                                        </div>
                                        <button type="button" class="lien" (click)="cancelProtection()">Retirer</button>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    <div class="consent-box" [class.consent-box-error]="consentTouched && !fd['dataProcessingConsent'].value">
                        <p-checkbox [formControl]="fd['dataProcessingConsent']" [binary]="true" inputId="consent" />
                        <label for="consent" style="font-size:1.05em;font-weight:400;cursor:pointer;">
                            J'accepte le traitement de mes données personnelles par l'ASCE-LC. <span class="req">*</span>
                        </label>
                    </div>
                    @if (consentTouched && !fd['dataProcessingConsent'].value) {
                        <p class="error-msg"><i class="pi pi-exclamation-circle"></i> Vous devez accepter pour continuer</p>
                    }
                </div>
            }
        </section>

        <div class="actions">
            <button type="button" class="btn btn-effacer" (click)="effacer()"><i class="pi pi-trash"></i> Effacer</button>
            <button type="button" class="btn btn-envoyer" (click)="ouvrirRecapitulatif()">
                <i class="pi pi-send"></i> Envoyer ma dénonciation
            </button>
        </div>
        @if (!avecCoordonnees) {
            <p class="mention">En envoyant, vous acceptez que l'ASCE-LC traite ces informations pour instruire votre signalement.
                <button type="button" (click)="showSecurite = true">En savoir plus</button></p>
        }

        <div class="page-foot">
            ASCE-LC — Autorité Supérieure de Contrôle d'État — Burkina Faso
        </div>
    </main>
</div>

<p-dialog header="Protection de lanceur d'alerte" [(visible)]="showProtectionDialog" [modal]="true"
    [draggable]="false" [style]="{ width: 'min(38em, 94vw)' }" (onHide)="fermerProtection()">

    <div class="protection-lecture" #lecture (scroll)="onScrollProtection(lecture)"
        style="max-height:50vh;overflow-y:auto;padding-right:.5em;">

        <div class="protection-info-box">
            <div style="font-weight:800;font-size:1.05em;margin-bottom:.5em;">À qui s'adresse cette protection ?</div>
            <p class="hint" style="margin-bottom:.625em;">
                Elle est réservée aux personnes qui signalent des faits de <strong>corruption,
                détournement de fonds publics ou abus de pouvoir</strong> dont elles ont eu connaissance
                <strong>dans le cadre de leurs fonctions ou activités</strong>.
            </p>
            <p class="hint">
                Elle garantit la <strong>confidentialité totale de votre identité</strong> et vous protège
                contre toute représaille, licenciement ou sanction liée à votre signalement.
            </p>
        </div>

        <div style="font-weight:800;font-size:1.05em;margin:1em 0 .5em;">Ce que cette protection change</div>
        <ul class="protection-liste">
            <li>Vous ne pouvez pas rester anonyme : <strong>votre identité est connue de l'ASCE-LC</strong>.</li>
            <li>Elle est cachée aux agents qui n'ont pas à la connaître. <strong>Chaque consultation est
                enregistrée</strong> et contrôlée.</li>
            <li>L'ASCE-LC est informée dès le dépôt qu'un signalement sous protection est arrivé.</li>
        </ul>

        <div style="font-weight:800;font-size:1.05em;margin:1em 0 .5em;">Ce qu'elle ne change pas</div>
        <ul class="protection-liste">
            <li>Elle ne garantit pas l'issue de l'enquête et n'empêche pas qu'on vous pose des questions.</li>
            <li>Elle ne dispense pas d'apporter des faits exacts : une accusation sciemment fausse reste punissable.</li>
            <li>Elle ne couvre pas des faits dont vous n'avez pas eu connaissance dans le cadre de votre travail.</li>
        </ul>

        <div class="protection-warning">
            <p style="font-size:1em;color:var(--red);margin:0;line-height:1.6;">
                <strong>Attention :</strong> invoquer cette protection de manière abusive est passible de
                <strong>sanctions pénales</strong>.
            </p>
        </div>
    </div>

    @if (!protectionLue) {
        <p class="hint" style="margin:.75em 0 0;text-align:center;">
            <i class="pi pi-arrow-down"></i> Faites défiler le texte jusqu'en bas pour continuer.
        </p>
    }

    @if (protectionLue) {
        <div class="protection-conditions">
            <div style="font-size:1em;font-weight:800;">Je confirme les 3 conditions suivantes :</div>
            <div class="condition-row" (click)="cond1 = !cond1">
                <div class="condition-check" [class.checked]="cond1">
                    @if (cond1) { <i class="pi pi-check" style="font-size:.7em;color:#fff;"></i> }
                </div>
                <span>J'ai eu connaissance de ces faits dans le cadre de mes fonctions, de mon travail ou de mes activités professionnelles.</span>
            </div>
            <div class="condition-row" (click)="cond2 = !cond2">
                <div class="condition-check" [class.checked]="cond2">
                    @if (cond2) { <i class="pi pi-check" style="font-size:.7em;color:#fff;"></i> }
                </div>
                <span>Je crains des représailles directes si mon identité est révélée (licenciement, menaces, sanctions...).</span>
            </div>
            <div class="condition-row" (click)="cond3 = !cond3">
                <div class="condition-check" [class.checked]="cond3">
                    @if (cond3) { <i class="pi pi-check" style="font-size:.7em;color:#fff;"></i> }
                </div>
                <span>Je comprends qu'invoquer cette protection de manière abusive constitue une infraction pénale.</span>
            </div>
            <button type="button" class="btn" [disabled]="!cond1 || !cond2 || !cond3" (click)="confirmProtection()">
                <i class="pi pi-shield"></i> Je confirme sur l'honneur
            </button>
            @if (protectionCondTouched && (!cond1 || !cond2 || !cond3)) {
                <p class="error-msg" style="justify-content:center;">
                    <i class="pi pi-exclamation-circle"></i> Veuillez cocher les 3 conditions pour continuer
                </p>
            }
        </div>
    }
</p-dialog>
    `
})
export class DepotPlainte implements OnDestroy {

    router = inject(Router);
    private route = inject(ActivatedRoute);

    private fb                  = inject(FormBuilder);
    private dossierService      = inject(DossierService);
    private messageService      = inject(MessageService);
    private attachmentService   = inject(AttachmentService);
    private confirmationService = inject(ConfirmationService);

    @ViewChild('recitChamp') private recitChamp?: ElementRef<HTMLTextAreaElement>;

    /** Écrire ou parler : deux façons de raconter sur une seule page (« ?mode=vocal » ouvre directement la voix). */
    mode: 'ecrit' | 'vocal' = this.route.snapshot.queryParamMap.get('mode') === 'vocal' ? 'vocal' : 'ecrit';
    readonly langues = ['Français', 'Mooré', 'Dioula', 'Fulfuldé', 'Autre'];
    langueParlee = '';

    submitting        = false;
    showSuccess       = false;
    showRecap         = false;
    showSecurite      = false;
    createdAccessCode = '';
    recitTouche       = false;
    consentTouched    = false;
    cond1 = false;
    cond2 = false;
    cond3 = false;
    protectionAcknowledged = false;
    protectionCondTouched  = false;

    /** Volets repliés par défaut : tout ce qui n'est pas le récit est facultatif. */
    ouvert: Record<Volet, boolean> = { precisions: false, preuves: false, coordonnees: false };

    /** Champs préremplis d'après le récit (et encore intacts) : signalés au citoyen pour qu'il les vérifie. */
    suggere = { lieu: false, periode: false, montant: false };

    isRecording       = false;
    audioBlob:        Blob | null   = null;
    audioUrl:         string | null = null;
    mediaRecorder:    MediaRecorder | null = null;
    recordingDuration = 0;
    recordingTimer:   any = null;

    attachments: File[] = [];
    maxFiles  = 5;
    maxSizeMB = 25;
    readonly extensionsLibelle = LIBELLE_EXTENSIONS;
    readonly acceptFichiers = COMPLEMENT_ACCEPT;

    /** Sans identité, un signalement est une dénonciation : c'est la valeur de départ, la page étant anonyme par défaut. */
    dossierForm = this.fb.group({
        type:             ['DENUNCIATION'],
        quality:          ['TEMOIN'],
        description:      [''],
        incidentLocation: [''],
        incidentPeriod:   [''],
        estimatedLoss:    [null as number | null]
    });

    declarantForm = this.fb.group({
        typeDeclarant:         ['CITIZEN'],
        organizationName:      [''],
        firstName:             [''],
        lastName:              [''],
        email:                 ['', Validators.email],
        phoneNumber:           [''],
        anonymous:             [true],
        dataProcessingConsent: [false],
        notificationsAccepted: [true],
        protectionRequested:   [false]
    });

    get f()  { return this.dossierForm.controls;   }
    get fd() { return this.declarantForm.controls; }

    get avecCoordonnees(): boolean { return !this.fd['anonymous'].value; }

    /** Un récit assez long, ou un message vocal : un des deux suffit pour envoyer. */
    get recitSuffisant(): boolean {
        return (this.f['description'].value ?? '').trim().length >= RECIT_MINIMUM || !!this.audioBlob;
    }

    /** Origine choisie dans les listes liées ; transmise au serveur au dépôt. */
    origine: OrigineSaisie = {};

    onOrigine(origine: OrigineSaisie): void {
        this.origine = origine;
    }

    choisirMode(mode: 'ecrit' | 'vocal'): void {
        this.mode = mode;
    }

    /** Un second appui sur la même langue la retire : le choix reste facultatif. */
    choisirLangue(langue: string): void {
        this.langueParlee = this.langueParlee === langue ? '' : langue;
    }

    basculer(volet: Volet): void {
        this.ouvert[volet] = !this.ouvert[volet];
    }

    /** Jour le plus récent que l'on puisse choisir : aujourd'hui (jamais dans le futur). */
    readonly jourMaximum = (() => {
        const maintenant = new Date();
        const deux = (n: number) => String(n).padStart(2, '0');
        return `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}`;
    })();

    /** Jour (AAAA-MM-JJ) et heure (HH:MM) choisis dans les champs du navigateur ; la période en est écrite en toutes lettres. */
    jourChoisi   = '';
    heureChoisie = '';

    onJour(valeur: string): void {
        this.jourChoisi = valeur ?? '';
        if (!this.jourChoisi) { this.heureChoisie = ''; }
        this.ecrirePeriode();
    }

    /** Sans jour, une heure ne dit rien : elle est ignorée. */
    onHeure(valeur: string): void {
        this.heureChoisie = this.jourChoisi ? (valeur ?? '') : '';
        this.ecrirePeriode();
    }

    private ecrirePeriode(): void {
        const champ = this.f['incidentPeriod'];
        champ.markAsDirty();
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(this.jourChoisi);
        if (!m) { champ.setValue(''); return; }
        const jour = formaterJour(Number(m[1]), Number(m[2]), Number(m[3]));
        const heure = this.heureChoisie ? formaterHeure(this.heureChoisie) : null;
        champ.setValue(heure ? `${jour} à ${heure}` : jour);
    }

    /**
     * Préremplit lieu, période et montant d'après le récit. Jamais par-dessus une saisie du citoyen (champ « dirty »),
     * et seulement avec ce que les règles reconnaissent : sans indice, le champ reste vide.
     */
    analyserRecit(): void {
        const indices = extraireDuRecit(this.f['description'].value ?? '');
        const cibles = [
            { cle: 'lieu', champ: this.f['incidentLocation'], valeur: indices.lieu, vide: '' },
            { cle: 'periode', champ: this.f['incidentPeriod'], valeur: indices.periode, vide: '' },
            { cle: 'montant', champ: this.f['estimatedLoss'], valeur: indices.montant, vide: null }
        ] as const;
        // Le volet des précisions ne s'ouvre jamais tout seul : la page ne doit pas bouger quand le citoyen
        // touche « Envoyer » juste après avoir écrit (le décalage ferait perdre son appui).
        for (const { cle, champ, valeur, vide } of cibles) {
            if (champ.dirty) { continue; }
            if (valeur === null) {
                if (this.suggere[cle]) { champ.setValue(vide as never); this.suggere[cle] = false; }
                continue;
            }
            champ.setValue(valeur as never);
            this.suggere[cle] = true;
        }
    }

    get aDesIndicesRepere(): boolean {
        return this.suggere.lieu || this.suggere.periode || this.suggere.montant;
    }

    typeOptions = [
        { label: 'Témoin',  value: 'DENUNCIATION', description: 'Je signale des faits dont j\'ai connaissance' },
        { label: 'Victime', value: 'COMPLAINT',    description: 'Je demande réparation pour un préjudice subi' }
    ];

    selectType(value: string): void {
        this.f['type'].setValue(value);
        this.f['quality'].setValue(value === 'DENUNCIATION' ? 'TEMOIN' : 'VICTIME');
    }

    /** La fenêtre des conditions est ouverte : rien n'est coché, et le texte n'est pas encore lu. */
    showProtectionDialog = false;
    protectionLue        = false;

    ouvrirProtection(): void {
        this.cond1 = this.cond2 = this.cond3 = false;
        this.protectionCondTouched = false;
        this.protectionLue = false;
        this.showProtectionDialog = true;
        // Un texte assez court pour tenir sans défilement est considéré comme lu.
        setTimeout(() => {
            const zone = document.querySelector('.protection-lecture') as HTMLElement | null;
            if (zone) { this.onScrollProtection(zone); }
        }, 50);
    }

    onScrollProtection(zone: { scrollTop: number; clientHeight: number; scrollHeight: number }): void {
        if (zone.scrollTop + zone.clientHeight >= zone.scrollHeight - 8) {
            this.protectionLue = true;
        }
    }

    /** Fermer la fenêtre sans confirmer ne demande aucune protection. */
    fermerProtection(): void {
        this.showProtectionDialog = false;
        if (!this.protectionAcknowledged) {
            this.fd['protectionRequested'].setValue(false);
            this.cond1 = this.cond2 = this.cond3 = false;
        }
    }

    confirmProtection(): void {
        this.protectionCondTouched = true;
        if (!this.protectionLue || !this.cond1 || !this.cond2 || !this.cond3) return;
        this.confirmationService.confirm({
            header:      "Confirmation sur l'honneur",
            message:     "En confirmant, vous attestez sur l'honneur que votre demande "
                       + "de protection lanceur d'alerte est justifiée.",
            acceptLabel: "Je confirme sur l'honneur",
            rejectLabel: 'Annuler',
            acceptIcon:  'pi pi-shield',
            rejectButtonProps: { severity: 'secondary', outlined: true },
            accept:  () => {
                this.protectionAcknowledged = true;
                this.fd['protectionRequested'].setValue(true);
                this.showProtectionDialog = false;
            },
            reject:  () => {}
        });
    }

    cancelProtection(): void {
        this.fd['protectionRequested'].setValue(false);
        this.protectionAcknowledged   = false;
        this.protectionCondTouched    = false;
        this.cond1 = this.cond2 = this.cond3 = false;
    }

    /** Le citoyen choisit de s'identifier : les champs d'identité s'ouvrent. */
    laisserCoordonnees(): void {
        this.fd['anonymous'].setValue(false);
        this.ouvert.coordonnees = true;
    }

    setAnonymous(): void {
        this.fd['anonymous'].setValue(true);
        this.ouvert.coordonnees = false;
        this.cancelProtection();
        if (this.f['quality'].value !== 'TEMOIN') {
            this.f['type'].setValue('DENUNCIATION');
            this.f['quality'].setValue('TEMOIN');
            this.messageService.add({
                severity: 'info', summary: 'Signalement basculé en dénonciation',
                detail: 'Sans identité, votre signalement est traité comme une dénonciation. Pour déposer une plainte, indiquez vos coordonnées.'
            });
        }
    }

    /** Vérifie l'essentiel, puis montre le récapitulatif : rien n'est envoyé avant la confirmation. */
    ouvrirRecapitulatif(): void {
        this.analyserRecit();
        this.recitTouche = true;
        if (!this.recitSuffisant) {
            this.messageService.add({
                severity: 'warn', summary: 'Votre récit',
                detail: `Racontez les faits en quelques phrases (au moins ${RECIT_MINIMUM} caractères) ou enregistrez votre voix.`
            });
            this.recitChamp?.nativeElement.focus();
            return;
        }
        if (this.avecCoordonnees) {
            this.consentTouched = true;
            if (this.fd['email'].invalid) {
                this.fd['email'].markAsTouched();
                this.messageService.add({
                    severity: 'warn', summary: 'E-mail invalide',
                    detail: 'Saisissez une adresse e-mail valide (ex. nom@exemple.bf) ou laissez le champ vide.'
                });
                return;
            }
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
                    severity: 'warn', summary: "Protection lanceur d'alerte",
                    detail: 'Vous devez confirmer les 3 conditions avant de continuer.'
                });
                return;
            }
        }
        this.showRecap = true;
    }

    confirmerEnvoi(): void {
        this.showRecap = false;
        this.submit();
    }

    /** Efface tout après confirmation : un récit ne se perd pas par un clic malheureux. */
    effacer(): void {
        this.confirmationService.confirm({
            header:      'Effacer votre saisie ?',
            message:     'Tout ce que vous avez écrit ou ajouté sera supprimé.',
            acceptLabel: 'Effacer',
            rejectLabel: 'Garder',
            acceptIcon:  'pi pi-trash',
            rejectButtonProps: { severity: 'secondary', outlined: true },
            accept: () => this.reinitialiser(),
            reject: () => {}
        });
    }

    private reinitialiser(): void {
        this.dossierForm.reset({
            type: 'DENUNCIATION', quality: 'TEMOIN', description: '',
            incidentLocation: '', incidentPeriod: '', estimatedLoss: null
        });
        this.declarantForm.reset({
            typeDeclarant: 'CITIZEN', organizationName: '', firstName: '', lastName: '', email: '', phoneNumber: '',
            anonymous: true, dataProcessingConsent: false, notificationsAccepted: true, protectionRequested: false
        });
        this.libererApercus();
        this.attachments = [];
        this.deleteAudio();
        this.mode = 'ecrit';
        this.langueParlee = '';
        this.cancelProtection();
        this.origine = {};
        this.ouvert = { precisions: false, preuves: false, coordonnees: false };
        this.suggere = { lieu: false, periode: false, montant: false };
        this.jourChoisi = this.heureChoisie = '';
        this.recitTouche = this.consentTouched = false;
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
            this.mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            this.mediaRecorder.onstop = () => {
                // Le vrai format de l'appareil (iPhone : audio/mp4), pas toujours « webm ».
                this.audioBlob = new Blob(chunks, { type: typeAudioEnregistre(this.mediaRecorder?.mimeType).type });
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
        this.audioBlob = null;
        this.audioUrl  = null;
        this.recordingDuration = 0;
    }

    /** « 250000 » → « 250 000 » (espace ordinaire : l'espace insécable fine ne s'affiche pas partout). */
    formatMontant(montant: number | null): string {
        return montant === null ? '' : montant.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
    }

    formatDuration(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /** Photo, vidéo ou galerie : les trois alimentent la même liste. La sélection est vidée pour pouvoir reprendre le même fichier. */
    onFileSelect(event: any): void {
        const champ = event.target;
        this.addFiles(Array.from(champ.files ?? []));
        champ.value = '';
    }

    private addFiles(files: File[]): void {
        const valid = files.filter(f => {
            if (!isAllowedExtension(f.name)) {
                this.messageService.add({
                    severity: 'warn', summary: 'Format non accepté',
                    detail: `${f.name} : formats acceptés ${this.extensionsLibelle}`
                });
                return false;
            }
            if (f.size > this.maxSizeMB * 1024 * 1024) {
                this.messageService.add({
                    severity: 'warn', summary: 'Fichier trop volumineux',
                    detail: `${f.name} dépasse ${this.maxSizeMB}MB`
                });
                return false;
            }
            return true;
        });
        const total = [...this.attachments, ...valid];
        if (total.length > this.maxFiles) {
            this.messageService.add({
                severity: 'warn', summary: 'Nombre de fichiers limité',
                detail: `${this.maxFiles} pièces jointes au maximum : les fichiers en trop n'ont pas été ajoutés.`
            });
        }
        this.attachments = total.slice(0, this.maxFiles);
    }

    removeAttachment(index: number): void {
        const [retire] = this.attachments.splice(index, 1);
        if (retire) { this.libererApercu(retire); }
    }

    /** Miniatures des photos : une adresse temporaire par fichier, libérée au retrait. */
    private apercus = new Map<File, string>();

    apercu(file: File): string | null {
        if (!file.type.startsWith('image/')) { return null; }
        let adresse = this.apercus.get(file);
        if (!adresse) { adresse = URL.createObjectURL(file); this.apercus.set(file, adresse); }
        return adresse;
    }

    private libererApercu(file: File): void {
        const adresse = this.apercus.get(file);
        if (adresse) { URL.revokeObjectURL(adresse); this.apercus.delete(file); }
    }

    private libererApercus(): void {
        this.apercus.forEach(adresse => URL.revokeObjectURL(adresse));
        this.apercus.clear();
    }

    ngOnDestroy(): void { this.libererApercus(); }

    getFileIcon(file: File): string {
        if (file.type.includes('image')) return 'pi pi-image';
        if (file.type.includes('pdf'))   return 'pi pi-file-pdf';
        if (file.type.includes('word'))  return 'pi pi-file-word';
        if (file.type.includes('video')) return 'pi pi-video';
        if (file.type.includes('audio')) return 'pi pi-volume-up';
        return 'pi pi-file';
    }
    getFileBg(file: File): string {
        if (file.type.includes('image')) return 'rgba(0,54,23,.08)';
        if (file.type.includes('pdf'))   return 'rgba(196,5,16,.1)';
        if (file.type.includes('video')) return 'rgba(0,54,23,.06)';
        if (file.type.includes('audio')) return 'rgba(196,5,16,.08)';
        return 'var(--mist)';
    }
    getFileColor(file: File): string {
        if (file.type.includes('image')) return 'var(--ink)';
        if (file.type.includes('pdf'))   return 'var(--red)';
        if (file.type.includes('video')) return 'var(--ink)';
        if (file.type.includes('audio')) return 'var(--red)';
        return 'var(--ink-60)';
    }
    formatFileSize(bytes: number): string {
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /** Un dépôt anonyme ne transmet que la région : une province ou une commune pourrait identifier son auteur. */
    private origineAEnvoyer(anonyme: boolean): OrigineSaisie {
        if (!anonyme) { return this.origine; }
        const { origineProvinceId, origineCommuneId, ...regionSeule } = this.origine;
        return regionSeule;
    }

    submit(): void {
        if (!this.recitSuffisant) { return; }
        this.submitting = true;

        // Un dépôt anonyme n'envoie aucune donnée d'identité, même saisie avant le choix de l'anonymat.
        const isAnonymous = this.fd['anonymous'].value || false;
        const identity = (value: string | null): string | undefined =>
            isAnonymous ? undefined : (value || undefined);

        // Le citoyen n'écrit plus de résumé : l'objet est la première phrase de son récit.
        const recit = (this.f['description'].value ?? '').trim();
        const objet = recit ? resumeDuRecit(recit) : OBJET_MESSAGE_VOCAL;
        // La langue parlée aide l'agent à trouver qui peut écouter le message ; elle ne part qu'avec un message vocal.
        const noteLangue = this.audioBlob && this.langueParlee ? `Message vocal en ${this.langueParlee}.` : '';
        const description = [recit, noteLangue].filter(Boolean).join('\n\n');

        const request = {
            type:             this.f['type'].value as any,
            quality:          this.f['quality'].value as any,
            submissionMode:   'WEB_FORM' as any,
            anonymous:        isAnonymous,
            object:           objet,
            description:      description || undefined,
            incidentLocation: this.f['incidentLocation'].value || undefined,
            ...this.origineAEnvoyer(isAnonymous),
            incidentPeriod:   this.f['incidentPeriod'].value   || undefined,
            estimatedLoss:    this.f['estimatedLoss'].value    || undefined,
            declarantData: {
                typeDeclarant:          isAnonymous
                                            ? 'ANONYMOUS' as any : this.fd['typeDeclarant'].value as any,
                organizationName:       identity(this.fd['organizationName'].value),
                firstName:              identity(this.fd['firstName'].value),
                lastName:               identity(this.fd['lastName'].value),
                email:                  identity(this.fd['email'].value),
                phoneNumber:            identity(this.fd['phoneNumber'].value),
                anonymous:              isAnonymous,
                dataProcessingConsent:  true,
                notificationsAccepted:  this.fd['notificationsAccepted'].value || true,
                protectionRequested:    this.fd['protectionRequested'].value   || false,
                protectionAcknowledged: this.protectionAcknowledged
            }
        };

        this.dossierService.submit(request).subscribe({
            next: dossier => {
                this.createdAccessCode = dossier.accessCode;
                sessionStorage.setItem('lastSubmittedDossierId', dossier.id);

                const allFiles = [...this.attachments];
                if (this.audioBlob) {
                    const { type, extension } = typeAudioEnregistre(this.audioBlob.type);
                    allFiles.push(new File(
                        [this.audioBlob],
                        `temoignage_audio_${Date.now()}.${extension}`,
                        { type }
                    ));
                }

                if (allFiles.length > 0) {
                    this.attachmentService.upload(dossier.id, allFiles, true, dossier.accessCode).subscribe({
                        next:  () => { this.submitting = false; this.showSuccess = true; },
                        error: err => {
                            this.submitting = false;
                            this.showSuccess = true;
                            // Le serveur dit quel fichier est refusé et pourquoi : le citoyen doit le savoir.
                            const cause = err?.error?.message
                                ?? "Les pièces jointes n'ont pas pu être envoyées.";
                            this.messageService.add({
                                severity: 'warn', summary: 'Dossier créé',
                                detail:   `${cause} Conservez votre code de suivi et contactez l'ASCE-LC.`
                            });
                        }
                    });
                } else {
                    this.submitting = false;
                    this.showSuccess = true;
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
