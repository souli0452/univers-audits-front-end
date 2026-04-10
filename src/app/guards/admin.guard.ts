import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(): boolean {
        if (this.authService.isAdmin()) {
            return true;
        }

        // Redirect to login if not authenticated
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/auth/login']);
        } else {
            // Redirect to dashboard if user is not admin
            this.router.navigate(['/']);
        }

        return false;
    }
}
