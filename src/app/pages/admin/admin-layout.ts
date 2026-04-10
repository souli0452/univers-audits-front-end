import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="admin-layout">
            <router-outlet></router-outlet>
        </div>
    `,
    styles: [`
        .admin-layout {
            min-height: 100vh;
        }
    `]
})
export class AdminLayout {}
