import { isEmptyLink, preventIfEmptyLink } from './empty-link';

describe('empty-link', () => {
    describe('isEmptyLink', () => {
        it('considère « # », vide, espaces, null et undefined comme des liens vides', () => {
            for (const v of ['#', '', '   ', ' # ', null, undefined]) {
                expect(isEmptyLink(v)).withContext(String(v)).toBeTrue();
            }
        });

        it('ne considère pas une vraie adresse comme vide', () => {
            for (const v of ['https://www.facebook.com/ascelcbf', '/portail/suivi', 'mailto:a@b.bf']) {
                expect(isEmptyLink(v)).withContext(v).toBeFalse();
            }
        });
    });

    describe('preventIfEmptyLink', () => {
        const click = () => new MouseEvent('click', { cancelable: true });

        it('annule la navigation quand le lien est vide', () => {
            const event = click();
            preventIfEmptyLink(event, '#');
            expect(event.defaultPrevented).toBeTrue();
        });

        it('annule la navigation quand aucune adresse n’est fournie', () => {
            const event = click();
            preventIfEmptyLink(event);
            expect(event.defaultPrevented).toBeTrue();
        });

        it('laisse la navigation quand le lien est renseigné', () => {
            const event = click();
            preventIfEmptyLink(event, 'https://www.asce-lc.bf');
            expect(event.defaultPrevented).toBeFalse();
        });
    });
});
