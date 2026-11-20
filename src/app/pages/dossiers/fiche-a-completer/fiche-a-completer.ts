import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierUpdateRequest } from '../../../core/models/dossier.model';
import { CHOIX_NATURE_AGENT, TYPOLOGIES_INSTITUTIONNELLES } from '../../../core/utils/saisine-categories';
import { DureeAudio } from '../../../shared/duree-audio/duree-audio';
import { ChoixSuggere, SuggestionSaisineAide } from '../../../shared/suggestion-saisine/suggestion-saisine';

export interface AudioDuDossier { id: string; nom: string; url: string; }

/**
 * Compléter la fiche d'un dossier avant l'étude : pour un dépôt vocal, l'agent écoute l'enregistrement (toujours
 * visible, en tête) puis renseigne l'objet, les faits, le lieu, la nature et le type d'institution.
 */
@Component({
    selector: 'app-fiche-a-completer',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, TextareaModule, ToastModule, DureeAudio, SuggestionSaisineAide],
    providers: [MessageService],
    template: `
        <p-toast />
        <section class="bg-white dark:bg-surface-800 rounded-2xl border border-primary-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-surface-100 flex items-center gap-2">
                <i class="pi pi-pencil text-primary-600"></i>
                <h3 class="font-semibold text-sm">Compléter la fiche du dossier</h3>
            </div>

            <div class="p-5 flex flex-col gap-4">
                @if (audios().length) {
                    <div class="rounded-xl border border-primary-200 bg-primary-50 p-4">
                        <div class="font-semibold text-sm text-primary-900 mb-1">
                            <i class="pi pi-microphone mr-2"></i>Témoignage vocal
                        </div>
                        <p class="text-xs text-primary-800 mb-3">
                            Écoutez-le, puis renseignez ci-dessous les informations qu'il contient.
                        </p>
                        @for (a of audios(); track a.id) {
                            @if (a.url) {
                                <audio appDureeAudio [src]="a.url" controls preload="auto" class="w-full" style="height:40px;"></audio>
                            } @else {
                                <p class="text-xs text-primary-700"><i class="pi pi-spin pi-spinner mr-1"></i>Chargement de l'enregistrement…</p>
                            }
                        }
                    </div>
                }

                <form [formGroup]="form" class="flex flex-col gap-4" (ngSubmit)="enregistrer()">
                    <label class="flex flex-col gap-1">
                        <span class="text-sm font-medium">Objet du dossier</span>
                        <input pInputText formControlName="object" maxlength="500"
                               placeholder="En une phrase : de quoi s'agit-il ?"/>
                    </label>

                    <label class="flex flex-col gap-1">
                        <span class="text-sm font-medium">Décrivez les faits</span>
                        <textarea pTextarea formControlName="description" rows="5" maxlength="10000"></textarea>
                    </label>

                    <app-suggestion-saisine [texte]="texteDuRecit()"
                        [natureActuelle]="form.controls.natureSaisineChoisie.value"
                        [typologieActuelle]="form.controls.typologieInstitutionnelle.value"
                        [natureModifiable]="form.controls.natureSaisineChoisie.enabled"
                        (appliquer)="appliquerSuggestion($event)" />

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label class="flex flex-col gap-1">
                            <span class="text-sm font-medium">Lieu des faits</span>
                            <input pInputText formControlName="incidentLocation" maxlength="300"/>
                        </label>
                        <label class="flex flex-col gap-1">
                            <span class="text-sm font-medium">Période</span>
                            <input pInputText formControlName="incidentPeriod" maxlength="200" placeholder="Ex. : mars 2026"/>
                        </label>
                        <label class="flex flex-col gap-1">
                            <span class="text-sm font-medium">Montant estimé (FCFA)</span>
                            <input pInputText type="number" min="0" formControlName="estimatedLoss"/>
                        </label>
                        <label class="flex flex-col gap-1">
                            <span class="text-sm font-medium">Nature du dossier</span>
                            <p-select [options]="natures" optionLabel="label" optionValue="value"
                                      formControlName="natureSaisineChoisie" appendTo="body" styleClass="w-full"/>
                        </label>
                        <label class="flex flex-col gap-1 md:col-span-2">
                            <span class="text-sm font-medium">Type d'institution mise en cause</span>
                            <p-select [options]="typologies" optionLabel="label" optionValue="value"
                                      formControlName="typologieInstitutionnelle" [showClear]="true"
                                      placeholder="À renseigner" appendTo="body" styleClass="w-full"/>
                        </label>
                    </div>

                    <div class="flex justify-end">
                        <p-button type="submit" label="Enregistrer les compléments" icon="pi pi-check" [loading]="enCours"/>
                    </div>
                </form>
            </div>
        </section>
    `
})
export class FicheACompleter implements OnInit {
    readonly dossier = input.required<DossierResponse>();
    readonly audios  = input<AudioDuDossier[]>([]);
    readonly enregistre = output<DossierResponse>();

    private dossierService = inject(DossierService);
    private messages       = inject(MessageService);
    private fb             = inject(FormBuilder);

    readonly natures    = CHOIX_NATURE_AGENT;
    readonly typologies = TYPOLOGIES_INSTITUTIONNELLES;
    enCours = false;

    readonly form = this.fb.group({
        object:                    ['', [Validators.required, Validators.minLength(10)]],
        description:               ['', Validators.required],
        incidentLocation:          [''],
        incidentPeriod:            [''],
        estimatedLoss:             [null as number | null],
        natureSaisineChoisie:      [''],
        typologieInstitutionnelle: [null as string | null]
    });

    ngOnInit(): void {
        const d = this.dossier();
        this.form.patchValue({
            object:                    d.object ?? '',
            description:               d.description ?? '',
            incidentLocation:          d.incidentLocation ?? '',
            incidentPeriod:            d.incidentPeriod ?? '',
            estimatedLoss:             d.estimatedLoss ?? null,
            natureSaisineChoisie:      d.type,
            typologieInstitutionnelle: d.typologieInstitutionnelle ?? null
        });
        // Un signalement d'autorité ou une auto-saisine garde sa nature : on ne la propose pas à la modification.
        if (!this.natures.some(n => n.value === d.type)) {
            this.form.controls.natureSaisineChoisie.disable();
        }
    }

    /** Récit sur lequel s'appuie la suggestion : l'objet et les faits, tels que l'agent les a à l'écran. */
    texteDuRecit(): string {
        return `${this.form.controls.object.value ?? ''}\n${this.form.controls.description.value ?? ''}`;
    }

    /** L'agent accepte la suggestion : elle remplit les listes, rien n'est enregistré avant « Enregistrer ». */
    appliquerSuggestion(choix: ChoixSuggere): void {
        if (choix.nature && this.form.controls.natureSaisineChoisie.enabled) {
            this.form.controls.natureSaisineChoisie.setValue(choix.nature);
        }
        if (choix.typologie) { this.form.controls.typologieInstitutionnelle.setValue(choix.typologie); }
        this.form.markAsDirty();
    }

    enregistrer(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messages.add({ severity: 'warn', summary: 'Fiche incomplète',
                detail: "L'objet (10 caractères au moins) et la description des faits sont obligatoires." });
            return;
        }
        const v = this.form.getRawValue();
        const texte = (valeur: string | null | undefined) => (valeur ?? '').trim() || undefined;
        const champs: Partial<DossierUpdateRequest> = {
            object: texte(v.object), description: texte(v.description),
            incidentLocation: texte(v.incidentLocation), incidentPeriod: texte(v.incidentPeriod),
            estimatedLoss: v.estimatedLoss ?? undefined,
            natureSaisineChoisie: this.form.controls.natureSaisineChoisie.disabled ? undefined : texte(v.natureSaisineChoisie),
            typologieInstitutionnelle: v.typologieInstitutionnelle ?? undefined
        };
        // Seuls les champs renseignés sont envoyés : le serveur ne touche pas aux autres.
        const demande: Record<string, unknown> = { version: this.dossier().version };
        for (const [cle, valeur] of Object.entries(champs)) {
            if (valeur !== undefined) { demande[cle] = valeur; }
        }

        this.enCours = true;
        this.dossierService.update(this.dossier().id, demande as unknown as DossierUpdateRequest).subscribe({
            next: dossier => {
                this.enCours = false;
                this.messages.add({ severity: 'success', summary: 'Fiche complétée',
                    detail: 'Les informations ont été enregistrées au dossier.' });
                this.enregistre.emit(dossier);
            },
            error: err => {
                this.enCours = false;
                this.messages.add({ severity: 'error', summary: 'Enregistrement impossible',
                    detail: err?.error?.message || err?.message || 'Réessayez dans un instant.' });
            }
        });
    }
}
