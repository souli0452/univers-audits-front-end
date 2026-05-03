import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
    id: string;
    type: string;
    subject: string;
    content: string;
    createdAt: string;
    status: string;
    dossierId?: string;
    dossierNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/notifications`;

    
    unreadCount = signal(0);

    loadUnread(): void {
        const params = new HttpParams()
            .set('unreadOnly', 'true')
            .set('size', '50');

        this.http.get<any>(`${this.baseUrl}/my`, { params }).subscribe({
            next: page => this.unreadCount.set(page.totalElements || 0),
            error: ()   => {}
        });
    }

    getMyNotifications(page = 0, size = 20) {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size);

        return this.http.get<any>(`${this.baseUrl}/my`, { params });
    }

    markAsRead(id: string) {
        return this.http.patch(`${this.baseUrl}/${id}/read`, {});
    }

    markAllAsRead() {
        return this.http.patch(`${this.baseUrl}/read-all`, {});
    }
}