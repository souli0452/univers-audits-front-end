import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AgentResponse {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    grade?: string;
    actif: boolean;
    keycloakId?: string;
    createdAt?: string;
    departementLabel?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface CreateAgentRequest {
    matricule: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    grade?: string;
    keycloakRoles?: string[];
}

export interface UpdateAgentRequest {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    grade?: string;
    keycloakRoles?: string[];
}

@Injectable({ providedIn: 'root' })
export class AgentService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/agents`;  

    findAll(page = 0, size = 20, search?: string): Observable<PageResponse<AgentResponse>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);
        if (search) params = params.set('search', search);
        return this.http.get<PageResponse<AgentResponse>>(this.baseUrl, { params });
    }

    findById(id: string): Observable<AgentResponse> {
        return this.http.get<AgentResponse>(`${this.baseUrl}/${id}`);
    }

    create(req: CreateAgentRequest): Observable<AgentResponse> {
        return this.http.post<AgentResponse>(this.baseUrl, req);
    }

    update(id: string, req: UpdateAgentRequest): Observable<AgentResponse> {
        return this.http.put<AgentResponse>(`${this.baseUrl}/${id}`, req);
    }

    activate(id: string): Observable<AgentResponse> {
        return this.http.patch<AgentResponse>(`${this.baseUrl}/${id}/activate`, {});
    }

    deactivate(id: string): Observable<AgentResponse> {
        return this.http.patch<AgentResponse>(`${this.baseUrl}/${id}/deactivate`, {});
    }

    getAvailableRoles(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/keycloak-roles`);
    }

    getAgentRoles(id: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/${id}/keycloak-roles`);
    }

    updateRoles(id: string, roles: string[]): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/keycloak-roles`, roles);
    }
}