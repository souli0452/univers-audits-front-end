import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route, Router, provideRouter } from '@angular/router';
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

    it('l\'ancienne adresse /portail/vocal (liens, favoris) ouvre la page de dépôt unique en mode « Parler »', async () => {
        @Component({ template: '' })
        class DepotFactice {}
        TestBed.configureTestingModule({
            providers: [provideRouter([{
                path: 'portail',
                children: portailRoutes.map(r => r.path === 'deposer' ? { path: 'deposer', component: DepotFactice } : r)
            }])]
        });
        const router = TestBed.inject(Router);

        await router.navigateByUrl('/portail/vocal');

        expect(router.url).toBe('/portail/deposer?mode=vocal');
    });

    it('n\'y a plus de page vocale séparée : /portail/vocal n\'a plus de composant propre', () => {
        const route = find('vocal')!;

        expect(route.loadComponent).toBeUndefined();
        expect(route.component).toBeUndefined();
    });
});
