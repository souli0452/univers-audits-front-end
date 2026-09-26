import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationItem, NotificationPage } from '../models/notification.model';

export type { NotificationItem, NotificationPage } from '../models/notification.model';

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

    getPending(page = 0, size = 20): Observable<NotificationPage> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<NotificationPage>(`${this.baseUrl}/pending`, { params });
    }

    sendNow(id: string): Observable<NotificationItem> {
        return this.http.patch<NotificationItem>(`${this.baseUrl}/${id}/send`, {});
    }

    cancel(id: string, reason: string): Observable<NotificationItem> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<NotificationItem>(`${this.baseUrl}/${id}/cancel`, {}, { params });
    }

    retry(id: string): Observable<NotificationItem> {
        return this.http.patch<NotificationItem>(`${this.baseUrl}/${id}/retry`, {});
    }
}