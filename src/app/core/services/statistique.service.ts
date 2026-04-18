import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatistiqueResponse } from '../models/dossier.model';

@Injectable({ providedIn: 'root' })
export class StatistiqueService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/stats`;

    getDashboard(
        start: string,
        end: string
    ): Observable<StatistiqueResponse> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end);
        return this.http.get<StatistiqueResponse>(
            `${this.baseUrl}/dashboard`, { params }
        );
    }

    getQuarterlyStats(
        year: number,
        quarter: number
    ): Observable<StatistiqueResponse> {
        const params = new HttpParams()
            .set('year', year)
            .set('quarter', quarter);
        return this.http.get<StatistiqueResponse>(
            `${this.baseUrl}/quarterly`, { params }
        );
    }

    getAnnualStats(year: number): Observable<StatistiqueResponse> {
        const params = new HttpParams().set('year', year);
        return this.http.get<StatistiqueResponse>(
            `${this.baseUrl}/annual`, { params }
        );
    }
}