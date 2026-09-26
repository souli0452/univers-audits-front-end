import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/common.model';
import {
    FicheRetexResponse, FicheRetexRequest,
    PublierLeconRequest, LeconAPartagerResponse
} from '../models/fiche-retex.model';

export type {
    FicheRetexResponse, FicheRetexRequest,
    PublierLeconRequest, LeconAPartagerResponse
} from '../models/fiche-retex.model';

@Injectable({ providedIn: 'root' })
export class FicheRetexService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/fiche-retex`;
    }

    getFicheRetex(investigationId: string): Observable<FicheRetexResponse | null> {
        return this.http.get<FicheRetexResponse>(this.url(investigationId))
            .pipe(catchError(() => of(null)));
    }

    createFicheRetex(investigationId: string, req: FicheRetexRequest): Observable<FicheRetexResponse> {
        return this.http.post<FicheRetexResponse>(this.url(investigationId), req);
    }

    publierLecon(investigationId: string, req: PublierLeconRequest): Observable<LeconAPartagerResponse> {
        return this.http.post<LeconAPartagerResponse>(`${this.url(investigationId)}/publier-lecon`, req);
    }
}

@Injectable({ providedIn: 'root' })
export class LeconsAPartagerService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/lecons-a-partager`;

    lister(page = 0, size = 20): Observable<PageResponse<LeconAPartagerResponse>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<LeconAPartagerResponse>>(this.baseUrl, { params });
    }
}
