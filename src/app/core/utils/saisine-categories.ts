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
    { label: 'Établissements publics',                      value: 'ETABLISSEMENTS_PUBLICS' },
    { label: "Sociétés d'État",                             value: 'SOCIETES_D_ETAT' },
    { label: 'Projets et programmes',                       value: 'PROJETS_PROGRAMMES' },
    { label: 'Fonds de financement',                        value: 'FONDS_FINANCEMENT' },
    { label: 'Collectivités territoriales',                 value: 'COLLECTIVITES_TERRITORIALES' },
    { label: 'Autres',                                      value: 'AUTRES' }
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
