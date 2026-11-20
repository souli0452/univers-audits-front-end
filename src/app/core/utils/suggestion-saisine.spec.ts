import { suggererSaisine } from './suggestion-saisine';

describe('suggererSaisine : nature', () => {
    it('propose plainte quand le déclarant est lui-même lésé', () => {
        const s = suggererSaisine("On m'a demandé 50 000 F pour établir mon acte de naissance à la mairie.");
        expect(s.nature).toBe('PLAINTE');
    });

    it('propose plainte pour « j’ai payé » avec l’apostrophe typographique', () => {
        expect(suggererSaisine('J’ai payé 20 000 F pour obtenir ma parcelle, sans reçu.').nature).toBe('PLAINTE');
    });

    it('propose plainte quand le déclarant dit porter plainte', () => {
        expect(suggererSaisine('Je dépose plainte contre le service des impôts de Koudougou.').nature).toBe('PLAINTE');
    });

    it('propose dénonciation quand le déclarant a été témoin', () => {
        expect(suggererSaisine('J’ai vu le directeur détourner du carburant du service chaque semaine.').nature)
            .toBe('DENONCIATION');
    });

    it('propose dénonciation quand le déclarant dit dénoncer', () => {
        expect(suggererSaisine('Je tiens à dénoncer des marchés attribués sans appel d’offres.').nature)
            .toBe('DENONCIATION');
    });

    it('ne propose rien quand le récit mêle victime et témoin', () => {
        const s = suggererSaisine("J'ai vu le comptable encaisser des pots-de-vin, et on m'a demandé de l'argent aussi.");
        expect(s.nature).toBeNull();
    });

    it('ne propose rien quand rien n’oriente', () => {
        expect(suggererSaisine('Des marchés sont attribués de manière suspecte dans cette direction depuis longtemps.').nature)
            .toBeNull();
    });
});

describe('suggererSaisine : type d’institution', () => {
    const cas: [string, string, string][] = [
        ['mairie', 'Le maire de la commune a vendu des parcelles sans autorisation du conseil municipal.',
            'COLLECTIVITES_TERRITORIALES'],
        ['ministère', 'Au ministère de la Santé, des recrutements sont faits sans concours.',
            'MINISTERES_ADMINISTRATIONS_CENTRALES'],
        ['hôpital', "À l'hôpital de Dédougou, des médicaments sont revendus par le personnel.", 'ETABLISSEMENTS_PUBLICS'],
        ['société d’État', 'La SONABEL facture des raccordements qui ne sont jamais réalisés.', 'SOCIETES_D_ETAT'],
        ['projet', "Dans le projet d'appui aux femmes, les kits ne sont pas distribués aux bénéficiaires.", 'PROJETS_PROGRAMMES'],
        ['fonds', 'Le fonds national a versé les subventions à des entreprises fictives.', 'FONDS_FINANCEMENT']
    ];
    for (const [nom, texte, attendu] of cas) {
        it(`reconnaît ${nom}`, () => {
            expect(suggererSaisine(texte).typologie).toBe(attendu);
        });
    }

    it('ne propose rien quand deux types se disputent', () => {
        const s = suggererSaisine("À la mairie, le ministère n'a jamais répondu aux demandes de la commune.");
        expect(s.typologie).toBeNull();
    });

    it('ne confond pas le ministère public avec un ministère', () => {
        expect(suggererSaisine('Le dossier a été transmis au ministère public sans suite depuis deux ans.').typologie)
            .toBeNull();
    });

    it('ne prend pas « en commun » ni « au fond » pour une commune ou un fonds', () => {
        expect(suggererSaisine('Ils ont agi en commun, et au fond le directeur le savait très bien.').typologie)
            .toBeNull();
    });

    it('ne propose rien sans mot repère', () => {
        expect(suggererSaisine('Le directeur exige de l’argent à chaque dossier déposé dans son bureau.').typologie)
            .toBeNull();
    });
});

describe('suggererSaisine : cas limites', () => {
    it('ne propose rien pour un texte vide, absent ou trop court', () => {
        for (const t of ['', '   ', 'mairie', null as unknown as string, undefined as unknown as string]) {
            expect(suggererSaisine(t)).toEqual({ nature: null, typologie: null });
        }
    });

    it('propose les deux à la fois quand le récit est clair', () => {
        const s = suggererSaisine("On m'a réclamé 10 000 F à la mairie de Boromo pour un acte de mariage.");
        expect(s).toEqual({ nature: 'PLAINTE', typologie: 'COLLECTIVITES_TERRITORIALES' });
    });
});
