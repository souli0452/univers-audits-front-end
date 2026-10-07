/**
 * Numéro vert de l'ASCE-LC. Valeur affichée quand le paramètre `hotline_number` du portail n'est pas
 * renseigné ; c'est la même que la constante institutionnelle du back (AsceLcInstitutionalInfo), utilisée
 * dans les récépissés et les documents PDF.
 */
export const NUMERO_VERT = '80 00 11 02';

/** Lien téléphonique (« tel: ») d'un numéro écrit avec des espaces. */
export const lienTelephone = (numero: string): string => 'tel:' + numero.replace(/\s+/g, '');
