import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/common.model';
import { RegistreAuditionEntryResponse } from '../models/registre-auditions.model';

export type { RegistreAuditionEntryResponse, IntervieweeType, AuditionStatus, PvStatus } from '../models/registre-auditions.model';

@Injectable({ providedIn: 'root' })
export class RegistreAuditionsService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/registre-auditions`;

    findAll(page = 0, size = 20): Observable<PageResponse<RegistreAuditionEntryResponse>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<RegistreAuditionEntryResponse>>(this.baseUrl, { params });
    }
}
