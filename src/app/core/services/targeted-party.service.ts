import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TargetedPartyResponse {
    id: string;
    partyType: string;
    firstName?: string;
    name?: string;
    position?: string;
    institution?: string;
    organization?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    relationWithDeclarant?: string;
    allegedRole?: string;
    createdAt?: string;
}

export interface TargetedPartyRequest {
    partyType: string;
    firstName?: string;
    name?: string;
    position?: string;
    institution?: string;
    organization?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    relationWithDeclarant?: string;
    allegedRole?: string;
}

@Injectable({ providedIn: 'root' })
export class TargetedPartyService {

    private http = inject(HttpClient);

    private url(dossierId: string): string {
        return `${environment.apiUrl}/dossiers/${dossierId}/parties`;
    }

    findAll(dossierId: string): Observable<TargetedPartyResponse[]> {
        return this.http.get<TargetedPartyResponse[]>(this.url(dossierId));
    }

    create(
        dossierId: string,
        req: TargetedPartyRequest
    ): Observable<TargetedPartyResponse> {
        return this.http.post<TargetedPartyResponse>(this.url(dossierId), req);
    }

    update(
        dossierId: string,
        partyId: string,
        req: TargetedPartyRequest
    ): Observable<TargetedPartyResponse> {
        return this.http.put<TargetedPartyResponse>(
            `${this.url(dossierId)}/${partyId}`, req
        );
    }

    delete(dossierId: string, partyId: string): Observable<void> {
        return this.http.delete<void>(`${this.url(dossierId)}/${partyId}`);
    }
}