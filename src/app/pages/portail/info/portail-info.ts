import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PortalConfigService } from '../../../core/services/portal-config.service';
import { NUMERO_VERT, lienTelephone } from '../../../core/constants/numero-vert';
import { PortailPage } from '../shared/portail-page';

export interface PageInfo {
    titre: string;
    intro: string;
    sections: { titre: string; paragraphes: string[] }[];
    /** Renvoi vers la page correspondante du site institutionnel. */
    source?: { texte: string; url: string };
}

/** Coordonnées officielles publiées sur www.asce-lc.bf/contact/ ; la configuration du portail les remplace. */
export const COORDONNEES_OFFICIELLES = {
    courriel: 'info@asce-lc.bf',
    courrielDenonciation: 'denoncer@asce-lc.bf',
    adresse: 'Avenue Pascal Zagré, Ouaga 2000, Ouagadougou, Burkina Faso',
    boitePostale: '01 BP 617 Ouagadougou 01',
    telephones: ['(+226) 25 37 40 56', '(+226) 25 37 40 60'],
    horaires: 'Du lundi au jeudi de 7 h 30 à 16 h 00, le vendredi de 7 h 30 à 16 h 30',
    site: 'https://www.asce-lc.bf'
};

/**
 * Pages d'information du portail (pied de page). Contenu repris du site institutionnel www.asce-lc.bf
 * (missions, fondement légal, contact) et de ce que fait réellement l'application. À faire relire par
 * l'ASCE-LC avant mise en production, en particulier la page de confidentialité.
 */
export const PAGES_INFO: Record<string, PageInfo> = {
    'missions': {
        titre: 'Nos missions',
        intro: "L'Autorité Supérieure de Contrôle d'État et de Lutte contre la Corruption (ASCE-LC) a été créée par la loi organique n°082-2015/CNT du 24 novembre 2015. Elle a regroupé les missions de plusieurs organismes antérieurs, dont l'Inspection Générale d'État et la Haute Autorité de Coordination de la Lutte contre la Corruption.",
        sections: [
            { titre: 'Prévention (article 8)', paragraphes: ["Définir des politiques et des stratégies de prévention, sensibiliser les citoyens, appuyer les programmes éducatifs, renforcer les capacités de la société civile et mener une communication stratégique."] },
            { titre: 'Lutte contre la corruption (article 9)', paragraphes: ["Mener des investigations, collecter les preuves, analyser les informations à l'intention des autorités judiciaires, assurer le recouvrement des sommes concernées et saisir la justice."] },
            { titre: "Déclaration d'intérêts et de patrimoine (article 10)", paragraphes: ["Recevoir et traiter les déclarations, en assurer la publication et l'archivage, les vérifier et mettre en demeure les autorités défaillantes."] },
            { titre: 'Contrôle administratif interne (article 11)', paragraphes: [
                "Contrôler le respect des textes législatifs et réglementaires, s'assurer de la mise en place de dispositifs de gestion des risques, auditer les systèmes de gestion et évaluer les politiques publiques.",
                "Cet article charge aussi l'ASCE-LC de recevoir et d'étudier les dénonciations des citoyens sur leurs relations avec les services publics : c'est le rôle de ce portail." ] },
            { titre: 'Coordination (article 6)', paragraphes: ["Coordonner les organes de contrôle interne de l'administration, harmoniser leurs méthodes de travail et organiser des rencontres de concertation entre eux."] }
        ],
        source: { texte: "Voir les missions et attributions sur le site de l'ASCE-LC", url: 'https://www.asce-lc.bf/missions-et-attribution-asce-lc/' }
    },
    'textes-juridiques': {
        titre: 'Textes juridiques',
        intro: "Les textes sur lesquels s'appuient l'ASCE-LC et ce portail.",
        sections: [
            { titre: "Loi organique n°082-2015/CNT du 24 novembre 2015", paragraphes: ["Crée l'ASCE-LC et fixe ses attributions. L'article 11 la charge de recevoir et d'étudier les dénonciations des citoyens sur leurs relations avec les services publics."] },
            { titre: 'Loi n°032-2007/AN du 29 novembre 2007', paragraphes: ["Son article 3 est également cité par l'ASCE-LC parmi les fondements de la réception des plaintes et des dénonciations."] },
            { titre: 'Loi n°001-2021/AN du 30 mars 2021', paragraphes: [
                "Protection des données à caractère personnel : elle remplace la loi de 2004. Les données doivent être collectées pour un usage précis et légal. Chacun dispose d'un droit d'accès, de rectification, d'opposition et d'effacement, et les organismes doivent en assurer la sécurité.",
                "L'application de cette loi est contrôlée par la Commission de l'informatique et des libertés (CIL)." ] },
            { titre: 'Protection des personnes qui signalent', paragraphes: ["L'ASCE-LC indique que les personnes qui dénoncent bénéficient des mesures de protection prévues par la loi."] }
        ],
        source: { texte: "Voir le fondement légal sur le site de l'ASCE-LC", url: 'https://www.asce-lc.bf/fondement-legal-des-plaintes-et-denonciations/' }
    },
    'confidentialite': {
        titre: 'Confidentialité',
        intro: "Ce que nous collectons lorsque vous signalez des faits, pourquoi, et qui peut y accéder. Le traitement de vos données relève de la loi n°001-2021/AN du 30 mars 2021.",
        sections: [
            { titre: 'Ce que nous collectons', paragraphes: [
                "Ce que vous renseignez : la nature et la description des faits, le lieu, un montant estimé, les pièces jointes et l'éventuel enregistrement audio.",
                "Vos coordonnées si vous choisissez de les fournir (obligatoires pour une victime). Vous pouvez rester anonyme si vous signalez en tant que témoin." ] },
            { titre: 'Pourquoi', paragraphes: ["Ces informations servent à instruire votre signalement et, si vous avez fourni vos coordonnées, à vous contacter ou à vous informer de la suite."] },
            { titre: 'Qui y a accès', paragraphes: [
                "Les agents habilités à traiter les dossiers. Vos informations ne sont pas affichées publiquement, ni dans les chiffres du portail.",
                "Si les faits relèvent d'une autre autorité compétente, le dossier peut lui être transmis." ] },
            { titre: 'Votre code de suivi', paragraphes: ["Il vous est remis à la fin du dépôt. Il est la seule clé d'accès à votre dossier : ne le partagez pas et conservez-le."] },
            { titre: 'Vos droits', paragraphes: [
                "La loi vous reconnaît un droit d'accès, de rectification, d'opposition et d'effacement de vos données. Pour les exercer, utilisez les coordonnées indiquées dans les mentions légales.",
                "Vous pouvez aussi vous adresser à la Commission de l'informatique et des libertés (CIL), autorité de contrôle." ] }
        ]
    },
    'conditions': {
        titre: "Conditions d'utilisation",
        intro: "Ce que nous attendons de vous et ce que le portail permet.",
        sections: [
            { titre: 'Qui peut signaler', paragraphes: ["Les citoyens, groupes, personnes morales, usagers de l'administration et institutions partenaires peuvent déposer une plainte ou une dénonciation. Un témoin peut rester anonyme ; une victime, ou son représentant, doit s'identifier."] },
            { titre: 'Bonne foi', paragraphes: ["Signalez des faits que vous soupçonnez ou connaissez, de bonne foi. Accuser quelqu'un en sachant que c'est faux peut engager votre responsabilité."] },
            { titre: 'Ce que le portail ne remplace pas', paragraphes: ["Le portail n'est pas un service d'urgence. En cas de danger immédiat, contactez les secours, la police ou la gendarmerie."] },
            { titre: 'Contenu transmis', paragraphes: ["Ne transmettez que les informations utiles à l'instruction. Les fichiers joints doivent être ceux que vous avez le droit de communiquer."] },
            { titre: 'Disponibilité', paragraphes: ["Le dépôt en ligne est accessible à tout moment, sous réserve d'opérations de maintenance. Le numéro vert reste disponible pendant les heures d'ouverture si le portail ne l'est pas."] }
        ]
    },
    'mentions-legales': {
        titre: 'Mentions légales',
        intro: "Éditeur du portail et moyens de nous joindre.",
        sections: [
            { titre: 'Éditeur', paragraphes: ["Autorité Supérieure de Contrôle d'État et de Lutte contre la Corruption (ASCE-LC), Burkina Faso."] },
            { titre: 'Nous joindre', paragraphes: ['{contact}'] }
        ]
    }
};

@Component({
    selector: 'app-portail-info',
    standalone: true,
    imports: [CommonModule, RouterModule, PortailPage],
    styles: [`
        :host{--green:#009640;--ink:#003617;--hair:#E4E9E6;--ink-60:rgba(0,54,23,.72)}
        article{background:#fff;border:1px solid var(--hair);border-radius:12px;padding:1.4rem 1.6rem}
        h2{font-size:1rem;font-weight:800;margin:1.4rem 0 .4rem;color:var(--ink)}
        h2:first-child{margin-top:0}
        p{margin:0 0 .6rem;font-size:.9rem;line-height:1.75;color:var(--ink-60)}
        a{color:var(--green);font-weight:700;text-decoration:underline}
        .source{margin-top:1.25rem}
    `],
    template: `
        @if (page) {
            <app-portail-page [titre]="page.titre" [intro]="page.intro">
                <article>
                    @for (s of page.sections; track s.titre) {
                        <h2>{{ s.titre }}</h2>
                        @for (p of s.paragraphes; track $index) {
                            @if (p === '{contact}') {
                                <p>Numéro vert (gratuit) : <a [href]="lienNumero">{{ numero }}</a></p>
                                <p>Téléphone : {{ telephones.join(' · ') }}</p>
                                <p>Courriel : <a [href]="'mailto:' + courriel">{{ courriel }}</a></p>
                                <p>Signalements par courriel : <a [href]="'mailto:' + courrielDenonciation">{{ courrielDenonciation }}</a></p>
                                <p>{{ adresse }}<br>{{ boitePostale }}</p>
                                <p>{{ horaires }}</p>
                                <p>Site institutionnel : <a [href]="site" target="_blank" rel="noopener">{{ site }}</a></p>
                            } @else { <p>{{ p }}</p> }
                        }
                    }
                    @if (page.source) {
                        <p class="source"><a [href]="page.source.url" target="_blank" rel="noopener">{{ page.source.texte }}</a></p>
                    }
                </article>
            </app-portail-page>
        } @else {
            <app-portail-page titre="Page introuvable" intro="Cette page n'existe pas.">
                <a routerLink="/portail">Retour à l'accueil</a>
            </app-portail-page>
        }
    `
})
export class PortailInfo implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly cfgService = inject(PortalConfigService);
    private readonly destroy$ = new Subject<void>();

    page: PageInfo | null = null;
    numero = NUMERO_VERT;
    courriel = COORDONNEES_OFFICIELLES.courriel;
    adresse = COORDONNEES_OFFICIELLES.adresse;
    courrielDenonciation = COORDONNEES_OFFICIELLES.courrielDenonciation;
    readonly boitePostale = COORDONNEES_OFFICIELLES.boitePostale;
    readonly telephones = COORDONNEES_OFFICIELLES.telephones;
    readonly horaires = COORDONNEES_OFFICIELLES.horaires;
    readonly site = COORDONNEES_OFFICIELLES.site;

    get lienNumero(): string { return lienTelephone(this.numero); }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(p => {
            const cle = p.get('page') ?? '';
            this.page = Object.prototype.hasOwnProperty.call(PAGES_INFO, cle) ? PAGES_INFO[cle] : null;
        });
        this.cfgService.config$.pipe(takeUntil(this.destroy$)).subscribe(cfg => {
            this.numero = cfg['hotline_number'] || NUMERO_VERT;
            this.courriel = cfg['email_contact'] || COORDONNEES_OFFICIELLES.courriel;
            this.adresse = cfg['address'] || COORDONNEES_OFFICIELLES.adresse;
            this.courrielDenonciation = cfg['email_denonciation'] || COORDONNEES_OFFICIELLES.courrielDenonciation;
        });
        this.cfgService.loadPublicConfig();
    }

    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
