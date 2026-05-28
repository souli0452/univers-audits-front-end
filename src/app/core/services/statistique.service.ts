import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface MonthlyCount {
    month:          string;
    count:          number;
    investigations: number;
}

export interface StatistiqueResponse {
    period:      string;
    generatedAt: string;

    totalDossiers:   number;
    countByStatus:   Record<string, number>;
    monthlyTrend:    MonthlyCount[];

    countBySubmissionMode: Record<string, number>;

    inadmissibleCount:              number;
    investigatedCount:              number;
    transferredCount:               number;
    closedWithoutInvestigationCount:number;

    countByType: Record<string, number>;

    totalEstimatedLoss?: number;

    inProgressInvestigations: number;
    reportsProduced:          number;
    referredToJustice:        number;

    unfoundedWithoutInvestigation: number;
    unfoundedAfterInvestigation:   number;
    admissibilityRate:             number;

    avgRegistrationDelayDays?:    number;  // objectif : 7j
    avgOpportunityStudyDays?:     number;  // objectif : 7j
    avgAcknowledgmentDays?:       number;  // objectif : 3j
    avgInvestigationDurationDays?:number;  // objectif : 90j
    avgDeiApprovalDays?:          number;  // objectif : 15j
    avgCgeApprovalDays?:          number;  // objectif : 20j

    overdueAcknowledgments: number;
    overdueInvestigations:  number;
    overdueComplements:     number;
}

export interface PublicStats {
    totalDossiers:    number;
    dossiersNouveaux: number;
    dossiersEnCours:  number;
    dossiersTraites:  number;
    confidentiel:     string;
    delaiJours:       number;
}

@Injectable({ providedIn: 'root' })
export class StatistiqueService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/stats`;

    getPublicStats(): Observable<PublicStats> {
        return this.http.get<PublicStats>(`${this.baseUrl}/public`);
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