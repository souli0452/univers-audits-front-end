import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromLocalStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() {}

    /**
     * Simulated login - in production, call your backend API
     */
    login(email: string, password: string, role: 'admin' | 'user' = 'user'): Observable<User> {
        return new Observable((observer) => {
            // Simulate API call delay
            setTimeout(() => {
                const user: User = {
                    id: Math.random().toString(36).substr(2, 9),
                    email,
                    name: email.split('@')[0],
                    role
                };
                this.setCurrentUser(user);
                observer.next(user);
                observer.complete();
            }, 500);
        });
    }

    /**
     * Logout the current user
     */
    logout(): void {
        this.currentUserSubject.next(null);
        localStorage.removeItem('currentUser');
    }

    /**
     * Get the current user
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.currentUserSubject.value !== null;
    }

    /**
     * Check if current user is admin
     */
    isAdmin(): boolean {
        return this.currentUserSubject.value?.role === 'admin';
    }

    /**
     * Set the current user
     */
    private setCurrentUser(user: User): void {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    /**
     * Get user from localStorage
     */
    private getUserFromLocalStorage(): User | null {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
}
