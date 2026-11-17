import { PublicationTrimestrielle } from '../models/statistique.model';
import { PERIODES, periodeARapporter, versCsv, nomDuFichier } from './publication-trimestrielle';

const situation = (surcharge: Partial<PublicationTrimestrielle> = {}): PublicationTrimestrielle => ({
    annee: 2026, codePeriode: 'T1', periode: 'T1 2026', genereLe: '2026-04-02T08:00:00Z', total: 74,
    categories: [{ code: 'DENONCIATION', libelle: 'Dénonciations', nombre: 54, taux: 72.97 }],
    modesDeSaisine: [{ code: 'WHATSAPP', libelle: 'WhatsApp', nombre: 23, taux: 31.08 }],
    typologiesInstitutionnelles: [], allegations: [],
    traitement: [{ code: 'STOCK', libelle: 'Stock en instance', nombre: 51, taux: 68.92 }],
    enjeuxFinanciers: 7000000000,
    recevabilite: [], originesGeographiques: [],
    velocite: [{ code: 'INVESTIGATION', libelle: "Phase d'investigation", nombre: 18, delaiMoyenJours: 45 }],
    notes: ['Dossiers comptés : ceux enregistrés pendant le trimestre.'],
    ...surcharge
});

describe('publication-trimestrielle', () => {
    it('propose les trimestres, les deux semestres et l\'année', () => {
        expect(PERIODES.map(p => p.value)).toEqual(['T1', 'T2', 'T3', 'T4', 'S1', 'S2', 'ANNEE']);
    });

    describe('periodeARapporter', () => {
        it('propose le dernier trimestre terminé', () => {
            expect(periodeARapporter(new Date(2026, 4, 12))).toEqual({ annee: 2026, periode: 'T1' });   // mai → T1
            expect(periodeARapporter(new Date(2026, 9, 3))).toEqual({ annee: 2026, periode: 'T3' });    // octobre → T3
        });

        it("revient au T4 de l'année précédente en janvier, février et mars", () => {
            expect(periodeARapporter(new Date(2026, 0, 15))).toEqual({ annee: 2025, periode: 'T4' });
            expect(periodeARapporter(new Date(2026, 2, 31))).toEqual({ annee: 2025, periode: 'T4' });
        });
    });

    describe('versCsv', () => {
        it('écrit chaque tableau avec son titre, séparé par des points-virgules pour Excel', () => {
            const csv = versCsv(situation());

            expect(csv).toContain('Situation des plaintes et dénonciations;T1 2026');
            expect(csv).toContain('Total des dossiers enregistrés;74');
            expect(csv).toContain('Catégories');
            expect(csv).toContain('Dénonciations;54;72,97 %');
            expect(csv).toContain('WhatsApp;23;31,08 %');
            expect(csv).toContain('Stock en instance;51;68,92 %');
            expect(csv).toContain("Phase d'investigation;18;45 jours");
            expect(csv).toContain('Enjeux financiers (FCFA);7000000000');
        });

        it('indique « non mesuré » quand le délai moyen est inconnu', () => {
            const csv = versCsv(situation({
                velocite: [{ code: 'CLOTURES', libelle: 'Dossiers clôturés', nombre: 5, delaiMoyenJours: null }]
            }));

            expect(csv).toContain('Dossiers clôturés;5;non mesuré');
        });

        it("neutralise une cellule qui commencerait comme une formule", () => {
            const csv = versCsv(situation({
                allegations: [{ code: 'X', libelle: '=SOMME(A1:A9)', nombre: 1, taux: 1.35 }]
            }));

            expect(csv).toContain("'=SOMME(A1:A9);1;1,35 %");
        });

        it('met entre guillemets un libellé qui contient un séparateur, un guillemet ou un saut de ligne', () => {
            const csv = versCsv(situation({
                allegations: [
                    { code: 'A', libelle: 'a;=cmd|x', nombre: 1, taux: 1 },
                    { code: 'B', libelle: 'dit "oui"', nombre: 2, taux: 2 },
                    { code: 'C', libelle: 'ligne1\n=ligne2', nombre: 3, taux: 3 },
                    { code: 'D', libelle: '=1+1;x', nombre: 4, taux: 4 }
                ]
            }));

            expect(csv).toContain('"a;=cmd|x";1;1 %');
            expect(csv).toContain('"dit ""oui""";2;2 %');
            expect(csv).toContain('"ligne1\n=ligne2";3;3 %');
            expect(csv).toContain(`"'=1+1;x";4;4 %`);
        });

        it('applique la même protection à la période et aux notes', () => {
            const csv = versCsv(situation({ periode: '=T1;2026', notes: ['=HYPERLINK("http://x");y'] }));

            expect(csv).toContain(`Situation des plaintes et dénonciations;"'=T1;2026"`);
            expect(csv).toContain(`"'=HYPERLINK(""http://x"");y"`);
        });

        it('place les notes de lecture à la fin', () => {
            const csv = versCsv(situation());

            expect(csv.trimEnd().endsWith('Dossiers comptés : ceux enregistrés pendant le trimestre.')).toBeTrue();
        });
    });

    it('nomDuFichier est stable et sans espace', () => {
        expect(nomDuFichier(situation())).toBe('situation-plaintes-denonciations-2026-T1.csv');
        expect(nomDuFichier(situation({ codePeriode: 'ANNEE' }))).toBe('situation-plaintes-denonciations-2026-ANNEE.csv');
    });
});
