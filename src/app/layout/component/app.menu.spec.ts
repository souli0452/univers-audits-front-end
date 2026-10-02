import { MenuItem } from 'primeng/api';
import { AppMenu } from './app.menu';

const groupe = (label: string, visible?: boolean): MenuItem => ({ label, visible });
const sep: MenuItem = { separator: true };
const libelles = (items: MenuItem[]) => items.map(i => (i.separator ? '---' : i.label));

describe('AppMenu.sansSeparateursOrphelins', () => {
    it('retire les groupes masqués et les séparateurs devenus orphelins', () => {
        const menu = [groupe('Navigation'), sep, groupe('Dossiers', false), sep,
                      groupe('Bureau', false), sep, groupe('Administration', false), sep, groupe('Compte')];

        expect(libelles(AppMenu.sansSeparateursOrphelins(menu))).toEqual(['Navigation', '---', 'Compte']);
    });

    it('laisse intact un menu complet', () => {
        const menu = [groupe('A'), sep, groupe('B'), sep, groupe('C')];

        expect(libelles(AppMenu.sansSeparateursOrphelins(menu))).toEqual(['A', '---', 'B', '---', 'C']);
    });

    it('retire un séparateur en tête ou en queue', () => {
        const menu = [sep, groupe('A'), sep];

        expect(libelles(AppMenu.sansSeparateursOrphelins(menu))).toEqual(['A']);
    });
});
