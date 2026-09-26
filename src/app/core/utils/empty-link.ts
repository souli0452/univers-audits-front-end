/**
 * Un lien « vide » (adresse absente ou « # ») ne doit mener nulle part : avec le
 * routage par « # », un href="#" rechargerait l'accueil, et avec target="_blank"
 * il ouvrirait la page courante dans un nouvel onglet.
 */
export function isEmptyLink(url: string | null | undefined): boolean {
    const value = (url ?? '').trim();
    return value === '' || value === '#';
}

export function preventIfEmptyLink(event: Event, url?: string | null): void {
    if (isEmptyLink(url)) {
        event.preventDefault();
    }
}
