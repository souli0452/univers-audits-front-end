import { calculerPeriode } from './periode-statistiques';

describe('calculerPeriode', () => {
    const maintenant = new Date(2026, 9, 2, 14, 30); // 2 octobre 2026, 14 h 30

    it('par défaut : de janvier à maintenant, année en cours', () => {
        const p = calculerPeriode('year', maintenant)!;
        expect(p.debut).toEqual(new Date(2026, 0, 1));
        expect(p.fin).toEqual(maintenant);
    });

    it('année précédente : du 1er janvier au 31 décembre inclus', () => {
        const p = calculerPeriode('lastYear', maintenant)!;
        expect(p.debut).toEqual(new Date(2025, 0, 1));
        expect(p.fin).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
    });

    it('année en cours et précédente : du 1er janvier précédent à maintenant', () => {
        const p = calculerPeriode('twoYears', maintenant)!;
        expect(p.debut).toEqual(new Date(2025, 0, 1));
        expect(p.fin).toEqual(maintenant);
    });

    it('trimestre et mois courants', () => {
        expect(calculerPeriode('quarter', maintenant)!.debut).toEqual(new Date(2026, 9, 1));
        expect(calculerPeriode('month', maintenant)!.debut).toEqual(new Date(2026, 9, 1));
    });

    it('intervalle libre à cheval sur deux années', () => {
        const p = calculerPeriode('custom', maintenant, [new Date(2025, 10, 15), new Date(2026, 2, 10)])!;
        expect(p.debut).toEqual(new Date(2025, 10, 15, 0, 0, 0, 0));
        expect(p.fin).toEqual(new Date(2026, 2, 10, 23, 59, 59, 999));
    });

    it('intervalle libre sans date de fin : la seule journée choisie', () => {
        const p = calculerPeriode('custom', maintenant, [new Date(2026, 5, 3), null])!;
        expect(p.debut).toEqual(new Date(2026, 5, 3, 0, 0, 0, 0));
        expect(p.fin).toEqual(new Date(2026, 5, 3, 23, 59, 59, 999));
    });

    it('intervalle libre : la fin ne dépasse pas maintenant', () => {
        const p = calculerPeriode('custom', maintenant, [new Date(2026, 9, 1), new Date(2026, 9, 2)])!;
        expect(p.fin).toEqual(maintenant);
    });

    it('intervalle libre : des dates inversées sont remises dans l\'ordre', () => {
        const p = calculerPeriode('custom', maintenant, [new Date(2026, 2, 10), new Date(2025, 10, 15)])!;
        expect(p.debut).toEqual(new Date(2025, 10, 15, 0, 0, 0, 0));
        expect(p.fin).toEqual(new Date(2026, 2, 10, 23, 59, 59, 999));
    });

    it('intervalle libre sans aucune date : pas de période', () => {
        expect(calculerPeriode('custom', maintenant, null)).toBeNull();
        expect(calculerPeriode('custom', maintenant, [null, null])).toBeNull();
    });
});
