import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
    RequeteParquetResponse,
    RequeteParquetRequest,
    ConstitutionPartieCivileResponse,
    ConstitutionPartieCivileRequest,
    SuiviProcedurePenaleListResponse,
    SuiviProcedurePenaleRequest
} from '../models/suites-judiciaires.model';

export type {
    RequeteParquetResponse,
    RequeteParquetRequest,
    ConstitutionPartieCivileResponse,
    ConstitutionPartieCivileRequest,
    SuiviProcedurePenaleResponse,
    SuiviProcedurePenaleListResponse,
    SuiviProcedurePenaleRequest
} from '../models/suites-judiciaires.model';

@Injectable({ providedIn: 'root' })
export class RequeteParquetService {
    private http = inject(HttpClient);
    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/requete-parquet`;
    }

    get(investigationId: string): Observable<RequeteParquetResponse | null> {
        return this.http.get<RequeteParquetResponse>(this.url(investigationId))
            .pipe(catchError(() => of(null)));
    }

    enregistrer(investigationId: string, req: RequeteParquetRequest): Observable<RequeteParquetResponse> {
        return this.http.put<RequeteParquetResponse>(this.url(investigationId), req);
    }
}

@Injectable({ providedIn: 'root' })
export class ConstitutionPartieCivileService {
    private http = inject(HttpClient);
    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/constitution-partie-civile`;
    }

    get(investigationId: string): Observable<ConstitutionPartieCivileResponse | null> {
        return this.http.get<ConstitutionPartieCivileResponse>(this.url(investigationId))
            .pipe(catchError(() => of(null)));
    }

    creer(investigationId: string, req: ConstitutionPartieCivileRequest): Observable<ConstitutionPartieCivileResponse> {
        return this.http.post<ConstitutionPartieCivileResponse>(this.url(investigationId), req);
    }
}

@Injectable({ providedIn: 'root' })
export class SuiviProcedurePenaleService {
    private http = inject(HttpClient);
    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/suivi-procedure-penale`;
    }

    lister(investigationId: string): Observable<SuiviProcedurePenaleListResponse> {
        return this.http.get<SuiviProcedurePenaleListResponse>(this.url(investigationId));
    }

    ajouter(investigationId: string, req: SuiviProcedurePenaleRequest): Observable<SuiviProcedurePenaleListResponse> {
        return this.http.post<SuiviProcedurePenaleListResponse>(this.url(investigationId), req);
    }
}
