import { TestBed } from '@angular/core/testing';
import { Route, provideRouter } from '@angular/router';
import { Notfound } from './notfound/notfound';
import { Access } from './auth/access';
import { Error as ErrorPage } from './auth/error';
import authRoutes from './auth/auth.routes';

const GABARIT = ['Not Found', 'Access Denied', 'Error Occured', 'Go to Dashboard', 'Requested resource', 'permisions',
    'Frequently Asked Questions', 'Ultricies', 'Solution Center', 'Permission Manager', 'Phasellus', 'Accumsan', 'PrimeLand'];

function texte(component: any): string {
    TestBed.configureTestingModule({ imports: [component], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('pages d’erreur', () => {
    it('la page 404 est en français, sans texte factice du gabarit, avec un retour vers l’accueil', () => {
        const contenu = texte(Notfound);

        expect(contenu).toContain('Page introuvable');
        expect(contenu).toContain('Retour à l’accueil');
        for (const mot of GABARIT) expect(contenu).withContext(mot).not.toContain(mot);
    });

    it('la page « accès refusé » est en français', () => {
        const contenu = texte(Access);

        expect(contenu).toContain('Accès refusé');
        expect(contenu).toContain('Retour à l’accueil');
        for (const mot of GABARIT) expect(contenu).withContext(mot).not.toContain(mot);
    });

    it('la page d’erreur est en français', () => {
        const contenu = texte(ErrorPage);

        expect(contenu).toContain('Une erreur est survenue');
        expect(contenu).toContain('Retour à l’accueil');
        for (const mot of GABARIT) expect(contenu).withContext(mot).not.toContain(mot);
    });
});

describe('auth.routes', () => {
    const find = (path: string): Route | undefined => authRoutes.find(r => r.path === path);

    it('/auth/login ne présente plus de faux formulaire : il envoie vers /app (connexion Keycloak)', () => {
        const login = find('login');

        expect(login?.redirectTo).toBe('/app');
        expect(login?.component).toBeUndefined();
    });

    it('conserve les pages accès refusé et erreur', () => {
        expect(find('access')?.component).toBe(Access);
        expect(find('error')?.component).toBe(ErrorPage);
    });
});
