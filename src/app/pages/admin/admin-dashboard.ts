import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, InputTextModule],
    template: `
        <!-- Navigation Bar -->
        <nav class="navbar">
            <div class="navbar-container">
                <!-- Logo -->
                <div class="logo-section">
                    <svg viewBox="0 0 100 100" class="logo-icon">
                        <circle cx="50" cy="50" r="48" fill="#1a5f3d" stroke="#2d7a4f" stroke-width="2"/>
                        <path d="M35 35 L65 35 L70 50 L65 65 L35 65 L30 50 Z" fill="#ffffff"/>
                        <text x="50" y="55" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1a5f3d" text-anchor="middle">ASCE-LC</text>
                    </svg>
                    <h1 class="org-name">ASCE-LC</h1>
                </div>

                <!-- Navigation Links -->
                <div class="nav-links">
                    <a href="#" class="nav-link active">Accueil</a>
                    <a href="#" class="nav-link">À propos</a>
                    <a href="#" class="nav-link">Dénoncer</a>
                    <a href="#" class="nav-link">Suivre ma dénonciation</a>
                    <a href="#" class="nav-link">FAQ</a>
                </div>

                <!-- User Menu -->
                <div class="user-menu">
                    <span class="user-name">{{ currentUser?.name }}</span>
                    <button (click)="logout()" class="logout-btn">
                        <i class="pi pi-sign-out"></i>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="hero-section">
            <div class="hero-background">
                <video autoplay muted loop class="hero-video">
                    <source src="https://via.placeholder.com/1920x1080/1a5f3d/1a5f3d" type="video/mp4">
                </video>
                <div class="hero-overlay"></div>
            </div>

            <div class="hero-content">
                    <svg viewBox="0 0 100 100" class="hero-logo" style="width: 80px; height: 80px; margin-bottom: 20px;">
                        <circle cx="50" cy="50" r="48" fill="#1a5f3d" stroke="#2d7a4f" stroke-width="2"/>
                        <path d="M35 35 L65 35 L70 50 L65 65 L35 65 L30 50 Z" fill="#ffffff"/>
                        <text x="50" y="55" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1a5f3d" text-anchor="middle">ASCE-LC</text>
                    </svg>
                    <h1 class="hero-title">Plateforme des plaintes et dénonciations</h1>
                    <button class="cta-button">
                        <i class="pi pi-check-circle"></i>
                        SUIVRE MA DÉNONCIATION
                    </button>
                </div>
        </section>

        <!-- Admin Stats Section -->
        <section class="admin-stats">
            <div class="stats-container">
                <h2 class="section-title">Tableau de Bord Administrateur</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <i class="pi pi-exclamation-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Dénonciations</h3>
                            <p class="stat-number">24</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <i class="pi pi-times-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>En Attente</h3>
                            <p class="stat-number">8</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <i class="pi pi-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Traitées</h3>
                            <p class="stat-number">16</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                            <i class="pi pi-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Utilisateurs</h3>
                            <p class="stat-number">156</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Recent Denunciations -->
        <section class="recent-denunciations">
            <div class="stats-container">
                <h2 class="section-title">Dénonciations Récentes</h2>
                
                <div class="denunciations-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Catégorie</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let item of recentDenunciations">
                                <td>#{{ item.id }}</td>
                                <td>{{ item.date }}</td>
                                <td>{{ item.category }}</td>
                                <td>
                                    <span class="badge" [ngClass]="'badge-' + item.status.toLowerCase()">
                                        {{ item.status }}
                                    </span>
                                </td>
                                <td>
                                    <button class="action-btn" title="Voir détails">
                                        <i class="pi pi-eye"></i>
                                    </button>
                                    <button class="action-btn" title="Éditer">
                                        <i class="pi pi-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="admin-footer">
            <div class="footer-content">
                <p>&copy; 2024 ASCE-LC. Tous droits réservés.</p>
                <p>Cellule d'Analyse et de Traitement des Plaintes et Dénonciations</p>
            </div>
        </footer>
    `,
    styles: [`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :host {
            display: block;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
        }

        /* Navbar */
        .navbar {
            background: linear-gradient(135deg, #1a5f3d 0%, #2d7a4f 100%);
            padding: 0.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .navbar-container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-icon {
            width: 50px;
            height: 50px;
        }

        .org-name {
            color: white;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: 0.05em;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            flex: 1;
            margin-left: 3rem;
        }

        .nav-link {
            color: rgba(255, 255, 255, 0.9);
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.3s ease;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid transparent;
        }

        .nav-link:hover,
        .nav-link.active {
            color: white;
            border-bottom-color: #4caf50;
        }

        .user-menu {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .user-name {
            color: white;
            font-weight: 500;
        }

        .logout-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 1.25rem;
        }

        .logout-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* Hero Section */
        .hero-section {
            position: relative;
            height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .hero-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a5f3d 0%, #2d7a4f 100%);
        }

        .hero-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.4;
        }

        .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(26, 95, 61, 0.8) 0%, rgba(45, 122, 79, 0.6) 100%);
        }

        .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
            color: white;
            padding: 0 2rem;
            max-width: 900px;
        }

        .hero-title {
            font-size: 2.75rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            line-height: 1.2;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .hero-logo {
            width: 120px;
            margin: 0 auto 1.5rem;
            display: block;
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.08);
            padding: 0.6rem;
        }

        .hero-subtitle {
            font-size: 1.25rem;
            margin-bottom: 2.5rem;
            opacity: 0.95;
            font-weight: 300;
        }

        .hero-buttons {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn {
            padding: 1rem 2.5rem;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: all 0.3s ease;
            text-decoration: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-primary {
            background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4);
        }

        .btn-success {
            background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
            color: white;
        }

        .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(56, 142, 60, 0.4);
        }

        /* Stats Section */
        .admin-stats {
            padding: 4rem 2rem;
            background: white;
        }

        .stats-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .section-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1a5f3d;
            margin-bottom: 2.5rem;
            text-align: center;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            display: flex;
            align-items: center;
            gap: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border-left: 4px solid #1a5f3d;
        }

        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
        }

        .stat-content h3 {
            color: #666;
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .stat-number {
            color: #1a5f3d;
            font-size: 2rem;
            font-weight: 700;
        }

        /* Recent Denunciations */
        .recent-denunciations {
            padding: 4rem 2rem;
            background: #f9f9f9;
        }

        .denunciations-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: linear-gradient(135deg, #1a5f3d 0%, #2d7a4f 100%);
            color: white;
        }

        th {
            padding: 1.25rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.95rem;
        }

        td {
            padding: 1.25rem;
            border-bottom: 1px solid #eee;
            color: #333;
        }

        tbody tr:hover {
            background: #f5f5f5;
        }

        .badge {
            padding: 0.4rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .badge-pending {
            background: #fff3cd;
            color: #856404;
        }

        .badge-approved {
            background: #d4edda;
            color: #155724;
        }

        .badge-rejected {
            background: #f8d7da;
            color: #721c24;
        }

        .action-btn {
            background: none;
            border: none;
            color: #1a5f3d;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.2s ease;
            margin-right: 0.5rem;
            padding: 0.5rem;
        }

        .action-btn:hover {
            color: #2d7a4f;
            transform: scale(1.2);
        }

        /* Footer */
        .admin-footer {
            background: linear-gradient(135deg, #1a5f3d 0%, #2d7a4f 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .footer-content {
            max-width: 1400px;
            margin: 0 auto;
        }

        .footer-content p {
            margin: 0.5rem 0;
            opacity: 0.9;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }

            .hero-title {
                font-size: 1.75rem;
            }

            .hero-buttons {
                flex-direction: column;
            }

            .btn {
                width: 100%;
                justify-content: center;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            table {
                font-size: 0.9rem;
            }

            th, td {
                padding: 0.75rem;
            }
        }
    `]
})
export class AdminDashboard implements OnInit {
    currentUser: User | null = null;

    recentDenunciations = [
        { id: 'DN001', date: '2024-04-05', category: 'Corruption', status: 'Pending' },
        { id: 'DN002', date: '2024-04-04', category: 'Malveillance', status: 'Approved' },
        { id: 'DN003', date: '2024-04-03', category: 'Fraude', status: 'Pending' },
        { id: 'DN004', date: '2024-04-02', category: 'Abus de pouvoir', status: 'Rejected' },
        { id: 'DN005', date: '2024-04-01', category: 'Corruption', status: 'Approved' }
    ];

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.currentUser = this.authService.getCurrentUser();
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }
}
