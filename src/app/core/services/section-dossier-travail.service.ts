import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    SectionDossierTravailResponse, OrganisationDetailRequest, SectionDetailCreateRequest
} from '../models/section-dossier-travail.model';

export type {
    SectionDossierTravailResponse, OrganisationDetailRequest, SectionDetailCreateRequest,
    TypeSectionDossierTravail, OrganisationDetail
} from '../models/section-dossier-travail.model';

@Injectable({ providedIn: 'root' })
export class SectionDossierTravailService {

    private http = inject(HttpClient);

    private url(dossierId: string): string {
        return `${environment.apiUrl}/dossiers/${dossierId}/dossier-travail`;
    }

    listerSections(dossierId: string): Observable<SectionDossierTravailResponse[]> {
        return this.http.get<SectionDossierTravailResponse[]>(`${this.url(dossierId)}/sections`);
    }

    definirOrganisationDetail(dossierId: string, req: OrganisationDetailRequest): Observable<void> {
        return this.http.post<void>(`${this.url(dossierId)}/organisation-detail`, req);
    }

    creerSectionDetail(dossierId: string, req: SectionDetailCreateRequest): Observable<SectionDossierTravailResponse> {
        return this.http.post<SectionDossierTravailResponse>(`${this.url(dossierId)}/sections`, req);
    }
}
