import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { DossierResponse, isVersionConflict } from '../../../core/models/dossier.model';
import { DossierService } from '../../../core/services/dossier.service';
import { ActionId } from '../dossier-detail/actions-dossier';
import { DefinitionTransition, TRANSITIONS, libelleStatut, transitionDeLAction } from '../dossier-detail/transitions-dossier';

/**
 * Fenêtre de confirmation d'une action simple du circuit (enregistrer, démarrer l'étude, recevable, irrecevable,
 * clôturer…), ouverte depuis la liste sans quitter la page. Même règle que le détail : la version du dossier part
 * avec la demande, et un dossier modifié entre-temps par un autre agent est rechargé puis signalé.
 *
 * Le parent crée le composant à l'ouverture et le retire à la fermeture : chaque ouverture repart d'un motif vide.
 */
@Component({
    selector: 'app-transition-dossier',
    standalone: true,
    imports: [FormsModule, ButtonModule, DialogModule, TextareaModule],
    template: `
        @if (transition(); as t) {
            <p-dialog [visible]="true" (visibleChange)="$event || ferme.emit()" [header]="t.titre"
                [modal]="true" [style]="{ width: 'min(32em, 94vw)' }" [draggable]="false" appendTo="body">
                <div class="flex flex-col gap-4 py-2">
                    <div class="p-3 bg-surface-50 border border-surface-200 rounded-xl text-sm flex flex-col gap-1">
                        <div class="font-semibold">{{ dossier().number || 'Dossier sans numéro' }}</div>
                        <div class="text-surface-700">{{ dossier().object }}</div>
                        <div class="mt-1">
                            Statut : <strong>{{ statutActuel() }}</strong>
                            <i class="pi pi-arrow-right mx-2 text-xs"></i>
                            <strong>{{ statutVise() }}</strong>
                        </div>
                    </div>
                    <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 m-0">{{ t.message(dossier().status) }}</p>
                    </div>
                    @if (!t.annulable) {
                        <div role="alert" class="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2">
                            <i class="pi pi-exclamation-triangle text-orange-600 mt-0.5"></i>
                            <p class="text-sm text-orange-800 m-0">
                                Cette action est <strong>définitive</strong> : elle ne peut pas être annulée dans l'application.
                            </p>
                        </div>
                    }
                    <textarea pTextarea [(ngModel)]="motif" placeholder="Motif / Observation (optionnel)"
                        rows="4" class="w-full resize-none" aria-label="Motif ou observation (facultatif)"></textarea>
                    <label class="flex items-start gap-2 text-sm cursor-pointer">
                        <input type="checkbox" [(ngModel)]="verifie" class="mt-1" />
                        <span>J'ai vérifié le dossier et je confirme cette action.</span>
                    </label>
                </div>
                <ng-template pTemplate="footer">
                    <p-button label="Annuler" severity="secondary" outlined (onClick)="ferme.emit()" />
                    <p-button [label]="t.titre" [loading]="enCours" [disabled]="!verifie" (onClick)="confirmer()" />
                </ng-template>
            </p-dialog>
        }
    `
})
export class TransitionDossier {
    readonly dossier = input.required<DossierResponse>();
    readonly action = input.required<ActionId>();
    /** Le dossier tel que le serveur le rend après la transition (ou rechargé après un conflit). */
    readonly termine = output<DossierResponse>();
    readonly ferme = output<void>();

    private readonly service = inject(DossierService);
    private readonly messages = inject(MessageService);

    motif = '';
    /** « J'ai vérifié le dossier » : sans cette case, rien ne part (les transitions ne s'annulent pas). */
    verifie = false;
    enCours = false;

    statutActuel(): string { return libelleStatut(this.dossier().status); }
    statutVise(): string { return libelleStatut(this.transition()?.statutVise); }

    readonly transition = computed<DefinitionTransition | undefined>(() => {
        const type = transitionDeLAction(this.action());
        return type ? TRANSITIONS[type] : undefined;
    });

    confirmer(): void {
        const t = this.transition();
        if (!t || this.enCours || !this.verifie) { return; }
        const d = this.dossier();
        this.enCours = true;
        t.appel(this.service, d.id, { version: d.version, reason: this.motif }).subscribe({
            next: misAJour => {
                this.enCours = false;
                this.messages.add({ severity: 'success', summary: 'Statut mis à jour', detail: t.titre });
                this.termine.emit(misAJour);
            },
            error: err => this.echec(err, d.id)
        });
    }

    private echec(err: any, id: string): void {
        if (!isVersionConflict(err)) {
            this.enCours = false;
            this.messages.add({ severity: 'error', summary: 'Erreur', detail: err?.error?.message || 'Action impossible' });
            return;
        }
        this.messages.add({ severity: 'warn', summary: 'Dossier modifié entre-temps',
            detail: 'Un autre agent a modifié ce dossier. Il a été actualisé : vérifiez son état, puis recommencez si besoin.' });
        this.service.refreshById(id).subscribe({
            next: frais => { this.enCours = false; this.termine.emit(frais); },
            error: () => {
                this.enCours = false;
                this.messages.add({ severity: 'error', summary: 'Erreur de rechargement', detail: 'Impossible de recharger le dossier.' });
            }
        });
    }
}
