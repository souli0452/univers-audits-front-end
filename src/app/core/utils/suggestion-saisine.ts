/**
 * Suggestion, à l'agent, de la nature du dossier et du type d'institution, d'après le récit.
 *
 * Aide à la décision, jamais une décision : le citoyen ne choisit ni l'un ni l'autre, et l'agent confirme ou
 * corrige. Tout se fait ICI, dans le navigateur, par des règles simples (un récit de lanceur d'alerte ne part
 * vers aucun service externe). Dans le doute, la règle ne propose rien (null) plutôt qu'un choix hasardeux.
 */
export interface SuggestionSaisine {
    /** « PLAINTE » ou « DENONCIATION », valeurs du serveur ; null si le récit n'oriente pas clairement. */
    nature: 'PLAINTE' | 'DENONCIATION' | null;
    /** Valeur de TypologieInstitutionnelle du serveur ; null si aucune ou plusieurs catégories sont repérées. */
    typologie: string | null;
}

const LONGUEUR_MINIMALE = 20;

function normaliser(texte: string): string {
    return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’‘`]/g, "'");
}

/** Le déclarant est lui-même lésé : il parle de ce qu'on lui a fait ou demandé, de son dossier, de sa parcelle… */
const MARQUEURS_VICTIME: RegExp[] = [
    /\bon m'a\b/,
    /\bj'ai (?:du )?(?:paye|verse|donne)\b/,
    /\bj'ai ete (?:victime|licencie|renvoye|menace|expulse|lese|arrete|chasse)\b/,
    /\bje suis (?:victime|lese)\b/,
    /\b(?:ma|mon|mes) (?:demande|parcelle|terre|terrain|pension|retraite|indemnite|prime|salaire|dossier|acte|permis|bourse)\b/,
    /\b(?:depose|deposer|porter|porte) plainte\b/
];

/** Le déclarant rapporte des faits dont il a été témoin ou qu'il dénonce. */
const MARQUEURS_TEMOIN: RegExp[] = [
    /\bj'ai (?:vu|constate|remarque|appris|surpris|assiste|ete temoin)\b/,
    /\bje suis temoin\b/,
    /\b(?:denoncer|denonce|denoncons|denonciation)\b/
];

const MOTS_REPERES: ReadonlyArray<[string, RegExp]> = [
    ['MINISTERES_ADMINISTRATIONS_CENTRALES', /\bministere\b(?!\s+public)|\bministre\b|\badministrations? centrales?\b/],
    ['ETABLISSEMENTS_PUBLICS', /\betablissements? publics?\b|\bhopital\b|\bcentre hospitalier\b|\buniversite\b|\b(?:chu|chr)\b/],
    ['SOCIETES_D_ETAT', /\bsocietes? d'etat\b|\bentreprises? publiques?\b|\b(?:sonabel|onea|sonabhy|lonab|sofitex|onatel|sonatur)\b/],
    ['PROJETS_PROGRAMMES', /\bprojets?\b|\bprogrammes?\b/],
    ['FONDS_FINANCEMENT', /\bfonds\b/],
    ['COLLECTIVITES_TERRITORIALES',
        /\bmairie\b|\bmaire\b|\bcommune\b|\bconseil (?:municipal|regional)\b|\bcollectivites?\b|\bprefecture\b|\bhaut-commissariat\b|\bgouvernorat\b|\bcsps\b|\bcentre de sante\b/]
];

function natureDuRecit(texte: string): SuggestionSaisine['nature'] {
    const victime = MARQUEURS_VICTIME.some(m => m.test(texte));
    const temoin = MARQUEURS_TEMOIN.some(m => m.test(texte));
    if (victime && !temoin) { return 'PLAINTE'; }
    if (temoin && !victime) { return 'DENONCIATION'; }
    return null;
}

function typologieDuRecit(texte: string): string | null {
    const trouvees = MOTS_REPERES.filter(([, motif]) => motif.test(texte));
    return trouvees.length === 1 ? trouvees[0][0] : null;
}

export function suggererSaisine(texte: string): SuggestionSaisine {
    const net = normaliser(texte ?? '').trim();
    if (net.length < LONGUEUR_MINIMALE) { return { nature: null, typologie: null }; }
    return { nature: natureDuRecit(net), typologie: typologieDuRecit(net) };
}
