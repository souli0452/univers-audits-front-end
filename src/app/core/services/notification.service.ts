import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
    id: string;
    type: string;
    subject: string;
    content: string;
    createdAt: string;
    read: boolean;
    dossierId?: string;
    dossierNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/notifications`;

    // Signal pour le compteur en temps réel
    unreadCount = signal(0);

    loadUnread(): void {
        this.http.get<any>(
            `${this.baseUrl}/my?unreadOnly=true&size=50`
        ).subscribe({
            next: page => {
                this.unreadCount.set(
                    page.totalElements || 0);
            },
            error: () => {}
        });
    }

    getMyNotifications(page = 0, size = 20) {
        return this.http.get<any>(
            `${this.baseUrl}/my?page=${page}&size=${size}`
        );
    }

    markAsRead(id: string) {
        return this.http.patch(
            `${this.baseUrl}/${id}/read`, {});
    }

    markAllAsRead() {
        return this.http.patch(
            `${this.baseUrl}/read-all`, {});
    }
}