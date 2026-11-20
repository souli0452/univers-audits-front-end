/**
 * Indices tirés du récit libre du citoyen : résumé, montant, période, lieu ou organisme.
 *
 * Tout se fait ICI, dans le navigateur, par des règles simples : un récit de lanceur d'alerte est une donnée
 * sensible et ne doit jamais partir vers un service externe. Les règles sont prudentes : dans le doute, elles
 * ne rendent rien (null) plutôt qu'une valeur inventée. Le citoyen voit les valeurs trouvées et peut les corriger.
 */

export interface IndicesDuRecit {
    resume: string;
    montant: number | null;
    periode: string | null;
    lieu: string | null;
}

const LONGUEUR_RESUME = 140;

/** Première phrase du récit (ou première ligne), raccourcie au dernier mot entier si elle est trop longue. */
export function resumeDuRecit(texte: string): string {
    const net = (texte ?? '').trim();
    if (!net) { return ''; }
    const premiereLigne = net.split(/\r?\n/)[0].trim();
    // Fin de phrase : . ! ? suivi d'un espace ou de la fin ; pas après « M. », « Mme », « Dr » ni dans « 1.500.000 ».
    const fin = /(?<!\b[A-Z]|\bMme|\bMlle|\bMr|\bDr|\bPr)[.!?…](?=\s|$)/.exec(premiereLigne);
    const phrase = fin ? premiereLigne.slice(0, fin.index + 1) : premiereLigne;
    if (phrase.length <= LONGUEUR_RESUME) { return phrase; }
    const coupe = phrase.slice(0, LONGUEUR_RESUME);
    const dernierEspace = coupe.lastIndexOf(' ');
    const base = (dernierEspace > 0 ? coupe.slice(0, dernierEspace) : coupe).trimEnd().replace(/[,;:\s]+$/, '');
    return base + '…';
}

const MONNAIE = String.raw`(?:de\s+)?(?:f\s?cfa|fcfa|cfa|francs?(?:\s+cfa)?|f(?![\p{L}\d]))`;
const MONTANT = new RegExp(
    String.raw`(?<![\d.,])(\d{1,3}(?:[   .]\d{3})+|\d+(?:[.,]\d+)?)(?:\s*(millions?|milliards?))?\s*${MONNAIE}`,
    'giu');
const NOMBRE_GROUPE = /^\d{1,3}(?:[   .]\d{3})+$/;

/** Plus grand montant en francs CFA cité dans le récit ; un nombre sans monnaie (téléphone, année…) est ignoré. */
export function montantDuRecit(texte: string): number | null {
    let plusGrand: number | null = null;
    for (const m of (texte ?? '').matchAll(MONTANT)) {
        const brut = m[1];
        let valeur = NOMBRE_GROUPE.test(brut)
            ? Number(brut.replace(/[   .]/g, ''))
            : parseFloat(brut.replace(',', '.'));
        const echelle = (m[2] ?? '').toLowerCase();
        if (echelle.startsWith('milliard')) { valeur *= 1_000_000_000; }
        else if (echelle.startsWith('million')) { valeur *= 1_000_000; }
        valeur = Math.round(valeur);
        if (Number.isFinite(valeur) && valeur > 0 && (plusGrand === null || valeur > plusGrand)) { plusGrand = valeur; }
    }
    return plusGrand;
}

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre',
    'Novembre', 'Décembre'];
const MOIS_SANS_ACCENT = MOIS.map(sansAccent);
const ANNEE_MINIMALE = 1990;

function sansAccent(texte: string): string {
    return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** « 15 mars 2025 » : jour, mois en toutes lettres, année. Même forme pour le calendrier et pour le repérage. */
export function formaterJour(annee: number, mois: number, jour: number): string {
    return `${jour} ${MOIS[mois - 1].toLowerCase()} ${annee}`;
}

/** « 14:30 » (champ heure) ou « 14h30 » → « 14h30 » ; « 09:05 » → « 9h05 » ; « 08:00 » → « 8h ». */
export function formaterHeure(heure: string): string | null {
    const m = /^(\d{1,2})\s?[:h]\s?([0-5]\d)?$/.exec((heure ?? '').trim().toLowerCase());
    if (!m || Number(m[1]) > 23) { return null; }
    return `${Number(m[1])}h${m[2] && m[2] !== '00' ? m[2] : ''}`;
}

const JOUR = String.raw`(1er|0?[1-9]|[12]\d|3[01])`;
const DATE_TEXTE = new RegExp(
    String.raw`(?<![\d\p{L}])${JOUR}\s+(${MOIS_SANS_ACCENT.join('|')})\s+(\d{4})(?!\d)`, 'gu');
const DATE_CHIFFRES = /(?<![\d/.-])(0?[1-9]|[12]\d|3[01])[/.-](0?[1-9]|1[0-2])[/.-](\d{4})(?!\d)/gu;
const HEURE = /(?<![\d:])([01]?\d|2[0-3])\s?h\s?([0-5]\d)?(?![\d\p{L}])/u;

/** Une date qui existe vraiment (pas le 31 février), pas avant 1990 et pas dans le futur. */
function dateReelle(annee: number, mois: number, jour: number, maintenant: Date): boolean {
    const d = new Date(annee, mois - 1, jour);
    return d.getFullYear() === annee && d.getMonth() === mois - 1 && d.getDate() === jour
        && annee >= ANNEE_MINIMALE && d.getTime() <= maintenant.getTime();
}

/** Première date complète du récit, avec l'heure si elle est donnée (« 15 mars 2025 à 14h30 »). */
function dateCompleteDuRecit(t: string, maintenant: Date): string | null {
    const candidates: { index: number; libelle: string }[] = [];
    for (const m of t.matchAll(DATE_TEXTE)) {
        const [jour, mois, annee] = [Number(m[1].replace('er', '')), MOIS_SANS_ACCENT.indexOf(m[2]) + 1, Number(m[3])];
        if (dateReelle(annee, mois, jour, maintenant)) { candidates.push({ index: m.index, libelle: formaterJour(annee, mois, jour) }); }
    }
    for (const m of t.matchAll(DATE_CHIFFRES)) {
        const [jour, mois, annee] = [Number(m[1]), Number(m[2]), Number(m[3])];
        if (dateReelle(annee, mois, jour, maintenant)) { candidates.push({ index: m.index, libelle: formaterJour(annee, mois, jour) }); }
    }
    if (candidates.length === 0) { return null; }
    const date = candidates.sort((a, b) => a.index - b.index)[0].libelle;
    const heure = HEURE.exec(t);
    const h = heure ? formaterHeure(`${heure[1]}h${heure[2] ?? ''}`) : null;
    return h ? `${date} à ${h}` : date;
}

/**
 * Période citée : « 15 mars 2025 à 14h30 », « Mars 2025 », « De 2021 à 2023 » ou « 2022 ». Le plus précis l'emporte ;
 * une heure seule n'est jamais une période.
 */
export function periodeDuRecit(texte: string, maintenant: Date = new Date()): string | null {
    const t = sansAccent(texte ?? '');
    const anneeMax = maintenant.getFullYear();
    const valide = (a: number) => a >= ANNEE_MINIMALE && a <= anneeMax;

    const complete = dateCompleteDuRecit(t, maintenant);
    if (complete) { return complete; }

    const moisAnnee = new RegExp(
        String.raw`(?<![\p{L}])(${MOIS_SANS_ACCENT.join('|')})\s+(?:de\s+l'annee\s+)?(\d{4})(?!\d)`, 'gu');
    for (const m of t.matchAll(moisAnnee)) {
        const [mois, annee] = [MOIS_SANS_ACCENT.indexOf(m[1]), Number(m[2])];
        const passe = annee < anneeMax || (annee === anneeMax && mois <= maintenant.getMonth());
        if (valide(annee) && passe) { return `${MOIS[mois]} ${m[2]}`; }
    }

    for (const m of t.matchAll(/(?<![\p{L}])(?:de|entre)\s+(\d{4})\s+(?:a|et)\s+(\d{4})(?!\d)/gu)) {
        const [debut, fin] = [Number(m[1]), Number(m[2])];
        if (valide(debut) && valide(fin) && debut < fin) { return `De ${debut} à ${fin}`; }
    }

    const anneeSeule = /(?<![\p{L}])(?:en|depuis|durant|pendant|vers|courant)\s+(\d{4})(?!\d)(?![.,]\d)(?!\s*(?:fcfa|cfa|francs?|f(?![\p{L}])))/gu;
    for (const m of t.matchAll(anneeSeule)) {
        if (valide(Number(m[1]))) { return m[1]; }
    }
    return null;
}

const ORGANISMES = ['mairie', 'ministère', 'ministere', 'direction', 'hôpital', 'hopital', 'csps', 'cmas', 'préfecture',
    'prefecture', 'douane', 'gendarmerie', 'commissariat', 'tribunal', 'université', 'universite', 'lycée', 'lycee',
    'collège', 'college', 'école', 'ecole', 'commune', 'centre', 'société', 'societe', 'agence', 'inspection', 'trésor',
    'tresor'];
const MOT_ORGANISME = new RegExp(`(?<![\\p{L}])(${ORGANISMES.join('|')})(?![\\p{L}])`, 'giu');
const NOM_PROPRE = /^(?:\s+(de la|de l['’]|du|des|de|d['’]))?\s*([\p{Lu}][\p{L}'’-]*(?:\s+(?:(?:de|du|des|la|le)\s+)?[\p{Lu}][\p{L}'’-]*){0,3})/u;

/** Premier organisme ou service nommé (« Mairie de Koudougou ») ; rien s'il n'est pas suivi d'un nom propre. */
export function lieuDuRecit(texte: string): string | null {
    const t = texte ?? '';
    for (const m of t.matchAll(MOT_ORGANISME)) {
        const suite = NOM_PROPRE.exec(t.slice(m.index + m[0].length));
        if (!suite) { continue; }
        const mot = m[1];
        const libelle = mot === mot.toUpperCase() && mot.length <= 5
            ? mot
            : mot.charAt(0).toUpperCase() + mot.slice(1).toLowerCase();
        const lien = suite[1] ? ` ${suite[1].toLowerCase()}` : '';
        return `${libelle}${lien}${suite[1]?.endsWith('\'') || suite[1]?.endsWith('’') ? '' : ' '}${suite[2]}`.replace(/\s+/g, ' ');
    }
    return null;
}

export function extraireDuRecit(texte: string, maintenant: Date = new Date()): IndicesDuRecit {
    return {
        resume: resumeDuRecit(texte),
        montant: montantDuRecit(texte),
        periode: periodeDuRecit(texte, maintenant),
        lieu: lieuDuRecit(texte)
    };
}
