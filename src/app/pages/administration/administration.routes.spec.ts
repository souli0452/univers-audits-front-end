import { Route } from '@angular/router';
import administrationRoutes from './administration.routes';

describe('administration.routes', () => {
    const find = (path: string): Route | undefined =>
        administrationRoutes.find(r => r.path === path);

    it('protège « notifications-queue » par une garde de rôle (le menu la masque déjà à CGE)', () => {
        const route = find('notifications-queue');
        expect(route).toBeDefined();
        expect(route!.canActivate?.length).toBe(1);
    });
});
