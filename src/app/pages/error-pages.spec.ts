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

describe('pages d’erreur — identité de l’ASCE-LC', () => {
    function page(component: any): HTMLElement {
        TestBed.configureTestingModule({ imports: [component], providers: [provideRouter([])] });
        const fixture = TestBed.createComponent(component);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    const PAGES: [string, any, string][] = [['404', Notfound, '404'], ['accès refusé', Access, '403'], ['erreur', ErrorPage, 'Erreur']];

    for (const [nom, composant, code] of PAGES) {
        describe(nom, () => {
            it('affiche le logo de l’ASCE-LC, qui ramène à l’accueil', () => {
                const racine = page(composant);

                const logo = racine.querySelector('img[alt="ASCE-LC"]') as HTMLImageElement;
                expect(logo).not.toBeNull();
                expect(logo.getAttribute('src')).toBe('assets/logo-asce.png');
                expect(logo.closest('a')?.getAttribute('href')).toBe('/');
            });

            it('affiche son code bien en vue', () => {
                expect(page(composant).querySelector('[data-testid="code"]')?.textContent?.trim()).toBe(code);
            });

            it('ne dépend d’aucune image externe (la politique de sécurité les bloque)', () => {
                const externes = Array.from(page(composant).querySelectorAll('img'))
                    .map(i => i.getAttribute('src') ?? '').filter(src => /^(https?:)?\/\//.test(src));

                expect(externes).toEqual([]);
            });

            it('propose de revenir à l’accueil ou d’ouvrir l’espace agent, par de vrais liens', () => {
                const liens = Array.from(page(composant).querySelectorAll('a')).map(a => [a.textContent?.trim(), a.getAttribute('href')]);

                expect(liens).toContain(['Retour à l’accueil', '/']);
                expect(liens).toContain(['Espace agent', '/app']);
            });

            it('reste blanc et vert : ni orange, ni rose, ni rouge, ni mode sombre', () => {
                const html = page(composant).innerHTML;

                expect(html).not.toMatch(/orange|pink|red-|rose|app-floating-configurator/i);
            });
        });
    }
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
