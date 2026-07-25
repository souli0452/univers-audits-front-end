import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from '../interceptors/skip-auth.context';
import { MonthlyCount, StatistiqueResponse, PublicStats } from '../models/statistique.model';

export type { MonthlyCount, StatistiqueResponse, PublicStats } from '../models/statistique.model';


@Injectable({ providedIn: 'root' })
export class StatistiqueService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/stats`;

    getPublicStats(): Observable<PublicStats> {
        return this.http.get<PublicStats>(`${this.baseUrl}/public`,
            { context: new HttpContext().set(SKIP_AUTH, true) });
    }

    getDashboard(start: string, end: string): Observable<StatistiqueResponse> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end);
        return this.http.get<StatistiqueResponse>(
            `${this.baseUrl}/dashboard`, { params }
        );
    }

    
    getQuarterlyStats(year: number, quarter: number): Observable<StatistiqueResponse> {
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