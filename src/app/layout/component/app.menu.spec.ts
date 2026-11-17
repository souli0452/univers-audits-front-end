import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KeycloakService } from '../../core/auth/keycloak.service';
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

describe('AppMenu : le CGE et le CGEA ne voient que le métier', () => {
    function menuPour(roles: string[]): MenuItem[] {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: KeycloakService, useValue: {
                    hasAnyRole: (r: string[]) => r.some(x => roles.includes(x)),
                    estDcpSeul: () => false,
                    logout: () => {}
                } }
            ]
        });
        const menu = TestBed.createComponent(AppMenu).componentInstance;
        menu.ngOnInit();
        return menu.model;
    }

    const groupeNomme = (menu: MenuItem[], label: string) => menu.find(i => i.label === label);
    const entree = (menu: MenuItem[], label: string) =>
        menu.flatMap(g => g.items ?? []).find(i => i.label === label);

    for (const role of ['CGE', 'CGEA']) {
        it(`${role} n'a pas de groupe Administration mais garde « Dépassements par acteur »`, () => {
            const menu = menuPour([role]);

            expect(groupeNomme(menu, 'Administration')).toBeUndefined();
            expect(entree(menu, 'Dépassements par acteur')?.visible).not.toBe(false);
        });
    }

    it("ADMIN_DDIC garde le groupe Administration au complet", () => {
        const menu = menuPour(['ADMIN_DDIC']);

        expect(groupeNomme(menu, 'Administration')).toBeDefined();
        expect(entree(menu, 'File des notifications')?.visible).not.toBe(false);
    });

    for (const role of ['CGE', 'CGEA', 'CHEF_DEI']) {
        it(`« Registre des auditions » est dans la section métier pour ${role}, pas dans l'administration`, () => {
            const menu = menuPour([role]);
            const registre = groupeNomme(menu, 'Investigations')?.items?.find(i => i.label === 'Registre des auditions');

            expect(registre).toBeDefined();
            expect(registre?.visible).not.toBe(false);
        });
    }

    it("« Registre des auditions » reste masqué au contrôleur d'État (accès limité au CGE, au CGEA et à l'administrateur)", () => {
        const menu = menuPour(['CONTROLEUR_ETAT']);
        const registre = groupeNomme(menu, 'Investigations')?.items?.find(i => i.label === 'Registre des auditions');

        expect(registre?.visible).toBe(false);
    });
});
