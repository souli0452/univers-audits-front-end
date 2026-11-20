/**
 * Échelle de texte de l'application interne (agents) : la taille de base du site est 14 px, ce qui faisait de
 * « text-xs » un texte de 10,5 px et de « text-sm » un texte de 12 px, trop petits à lire en continu.
 * Ces tests lisent la taille réellement affichée, avec les vraies feuilles de style de l'application.
 */
describe('échelle de texte', () => {
    function taille(classe: string): number {
        const el = document.createElement('span');
        el.className = classe;
        el.textContent = 'x';
        document.body.appendChild(el);
        const px = parseFloat(getComputedStyle(el).fontSize);
        el.remove();
        return px;
    }

    it('le plus petit texte (text-xs) reste lisible : 12 px au moins', () => {
        expect(taille('text-xs')).toBeGreaterThanOrEqual(12);
    });

    it('le texte secondaire (text-sm) fait 13 px au moins', () => {
        expect(taille('text-sm')).toBeGreaterThanOrEqual(13);
    });

    it('garde une hiérarchie : text-xs < text-sm <= texte courant', () => {
        const courant = parseFloat(getComputedStyle(document.body).fontSize);
        expect(taille('text-xs')).toBeLessThan(taille('text-sm'));
        expect(taille('text-sm')).toBeLessThanOrEqual(courant);
    });

    it('ne grossit pas les titres : text-xl et plus gardent la taille standard', () => {
        expect(taille('text-xl')).toBeCloseTo(1.25 * 14, 1);
        expect(taille('text-2xl')).toBeCloseTo(1.5 * 14, 1);
    });
});
