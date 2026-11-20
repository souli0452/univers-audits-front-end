import { extraireDuRecit, lieuDuRecit, montantDuRecit, periodeDuRecit, resumeDuRecit } from './extraction-recit';

describe('extraction-recit', () => {

    describe('resumeDuRecit', () => {
        it('prend la première phrase', () => {
            expect(resumeDuRecit('Le maire a pris de l\'argent pour un marché. Cela dure depuis longtemps.'))
                .toBe('Le maire a pris de l\'argent pour un marché.');
        });

        it('ne coupe pas sur un point décimal ni sur une abréviation de montant', () => {
            expect(resumeDuRecit('Ils ont demandé 1.500.000 FCFA pour un permis. Je suis témoin.'))
                .toBe('Ils ont demandé 1.500.000 FCFA pour un permis.');
        });

        it('prend la première ligne quand il n\'y a pas de ponctuation', () => {
            expect(resumeDuRecit('Détournement dans mon service\nsuite du récit'))
                .toBe('Détournement dans mon service');
        });

        it('raccourcit une très longue première phrase sans couper un mot', () => {
            const long = 'Le directeur ' + 'a détourné des fonds destinés à la construction des écoles '.repeat(6);
            const resume = resumeDuRecit(long);

            expect(resume.length).toBeLessThanOrEqual(141);
            expect(resume.endsWith('…')).toBeTrue();
            expect(long.startsWith(resume.slice(0, -1).trimEnd())).toBeTrue();
        });

        it('ne coupe pas après une abréviation de civilité', () => {
            expect(resumeDuRecit('M. Ouédraogo, le receveur, réclame de l\'argent. Il le fait chaque mois.'))
                .toBe('M. Ouédraogo, le receveur, réclame de l\'argent.');
        });

        it('ignore les espaces et sauts de ligne de début', () => {
            expect(resumeDuRecit('   \n  On m\'a réclamé de l\'argent au guichet.')).toBe('On m\'a réclamé de l\'argent au guichet.');
        });

        it('rend une chaîne vide pour un texte vide', () => {
            expect(resumeDuRecit('')).toBe('');
            expect(resumeDuRecit('   ')).toBe('');
        });
    });

    describe('montantDuRecit', () => {
        const cas: [string, number][] = [
            ['Ils ont pris 5 000 000 FCFA.', 5_000_000],
            ['Ils ont pris 5000000 FCFA.', 5_000_000],
            ['Ils ont pris 5.000.000 F CFA.', 5_000_000],
            ['On m\'a demandé 300 000 francs.', 300_000],
            ['On m\'a demandé 300 000 F pour le dossier.', 300_000],
            ['Environ 2 millions de francs CFA ont disparu.', 2_000_000],
            ['Un détournement de 1,5 million de FCFA.', 1_500_000],
            ['Un détournement de 3 milliards de FCFA.', 3_000_000_000]
        ];
        for (const [texte, attendu] of cas) {
            it(`lit ${attendu} dans « ${texte} »`, () => {
                expect(montantDuRecit(texte)).toBe(attendu);
            });
        }

        it('garde le plus grand montant quand il y en a plusieurs', () => {
            expect(montantDuRecit('Un pot-de-vin de 50 000 FCFA, puis 2 000 000 FCFA sur le marché.')).toBe(2_000_000);
        });

        it('ne prend pas pour un montant un nombre sans monnaie (téléphone, année, nombre de personnes)', () => {
            expect(montantDuRecit('Appelez le 70 12 34 56. En 2023, 40 personnes ont été recrutées.')).toBeNull();
        });

        it('ne prend pas « F » d\'un mot (femmes, fonctionnaire…) pour une monnaie', () => {
            expect(montantDuRecit('Il y avait 12 femmes et 15 fonctionnaires.')).toBeNull();
        });

        it('rend null sans montant', () => {
            expect(montantDuRecit('Rien d\'écrit sur l\'argent.')).toBeNull();
        });
    });

    describe('periodeDuRecit', () => {
        const maintenant = new Date(2026, 10, 19);

        it('lit un mois et une année', () => {
            expect(periodeDuRecit('Cela s\'est passé en janvier 2024 à la mairie.', maintenant)).toBe('Janvier 2024');
            expect(periodeDuRecit('Fin décembre 2025, on m\'a demandé de l\'argent.', maintenant)).toBe('Décembre 2025');
        });

        it('comprend février et août avec ou sans accent', () => {
            expect(periodeDuRecit('en février 2022', maintenant)).toBe('Février 2022');
            expect(periodeDuRecit('en fevrier 2022', maintenant)).toBe('Février 2022');
            expect(periodeDuRecit('en août 2021', maintenant)).toBe('Août 2021');
        });

        it('lit une année seule', () => {
            expect(periodeDuRecit('Depuis 2022, le même agent réclame de l\'argent.', maintenant)).toBe('2022');
        });

        it('lit une période entre deux années', () => {
            expect(periodeDuRecit('Entre 2021 et 2023, les marchés ont été truqués.', maintenant)).toBe('De 2021 à 2023');
            expect(periodeDuRecit('De 2020 à 2022 le directeur a signé de faux bons.', maintenant)).toBe('De 2020 à 2022');
        });

        it('préfère le mois précis à l\'année seule', () => {
            expect(periodeDuRecit('Depuis 2022, et surtout en mars 2025.', maintenant)).toBe('Mars 2025');
        });

        it('ignore une année dans le futur ou trop ancienne (numéro, montant…)', () => {
            expect(periodeDuRecit('Le dossier n° 2999 et le lot 1850.', maintenant)).toBeNull();
        });

        it('ne prend pas pour une année un nombre faisant partie d\'un montant', () => {
            expect(periodeDuRecit('Ils ont pris 2 000 000 FCFA.', maintenant)).toBeNull();
        });

        it('rend null sans date', () => {
            expect(periodeDuRecit('C\'est arrivé récemment.', maintenant)).toBeNull();
        });
    });

    describe('lieuDuRecit', () => {
        it('lit un organisme introduit par un article', () => {
            expect(lieuDuRecit('Cela se passe à la mairie de Koudougou, chaque semaine.')).toBe('Mairie de Koudougou');
            expect(lieuDuRecit('Au ministère de la Santé, un agent réclame de l\'argent.')).toBe('Ministère de la Santé');
            expect(lieuDuRecit('Dans le CSPS de Pabré on fait payer les soins gratuits.')).toBe('CSPS de Pabré');
        });

        it('s\'arrête avant le verbe ou la ponctuation', () => {
            expect(lieuDuRecit('Le directeur de l\'hôpital de Tenkodogo a vendu des médicaments.')).toBe('Hôpital de Tenkodogo');
        });

        it('rend null quand aucun organisme n\'est reconnu', () => {
            expect(lieuDuRecit('Quelqu\'un m\'a demandé de l\'argent.')).toBeNull();
        });
    });

    describe('extraireDuRecit', () => {
        it('réunit les quatre indices d\'un seul récit', () => {
            const r = extraireDuRecit(
                'À la mairie de Koudougou, un agent m\'a demandé 250 000 FCFA en mars 2025 pour un acte de naissance.',
                new Date(2026, 10, 19));

            expect(r.resume).toContain('mairie de Koudougou');
            expect(r.montant).toBe(250_000);
            expect(r.periode).toBe('Mars 2025');
            expect(r.lieu).toBe('Mairie de Koudougou');
        });

        it('ne rend rien d\'inventé pour un récit sans indice', () => {
            const r = extraireDuRecit('Je veux signaler un problème grave.', new Date(2026, 10, 19));

            expect(r.montant).toBeNull();
            expect(r.periode).toBeNull();
            expect(r.lieu).toBeNull();
            expect(r.resume).toBe('Je veux signaler un problème grave.');
        });
    });
});
