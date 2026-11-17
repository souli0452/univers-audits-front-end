import { PublicationTrimestrielle } from '../models/statistique.model';
import { trimestreARapporter, versCsv, nomDuFichier } from './publication-trimestrielle';

const situation = (surcharge: Partial<PublicationTrimestrielle> = {}): PublicationTrimestrielle => ({
    annee: 2026, trimestre: 1, periode: 'T1 2026', genereLe: '2026-04-02T08:00:00Z', total: 74,
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
    describe('trimestreARapporter', () => {
        it('propose le dernier trimestre terminé', () => {
            expect(trimestreARapporter(new Date(2026, 4, 12))).toEqual({ annee: 2026, trimestre: 1 });   // mai → T1
            expect(trimestreARapporter(new Date(2026, 9, 3))).toEqual({ annee: 2026, trimestre: 3 });    // octobre → T3
        });

        it("revient au T4 de l'année précédente en janvier, février et mars", () => {
            expect(trimestreARapporter(new Date(2026, 0, 15))).toEqual({ annee: 2025, trimestre: 4 });
            expect(trimestreARapporter(new Date(2026, 2, 31))).toEqual({ annee: 2025, trimestre: 4 });
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

        it('place les notes de lecture à la fin', () => {
            const csv = versCsv(situation());

            expect(csv.trimEnd().endsWith('Dossiers comptés : ceux enregistrés pendant le trimestre.')).toBeTrue();
        });
    });

    it('nomDuFichier est stable et sans espace', () => {
        expect(nomDuFichier(situation())).toBe('situation-plaintes-denonciations-2026-T1.csv');
    });
});
