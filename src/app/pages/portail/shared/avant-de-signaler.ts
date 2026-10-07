import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

interface Repere { icone: string; titre: string; texte: string; }

/**
 * « Avant de signaler » : lève les freins avant le dépôt (pas besoin de preuves, ce qu'il est utile de
 * préparer, ce qui se passe ensuite). Trois cartes sur l'accueil (version large, sous un titre de section),
 * encadré compact en tête du formulaire de dépôt.
 */
@Component({
    selector: 'app-avant-de-signaler',
    standalone: true,
    imports: [RouterModule],
    styles: [`
        :host{display:block;--green:#009640;--ink:#003617;--ink-60:rgba(0,54,23,.74);--hair:#E4E9E6;--mist:#F2F8F4}
        ul{list-style:none;margin:0;padding:0}
        li b{display:block;color:var(--ink);font-weight:800}
        .aide{font-size:.82rem;color:var(--ink-60)}
        .aide a{color:var(--green);font-weight:700;text-decoration:underline}

        /* compact : formulaire de dépôt */
        .bloc{background:var(--mist);border:1px solid var(--hair);border-left:4px solid var(--green);border-radius:12px;padding:1.1rem 1.35rem;text-align:left}
        h2{font-size:1rem;font-weight:800;color:var(--ink);margin:0 0 .8rem}
        .bloc ul{display:grid;gap:.7rem}
        .bloc li{display:flex;gap:.65rem;font-size:.84rem;line-height:1.55;color:var(--ink-60)}
        .bloc li b{display:inline}
        .bloc .ico{color:var(--green);margin-top:.15rem;flex-shrink:0}
        .bloc .aide{margin:.9rem 0 0}

        /* large : accueil, trois cartes */
        .cartes{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;max-width:960px;margin:0 auto;text-align:left}
        .carte{background:#fff;border:1px solid var(--hair);border-radius:14px;padding:1.6rem 1.5rem;box-shadow:0 4px 16px rgba(0,54,23,.05)}
        .carte .ico{width:44px;height:44px;border-radius:50%;background:var(--mist);border:1px solid var(--hair);display:flex;align-items:center;justify-content:center;margin-bottom:1rem}
        .carte .ico i{color:var(--green);font-size:1.15rem}
        .carte b{font-size:1.02rem;margin-bottom:.45rem}
        .carte p{margin:0;font-size:.92rem;line-height:1.65;color:var(--ink-60)}
        .carte p strong{color:var(--ink)}
        .pied{text-align:center;margin-top:1.75rem}
        .pied a{display:inline-flex;align-items:center;gap:.5rem;min-height:44px;padding:0 1.25rem;border:1.5px solid var(--green);border-radius:8px;color:var(--green);font-weight:800;font-size:.88rem;text-decoration:none;background:#fff}
        .pied a:hover{background:var(--green);color:#fff}
        .pied a:focus-visible{outline:3px solid #FFD800;outline-offset:2px}
        @media (max-width:860px){.cartes{grid-template-columns:1fr}}
    `],
    template: `
        @if (large) {
            <section aria-label="Avant de signaler">
                <ul class="cartes">
                    @for (r of reperes; track r.titre) {
                        <li class="carte">
                            <span class="ico"><i [class]="r.icone"></i></span>
                            <b>{{ r.titre }}</b>
                            <p>{{ r.texte }}</p>
                        </li>
                    }
                </ul>
                <p class="pied"><a routerLink="/portail/faq">Lire la foire aux questions <i class="pi pi-arrow-right"></i></a></p>
            </section>
        } @else {
            <section class="bloc" aria-labelledby="avant-titre">
                <h2 id="avant-titre">Avant de signaler</h2>
                <ul>
                    @for (r of reperes; track r.titre) {
                        <li><i class="ico" [class]="r.icone"></i><span><b>{{ r.titre }}.</b> {{ r.texte }}</span></li>
                    }
                </ul>
                <p class="aide">Une question ? Consultez la <a routerLink="/portail/faq">foire aux questions</a>.</p>
            </section>
        }
    `
})
export class AvantDeSignaler {
    /** Version large (accueil) ou compacte (formulaire). */
    @Input() large = false;

    readonly reperes: Repere[] = [
        { icone: 'pi pi-check-circle', titre: 'Un soupçon raisonnable suffit',
          texte: "Vous n'avez pas à prouver les faits : dites ce que vous savez, l'ASCE-LC instruit." },
        { icone: 'pi pi-list', titre: 'Ce qui aide',
          texte: "Qui, quoi, où et quand, l'organisme concerné, un montant s'il est connu, tout document en votre possession. Même incomplet, signalez quand même." },
        { icone: 'pi pi-key', titre: 'Ensuite',
          texte: "Vous recevez un code de suivi à conserver. Il vous permet de suivre l'avancement et de répondre à une demande de complément." }
    ];
}
