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

/** Période citée : « Mars 2025 », « De 2021 à 2023 » ou « 2022 ». Le mois précis l'emporte sur l'année seule. */
export function periodeDuRecit(texte: string, maintenant: Date = new Date()): string | null {
    const t = sansAccent(texte ?? '');
    const anneeMax = maintenant.getFullYear();
    const valide = (a: number) => a >= ANNEE_MINIMALE && a <= anneeMax;

    const moisAnnee = new RegExp(`(?<![\\p{L}])(${MOIS_SANS_ACCENT.join('|')})\\s+(?:de\\s+l'annee\\s+)?(\\d{4})(?!\\d)`, 'gu');
    for (const m of t.matchAll(moisAnnee)) {
        if (valide(Number(m[2]))) { return `${MOIS[MOIS_SANS_ACCENT.indexOf(m[1])]} ${m[2]}`; }
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
