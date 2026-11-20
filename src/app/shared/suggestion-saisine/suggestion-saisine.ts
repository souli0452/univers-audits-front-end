import { Component, computed, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { suggererSaisine } from '../../core/utils/suggestion-saisine';
import { TYPOLOGIES_INSTITUTIONNELLES, libelleDeNature } from '../../core/utils/saisine-categories';

export interface ChoixSuggere { nature?: string; typologie?: string; }

/**
 * Aide à l'agent qui qualifie un dossier : propose la nature et le type d'institution déduits du récit.
 * N'enregistre rien : « Appliquer » renvoie les valeurs au formulaire de l'agent, qui garde la main et valide
 * lui-même. Ne propose que ce qui diffère de l'existant, et seulement pour une nature modifiable.
 */
@Component({
    selector: 'app-suggestion-saisine',
    standalone: true,
    imports: [ButtonModule],
    template: `
        @if (propositions(); as p) {
            <div role="note" class="rounded-xl border border-primary-200 bg-primary-50 p-4 flex flex-col gap-2">
                <div class="text-sm text-primary-900">
                    <i class="pi pi-lightbulb mr-2"></i><strong>Suggestion</strong> d’après le récit : à vous de décider.
                </div>
                <ul class="text-sm text-primary-900 list-none p-0 m-0 flex flex-col gap-1">
                    @if (p.nature) { <li>Nature du dossier : <strong>{{ libelleNature(p.nature) }}</strong></li> }
                    @if (p.typologie) { <li>Type d’institution : <strong>{{ libelleTypologie(p.typologie) }}</strong></li> }
                </ul>
                <div class="flex gap-2">
                    <p-button label="Appliquer" size="small" icon="pi pi-check" (onClick)="appliquerChoix(p)" />
                    <p-button label="Ignorer" size="small" [outlined]="true" (onClick)="ignorer(p)" />
                </div>
            </div>
        }
    `
})
export class SuggestionSaisineAide {
    /** Récit sur lequel s'appuie la suggestion (objet et description). */
    readonly texte = input<string>('');
    readonly natureActuelle = input<string | null>(null);
    readonly typologieActuelle = input<string | null>(null);
    /** Faux pour un signalement d'autorité ou une auto-saisine : leur nature ne se change pas. */
    readonly natureModifiable = input<boolean>(true);
    readonly appliquer = output<ChoixSuggere>();

    private readonly ignoree = signal<string | null>(null);

    readonly propositions = computed<ChoixSuggere | null>(() => {
        const s = suggererSaisine(this.texte());
        const nature = this.natureModifiable() && s.nature && s.nature !== this.natureActuelle() ? s.nature : undefined;
        const typologie = s.typologie && s.typologie !== this.typologieActuelle() ? s.typologie : undefined;
        if (!nature && !typologie) { return null; }
        const choix: ChoixSuggere = {};
        if (nature) { choix.nature = nature; }
        if (typologie) { choix.typologie = typologie; }
        return cle(choix) === this.ignoree() ? null : choix;
    });

    libelleNature = libelleDeNature;
    libelleTypologie = (valeur: string): string =>
        TYPOLOGIES_INSTITUTIONNELLES.find(t => t.value === valeur)?.label ?? valeur;

    appliquerChoix(choix: ChoixSuggere): void { this.appliquer.emit(choix); }
    ignorer(choix: ChoixSuggere): void { this.ignoree.set(cle(choix)); }
}

function cle(choix: ChoixSuggere): string { return `${choix.nature ?? ''}|${choix.typologie ?? ''}`; }
