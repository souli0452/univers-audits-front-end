import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DossierService } from '../../../core/services/dossier.service';
import { ComplementRequestResponse } from '../../../core/models/complement.model';
import {
    COMPLEMENT_ACCEPT, COMPLEMENT_MAX_FILES, COMPLEMENT_MAX_FILE_MB,
    COMPLEMENT_MIN_MESSAGE, addComplementFiles, formatFileSize, validateComplement
} from '../../../core/utils/complement-form';

export type EtatComplement = 'chargement' | 'formulaire' | 'introuvable' | 'non-attendu' | 'erreur' | 'succes';

@Component({
    selector: 'app-portail-complement',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ButtonModule, TextareaModule],
    styles: [`
        :host {
            --green:#009640; --red:#E30613; --yellow:#FFD800; --ink:#003617; --mist:#F2F8F4;
            --ink-60:rgba(0,54,23,.62); --hair:#E4E9E6;
            display:block; min-height:100vh; background:var(--mist);
            font-family:'Lato', system-ui, sans-serif; color:var(--ink);
        }
        .page { max-width:640px; margin:0 auto; padding:2rem 1rem 3rem; }
        .card { background:#fff; border:1.5px solid var(--hair); border-radius:16px; padding:1.5rem; margin-bottom:1rem; }
        h1 { font-size:1.6rem; font-weight:800; margin:0 0 1rem; }
        h2 { font-size:1rem; font-weight:800; margin:0 0 .5rem; }
        .motif { background:var(--mist); border-left:4px solid var(--green); border-radius:8px; padding:.875rem 1rem; white-space:pre-line; }
        .retard { background:rgba(255,216,0,.15); border:1px solid var(--yellow); border-radius:10px; padding:.75rem 1rem; margin-top:.75rem; font-size:.9rem; }
        .erreur { background:#FDEBEC; border:1.5px solid var(--red); border-radius:10px; padding:.75rem 1rem; color:var(--red); font-size:.875rem; margin-bottom:1rem; }
        .fichier { display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.5rem .75rem; border:1px solid var(--hair); border-radius:8px; margin-top:.5rem; font-size:.875rem; }
        .aide { color:var(--ink-60); font-size:.8rem; margin-top:.375rem; }
        .actions { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:1rem; }
        .centre { text-align:center; }
    `],
    template: `
    <div class="page">
        <div *ngIf="etat === 'chargement'" class="card centre" role="status">Chargement de votre dossier…</div>

        <div *ngIf="etat === 'introuvable'" class="card centre">
            <h1>Code introuvable</h1>
            <p>Vérifiez le lien reçu ou votre code de suivi.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Aller au suivi" icon="pi pi-search" (onClick)="suivreSansCode()" />
                <p-button label="Accueil" severity="secondary" outlined (onClick)="accueil()" />
            </div>
        </div>

        <div *ngIf="etat === 'non-attendu'" class="card centre">
            <h1>Aucune réponse attendue</h1>
            <p>Aucun complément n’est attendu pour ce dossier. Une réponse a peut-être déjà été envoyée.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Voir l’état de mon dossier" icon="pi pi-search" (onClick)="suivre()" />
                <p-button label="Accueil" severity="secondary" outlined (onClick)="accueil()" />
            </div>
        </div>

        <div *ngIf="etat === 'erreur'" class="card centre">
            <h1>Service indisponible</h1>
            <p>Impossible de charger votre demande pour le moment.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Réessayer" icon="pi pi-refresh" (onClick)="recharger()" />
            </div>
        </div>

        <div *ngIf="etat === 'succes'" class="card centre">
            <h1>Réponse envoyée</h1>
            <p>Merci. Votre dossier repasse en étude : vous pouvez suivre son avancement avec votre code.</p>
            <p *ngIf="resultat?.late" class="retard">Votre réponse a été reçue après l’échéance ; elle a bien été transmise.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Suivre mon dossier" icon="pi pi-search" severity="success" (onClick)="suivre()" />
                <p-button label="Accueil" severity="secondary" outlined (onClick)="accueil()" />
            </div>
        </div>

        <ng-container *ngIf="etat === 'formulaire' && demande">
            <h1>Compléter mon dossier</h1>

            <div class="card">
                <h2>Ce que l’ASCE-LC vous demande</h2>
                <div class="motif">{{ demande.motif }}</div>
                <div *ngIf="demande.deadline" class="aide">Échéance : {{ demande.deadline | date:'dd/MM/yyyy' }}</div>
                <div *ngIf="demande.overdue" class="retard">L’échéance est dépassée. Votre réponse sera tout de même transmise.</div>
            </div>

            <div class="card">
                <div *ngIf="erreurs.length || erreurEnvoi" class="erreur" role="alert">
                    <div *ngFor="let e of erreurs">{{ e }}</div>
                    <div *ngIf="erreurEnvoi">{{ erreurEnvoi }}</div>
                </div>

                <h2><label for="reponse">Votre réponse</label></h2>
                <textarea id="reponse" pTextarea [(ngModel)]="message" rows="6" class="w-full"
                    [attr.maxlength]="2000"
                    placeholder="Écrivez votre réponse ({{ min }} caractères minimum)…"></textarea>

                <h2 style="margin-top:1rem;">Pièces jointes (facultatif)</h2>
                <input #champ type="file" multiple hidden [accept]="accept" (change)="choisirFichiers($event)" />
                <p-button label="Ajouter des fichiers" icon="pi pi-paperclip" severity="secondary" outlined
                    [disabled]="fichiers.length >= maxFichiers" (onClick)="champ.click()" />
                <div class="aide">{{ maxFichiers }} fichiers maximum, {{ maxMo }} Mo chacun (PDF, Word, images, audio, vidéo).</div>
                <div *ngFor="let f of fichiers; let i = index" class="fichier">
                    <span>{{ f.name }} — {{ taille(f.size) }}</span>
                    <p-button icon="pi pi-times" severity="danger" text size="small"
                        [attr.aria-label]="'Retirer ' + f.name" (onClick)="retirerFichier(i)" />
                </div>

                <div class="actions">
                    <p-button label="Envoyer ma réponse" icon="pi pi-send" [loading]="envoi" [disabled]="envoi"
                        (onClick)="envoyer()" />
                </div>
            </div>
        </ng-container>
    </div>
    `
})
export class PortailComplement implements OnInit {

    private route   = inject(ActivatedRoute);
    private router  = inject(Router);
    private service = inject(DossierService);

    readonly accept = COMPLEMENT_ACCEPT;
    readonly maxFichiers = COMPLEMENT_MAX_FILES;
    readonly maxMo = COMPLEMENT_MAX_FILE_MB;
    readonly min = COMPLEMENT_MIN_MESSAGE;
    readonly taille = formatFileSize;

    etat: EtatComplement = 'chargement';
    code = '';
    demande: ComplementRequestResponse | null = null;
    message = '';
    fichiers: File[] = [];
    erreurs: string[] = [];
    erreurEnvoi = '';
    envoi = false;
    resultat: { late: boolean; filesUploaded: number } | null = null;

    ngOnInit(): void {
        this.code = (this.route.snapshot.queryParamMap.get('code') ?? '').trim();
        if (!this.code) {
            this.etat = 'introuvable';
            return;
        }
        this.charger();
    }

    recharger(): void { this.charger(); }

    private charger(): void {
        this.etat = 'chargement';
        this.service.getComplementRequest(this.code).subscribe({
            next: demande => { this.demande = demande; this.etat = 'formulaire'; },
            error: (err: HttpErrorResponse) => {
                this.etat = err.status === 404 ? 'introuvable'
                          : err.status === 409 ? 'non-attendu'
                          : 'erreur';
            }
        });
    }

    choisirFichiers(event: Event): void {
        const input = event.target as HTMLInputElement;
        const { files, rejected } = addComplementFiles(this.fichiers, Array.from(input.files ?? []));
        this.fichiers = files;
        this.erreurs = rejected;
        input.value = '';
    }

    retirerFichier(index: number): void {
        this.fichiers = this.fichiers.filter((_, i) => i !== index);
    }

    envoyer(): void {
        if (this.envoi) return;
        this.erreurEnvoi = '';
        this.erreurs = validateComplement(this.message, this.fichiers);
        if (this.erreurs.length) return;

        this.envoi = true;
        this.service.submitComplement(this.code, this.message.trim(), this.fichiers).subscribe({
            next: resultat => {
                this.envoi = false;
                this.resultat = resultat;
                this.etat = 'succes';
            },
            error: (err: HttpErrorResponse) => {
                this.envoi = false;
                if (err.status === 409) {
                    this.etat = 'non-attendu';
                } else if (err.status === 429) {
                    this.erreurEnvoi = 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
                } else if (err.status === 400 && err.error?.message) {
                    this.erreurEnvoi = err.error.message;
                } else {
                    this.erreurEnvoi = 'L’envoi a échoué. Votre saisie est conservée : vérifiez votre connexion et réessayez.';
                }
            }
        });
    }

    suivre(): void { this.router.navigate(['/portail/suivi'], { queryParams: { code: this.code } }); }
    suivreSansCode(): void { this.router.navigate(['/portail/suivi']); }
    accueil(): void { this.router.navigate(['/portail']); }
}
