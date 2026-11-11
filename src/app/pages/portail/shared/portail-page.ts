import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TailleTexte } from './taille-texte';
import { AideNumeroVert } from './aide-numero-vert';

/**
 * Coque commune des pages d'information du portail (chiffres, mentions, etc.) : lien d'évitement,
 * retour à l'accueil, numéro vert, taille du texte et pied de page minimal.
 */
@Component({
    selector: 'app-portail-page',
    standalone: true,
    imports: [RouterModule, TailleTexte, AideNumeroVert],
    styles: [`
        :host{--green:#009640;--ink:#222222;--mist:#FFFFFF;--hair:#DCDCDC;--ink-60:#5f6368;
              display:block;min-height:100vh;background:var(--mist);font-family:'Lato',system-ui,sans-serif;color:var(--ink)}
        .skip{position:absolute;left:-9999px;top:0;background:#fff;color:var(--ink);padding:.6rem 1rem;z-index:10}
        .skip:focus{left:.5rem;top:.5rem}
        header{background:#fff;color:var(--green);border-bottom:1px solid var(--hair)}
        .bar{max-width:960px;margin:0 auto;padding:.9rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .retour{color:var(--green);text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:.5rem;min-height:36px}
        .retour:focus-visible{outline:2px solid var(--green);outline-offset:2px;border-radius:6px}
        .outils{display:flex;align-items:center;gap:1rem;color:var(--green)}
        main{max-width:960px;margin:0 auto;padding:2rem 1.25rem 4rem}
        h1{font-size:1.8rem;font-weight:700;margin:0 0 .5rem;color:var(--ink)}
        .intro{color:var(--ink-60);font-size:.92rem;line-height:1.6;margin:0 0 1.5rem}
        footer{border-top:1px solid var(--hair);padding:1.25rem;text-align:center;font-size:.78rem;color:var(--ink-60)}
        footer a{color:var(--green);font-weight:700;text-decoration:underline}
    `],
    template: `
        <a class="skip" href="#contenu">Aller au contenu</a>
        <header>
            <div class="bar">
                <a class="retour" routerLink="/portail"><i class="pi pi-arrow-left"></i> Accueil</a>
                <div class="outils"><app-aide-numero-vert /><app-taille-texte /></div>
            </div>
        </header>
        <main id="contenu">
            <h1>{{ titre }}</h1>
            @if (intro) { <p class="intro">{{ intro }}</p> }
            <ng-content />
        </main>
        <footer>
            <a routerLink="/portail/faq">Foire aux questions</a> ·
            <a routerLink="/portail/info/confidentialite">Confidentialité</a> ·
            <a routerLink="/portail/info/mentions-legales">Mentions légales</a>
        </footer>
    `
})
export class PortailPage {
    @Input({ required: true }) titre = '';
    @Input() intro = '';
}
