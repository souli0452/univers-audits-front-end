import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    RapportEnqueteResponse, RapportEnqueteRequest,
    NoteRecommandationsResponse, NoteRecommandationsRequest
} from '../models/rapport-enquete.model';

export type {
    RapportEnqueteResponse, RapportEnqueteRequest,
    NoteRecommandationsResponse, NoteRecommandationsRequest
} from '../models/rapport-enquete.model';

@Injectable({ providedIn: 'root' })
export class RapportEnqueteService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}`;
    }

    getRapport(investigationId: string): Observable<RapportEnqueteResponse | null> {
        return this.http.get<RapportEnqueteResponse>(`${this.url(investigationId)}/rapport`)
            .pipe(catchError(() => of(null)));
    }

    saveRapport(investigationId: string, req: RapportEnqueteRequest): Observable<RapportEnqueteResponse> {
        return this.http.put<RapportEnqueteResponse>(`${this.url(investigationId)}/rapport`, req);
    }

    getNote(investigationId: string): Observable<NoteRecommandationsResponse | null> {
        return this.http.get<NoteRecommandationsResponse>(`${this.url(investigationId)}/note-recommandations`)
            .pipe(catchError(() => of(null)));
    }

    saveNote(investigationId: string, req: NoteRecommandationsRequest): Observable<NoteRecommandationsResponse> {
        return this.http.put<NoteRecommandationsResponse>(`${this.url(investigationId)}/note-recommandations`, req);
    }
}
