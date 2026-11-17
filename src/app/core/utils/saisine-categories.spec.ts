import {
    CHOIX_NATURE_AGENT, MODES_RESEAUX_SOCIAUX, REGIONS_ORIGINE, TYPOLOGIES_INSTITUTIONNELLES,
    libelleDeNature, libelleDeRegion
} from './saisine-categories';

describe('saisine-categories', () => {
    it("l'agent choisit parmi les quatre natures du document de publication", () => {
        expect(CHOIX_NATURE_AGENT.map(o => o.value)).toEqual(
            ['PLAINTE', 'DENONCIATION', 'PLAINTE_DENONCIATION', 'DEMANDE_INTERVENTION']);
    });

    it('les quatre zones d\'origine et les sept typologies sont proposées avec leur libellé', () => {
        expect(REGIONS_ORIGINE.map(o => o.value)).toEqual(['KADIOGO', 'GUIRIKO', 'AUTRES_REGIONS', 'DIASPORA']);
        expect(TYPOLOGIES_INSTITUTIONNELLES.length).toBe(7);
        expect(TYPOLOGIES_INSTITUTIONNELLES.every(o => !!o.label)).toBeTrue();
    });

    it('WhatsApp et Messenger sont deux plateformes distinctes', () => {
        const valeurs = MODES_RESEAUX_SOCIAUX.map(o => o.value);
        expect(valeurs).toContain('WHATSAPP');
        expect(valeurs).toContain('MESSENGER');
    });

    describe('libelleDeNature', () => {
        it('nomme les valeurs renvoyées par le serveur', () => {
            expect(libelleDeNature('PLAINTE')).toBe('Plainte');
            expect(libelleDeNature('DENONCIATION')).toBe('Dénonciation');
            expect(libelleDeNature('PLAINTE_DENONCIATION')).toBe('Plainte-dénonciation');
            expect(libelleDeNature('DEMANDE_INTERVENTION')).toBe("Demande d'intervention");
            expect(libelleDeNature('SIGNALEMENT')).toBe("Signalement d'autorité");
            expect(libelleDeNature('AUTO_SAISINE')).toBe('Auto-saisine');
        });

        it('reconnaît encore les anciennes valeurs et rend telle quelle une valeur inconnue', () => {
            expect(libelleDeNature('COMPLAINT')).toBe('Plainte');
            expect(libelleDeNature('DENUNCIATION')).toBe('Dénonciation');
            expect(libelleDeNature('AUTRE')).toBe('AUTRE');
            expect(libelleDeNature(null)).toBe('—');
        });
    });

    it('libelleDeRegion nomme la zone ou rend un tiret', () => {
        expect(libelleDeRegion('DIASPORA')).toBe('Diaspora / Extérieur du pays');
        expect(libelleDeRegion(undefined)).toBe('—');
    });
});
