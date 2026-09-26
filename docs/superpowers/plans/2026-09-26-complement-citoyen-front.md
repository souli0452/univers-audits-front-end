# Complément du citoyen — volet front Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la page publique `/portail/complement?code=…` où un citoyen lit la demande de complément et y répond (message et pièces jointes), plus les libellés côté agent.

**Architecture:** Deux méthodes ajoutées à `DossierService` (lecture et dépôt, sans jeton), un utilitaire pur `complement-form.ts` pour les règles de saisie, un composant autonome `PortailComplement` à états (chargement, formulaire, code introuvable, complément non attendu, erreur, succès), une route dans `portail.routes.ts`. Le lien du suivi (`Soumettre mon complément`) existe déjà et n'est pas modifié.

**Tech Stack:** Angular 20 (composants autonomes, `inject`), PrimeNG 20, Karma/Jasmine (`npm run test:ci`), routage par hash (`withHashLocation`).

**Spec:** `docs/superpowers/specs/2026-09-26-complement-citoyen-design.md`. Le volet back est décrit dans `docs/superpowers/plans/2026-09-26-complement-citoyen-back.md` et **doit être déployé avant** ce volet.

## Global Constraints

- Dépôt front, branche de départ `amandement_cge` ; travail sur une **nouvelle branche** `feature/complement-citoyen`. Rien n'est poussé sans accord explicite de l'utilisateur.
- Contrat back (voir le plan back) :
  - `GET {apiUrl}/dossiers/public/complement/{accessCode}` → `{ status, motif, requestedAt, deadline (nullable), overdue }` ; 404 code inconnu ; 409 « Aucun complément n'est attendu pour ce dossier ».
  - `POST {apiUrl}/dossiers/public/complement/{accessCode}` (multipart : `message`, `files`) → `{ status, late, filesUploaded }` ; 400 validation ; 404 ; 409 ; 429 trop d'essais.
- Les deux appels utilisent `SKIP_AUTH` (aucun jeton n'est joint).
- Saisie : message de 10 caractères minimum et 2 000 maximum ; 5 fichiers maximum, 25 Mo chacun, 50 Mo au total ; extensions `.pdf, .doc, .docx, .jpg, .jpeg, .png, .mp3, .mp4, .avi, .mov` (identiques au dépôt).
- Le code de suivi et le message ne sont **jamais** conservés dans le navigateur (ni `localStorage`, ni `sessionStorage`).
- Un seul envoi à la fois : le bouton est désactivé pendant l'envoi.
- Libellés en français, typographie `’` et « » ; aucun texte factice.
- Le bouton agent « Complément reçu » n'est pas modifié.
- Commits en français avec la ligne `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Les tests s'exécutent avec `npm run test:ci` (sur ce poste : `export CHROME_BIN="C:/Program Files/Google/Chrome/Application/chrome.exe"` au préalable).
- Piège Windows : ne jamais passer de texte accentué à `node -e` en ligne de commande ; écrire un fichier script.

## Review Focus

1. Double clic sur « Envoyer ma réponse » : un seul appel part. Test : Task 3.
2. Lien sans `code`, ou avec un code de longueur invalide : « Code introuvable » sans appel au back inutile. Test : Task 3.
3. Réponse déjà envoyée (409 à l'envoi) : message clair, pas de nouvel essai possible, lien vers le suivi. Test : Task 3.
4. Échec réseau ou 5xx à l'envoi : le message et les fichiers saisis sont conservés, pas de faux succès. Test : Task 3.
5. Fichier de type non autorisé ou déposé par glisser-déposer : refusé avant l'envoi (le dépôt public actuel ne le fait pas). Test : Task 2.

---

### Task 0: Branche et base de test

**Files:** aucun.

- [ ] **Step 1: Créer la branche**

```bash
git checkout amandement_cge
git status --short           # rien à commiter (les fichiers non suivis dans docs/ ne comptent pas)
git checkout -b feature/complement-citoyen
```

- [ ] **Step 2: Relever la base**

Run: `export CHROME_BIN="C:/Program Files/Google/Chrome/Application/chrome.exe" && npm run test:ci 2>&1 | grep -E "TOTAL|FAILED"`
Expected: `TOTAL: 33 SUCCESS` (ou le nombre courant, à noter).

---

### Task 1: Modèles et appels au back

**Files:**
- Create: `src/app/core/models/complement.model.ts`
- Modify: `src/app/core/services/dossier.service.ts`
- Test: `src/app/core/services/dossier.service.complement.spec.ts`

**Interfaces:**
- Consumes: `SKIP_AUTH` (`../interceptors/skip-auth.context`), `HttpContext`, `environment.apiUrl` (déjà importés dans `dossier.service.ts`).
- Produces:
  - `interface ComplementRequestResponse { status: string; motif: string; requestedAt: string; deadline: string | null; overdue: boolean; }`
  - `interface ComplementSubmissionResponse { status: string; late: boolean; filesUploaded: number; }`
  - `DossierService.getComplementRequest(accessCode: string): Observable<ComplementRequestResponse>`
  - `DossierService.submitComplement(accessCode: string, message: string, files: File[]): Observable<ComplementSubmissionResponse>`

- [ ] **Step 1: Écrire le test (échec attendu : les méthodes n'existent pas)**

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DossierService } from './dossier.service';
import { SKIP_AUTH } from '../interceptors/skip-auth.context';

describe('DossierService — complément public', () => {
    let service: DossierService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(DossierService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('getComplementRequest lit la demande sans jeton', () => {
        let reponse: any;
        service.getComplementRequest('ABCD1234').subscribe(r => (reponse = r));

        const req = http.expectOne(r => r.url.endsWith('/dossiers/public/complement/ABCD1234'));
        expect(req.request.method).toBe('GET');
        expect(req.request.context.get(SKIP_AUTH)).toBeTrue();
        req.flush({ status: 'EN_ATTENTE_COMPLEMENT', motif: 'Justificatifs', requestedAt: '2026-09-20T09:00:00Z', deadline: null, overdue: false });

        expect(reponse.motif).toBe('Justificatifs');
    });

    it('getComplementRequest encode le code de suivi dans l’adresse', () => {
        service.getComplementRequest('A B/1').subscribe();

        const req = http.expectOne(r => r.url.includes('/dossiers/public/complement/'));
        expect(req.request.url).toContain('/dossiers/public/complement/A%20B%2F1');
        req.flush({});
    });

    it('submitComplement envoie le message et les fichiers en multipart, sans jeton', () => {
        const preuve = new File(['contenu'], 'preuve.pdf', { type: 'application/pdf' });
        const photo = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
        let reponse: any;

        service.submitComplement('ABCD1234', 'Voici mes justificatifs', [preuve, photo]).subscribe(r => (reponse = r));

        const req = http.expectOne(r => r.url.endsWith('/dossiers/public/complement/ABCD1234'));
        expect(req.request.method).toBe('POST');
        expect(req.request.context.get(SKIP_AUTH)).toBeTrue();
        const body = req.request.body as FormData;
        expect(body.get('message')).toBe('Voici mes justificatifs');
        expect(body.getAll('files').length).toBe(2);
        req.flush({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 2 });

        expect(reponse.filesUploaded).toBe(2);
    });

    it('submitComplement sans fichier n’envoie que le message', () => {
        service.submitComplement('ABCD1234', 'Message seul', []).subscribe();

        const req = http.expectOne(r => r.url.endsWith('/dossiers/public/complement/ABCD1234'));
        const body = req.request.body as FormData;
        expect(body.get('message')).toBe('Message seul');
        expect(body.getAll('files').length).toBe(0);
        req.flush({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 0 });
    });
});
```

Run: `npm run test:ci 2>&1 | grep -E "TS2339|getComplementRequest|TOTAL" | head -3`
Expected: échec de compilation : `Property 'getComplementRequest' does not exist on type 'DossierService'`.

- [ ] **Step 2: Créer les modèles**

`src/app/core/models/complement.model.ts` :

```ts
/** Ce que le back renvoie au déclarant pour une demande de complément (aucune donnée d’identité). */
export interface ComplementRequestResponse {
    status: string;
    motif: string;
    requestedAt: string;
    deadline: string | null;
    overdue: boolean;
}

export interface ComplementSubmissionResponse {
    status: string;
    late: boolean;
    filesUploaded: number;
}
```

- [ ] **Step 3: Ajouter les deux méthodes à `DossierService`**

Dans `dossier.service.ts`, ajouter l'import :

```ts
import { ComplementRequestResponse, ComplementSubmissionResponse } from '../models/complement.model';
```

et, juste après `trackByAccessCode(...)`, ces méthodes (le fichier importe déjà `HttpContext`, `SKIP_AUTH` et définit `baseUrl`) :

```ts
    /** Demande de complément vue par le déclarant (le code de suivi sert de preuve). */
    getComplementRequest(accessCode: string): Observable<ComplementRequestResponse> {
        return this.http.get<ComplementRequestResponse>(
            `${this.baseUrl}/public/complement/${encodeURIComponent(accessCode)}`,
            { context: new HttpContext().set(SKIP_AUTH, true) });
    }

    /** Réponse du déclarant : message et pièces en un seul envoi, le dossier repasse en étude. */
    submitComplement(accessCode: string, message: string, files: File[]): Observable<ComplementSubmissionResponse> {
        const form = new FormData();
        form.append('message', message);
        files.forEach(f => form.append('files', f, f.name));
        return this.http.post<ComplementSubmissionResponse>(
            `${this.baseUrl}/public/complement/${encodeURIComponent(accessCode)}`,
            form,
            { context: new HttpContext().set(SKIP_AUTH, true) });
    }
```

- [ ] **Step 4: Vérifier**

Run: `npm run test:ci 2>&1 | grep -E "TOTAL|FAILED"`
Expected: `TOTAL: 37 SUCCESS` (33 + 4).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/models/complement.model.ts src/app/core/services/dossier.service.ts src/app/core/services/dossier.service.complement.spec.ts
git commit -m "feat(complement): appels publics du complément dans DossierService

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Règles de saisie (utilitaire pur)

**Files:**
- Create: `src/app/core/utils/complement-form.ts`
- Test: `src/app/core/utils/complement-form.spec.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - constantes `COMPLEMENT_MIN_MESSAGE = 10`, `COMPLEMENT_MAX_MESSAGE = 2000`, `COMPLEMENT_MAX_FILES = 5`, `COMPLEMENT_MAX_FILE_MB = 25`, `COMPLEMENT_MAX_TOTAL_MB = 50`, `COMPLEMENT_ACCEPT` (chaîne pour l'attribut `accept`).
  - `validateComplement(message: string, files: File[]): string[]` — liste des erreurs, vide si la saisie est valide.
  - `addComplementFiles(current: File[], incoming: File[]): { files: File[]; rejected: string[] }`.
  - `formatFileSize(bytes: number): string`.

- [ ] **Step 1: Écrire les tests (échec attendu : le module n'existe pas)**

```ts
import {
    COMPLEMENT_MAX_FILES, COMPLEMENT_MAX_MESSAGE, COMPLEMENT_MIN_MESSAGE,
    addComplementFiles, formatFileSize, validateComplement
} from './complement-form';

const MB = 1024 * 1024;

function fichier(nom: string, taille = 10): File {
    const f = new File(['x'], nom);
    Object.defineProperty(f, 'size', { value: taille });
    return f;
}

describe('complement-form', () => {
    describe('validateComplement', () => {
        it('accepte un message de 10 caractères ou plus', () => {
            expect(validateComplement('x'.repeat(COMPLEMENT_MIN_MESSAGE), [])).toEqual([]);
        });

        it('refuse un message trop court, en ignorant les espaces autour', () => {
            const erreurs = validateComplement('   court   ', []);
            expect(erreurs.length).toBe(1);
            expect(erreurs[0]).toContain('10 caractères');
        });

        it('refuse un message vide', () => {
            expect(validateComplement('', []).length).toBe(1);
        });

        it('refuse un message de plus de 2 000 caractères', () => {
            const erreurs = validateComplement('x'.repeat(COMPLEMENT_MAX_MESSAGE + 1), []);
            expect(erreurs.some(e => e.includes('2000'))).toBeTrue();
        });

        it('refuse un total de fichiers de plus de 50 Mo', () => {
            const erreurs = validateComplement('Un message assez long', [fichier('a.pdf', 30 * MB), fichier('b.pdf', 25 * MB)]);
            expect(erreurs.some(e => e.includes('50 Mo'))).toBeTrue();
        });

        it('accepte des fichiers dont le total reste sous 50 Mo', () => {
            expect(validateComplement('Un message assez long', [fichier('a.pdf', 20 * MB), fichier('b.pdf', 20 * MB)])).toEqual([]);
        });
    });

    describe('addComplementFiles', () => {
        it('ajoute les fichiers autorisés', () => {
            const r = addComplementFiles([], [fichier('preuve.pdf'), fichier('photo.JPG')]);
            expect(r.files.map(f => f.name)).toEqual(['preuve.pdf', 'photo.JPG']);
            expect(r.rejected).toEqual([]);
        });

        it('refuse un type non autorisé, y compris déposé par glisser-déposer', () => {
            const r = addComplementFiles([], [fichier('script.html'), fichier('virus.exe'), fichier('ok.pdf')]);
            expect(r.files.map(f => f.name)).toEqual(['ok.pdf']);
            expect(r.rejected.length).toBe(2);
            expect(r.rejected[0]).toContain('script.html');
        });

        it('refuse un fichier de plus de 25 Mo', () => {
            const r = addComplementFiles([], [fichier('gros.pdf', 26 * MB)]);
            expect(r.files).toEqual([]);
            expect(r.rejected[0]).toContain('25 Mo');
        });

        it('limite à 5 fichiers et signale les suivants', () => {
            const courants = Array.from({ length: COMPLEMENT_MAX_FILES - 1 }, (_, i) => fichier(`f${i}.pdf`));
            const r = addComplementFiles(courants, [fichier('cinq.pdf'), fichier('six.pdf')]);
            expect(r.files.length).toBe(COMPLEMENT_MAX_FILES);
            expect(r.rejected.length).toBe(1);
            expect(r.rejected[0]).toContain('six.pdf');
        });

        it('ne modifie pas le tableau d’origine', () => {
            const courants = [fichier('a.pdf')];
            addComplementFiles(courants, [fichier('b.pdf')]);
            expect(courants.length).toBe(1);
        });
    });

    describe('formatFileSize', () => {
        it('formate en octets, Ko et Mo', () => {
            expect(formatFileSize(0)).toBe('0 o');
            expect(formatFileSize(512)).toBe('512 o');
            expect(formatFileSize(2048)).toBe('2.0 Ko');
            expect(formatFileSize(3 * MB)).toBe('3.0 Mo');
        });
    });
});
```

Run: `npm run test:ci 2>&1 | grep -E "TS2307|complement-form|TOTAL" | head -2`
Expected: échec de compilation : `Cannot find module './complement-form'`.

- [ ] **Step 2: Écrire l'utilitaire**

```ts
/** Règles de saisie de la réponse à une demande de complément (alignées sur le back). */
export const COMPLEMENT_MIN_MESSAGE = 10;
export const COMPLEMENT_MAX_MESSAGE = 2000;
export const COMPLEMENT_MAX_FILES = 5;
export const COMPLEMENT_MAX_FILE_MB = 25;
export const COMPLEMENT_MAX_TOTAL_MB = 50;

const EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp3', 'mp4', 'avi', 'mov'];
export const COMPLEMENT_ACCEPT = EXTENSIONS.map(e => `.${e}`).join(',');

const MB = 1024 * 1024;

function isAllowedExtension(name: string): boolean {
    const dot = name.lastIndexOf('.');
    return dot > -1 && EXTENSIONS.includes(name.slice(dot + 1).toLowerCase());
}

/** Erreurs de saisie ; liste vide si la réponse peut être envoyée. */
export function validateComplement(message: string, files: File[]): string[] {
    const errors: string[] = [];
    const text = message.trim();
    if (text.length < COMPLEMENT_MIN_MESSAGE) {
        errors.push(`Votre réponse doit contenir au moins ${COMPLEMENT_MIN_MESSAGE} caractères.`);
    }
    if (text.length > COMPLEMENT_MAX_MESSAGE) {
        errors.push(`Votre réponse ne doit pas dépasser ${COMPLEMENT_MAX_MESSAGE} caractères.`);
    }
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (total > COMPLEMENT_MAX_TOTAL_MB * MB) {
        errors.push(`Le total des fichiers ne doit pas dépasser ${COMPLEMENT_MAX_TOTAL_MB} Mo.`);
    }
    return errors;
}

/** Ajoute des fichiers à la sélection en refusant type, taille et nombre hors règles. */
export function addComplementFiles(current: File[], incoming: File[]): { files: File[]; rejected: string[] } {
    const files = [...current];
    const rejected: string[] = [];
    for (const f of incoming) {
        if (!isAllowedExtension(f.name)) {
            rejected.push(`${f.name} : type de fichier non autorisé`);
        } else if (f.size > COMPLEMENT_MAX_FILE_MB * MB) {
            rejected.push(`${f.name} : dépasse ${COMPLEMENT_MAX_FILE_MB} Mo`);
        } else if (files.length >= COMPLEMENT_MAX_FILES) {
            rejected.push(`${f.name} : ${COMPLEMENT_MAX_FILES} fichiers maximum`);
        } else {
            files.push(f);
        }
    }
    return { files, rejected };
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < MB) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / MB).toFixed(1)} Mo`;
}
```

- [ ] **Step 3: Vérifier**

Run: `npm run test:ci 2>&1 | grep -E "TOTAL|FAILED"`
Expected: `TOTAL: 49 SUCCESS` (37 + 12).

- [ ] **Step 4: Commit**

```bash
git add src/app/core/utils/complement-form.ts src/app/core/utils/complement-form.spec.ts
git commit -m "feat(complement): règles de saisie de la réponse (message, fichiers)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Page `PortailComplement`

**Files:**
- Create: `src/app/pages/portail/complement/portail-complement.ts`
- Test: `src/app/pages/portail/complement/portail-complement.spec.ts`

**Interfaces:**
- Consumes: `DossierService.getComplementRequest` / `submitComplement` (Task 1) ; `validateComplement`, `addComplementFiles`, `formatFileSize`, `COMPLEMENT_ACCEPT`, `COMPLEMENT_MAX_FILES`, `COMPLEMENT_MAX_FILE_MB`, `COMPLEMENT_MIN_MESSAGE` (Task 2) ; `ActivatedRoute.snapshot.queryParamMap.get('code')`.
- Produces: classe `PortailComplement` (composant autonome, sélecteur `app-portail-complement`) avec les membres publics utilisés par les tests : `etat`, `demande`, `code`, `message`, `fichiers`, `erreurs`, `erreurEnvoi`, `envoi`, `resultat`, `envoyer()`, `choisirFichiers(event)`, `retirerFichier(i)`, `suivre()`, `accueil()`, `recharger()`.

- [ ] **Step 1: Écrire les tests (échec attendu : le composant n'existe pas)**

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { PortailComplement } from './portail-complement';
import { DossierService } from '../../../core/services/dossier.service';

const DEMANDE = {
    status: 'EN_ATTENTE_COMPLEMENT',
    motif: 'Veuillez fournir les justificatifs de paiement',
    requestedAt: '2026-09-20T09:00:00Z',
    deadline: '2026-09-30T23:59:59Z',
    overdue: false
};

describe('PortailComplement', () => {
    let fixture: ComponentFixture<PortailComplement>;
    let component: PortailComplement;
    let service: { getComplementRequest: jasmine.Spy; submitComplement: jasmine.Spy };

    function creer(code: string | null) {
        TestBed.configureTestingModule({
            imports: [PortailComplement],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (k: string) => (k === 'code' ? code : null) } } } },
                { provide: DossierService, useValue: service }
            ]
        });
        fixture = TestBed.createComponent(PortailComplement);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    const texte = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
    const erreur = (status: number) => throwError(() => new HttpErrorResponse({ status }));

    beforeEach(() => {
        service = {
            getComplementRequest: jasmine.createSpy('getComplementRequest').and.returnValue(of(DEMANDE)),
            submitComplement: jasmine.createSpy('submitComplement').and.returnValue(of({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 0 }))
        };
    });

    describe('chargement', () => {
        it('lit le code dans l’adresse et affiche le motif et l’échéance', () => {
            creer('ABCD1234');

            expect(service.getComplementRequest).toHaveBeenCalledOnceWith('ABCD1234');
            expect(component.etat).toBe('formulaire');
            expect(texte()).toContain('Veuillez fournir les justificatifs de paiement');
            expect(texte()).toContain('Échéance');
        });

        it('affiche un bandeau quand l’échéance est dépassée', () => {
            service.getComplementRequest.and.returnValue(of({ ...DEMANDE, overdue: true }));
            creer('ABCD1234');

            expect(texte()).toContain('L’échéance est dépassée');
            expect(component.etat).toBe('formulaire');
        });

        it('sans échéance, n’affiche aucune date ni bandeau', () => {
            service.getComplementRequest.and.returnValue(of({ ...DEMANDE, deadline: null }));
            creer('ABCD1234');

            expect(texte()).not.toContain('Échéance');
            expect(texte()).not.toContain('L’échéance est dépassée');
        });

        it('sans code dans l’adresse : « Code introuvable » sans appeler le back', () => {
            creer(null);

            expect(service.getComplementRequest).not.toHaveBeenCalled();
            expect(component.etat).toBe('introuvable');
            expect(texte()).toContain('Code introuvable');
        });

        it('code inconnu (404) : « Code introuvable »', () => {
            service.getComplementRequest.and.returnValue(erreur(404));
            creer('ZZZZZZZZ');

            expect(component.etat).toBe('introuvable');
        });

        it('dossier qui n’attend pas de complément (409) : « Aucune réponse attendue »', () => {
            service.getComplementRequest.and.returnValue(erreur(409));
            creer('ABCD1234');

            expect(component.etat).toBe('non-attendu');
            expect(texte()).toContain('Aucune réponse attendue');
        });

        it('autre erreur : « Service indisponible » avec possibilité de réessayer', () => {
            service.getComplementRequest.and.returnValue(erreur(500));
            creer('ABCD1234');

            expect(component.etat).toBe('erreur');
            service.getComplementRequest.and.returnValue(of(DEMANDE));
            component.recharger();
            expect(component.etat).toBe('formulaire');
        });
    });

    describe('envoi', () => {
        beforeEach(() => creer('ABCD1234'));

        it('refuse un message trop court sans appeler le back', () => {
            component.message = 'court';

            component.envoyer();

            expect(service.submitComplement).not.toHaveBeenCalled();
            expect(component.erreurs.length).toBe(1);
            expect(component.etat).toBe('formulaire');
        });

        it('envoie le message nettoyé et les fichiers puis affiche le succès', () => {
            const preuve = new File(['x'], 'preuve.pdf');
            component.message = '  Voici les justificatifs demandés  ';
            component.fichiers = [preuve];

            component.envoyer();

            expect(service.submitComplement).toHaveBeenCalledOnceWith('ABCD1234', 'Voici les justificatifs demandés', [preuve]);
            expect(component.etat).toBe('succes');
            expect(texte()).toContain('Réponse envoyée');
        });

        it('ignore un second clic tant que l’envoi est en cours (pas de double envoi)', () => {
            const enCours = new Subject<any>();
            service.submitComplement.and.returnValue(enCours);
            component.message = 'Un message assez long';

            component.envoyer();
            component.envoyer();

            expect(service.submitComplement).toHaveBeenCalledTimes(1);
            expect(component.envoi).toBeTrue();
            enCours.next({ status: 'EN_ETUDE_OPPORTUNITE', late: false, filesUploaded: 0 });
            enCours.complete();
            expect(component.envoi).toBeFalse();
        });

        it('réponse déjà reçue (409) : plus aucun envoi possible, lien vers le suivi', () => {
            service.submitComplement.and.returnValue(erreur(409));
            component.message = 'Un message assez long';

            component.envoyer();

            expect(component.etat).toBe('non-attendu');
            expect(texte()).toContain('Aucune réponse attendue');
        });

        it('trop d’essais (429) : message dédié, saisie conservée', () => {
            service.submitComplement.and.returnValue(erreur(429));
            component.message = 'Un message assez long';

            component.envoyer();

            expect(component.erreurEnvoi).toContain('Trop de tentatives');
            expect(component.etat).toBe('formulaire');
            expect(component.message).toBe('Un message assez long');
        });

        it('échec réseau : pas de faux succès, message et fichiers conservés, bouton de nouveau actif', () => {
            service.submitComplement.and.returnValue(erreur(0));
            const preuve = new File(['x'], 'preuve.pdf');
            component.message = 'Un message assez long';
            component.fichiers = [preuve];

            component.envoyer();

            expect(component.etat).toBe('formulaire');
            expect(component.erreurEnvoi).toBeTruthy();
            expect(component.message).toBe('Un message assez long');
            expect(component.fichiers).toEqual([preuve]);
            expect(component.envoi).toBeFalse();
        });

        it('indique la réponse reçue en retard dans l’écran de succès', () => {
            service.submitComplement.and.returnValue(of({ status: 'EN_ETUDE_OPPORTUNITE', late: true, filesUploaded: 0 }));
            component.message = 'Un message assez long';

            component.envoyer();

            expect(texte()).toContain('reçue après l’échéance');
        });
    });

    describe('fichiers', () => {
        beforeEach(() => creer('ABCD1234'));

        it('refuse un type non autorisé et signale le refus', () => {
            component.choisirFichiers({ target: { files: [new File(['x'], 'script.html'), new File(['x'], 'ok.pdf')], value: '' } } as any);

            expect(component.fichiers.map(f => f.name)).toEqual(['ok.pdf']);
            expect(component.erreurs.some(e => e.includes('script.html'))).toBeTrue();
        });

        it('retire un fichier de la sélection', () => {
            component.fichiers = [new File(['x'], 'a.pdf'), new File(['x'], 'b.pdf')];

            component.retirerFichier(0);

            expect(component.fichiers.map(f => f.name)).toEqual(['b.pdf']);
        });
    });

    describe('navigation', () => {
        it('« Suivre mon dossier » ouvre le suivi avec le code', () => {
            creer('ABCD1234');
            const router = TestBed.inject(Router);
            const navigate = spyOn(router, 'navigate');

            component.suivre();

            expect(navigate).toHaveBeenCalledWith(['/portail/suivi'], { queryParams: { code: 'ABCD1234' } });
        });

        it('« Accueil » ouvre l’accueil du portail', () => {
            creer('ABCD1234');
            const router = TestBed.inject(Router);
            const navigate = spyOn(router, 'navigate');

            component.accueil();

            expect(navigate).toHaveBeenCalledWith(['/portail']);
        });
    });

    it('ne conserve ni le code ni le message dans le navigateur', () => {
        const local = spyOn(Storage.prototype, 'setItem');
        creer('ABCD1234');
        component.message = 'Un message assez long';

        component.envoyer();

        expect(local).not.toHaveBeenCalled();
    });
});
```

Run: `npm run test:ci 2>&1 | grep -E "TS2307|portail-complement|TOTAL" | head -2`
Expected: échec de compilation : `Cannot find module './portail-complement'`.

- [ ] **Step 2: Écrire le composant**

`src/app/pages/portail/complement/portail-complement.ts` :

```ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DossierService } from '../../../core/services/dossier.service';
import { ComplementRequestResponse } from '../../../core/models/complement.model';
import {
    COMPLEMENT_ACCEPT, COMPLEMENT_MAX_FILES, COMPLEMENT_MAX_FILE_MB,
    COMPLEMENT_MIN_MESSAGE, addComplementFiles, formatFileSize, validateComplement
} from '../../../core/utils/complement-form';

export type EtatComplement = 'chargement' | 'formulaire' | 'introuvable' | 'non-attendu' | 'erreur' | 'succes';

@Component({
    selector: 'app-portail-complement',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ButtonModule, TextareaModule],
    styles: [`
        :host {
            --green:#009640; --red:#E30613; --yellow:#FFD800; --ink:#003617; --mist:#F2F8F4;
            --ink-60:rgba(0,54,23,.62); --hair:#E4E9E6;
            display:block; min-height:100vh; background:var(--mist);
            font-family:'Lato', system-ui, sans-serif; color:var(--ink);
        }
        .page { max-width:640px; margin:0 auto; padding:2rem 1rem 3rem; }
        .card { background:#fff; border:1.5px solid var(--hair); border-radius:16px; padding:1.5rem; margin-bottom:1rem; }
        h1 { font-size:1.6rem; font-weight:800; margin:0 0 1rem; }
        h2 { font-size:1rem; font-weight:800; margin:0 0 .5rem; }
        .motif { background:var(--mist); border-left:4px solid var(--green); border-radius:8px; padding:.875rem 1rem; white-space:pre-line; }
        .retard { background:rgba(255,216,0,.15); border:1px solid var(--yellow); border-radius:10px; padding:.75rem 1rem; margin-top:.75rem; font-size:.9rem; }
        .erreur { background:#FDEBEC; border:1.5px solid var(--red); border-radius:10px; padding:.75rem 1rem; color:var(--red); font-size:.875rem; margin-bottom:1rem; }
        .fichier { display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.5rem .75rem; border:1px solid var(--hair); border-radius:8px; margin-top:.5rem; font-size:.875rem; }
        .aide { color:var(--ink-60); font-size:.8rem; margin-top:.375rem; }
        .actions { display:flex; gap:.5rem; flex-wrap:wrap; margin-top:1rem; }
        .centre { text-align:center; }
    `],
    template: `
    <div class="page">
        <div *ngIf="etat === 'chargement'" class="card centre" role="status">Chargement de votre dossier…</div>

        <div *ngIf="etat === 'introuvable'" class="card centre">
            <h1>Code introuvable</h1>
            <p>Vérifiez le lien reçu ou votre code de suivi.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Aller au suivi" icon="pi pi-search" (onClick)="suivreSansCode()" />
                <p-button label="Accueil" severity="secondary" outlined (onClick)="accueil()" />
            </div>
        </div>

        <div *ngIf="etat === 'non-attendu'" class="card centre">
            <h1>Aucune réponse attendue</h1>
            <p>Aucun complément n’est attendu pour ce dossier. Une réponse a peut-être déjà été envoyée.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Voir l’état de mon dossier" icon="pi pi-search" (onClick)="suivre()" />
                <p-button label="Accueil" severity="secondary" outlined (onClick)="accueil()" />
            </div>
        </div>

        <div *ngIf="etat === 'erreur'" class="card centre">
            <h1>Service indisponible</h1>
            <p>Impossible de charger votre demande pour le moment.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Réessayer" icon="pi pi-refresh" (onClick)="recharger()" />
            </div>
        </div>

        <div *ngIf="etat === 'succes'" class="card centre">
            <h1>Réponse envoyée</h1>
            <p>Merci. Votre dossier repasse en étude : vous pouvez suivre son avancement avec votre code.</p>
            <p *ngIf="resultat?.late" class="retard">Votre réponse a été reçue après l’échéance ; elle a bien été transmise.</p>
            <div class="actions" style="justify-content:center;">
                <p-button label="Suivre mon dossier" icon="pi pi-search" severity="success" (onClick)="suivre()" />
                <p-button label="Accueil" severity="secondary" outlined (onClick)="accueil()" />
            </div>
        </div>

        <ng-container *ngIf="etat === 'formulaire' && demande">
            <h1>Compléter mon dossier</h1>

            <div class="card">
                <h2>Ce que l’ASCE-LC vous demande</h2>
                <div class="motif">{{ demande.motif }}</div>
                <div *ngIf="demande.deadline" class="aide">Échéance : {{ demande.deadline | date:'dd/MM/yyyy' }}</div>
                <div *ngIf="demande.overdue" class="retard">L’échéance est dépassée. Votre réponse sera tout de même transmise.</div>
            </div>

            <div class="card">
                <div *ngIf="erreurs.length || erreurEnvoi" class="erreur" role="alert">
                    <div *ngFor="let e of erreurs">{{ e }}</div>
                    <div *ngIf="erreurEnvoi">{{ erreurEnvoi }}</div>
                </div>

                <h2><label for="reponse">Votre réponse</label></h2>
                <textarea id="reponse" pTextarea [(ngModel)]="message" rows="6" class="w-full"
                    [attr.maxlength]="2000"
                    placeholder="Écrivez votre réponse ({{ min }} caractères minimum)…"></textarea>

                <h2 style="margin-top:1rem;">Pièces jointes (facultatif)</h2>
                <input #champ type="file" multiple hidden [accept]="accept" (change)="choisirFichiers($event)" />
                <p-button label="Ajouter des fichiers" icon="pi pi-paperclip" severity="secondary" outlined
                    [disabled]="fichiers.length >= maxFichiers" (onClick)="champ.click()" />
                <div class="aide">{{ maxFichiers }} fichiers maximum, {{ maxMo }} Mo chacun (PDF, Word, images, audio, vidéo).</div>
                <div *ngFor="let f of fichiers; let i = index" class="fichier">
                    <span>{{ f.name }} — {{ taille(f.size) }}</span>
                    <p-button icon="pi pi-times" severity="danger" text size="small"
                        [attr.aria-label]="'Retirer ' + f.name" (onClick)="retirerFichier(i)" />
                </div>

                <div class="actions">
                    <p-button label="Envoyer ma réponse" icon="pi pi-send" [loading]="envoi" [disabled]="envoi"
                        (onClick)="envoyer()" />
                </div>
            </div>
        </ng-container>
    </div>
    `
})
export class PortailComplement implements OnInit {

    private route   = inject(ActivatedRoute);
    private router  = inject(Router);
    private service = inject(DossierService);

    readonly accept = COMPLEMENT_ACCEPT;
    readonly maxFichiers = COMPLEMENT_MAX_FILES;
    readonly maxMo = COMPLEMENT_MAX_FILE_MB;
    readonly min = COMPLEMENT_MIN_MESSAGE;
    readonly taille = formatFileSize;

    etat: EtatComplement = 'chargement';
    code = '';
    demande: ComplementRequestResponse | null = null;
    message = '';
    fichiers: File[] = [];
    erreurs: string[] = [];
    erreurEnvoi = '';
    envoi = false;
    resultat: { late: boolean; filesUploaded: number } | null = null;

    ngOnInit(): void {
        this.code = (this.route.snapshot.queryParamMap.get('code') ?? '').trim();
        if (!this.code) {
            this.etat = 'introuvable';
            return;
        }
        this.charger();
    }

    recharger(): void { this.charger(); }

    private charger(): void {
        this.etat = 'chargement';
        this.service.getComplementRequest(this.code).subscribe({
            next: demande => { this.demande = demande; this.etat = 'formulaire'; },
            error: (err: HttpErrorResponse) => {
                this.etat = err.status === 404 ? 'introuvable'
                          : err.status === 409 ? 'non-attendu'
                          : 'erreur';
            }
        });
    }

    choisirFichiers(event: Event): void {
        const input = event.target as HTMLInputElement;
        const { files, rejected } = addComplementFiles(this.fichiers, Array.from(input.files ?? []));
        this.fichiers = files;
        this.erreurs = rejected;
        input.value = '';
    }

    retirerFichier(index: number): void {
        this.fichiers = this.fichiers.filter((_, i) => i !== index);
    }

    envoyer(): void {
        if (this.envoi) return;
        this.erreurEnvoi = '';
        this.erreurs = validateComplement(this.message, this.fichiers);
        if (this.erreurs.length) return;

        this.envoi = true;
        this.service.submitComplement(this.code, this.message.trim(), this.fichiers).subscribe({
            next: resultat => {
                this.envoi = false;
                this.resultat = resultat;
                this.etat = 'succes';
            },
            error: (err: HttpErrorResponse) => {
                this.envoi = false;
                if (err.status === 409) {
                    this.etat = 'non-attendu';
                } else if (err.status === 429) {
                    this.erreurEnvoi = 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
                } else if (err.status === 400 && err.error?.message) {
                    this.erreurEnvoi = err.error.message;
                } else {
                    this.erreurEnvoi = 'L’envoi a échoué. Votre saisie est conservée : vérifiez votre connexion et réessayez.';
                }
            }
        });
    }

    suivre(): void { this.router.navigate(['/portail/suivi'], { queryParams: { code: this.code } }); }
    suivreSansCode(): void { this.router.navigate(['/portail/suivi']); }
    accueil(): void { this.router.navigate(['/portail']); }
}
```

Note : dans le test « autre erreur : « Service indisponible » », `erreur(0)` et `erreur(500)` sont traités par la branche `else` ; le test « 400 » n'est pas requis car le message du back est affiché tel quel.

- [ ] **Step 3: Vérifier**

Run: `npm run test:ci 2>&1 | grep -E "TOTAL|FAILED|error TS"`
Expected: `TOTAL: 68 SUCCESS` (49 + 19). Si un test échoue sur `texte()` parce que la vue n'est pas rafraîchie après une action, appeler `fixture.detectChanges()` dans le test juste avant la lecture du texte (jamais modifier l'assertion).

- [ ] **Step 4: Vérifier la compilation AOT du gabarit**

Run: `npx ng build --configuration development 2>&1 | grep -E "ERROR|NG[0-9]+|Application bundle"`
Expected: `Application bundle generation complete`, aucune ligne ERROR.

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/portail/complement/
git commit -m "feat(complement): page portail de réponse à une demande de complément

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Route

**Files:**
- Modify: `src/app/pages/portail/portail.routes.ts`
- Test: `src/app/pages/portail/portail.routes.spec.ts`

**Interfaces:**
- Consumes: `PortailComplement` (Task 3).
- Produces: la route `complement` sous `/portail` (adresse `/#/portail/complement?code=…`).

- [ ] **Step 1: Écrire le test (échec attendu : la route n'existe pas)**

```ts
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
```

Run: `npm run test:ci 2>&1 | grep -E "FAILED|TOTAL" | head -3`
Expected: `1 FAILED` (route `complement` absente).

- [ ] **Step 2: Ajouter la route**

Dans `portail.routes.ts`, remplacer la fin du fichier :

```ts
            .then(m => m.PortailSuivi)
    }
] as Routes;
```

par :

```ts
            .then(m => m.PortailSuivi)
    },
    {
        path: 'complement',
        loadComponent: () =>
            import('./complement/portail-complement')
            .then(m => m.PortailComplement)
    }
] as Routes;
```

- [ ] **Step 3: Vérifier**

Run: `npm run test:ci 2>&1 | grep -E "TOTAL|FAILED"`
Expected: `TOTAL: 70 SUCCESS` (68 + 2).

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/portail/portail.routes.ts src/app/pages/portail/portail.routes.spec.ts
git commit -m "feat(complement): route publique /portail/complement

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Libellés côté agent

**Files:**
- Modify: `src/app/pages/dossiers/dossier-detail/dossier-detail.ts` (méthode `getObsTypeLabel`)
- Modify: `src/app/pages/administration/audit/audit-dashboard.ts` (liste `actionOptions`)
- Test: `src/app/pages/dossiers/dossier-detail/dossier-detail.labels.spec.ts`
- Test: `src/app/pages/administration/audit/audit-dashboard.spec.ts`

**Interfaces:**
- Consumes: le type d'observation `COMPLEMENT_RESPONSE` et l'action d'audit `RECEVOIR_COMPLEMENT` produits par le back.
- Produces: libellés « Réponse au complément » et « Recevoir complément ».

- [ ] **Step 1: Écrire les tests (échec attendu)**

`dossier-detail.labels.spec.ts` :

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DossierDetail } from './dossier-detail';
import { KeycloakService } from '../../../core/auth/keycloak.service';

describe('DossierDetail — libellés d’observation', () => {
    it('libelle la réponse du déclarant au complément', () => {
        TestBed.configureTestingModule({
            imports: [DossierDetail],
            providers: [
                provideRouter([]), provideHttpClient(), provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } } } },
                { provide: KeycloakService, useValue: { hasAnyRole: () => false } }
            ]
        });
        const component = TestBed.createComponent(DossierDetail).componentInstance;

        expect(component.getObsTypeLabel('COMPLEMENT_RESPONSE')).toBe('Réponse au complément');
        expect(component.getObsTypeLabel('COMPLEMENT_REQUEST')).toBe('Demande complément');
    });
});
```

`audit-dashboard.spec.ts` :

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuditDashboard } from './audit-dashboard';

describe('AuditDashboard — actions filtrables', () => {
    it('propose l’action « Recevoir complément » journalisée à la réponse d’un déclarant', () => {
        TestBed.configureTestingModule({
            imports: [AuditDashboard],
            providers: [provideRouter([]), provideHttpClient(), provideNoopAnimations()]
        });
        const component = TestBed.createComponent(AuditDashboard).componentInstance;

        expect(component.actionOptions).toContain({ label: 'Recevoir complément', value: 'RECEVOIR_COMPLEMENT' });
    });
});
```

Run: `npm run test:ci 2>&1 | grep -E "FAILED|TOTAL" | head -4`
Expected: 2 échecs (`Expected 'COMPLEMENT_RESPONSE' to be 'Réponse au complément'` et l'option absente).

- [ ] **Step 2: Ajouter les libellés**

Dans `dossier-detail.ts`, méthode `getObsTypeLabel`, remplacer :

```ts
            TRANSFER_NOTE: 'Note transfert'
        };
```

par :

```ts
            TRANSFER_NOTE: 'Note transfert',
            COMPLEMENT_RESPONSE: 'Réponse au complément'
        };
```

Dans `audit-dashboard.ts`, liste `actionOptions`, remplacer :

```ts
    { label: 'Supprimer rôle',       value: 'SUPPRIMER_ROLE'       },
  ];
```

par :

```ts
    { label: 'Supprimer rôle',       value: 'SUPPRIMER_ROLE'       },
    { label: 'Recevoir complément',  value: 'RECEVOIR_COMPLEMENT'  },
  ];
```

Ne **pas** ajouter `COMPLEMENT_RESPONSE` à la liste de création d'observations par un agent (`typeOptions`) : seul le déclarant, via le portail, produit ce type.

- [ ] **Step 3: Vérifier que le nom affiché de l'auteur est bien `authorFullName`**

Run: `grep -n "authorFullName" src/app/pages/dossiers/dossier-detail/dossier-detail.html src/app/core/models/observation.model.ts`
Expected: au moins une occurrence dans le gabarit ou le modèle. Si l'écran affiche un autre champ (par exemple `agent.firstName`), l'observation du déclarant s'afficherait sous le nom de l'agent qui a demandé le complément : adapter alors l'affichage pour préférer `authorFullName`, avec un test.

- [ ] **Step 4: Vérifier**

Run: `npm run test:ci 2>&1 | grep -E "TOTAL|FAILED"`
Expected: `TOTAL: 72 SUCCESS` (70 + 2).

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/dossiers/dossier-detail/ src/app/pages/administration/audit/
git commit -m "feat(complement): libellés agent de la réponse au complément

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Cahier de recette et vérification finale

**Files:**
- Modify (branche `docs/cahier-recette`) : `docs/recette/data/p04-suivi.mjs`, `docs/recette/data/p07-traitement.mjs`, `docs/recette/data/p13-notifications-profil.mjs` (si nécessaire)
- Modify : `docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md` (volume)

**Interfaces:**
- Consumes: les libellés de la page (Task 3), qui existent alors dans `src/` de la branche `feature/complement-citoyen`.
- Produces: le cahier régénéré (`npm run build` dans `docs/recette`).

- [ ] **Step 1: Vérification finale du front**

Run: `npm run test:ci 2>&1 | grep -E "TOTAL|FAILED" && npx ng build --configuration production 2>&1 | grep -E "ERROR|Application bundle"`
Expected: `TOTAL: 72 SUCCESS` et `Application bundle generation complete`, aucune ligne ERROR.

- [ ] **Step 2: Rapatrier le front dans la branche du cahier**

Le validateur du cahier lit les libellés dans `src/` de la branche courante : la branche du cahier doit contenir la page.

```bash
git checkout docs/cahier-recette
git merge --no-ff feature/complement-citoyen -m "Merge feature/complement-citoyen dans docs/cahier-recette

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Mettre à jour les cas existants**

Dans `docs/recette/data/p04-suivi.mjs`, remplacer le cas `P04-04` par :

```js
    {
      id: 'P04-04',
      title: 'Dossier en attente de complément : lien vers la page de réponse',
      priority: 'Majeur',
      type: 'nominal',
      role: 'PUBLIC',
      preconditions: ['Un dossier au statut EN_ATTENTE_COMPLEMENT avec un motif et une échéance (voir P07-03)'],
      steps: [
        'Rechercher le dossier sur /portail/suivi avec son code',
        'Lire le statut « Complément requis »',
        'Cliquer sur « Soumettre mon complément »'
      ],
      data: [],
      expected: [
        'Le message « Des informations supplémentaires sont nécessaires. Merci de soumettre votre complément. » s’affiche',
        'La page « Compléter mon dossier » s’ouvre (adresse /#/portail/complement?code=…)',
        'Elle affiche le motif de la demande saisi par l’agent et l’échéance'
      ],
      ui: ['Complément requis', 'Soumettre mon complément', 'Compléter mon dossier']
    },
```

Dans `p07-traitement.mjs`, cas `P07-04`, remplacer l'`aConfirmer` (« Le complément du citoyen ne peut pas être déposé depuis le portail… ») par la précision suivante, en retirant la clé `aConfirmer` et en ajoutant à `expected` : `'Cette action manuelle sert aux compléments reçus hors portail (courrier, guichet, téléphone) : un complément déposé par le citoyen sur le portail fait déjà repasser le dossier en étude sans clic d’agent (voir P04-10)'`.

Dans `p04-suivi.mjs`, cas `P04-08`, remplacer l'`aConfirmer` (« Aucune limitation n'est visible côté écran… ») par une vérification réelle : ajouter à `expected` `'Au-delà de 20 recherches par minute depuis la même adresse, le suivi répond « Trop de requêtes » (code 429)'` et retirer l'`aConfirmer`.

- [ ] **Step 4: Ajouter les nouveaux cas du complément (P04-10 à P04-16)**

Ajouter à `cases` de `p04-suivi.mjs`, en suivant le guide de rédaction (`docs/superpowers/plans/2026-09-26-cahier-de-recette.md`, section « Case authoring guide »), 7 cas. Pour chacun : `role: 'PUBLIC'`, préconditions « dossier au statut EN_ATTENTE_COMPLEMENT », et `ui` limité aux libellés présents dans `src/` (« Compléter mon dossier », « Ce que l’ASCE-LC vous demande », « Envoyer ma réponse », « Réponse envoyée », « Code introuvable », « Aucune réponse attendue », « Service indisponible »).

| ID | Priorité | Type | Contenu |
|---|---|---|---|
| P04-10 | Critique | nominal | Réponse par message seul dans les délais : « Envoyer ma réponse » → « Réponse envoyée » ; côté agent le dossier est « En étude », une observation « Réponse au complément » signée « Déclarant (via le portail) » apparaît, une alerte interne « Complément reçu » existe, le journal contient « Recevoir complément » |
| P04-11 | Majeur | nominal | Réponse avec 2 pièces jointes (PDF et image) : elles sont téléchargeables côté agent dans « Pièces jointes » |
| P04-12 | Majeur | nominal | Réponse après l’échéance : le bandeau « L’échéance est dépassée » s’affiche avant l’envoi, l’écran de succès indique « reçue après l’échéance », l’observation côté agent commence par « Reçu en retard (échéance du JJ/MM/AAAA) » |
| P04-13 | Critique | securite | Dossier anonyme (sans coordonnées) : la réponse fonctionne avec le seul code, aucune donnée d’identité n’est demandée ni affichée sur la page |
| P04-14 | Majeur | negatif | Seconde réponse, ou code d’un dossier qui n’attend rien : « Aucune réponse attendue » avec lien vers le suivi, aucun second passage de statut |
| P04-15 | Majeur | negatif | Message de moins de 10 caractères, fichier .html ou .exe, fichier de plus de 25 Mo, sixième fichier : chaque refus est expliqué avant l’envoi ; code absent ou inconnu : « Code introuvable » |
| P04-16 | Majeur | negatif | Coupure réseau pendant l’envoi : pas de faux succès, message et fichiers conservés, l’envoi peut être relancé ; plus de 5 envois en 10 minutes : message « Trop de tentatives » |

Ajouter aussi un `aConfirmer` à P04-11 : `'La limite de taille d’envoi de nginx sur la VM (client_max_body_size) doit permettre au moins 50 Mo'`.

- [ ] **Step 5: Valider, tester et régénérer**

```bash
cd docs/recette
node validate.mjs      # attendu : OK — 15 processus, 151 cas
npm test 2>&1 | grep -E "^# (pass|fail)"
npm run build 2>&1 | tail -1
cd ../..
```

Expected: `OK — 15 processus, 151 cas`, `# fail 0`, `Généré : … (151 cas)`. Si le validateur signale un libellé introuvable, recopier le libellé exact depuis `portail-complement.ts`.

- [ ] **Step 6: Mettre à jour le volume dans le spec du cahier et commiter**

Dans `docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md`, section 6, remplacer « 144 cas » par « 151 cas ».

```bash
git add docs/recette/data docs/superpowers/specs/2026-09-26-cahier-de-recette-design.md
git commit -m "docs(recette): cas du complément citoyen et mise à jour de P04-04, P04-08, P07-04

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Livraison**

Ne **pas** pousser sans accord. Présenter à l'utilisateur : les commits, le résultat des tests et des builds, et rappeler l'ordre : (1) déployer le back `feature/complement-portail` (voir son plan), (2) vérifier la limite de taille d'envoi de nginx, (3) déployer ce front. Demander s'il faut fusionner `feature/complement-citoyen` dans `amandement_cge` et pousser.
