import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
    id:             string;
    type:           string;
    subject:        string;
    content?:       string;
    createdAt:      string;
    readAt?:        string;
    status:         string;
    dossierId?:     string;
    dossierNumber?: string;
}

export interface NotificationPage {
    content:       NotificationItem[];
    totalElements: number;
    totalPages:    number;
    size:          number;
    number:        number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/notifications`;

    unreadCount = signal(0);

   
    loadUnread(): void {
        this.http.get<number>(`${this.baseUrl}/my/unread-count`)
            .subscribe({
                next: count => this.unreadCount.set(count ?? 0),
                error: ()   => {}
            });
    }

    
    getMyNotifications(page = 0, size = 20): Observable<NotificationPage> {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);
        return this.http.get<NotificationPage>(
            `${this.baseUrl}/my`, { params });
    }

    markAsRead(id: string): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {});
    }

    markAllAsRead(): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
    }
}