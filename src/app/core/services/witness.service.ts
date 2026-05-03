import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WitnessResponse {
    id: string;
    firstName?: string;
    lastName?: string;
    profession?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    testimonyNature?: string;
    relationWithParties?: string;
    interrogationDate?: string;
    consentToContact: boolean;
    anonymous: boolean;
    createdAt?: string;
}

export interface WitnessRequest {
    firstName?: string;
    lastName?: string;
    profession?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    testimonyNature?: string;
    relationWithParties?: string;
    interrogationDate?: string;
    consentToContact?: boolean;
    anonymous?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WitnessService {

    private http = inject(HttpClient);

    private url(dossierId: string): string {
        return `${environment.apiUrl}/dossiers/${dossierId}/witnesses`;
    }

    findAll(dossierId: string): Observable<WitnessResponse[]> {
        return this.http.get<WitnessResponse[]>(this.url(dossierId));
    }

    create(
        dossierId: string,
        req: WitnessRequest
    ): Observable<WitnessResponse> {
        return this.http.post<WitnessResponse>(this.url(dossierId), req);
    }

    update(
        dossierId: string,
        witnessId: string,
        req: WitnessRequest
    ): Observable<WitnessResponse> {
        return this.http.put<WitnessResponse>(
            `${this.url(dossierId)}/${witnessId}`, req
        );
    }

    delete(dossierId: string, witnessId: string): Observable<void> {
        return this.http.delete<void>(`${this.url(dossierId)}/${witnessId}`);
    }
}