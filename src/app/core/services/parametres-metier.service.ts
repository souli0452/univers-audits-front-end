import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ParametreDelai, ParametreDelaiRequest,
    JourFerie, JourFerieRequest,
    IndiceFraude, IndiceFraudeRequest,
    TypeInfraction, TypeInfractionRequest,
    PointChecklistDossierTravail, PointChecklistDossierTravailRequest
} from '../models/parametres-metier.model';

export type {
    ParametreDelai, ParametreDelaiRequest,
    JourFerie, JourFerieRequest,
    IndiceFraude, IndiceFraudeRequest,
    TypeInfraction, TypeInfractionRequest,
    PointChecklistDossierTravail, PointChecklistDossierTravailRequest
} from '../models/parametres-metier.model';

@Injectable({ providedIn: 'root' })
export class ParametreDelaiService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/parametres-delai`;

    findAll(): Observable<ParametreDelai[]> {
        return this.http.get<ParametreDelai[]>(`${this.url}/admin`);
    }

    update(code: string, req: ParametreDelaiRequest): Observable<ParametreDelai> {
        return this.http.put<ParametreDelai>(`${this.url}/${code}`, req);
    }
}

@Injectable({ providedIn: 'root' })
export class JourFerieService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/jours-feries`;

    findAll(): Observable<JourFerie[]> {
        return this.http.get<JourFerie[]>(`${this.url}/admin`);
    }

    create(req: JourFerieRequest): Observable<JourFerie> {
        return this.http.post<JourFerie>(this.url, req);
    }

    update(id: string, req: JourFerieRequest): Observable<JourFerie> {
        return this.http.put<JourFerie>(`${this.url}/${id}`, req);
    }
}

@Injectable({ providedIn: 'root' })
export class IndiceFraudeService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/indices-fraude`;

    findAll(): Observable<IndiceFraude[]> {
        return this.http.get<IndiceFraude[]>(`${this.url}/admin`);
    }

    create(req: IndiceFraudeRequest): Observable<IndiceFraude> {
        return this.http.post<IndiceFraude>(this.url, req);
    }

    update(code: string, req: IndiceFraudeRequest): Observable<IndiceFraude> {
        return this.http.put<IndiceFraude>(`${this.url}/${code}`, req);
    }
}

@Injectable({ providedIn: 'root' })
export class TypeInfractionService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/types-infraction`;

    findAllActifs(): Observable<TypeInfraction[]> {
        return this.http.get<TypeInfraction[]>(this.url);
    }

    findAll(): Observable<TypeInfraction[]> {
        return this.http.get<TypeInfraction[]>(`${this.url}/admin`);
    }

    create(req: TypeInfractionRequest): Observable<TypeInfraction> {
        return this.http.post<TypeInfraction>(this.url, req);
    }

    update(code: string, req: TypeInfractionRequest): Observable<TypeInfraction> {
        return this.http.put<TypeInfraction>(`${this.url}/${code}`, req);
    }
}

@Injectable({ providedIn: 'root' })
export class PointChecklistDossierTravailAdminService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/points-checklist-dossier-travail`;

    findAll(): Observable<PointChecklistDossierTravail[]> {
        return this.http.get<PointChecklistDossierTravail[]>(`${this.url}/admin`);
    }

    create(req: PointChecklistDossierTravailRequest): Observable<PointChecklistDossierTravail> {
        return this.http.post<PointChecklistDossierTravail>(this.url, req);
    }

    update(code: string, req: PointChecklistDossierTravailRequest): Observable<PointChecklistDossierTravail> {
        return this.http.put<PointChecklistDossierTravail>(`${this.url}/${code}`, req);
    }
}
