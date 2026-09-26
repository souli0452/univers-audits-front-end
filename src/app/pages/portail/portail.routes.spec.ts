import { Route } from '@angular/router';
import portailRoutes from './portail.routes';
import { PortailComplement } from './complement/portail-complement';

describe('portail.routes', () => {
    const find = (path: string): Route | undefined => portailRoutes.find(r => r.path === path);

    it('déclare /portail/complement, cible du lien « Soumettre mon complément » du suivi', async () => {
        const route = find('complement');

        expect(route).toBeDefined();
        expect(route!.canActivate).toBeUndefined();   // page publique : aucune connexion exigée
        const composant = await (route!.loadComponent as () => Promise<unknown>)();
        expect(composant).toBe(PortailComplement);
    });

    it('conserve les routes publiques existantes', () => {
        for (const path of ['', 'deposer', 'vocal', 'suivi']) {
            expect(find(path)).withContext(path).toBeDefined();
        }
    });
});
