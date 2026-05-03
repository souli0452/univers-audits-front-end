import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UpdateProfileRequest {
    firstName: string;
    lastName:  string;
    email:     string;
}

export interface ChangePasswordRequest {
    newPassword:     string;
    confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/profile`;

    updateProfile(req: UpdateProfileRequest): Observable<any> {
        return this.http.put(this.baseUrl, req);
    }

    changePassword(req: ChangePasswordRequest): Observable<any> {
        return this.http.put(`${this.baseUrl}/password`, req);
    }
}