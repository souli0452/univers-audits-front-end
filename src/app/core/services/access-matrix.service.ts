import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Nombre de points d'entrée du module qu'un rôle peut consulter / sur lesquels il peut agir. */
export interface CelluleAcces { consulter: number; agir: number; }

export interface ModuleAcces {
    module: string;
    libelle: string;
    totalConsulter: number;
    totalAgir: number;
    parRole: Record<string, CelluleAcces>;
}

export interface RoleAcces { code: string; agents: number; }

export interface MatriceAcces { roles: RoleAcces[]; modules: ModuleAcces[]; }

@Injectable({ providedIn: 'root' })
export class AccessMatrixService {
    private readonly http = inject(HttpClient);

    get(): Observable<MatriceAcces> {
        return this.http.get<MatriceAcces>(`${environment.apiUrl}/admin/access-matrix`);
    }
}
