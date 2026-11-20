/**
 * Listes de choix et libellés de la saisine : nature choisie par l'agent, zone d'origine, typologie
 * institutionnelle, plateforme de réseau social. Les valeurs sont celles du serveur.
 */
export interface Choix { label: string; value: string; }

/** Natures qu'un agent peut attribuer en enregistrant un dossier (le citoyen n'a que plainte ou dénonciation). */
export const CHOIX_NATURE_AGENT: Choix[] = [
    { label: 'Plainte',                value: 'PLAINTE' },
    { label: 'Dénonciation',           value: 'DENONCIATION' },
    { label: 'Plainte-dénonciation',   value: 'PLAINTE_DENONCIATION' },
    { label: "Demande d'intervention", value: 'DEMANDE_INTERVENTION' }
];

export const REGIONS_ORIGINE: Choix[] = [
    { label: 'Région du Kadiogo',             value: 'KADIOGO' },
    { label: 'Région du Guiriko',             value: 'GUIRIKO' },
    { label: 'Autres régions et communes',    value: 'AUTRES_REGIONS' },
    { label: 'Diaspora / Extérieur du pays',  value: 'DIASPORA' }
];

export const TYPOLOGIES_INSTITUTIONNELLES: Choix[] = [
    { label: 'Ministères et administrations centrales',     value: 'MINISTERES_ADMINISTRATIONS_CENTRALES' },
    { label: "Établissements publics de l'État et entités assimilées",                      value: 'ETABLISSEMENTS_PUBLICS' },
    { label: "Sociétés d'État et entreprises publiques",                             value: 'SOCIETES_D_ETAT' },
    { label: 'Projets, programmes de développement',                       value: 'PROJETS_PROGRAMMES' },
    { label: 'Fonds de financement',                        value: 'FONDS_FINANCEMENT' },
    { label: 'Collectivités territoriales et services déconcentrés',                 value: 'COLLECTIVITES_TERRITORIALES' },
    { label: 'Autres secteurs privés ou transversaux',                                      value: 'AUTRES' }
];

/** Plateformes proposées quand le canal de réception est « Réseaux sociaux ». */
export const MODES_RESEAUX_SOCIAUX: Choix[] = [
    { label: 'WhatsApp',  value: 'WHATSAPP' },
    { label: 'Messenger', value: 'MESSENGER' },
    { label: 'Facebook',  value: 'FACEBOOK' },
    { label: 'X (Twitter)', value: 'TWITTER_X' },
    { label: 'YouTube',   value: 'YOUTUBE' },
    { label: 'Autre',     value: 'OTHER' }
];

/**
 * Motifs que le citoyen peut choisir, en mots simples (facultatif). Les valeurs sont celles du serveur
 * (MotifSignalement). `terme` est l'allégation officielle écrite à côté pour que chacun s'y retrouve, et
 * `allegation` son code (table type_infraction) : l'agent la retient ou la corrige à l'étude d'opportunité,
 * seul son choix entre dans les statistiques. Blanchiment, stellionat, concussion, délit d'apparence, conflit
 * d'intérêt et dettes ne sont volontairement pas proposés au citoyen.
 */
export interface MotifCitoyen { code: string; libelle: string; explication: string; terme: string | null; allegation: string | null; }

export const MOTIFS_CITOYEN: MotifCitoyen[] = [
    { code: 'CORRUPTION', libelle: "On m'a demandé de l'argent ou un cadeau",
      explication: 'Pour rendre un service, accélérer un dossier ou fermer les yeux.',
      terme: 'Corruption', allegation: 'CORRUPTION' },
    { code: 'DETOURNEMENT', libelle: "De l'argent ou des biens publics ont disparu",
      explication: 'Caisse vidée, matériel emporté, dépenses sans justificatif.',
      terme: 'Détournement et malversations financières', allegation: 'DETOURNEMENT_MALVERSATIONS' },
    { code: 'FAVORITISME', libelle: 'Un marché ou un recrutement donné à un proche',
      explication: 'Sans concurrence ou sans respecter les règles.',
      terme: 'Favoritisme', allegation: 'FAVORITISME' },
    { code: 'FAUX', libelle: 'Un faux document ou une fausse signature',
      explication: 'Faux diplôme, fausse pièce, signature imitée.',
      terme: 'Faux et usage de faux', allegation: 'FAUX_ET_USAGE_DE_FAUX' },
    { code: 'FRAUDE', libelle: 'Une fausse facture ou une fausse déclaration',
      explication: "Chiffres truqués pour tromper l'administration.",
      terme: 'Fraude', allegation: 'FRAUDE' },
    { code: 'ENRICHISSEMENT', libelle: 'Quelqu\'un vit bien au-dessus de ses moyens',
      explication: "Maisons, voitures ou train de vie qui ne s'expliquent pas par son salaire.",
      terme: 'Enrichissement illicite', allegation: 'ENRICHISSEMENT_ILLICITE' },
    { code: 'ABUS_DE_FONCTION', libelle: 'Un responsable abuse de son pouvoir',
      explication: 'Il utilise sa fonction pour son intérêt ou pour nuire.',
      terme: 'Abus de fonction', allegation: 'ABUS_DE_FONCTION' },
    { code: 'FONCIER', libelle: 'Un terrain vendu deux fois, un litige sur une parcelle',
      explication: 'Conflit lié à un terrain ou à une attribution de parcelle.',
      terme: 'Conflit foncier', allegation: 'CONFLIT_FONCIER' },
    { code: 'DYSFONCTIONNEMENT', libelle: 'Un service ne fonctionne pas comme il le devrait',
      explication: 'Lenteurs, absences, règles non appliquées.',
      terme: 'Dysfonctionnement', allegation: 'DYSFONCTIONNEMENT' },
    { code: 'AUTRE', libelle: 'Autre chose, ou je ne sais pas',
      explication: "L'agent qualifiera lui-même les faits.",
      terme: null, allegation: null }
];

export function motifCitoyen(code: string | null | undefined): MotifCitoyen | undefined {
    return MOTIFS_CITOYEN.find(m => m.code === code);
}

const NATURES: Record<string, string> = {
    PLAINTE: 'Plainte',
    DENONCIATION: 'Dénonciation',
    PLAINTE_DENONCIATION: 'Plainte-dénonciation',
    DEMANDE_INTERVENTION: "Demande d'intervention",
    SIGNALEMENT: "Signalement d'autorité",
    AUTO_SAISINE: 'Auto-saisine',
    // anciennes valeurs, encore présentes dans d'anciens écrans ou jeux de données
    COMPLAINT: 'Plainte',
    DENUNCIATION: 'Dénonciation',
    AUTO_REFERRAL: 'Auto-saisine',
    ANONYMOUS: 'Anonyme'
};

export function libelleDeNature(valeur: string | null | undefined): string {
    if (!valeur) { return '—'; }
    return NATURES[valeur] ?? valeur;
}

export function libelleDeRegion(valeur: string | null | undefined): string {
    if (!valeur) { return '—'; }
    return REGIONS_ORIGINE.find(r => r.value === valeur)?.label ?? valeur;
}
