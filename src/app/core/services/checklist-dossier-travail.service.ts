import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChecklistDossierTravailItemResponse, ChecklistCocheRequest } from '../models/checklist-dossier-travail.model';

export type { ChecklistDossierTravailItemResponse, ChecklistCocheRequest } from '../models/checklist-dossier-travail.model';

@Injectable({ providedIn: 'root' })
export class ChecklistDossierTravailService {

    private http = inject(HttpClient);

    private url(investigationId: string): string {
        return `${environment.apiUrl}/investigations/${investigationId}/checklist`;
    }

    getChecklist(investigationId: string): Observable<ChecklistDossierTravailItemResponse[]> {
        return this.http.get<ChecklistDossierTravailItemResponse[]>(this.url(investigationId));
    }

    setCoche(investigationId: string, pointCode: string, req: ChecklistCocheRequest): Observable<ChecklistDossierTravailItemResponse> {
        return this.http.put<ChecklistDossierTravailItemResponse>(`${this.url(investigationId)}/${pointCode}`, req);
    }
}
