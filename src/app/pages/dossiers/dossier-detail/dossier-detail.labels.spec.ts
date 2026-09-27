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
