import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog, LoginLog, AuditPageResponse, AuditStats } from '../models/audit.model';

export type { AuditLog, LoginLog, AuditStats } from '../models/audit.model';
 
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/audit`;
 
  getStats(): Observable<AuditStats> {
    return this.http.get<AuditStats>(`${this.baseUrl}/stats`);
  }
 
  getLogs(filters: {
    agentName?: string;   
    action?:    string;
    dateFrom?:  string;
    dateTo?:    string;
    page?:      number;
    size?:      number;
  }): Observable<AuditPageResponse<AuditLog>> {
    let params = new HttpParams();
    if (filters.agentName) params = params.set('agentName', filters.agentName);
    if (filters.action)    params = params.set('action',    filters.action);
    if (filters.dateFrom)  params = params.set('dateFrom',  filters.dateFrom);
    if (filters.dateTo)    params = params.set('dateTo',    filters.dateTo);
    params = params.set('page', filters.page ?? 0);
    params = params.set('size', filters.size ?? 20);
    return this.http.get<AuditPageResponse<AuditLog>>(this.baseUrl, { params });
  }
 
  getLogins(agentName?: string, page = 0, size = 20): Observable<AuditPageResponse<LoginLog>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (agentName) params = params.set('agentName', agentName);
    return this.http.get<AuditPageResponse<LoginLog>>(`${this.baseUrl}/logins`, { params });
  }
}
