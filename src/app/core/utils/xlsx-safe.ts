/**
 * Neutralise l'injection de formule CSV/Excel : un tableur peut interpréter
 * une cellule texte commençant par =, +, -, @ ou une tabulation comme une
 * formule/commande lors de l'ouverture ou de la réédition du fichier.
 * On préfixe ces valeurs d'une apostrophe pour forcer une interprétation
 * en texte brut.
 */
export function xlsxSafe(value: string | null | undefined): string {
    if (!value) return '';
    return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
