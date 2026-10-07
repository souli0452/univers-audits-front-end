import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicStats } from '../../../core/models/statistique.model';

export interface LigneBarre { libelle: string; valeur: number; pourcent: number; }

/** Convertit des valeurs en barres proportionnelles au maximum (la plus grande occupe toute la largeur). */
export function versBarres(lignes: { libelle: string; valeur: number }[]): LigneBarre[] {
    const max = Math.max(0, ...lignes.map(l => l.valeur));
    return lignes.map(l => ({ ...l, pourcent: max > 0 ? Math.round((l.valeur / max) * 100) : 0 }));
}

/**
 * Libellés publics de la nature de la saisine (TypeSaisine du back, calculée d'après la qualité du déposant).
 * Une nature inconnue est affichée telle quelle, sans casser la page.
 */
export const LIBELLES_TYPE: Record<string, string> = {
    DENONCIATION: 'Dénonciations',
    PLAINTE: 'Plaintes',
    SIGNALEMENT: 'Signalements des autorités',
    AUTO_SAISINE: 'Auto-saisines'
};

/** Libellés publics des canaux de dépôt (SubmissionMode du back). */
export const LIBELLES_CANAL: Record<string, string> = {
    WEB_FORM: 'Formulaire en ligne',
    AUDIO_COUNTER: 'Témoignage vocal',
    IN_PERSON: 'Sur place',
    PHONE: 'Téléphone',
    GREEN_NUMBER: 'Numéro vert',
    EMAIL: 'Courriel',
    POSTAL_MAIL: 'Courrier postal',
    PAPER_FORM: 'Formulaire papier',
    SMS: 'SMS',
    FAX: 'Fax',
    SOCIAL_MEDIA: 'Réseaux sociaux',
    PRESS_MEDIA: 'Presse',
    AUDIT_REPORT: "Rapport d'audit"
};

/** Part de dossiers traités, en pourcentage entier ; null tant qu'aucun dossier n'a été reçu. */
export function tauxTraitement(s: Pick<PublicStats, 'totalDossiers' | 'dossiersTraites'>): number | null {
    return s.totalDossiers > 0 ? Math.round((s.dossiersTraites / s.totalDossiers) * 100) : null;
}

const enBarres = (m: Record<string, number> | undefined, libelles: Record<string, string>): LigneBarre[] =>
    versBarres(Object.entries(m ?? {})
        .map(([cle, valeur]) => ({ libelle: libelles[cle] ?? cle, valeur }))
        .sort((a, b) => b.valeur - a.valeur));

/**
 * Chiffres publics (totaux agrégés uniquement, aucune donnée personnelle) : synthèse, évolution sur
 * cinq ans, répartition par nature et par canal pour l'année en cours. La version compacte (accueil)
 * omet la barre d'avancement ; la page « Chiffres » affiche tout.
 */
@Component({
    selector: 'app-apercu-chiffres',
    standalone: true,
    imports: [CommonModule],
    styles: [`
        :host{--green:#009640;--ink:#003617;--hair:#E4E9E6;--mist:#F2F8F4;--ink-60:rgba(0,54,23,.74);--amber:#E8A200;display:block;text-align:left}
        .tuiles{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.25rem}
        .tuile{background:#fff;border:1px solid var(--hair);border-radius:12px;padding:1.1rem;text-align:center}
        .tuile strong{display:block;font-family:ui-monospace,Consolas,monospace;font-size:1.8rem;line-height:1.1;color:var(--ink)}
        .tuile span{display:block;margin-top:.35rem;font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink-60)}
        .tuile.cle{background:var(--green);border-color:var(--green)}
        .tuile.cle strong,.tuile.cle span{color:#fff}
        .carte{background:#fff;border:1px solid var(--hair);border-radius:12px;padding:1.3rem 1.4rem}
        h3{font-size:1rem;font-weight:800;margin:0 0 .2rem;color:var(--ink)}
        .sous{font-size:.78rem;color:var(--ink-60);margin:0 0 1rem}
        .grille{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
        .grille.deux{grid-template-columns:repeat(2,1fr)}
        .barre{display:grid;grid-template-columns:minmax(5.5rem,34%) 1fr 2.2rem;gap:.6rem;align-items:center;margin-bottom:.5rem;font-size:.82rem}
        .barre .lib{overflow-wrap:anywhere;line-height:1.3}
        .piste{background:var(--hair);border-radius:6px;height:16px;overflow:hidden}
        .rempli{display:block;height:100%;background:var(--green);border-radius:6px;min-width:2px}
        .valeur{font-family:ui-monospace,Consolas,monospace;font-weight:700;text-align:right}
        .avancement{margin-bottom:1.25rem}
        .pile{display:flex;height:22px;border-radius:8px;overflow:hidden;background:var(--hair);margin:.4rem 0 .7rem}
        .pile span{display:block;height:100%}
        .legende{display:flex;flex-wrap:wrap;gap:.4rem 1.4rem;font-size:.8rem;color:var(--ink-60)}
        .legende i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:.4rem;vertical-align:baseline}
        .vide{font-size:.82rem;color:var(--ink-60);margin:0}
        .etat{padding:1rem;color:var(--ink-60);font-size:.9rem;text-align:center}
        @media (max-width:860px){.tuiles{grid-template-columns:repeat(2,1fr)}.grille,.grille.deux{grid-template-columns:1fr}}
    `],
    template: `
        @if (chargement) {
            <p class="etat" role="status">Chargement des chiffres…</p>
        } @else if (erreur || !stats) {
            <p class="etat" role="alert">Les chiffres ne sont pas disponibles pour le moment. Veuillez réessayer plus tard.</p>
        } @else {
            <div class="tuiles">
                <div class="tuile"><strong>{{ stats.totalDossiers | number }}</strong><span>Reçus au total</span></div>
                <div class="tuile"><strong>{{ stats.dossiersEnCours | number }}</strong><span>En cours d'instruction</span></div>
                <div class="tuile"><strong>{{ stats.dossiersTraites | number }}</strong><span>Traités</span></div>
                <div class="tuile cle">
                    <strong>{{ taux === null ? '—' : taux + ' %' }}</strong><span>Taux de traitement</span>
                </div>
            </div>

            @if (!compact && stats.totalDossiers > 0) {
                <div class="carte avancement">
                    <h3>Avancement des dossiers</h3>
                    <div class="pile" role="img"
                        [attr.aria-label]="stats.dossiersNouveaux + ' nouveaux, ' + stats.dossiersEnCours + ' en cours, ' + stats.dossiersTraites + ' traités'">
                        <span style="background:var(--amber)" [style.width.%]="part(stats.dossiersNouveaux)"></span>
                        <span style="background:#4DA6C8" [style.width.%]="part(stats.dossiersEnCours)"></span>
                        <span style="background:var(--green)" [style.width.%]="part(stats.dossiersTraites)"></span>
                    </div>
                    <div class="legende">
                        <span><i style="background:var(--amber)"></i>Nouveaux : {{ stats.dossiersNouveaux | number }}</span>
                        <span><i style="background:#4DA6C8"></i>En cours : {{ stats.dossiersEnCours | number }}</span>
                        <span><i style="background:var(--green)"></i>Traités : {{ stats.dossiersTraites | number }}</span>
                    </div>
                </div>
            }

            <div class="grille" [class.deux]="!compact && !canaux.length">
                @if (annees.length) {
                    <section class="carte" aria-labelledby="ch-annees">
                        <h3 id="ch-annees">Évolution sur {{ annees.length }} ans</h3>
                        <p class="sous">Signalements reçus par année</p>
                        @for (a of annees; track a.libelle) {
                            <div class="barre">
                                <span class="lib">{{ a.libelle }}</span>
                                <span class="piste" aria-hidden="true"><span class="rempli" [style.width.%]="a.pourcent"></span></span>
                                <span class="valeur">{{ a.valeur | number }}</span>
                            </div>
                        }
                    </section>
                }
                <section class="carte" aria-labelledby="ch-types">
                    <h3 id="ch-types">Par nature</h3>
                    <p class="sous">Reçus en {{ stats.anneeCourante }}</p>
                    @for (t of types; track t.libelle) {
                        <div class="barre">
                            <span class="lib">{{ t.libelle }}</span>
                            <span class="piste" aria-hidden="true"><span class="rempli" [style.width.%]="t.pourcent"></span></span>
                            <span class="valeur">{{ t.valeur | number }}</span>
                        </div>
                    } @empty { <p class="vide">Aucun signalement reçu cette année.</p> }
                </section>
                @if (canaux.length) {
                    <section class="carte" aria-labelledby="ch-canaux">
                        <h3 id="ch-canaux">Par canal de dépôt</h3>
                        <p class="sous">Reçus en {{ stats.anneeCourante }}</p>
                        @for (c of canaux; track c.libelle) {
                            <div class="barre">
                                <span class="lib">{{ c.libelle }}</span>
                                <span class="piste" aria-hidden="true"><span class="rempli" [style.width.%]="c.pourcent"></span></span>
                                <span class="valeur">{{ c.valeur | number }}</span>
                            </div>
                        }
                    </section>
                }
            </div>
        }
    `
})
export class ApercuChiffres {
    @Input() set stats(s: PublicStats | null) {
        this._stats = s;
        this.taux = s ? tauxTraitement(s) : null;
        this.annees = versBarres((s?.parAnnee ?? []).map(l => ({
            libelle: l.annee === s?.anneeCourante ? l.annee + ' (en cours)' : String(l.annee), valeur: l.total })));
        this.types = enBarres(s?.parType, LIBELLES_TYPE);
        this.canaux = enBarres(s?.parCanal, LIBELLES_CANAL);
    }
    get stats(): PublicStats | null { return this._stats; }
    @Input() chargement = false;
    @Input() erreur = false;
    /** Version compacte (accueil) : sans la barre d'avancement. */
    @Input() compact = false;

    private _stats: PublicStats | null = null;
    taux: number | null = null;
    annees: LigneBarre[] = [];
    types: LigneBarre[] = [];
    canaux: LigneBarre[] = [];

    /** Largeur (en %) d'un segment de la barre d'avancement. */
    part(valeur: number): number {
        const total = this._stats?.totalDossiers ?? 0;
        return total > 0 ? Math.min(100, (valeur / total) * 100) : 0;
    }
}
