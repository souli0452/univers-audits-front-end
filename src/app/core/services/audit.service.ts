import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
 
export interface AuditLog {
  id:          string;
  agentId:     string;
  agentName:   string;
  agentRole:   string;
  action:      string;
  entityType:  string;
  entityId:    string;
  description: string;
  ipAddress:   string;
  status:      string;
  createdAt:   string;
}
 
export interface LoginLog {
  id:            string;
  agentId:       string;
  agentName:     string;
  success:       boolean;
  ipAddress:     string;
  failureReason: string;
  createdAt:     string;
}
 
export interface PageResponse<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages:    number;
    number:        number;
    size:          number;
  };
}
 
export interface AuditStats {
  actionsToday:     number;
  actionsWeek:      number;
  loginsSuccess30d: number;
  loginsFailed30d:  number;
  totalActions:     number;
  totalLogins:      number;
  topActions:       Record<string, number>;
  topAgents:        Record<string, number>;
}
 
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
  }): Observable<PageResponse<AuditLog>> {
    let params = new HttpParams();
    if (filters.agentName) params = params.set('agentName', filters.agentName);
    if (filters.action)    params = params.set('action',    filters.action);
    if (filters.dateFrom)  params = params.set('dateFrom',  filters.dateFrom);
    if (filters.dateTo)    params = params.set('dateTo',    filters.dateTo);
    params = params.set('page', filters.page ?? 0);
    params = params.set('size', filters.size ?? 20);
    return this.http.get<PageResponse<AuditLog>>(this.baseUrl, { params });
  }
 
  getLogins(agentName?: string, page = 0, size = 20): Observable<PageResponse<LoginLog>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (agentName) params = params.set('agentName', agentName);
    return this.http.get<PageResponse<LoginLog>>(`${this.baseUrl}/logins`, { params });
  }
}
