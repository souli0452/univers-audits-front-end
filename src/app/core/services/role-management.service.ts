import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermissionDto, RoleDto, CreateRoleRequest, UpdateRoleRequest } from '../models/role.model';

export type { PermissionDto, RoleDto, CreateRoleRequest, UpdateRoleRequest } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/roles`;

  listAll():                               Observable<RoleDto[]>       { return this.http.get<RoleDto[]>(this.baseUrl); }
  getOne(roleKey: string):                 Observable<RoleDto>         { return this.http.get<RoleDto>(`${this.baseUrl}/${roleKey}`); }
  listPermissions():                       Observable<PermissionDto[]> { return this.http.get<PermissionDto[]>(`${this.baseUrl}/permissions`); }
  create(r: CreateRoleRequest):            Observable<RoleDto>         { return this.http.post<RoleDto>(this.baseUrl, r); }
  update(k: string, r: UpdateRoleRequest): Observable<RoleDto>         { return this.http.put<RoleDto>(`${this.baseUrl}/${k}`, r); }
  delete(roleKey: string):                 Observable<void>            { return this.http.delete<void>(`${this.baseUrl}/${roleKey}`); }
}