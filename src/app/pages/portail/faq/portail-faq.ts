import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TailleTexte } from '../shared/taille-texte';
import { AideNumeroVert } from '../shared/aide-numero-vert';

export interface QuestionFaq { groupe: string; question: string; reponse: string; }

/**
 * Foire aux questions du portail : répond aux craintes du dénonciateur avant le dépôt. Textes à faire
 * valider par les utilisateurs métier (ASCE-LC) avant mise en production.
 */
export const QUESTIONS_FAQ: QuestionFaq[] = [
    { groupe: 'Avant de signaler', question: 'Dois-je avoir des preuves pour signaler ?',
      reponse: "Non. Un soupçon raisonnable suffit. Décrivez ce que vous savez ou avez constaté ; l'ASCE-LC instruit le dossier et mène l'enquête si nécessaire. Si vous avez des documents, joignez-les, mais leur absence ne doit pas vous empêcher de signaler." },
    { groupe: 'Avant de signaler', question: 'Quelle différence entre une plainte et une dénonciation ?',
      reponse: "Une dénonciation est une information, écrite ou orale, sur des irrégularités ou des violations de la loi commises par des personnes de l'administration de l'État, des collectivités territoriales, des établissements publics ou des organismes chargés d'un service public. Une plainte exprime une préoccupation ou un mécontentement concernant des agents, des services, des interventions ou des actions de ces administrations et organismes. Dans le formulaire, choisissez celle qui correspond le mieux ; le dossier sera orienté au besoin." },
    { groupe: 'Avant de signaler', question: 'Qui peut signaler ?',
      reponse: "Les citoyens, les groupes, les personnes morales, les usagers de l'administration et les institutions partenaires. Chacun peut rester anonyme : sans identité, le signalement est traité comme une dénonciation (une plainte est nominative)." },
    { groupe: 'Avant de signaler', question: 'Que puis-je signaler ?',
      reponse: "Des faits concernant l'administration de l'État, les collectivités territoriales, les établissements publics et les organismes chargés d'une mission de service public. Les litiges strictement privés ne relèvent pas de l'ASCE-LC. En cas de doute, signalez quand même : le dossier sera orienté vers l'autorité compétente." },
    { groupe: 'Avant de signaler', question: 'Que faut-il préparer ?',
      reponse: "Rien d'obligatoire. Pour aider l'instruction : qui est concerné, ce qui s'est passé, où et quand, l'organisme ou le service impliqué, un montant estimé s'il est connu, et tout document utile (PDF, Word, images, audio, vidéo)." },
    { groupe: 'Avant de signaler', question: 'Puis-je témoigner de vive voix plutôt que par écrit ?',
      reponse: "Oui. Le témoignage vocal vous permet de raconter les faits dans votre langue (mooré, dioula, fulfuldé, etc.) depuis votre téléphone, sans rien écrire." },

    { groupe: 'Confidentialité', question: 'Mon identité sera-t-elle révélée ?',
      reponse: "Vos coordonnées ne sont accessibles qu'aux agents habilités à traiter votre dossier. Elles ne sont jamais affichées publiquement, ni dans les chiffres du portail. Si vous souhaitez rester discret, évitez aussi de les mentionner dans la description des faits." },
    { groupe: 'Confidentialité', question: 'Puis-je rester anonyme ?',
      reponse: "Oui, à l'étape « Vos coordonnées », vous pouvez choisir de rester anonyme. Sans identité, votre signalement est traité comme une dénonciation : une plainte, elle, est nominative, car elle émane d'une personne qui a subi un préjudice. Quand vous restez anonyme, nous ne pouvons pas vous contacter : le seul moyen de suivre votre dossier et de répondre à une éventuelle demande de précision est votre code de suivi. Si vous donnez vos coordonnées, l'instruction est généralement plus efficace, car l'agent peut vous demander des précisions." },
    { groupe: 'Confidentialité', question: "Les autres personnes peuvent-elles savoir que j'ai signalé ?",
      reponse: "Nous vous conseillons de n'en parler qu'à des personnes de confiance. Le contenu de votre signalement n'est communiqué qu'aux personnes qui en ont besoin pour le traiter." },
    { groupe: 'Confidentialité', question: 'Que se passe-t-il si mon signalement est sciemment faux ?',
      reponse: "Signaler de bonne foi des faits que vous soupçonnez est sans risque, même s'ils se révèlent inexacts. En revanche, accuser quelqu'un en sachant que c'est faux peut engager votre responsabilité. Présentez donc comme certains uniquement les faits dont vous êtes sûr(e)." },

    { groupe: 'Après le dépôt', question: 'Que se passe-t-il après mon signalement ?',
      reponse: "Votre dossier reçoit un numéro officiel et vous obtenez un code de suivi. Un agent instruit le dossier, mène l'enquête si nécessaire, puis une décision officielle est rendue. Vous pouvez suivre chaque étape avec votre code, à tout moment." },
    { groupe: 'Après le dépôt', question: 'Comment suivre mon dossier ?',
      reponse: "Sur la page d'accueil, entrez le code de suivi (8 caractères) remis après votre dépôt, dans la case « Suivre mon dossier »." },
    { groupe: 'Après le dépôt', question: "J'ai perdu mon code de suivi, que faire ?",
      reponse: "Le code est la seule clé d'accès à votre dossier : notez-le dès sa remise et gardez-le en lieu sûr. En cas de perte, appelez le numéro vert pour être orienté." },
    { groupe: 'Après le dépôt', question: 'Combien de temps faut-il pour traiter un dossier ?',
      reponse: "La durée dépend de la complexité des faits. L'état d'avancement de votre dossier est consultable à tout moment avec votre code de suivi." },
    { groupe: 'Après le dépôt', question: "L'ASCE-LC peut-elle me demander des précisions ?",
      reponse: "Oui. Si des informations manquent, l'agent peut vous adresser une demande de complément. Vous y répondez depuis le lien indiqué ou depuis la page de suivi, sans créer de compte." },
    { groupe: 'Après le dépôt', question: "Comment joindre l'ASCE-LC autrement qu'en ligne ?",
      reponse: "Par le numéro vert gratuit 80 00 11 02, par téléphone au (+226) 25 37 40 60 pour dénoncer un fait de corruption (standard : 25 37 40 56), par courriel à denoncer@asce-lc.bf pour un signalement (info@asce-lc.bf pour une question générale), ou sur place à Ouaga 2000, avenue Pascal Zagré. Les bureaux sont ouverts du lundi au jeudi de 7 h 30 à 16 h 00 et le vendredi de 7 h 30 à 16 h 30." },
    { groupe: 'Après le dépôt', question: 'Mon signalement peut-il être transmis à une autre autorité ?',
      reponse: "Si les faits relèvent d'une autre autorité compétente, le dossier peut lui être transmis, dans le respect de la confidentialité de votre identité." },
];

@Component({
    selector: 'app-portail-faq',
    standalone: true,
    imports: [CommonModule, RouterModule, TailleTexte, AideNumeroVert],
    styles: [`
        :host{--green:#009640;--red:#E30613;--yellow:#FFD800;--ink:#003617;--mist:#F2F8F4;--hair:#E4E9E6;--ink-60:rgba(0,54,23,.72);
              display:block;min-height:100vh;background:var(--mist);font-family:'Lato',system-ui,sans-serif;color:var(--ink)}
        .skip{position:absolute;left:-9999px;top:0;background:#fff;color:var(--ink);padding:.6rem 1rem;z-index:10}
        .skip:focus{left:.5rem;top:.5rem}
        header{background:var(--green);color:#fff;border-bottom:3px solid var(--yellow)}
        .bar{max-width:860px;margin:0 auto;padding:.9rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .bar a.retour{color:#fff;text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:.5rem;min-height:36px}
        .bar .outils{display:flex;align-items:center;gap:1rem;color:#fff}
        main{max-width:860px;margin:0 auto;padding:2rem 1.25rem 4rem}
        h1{font-family:ui-serif,Georgia,serif;font-size:1.8rem;font-weight:800;margin:0 0 .5rem;color:var(--ink)}
        .intro{color:var(--ink-60);font-size:.92rem;line-height:1.6;margin:0 0 1.25rem}
        .actions{display:flex;gap:.6rem;margin-bottom:1.5rem;flex-wrap:wrap}
        .actions button{background:#fff;border:1.5px solid var(--hair);border-radius:8px;padding:.5rem .9rem;font-weight:700;font-size:.8rem;color:var(--ink);cursor:pointer;font-family:inherit;min-height:36px}
        .actions button:hover{border-color:var(--green)}
        h2{font-size:.72rem;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin:1.75rem 0 .6rem}
        details{background:#fff;border:1px solid var(--hair);border-radius:10px;margin-bottom:.5rem}
        summary{cursor:pointer;padding:1rem 1.15rem;font-weight:700;font-size:.92rem;list-style:none;display:flex;justify-content:space-between;gap:1rem;align-items:center;min-height:44px}
        summary::-webkit-details-marker{display:none}
        summary::after{content:'+';font-size:1.3rem;font-weight:400;color:var(--green);flex-shrink:0}
        details[open] summary::after{content:'−'}
        summary:focus-visible{outline:3px solid var(--green);outline-offset:2px;border-radius:10px}
        details p{margin:0;padding:0 1.15rem 1.1rem;font-size:.88rem;line-height:1.7;color:var(--ink-60)}
        .cta{margin-top:2.5rem;background:#fff;border:1px solid var(--hair);border-radius:12px;padding:1.5rem;text-align:center}
        .cta p{margin:0 0 1rem;color:var(--ink-60);font-size:.9rem}
        .cta a{display:inline-flex;align-items:center;gap:.5rem;background:var(--red);color:#fff;text-decoration:none;font-weight:800;border-radius:8px;padding:.85rem 1.5rem;min-height:44px}
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
            <h1>Foire aux questions</h1>
            <p class="intro">Les réponses aux questions les plus fréquentes avant, pendant et après votre signalement.</p>
            <div class="actions">
                <button type="button" (click)="toutOuvrir()">Tout ouvrir</button>
                <button type="button" (click)="toutFermer()">Tout fermer</button>
            </div>
            <ng-container *ngFor="let q of questions; let i = index">
                <h2 *ngIf="i === 0 || questions[i-1].groupe !== q.groupe">{{ q.groupe }}</h2>
                <details [open]="ouvertes.has(i)" (toggle)="maj(i, $event)">
                    <summary>{{ q.question }}</summary>
                    <p>{{ q.reponse }}</p>
                </details>
            </ng-container>
            <div class="cta">
                <p>Vous êtes prêt(e) ? Votre signalement peut changer les choses.</p>
                <a routerLink="/portail/deposer"><i class="pi pi-megaphone"></i> Faire un signalement</a>
            </div>
        </main>
    `
})
export class PortailFaq {
    readonly questions = QUESTIONS_FAQ;
    ouvertes = new Set<number>();

    toutOuvrir(): void { this.ouvertes = new Set(this.questions.map((_, i) => i)); }
    toutFermer(): void { this.ouvertes = new Set(); }

    maj(i: number, evt: Event): void {
        const ouvert = (evt.target as HTMLDetailsElement).open;
        const copie = new Set(this.ouvertes);
        if (ouvert) { copie.add(i); } else { copie.delete(i); }
        this.ouvertes = copie;
    }
}
