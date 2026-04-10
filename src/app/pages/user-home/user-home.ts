import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService, User } from '../../services/auth.service';

@Component({
    selector: 'app-user-home',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
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
                <div class="hero-overlay"></div>
            </div>

            <div class="hero-content">
                <img src="assets/aselc-logo.png" alt="ASCE-LC" class="hero-logo" />
                <h1 class="hero-title">Plateforme des plaintes et dénonciations seulement</h1>
                <p class="hero-subtitle">Dénoncer ou suivre vos dénonciations en toute sécurité et confidentialité</p>

                <div class="hero-buttons">
                    <button class="btn btn-primary">
                        <i class="pi pi-exclamation-triangle"></i>
                        FAIRE UNE DÉNONCIATION
                    </button>
                    <button class="btn btn-success">
                        <i class="pi pi-check-circle"></i>
                        SUIVRE MES DÉNONCIATIONS
                    </button>
                </div>
            </div>
        </section>

        <!-- User Stats Section -->
        <section class="user-stats">
            <div class="stats-container">
                <h2 class="section-title">Mon Tableau de Bord</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <i class="pi pi-exclamation-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Mes Dénonciations</h3>
                            <p class="stat-number">3</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <i class="pi pi-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3>En cours</h3>
                            <p class="stat-number">1</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <i class="pi pi-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Traitées</h3>
                            <p class="stat-number">2</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                            <i class="pi pi-calendar"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Dernière action</h3>
                            <p class="stat-date">15 Mars 2024</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- My Denunciations -->
        <section class="my-denunciations">
            <div class="stats-container">
                <h2 class="section-title">Mes Dénonciations Récentes</h2>
                
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
                            <tr *ngFor="let item of myDenunciations">
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
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Quick Actions -->
        <section class="quick-actions">
            <div class="stats-container">
                <h2 class="section-title">Actions Rapides</h2>
                
                <div class="actions-grid">
                    <div class="action-item" routerLink="/profile">
                        <div class="action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <i class="pi pi-user"></i>
                        </div>
                        <h3>Mon Profil</h3>
                        <p>Gérez vos informations personnelles</p>
                    </div>

                    <div class="action-item">
                        <div class="action-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <i class="pi pi-file"></i>
                        </div>
                        <h3>Nouvelle Dénonciation</h3>
                        <p>Dénocer un acte de corruption</p>
                    </div>

                    <div class="action-item">
                        <div class="action-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <i class="pi pi-question-circle"></i>
                        </div>
                        <h3>Aide & FAQ</h3>
                        <p>Trouvez les réponses à vos questions</p>
                    </div>

                    <div class="action-item">
                        <div class="action-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                            <i class="pi pi-envelope"></i>
                        </div>
                        <h3>Contacter</h3>
                        <p>Écrivez-nous un message</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="user-footer">
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
            height: 400px;
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
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            line-height: 1.2;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .hero-logo {
            width: 100px;
            margin: 0 auto 1rem;
            display: block;
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.25);
            background: rgba(255, 255, 255, 0.08);
            padding: 0.5rem;
        }

        .hero-subtitle {
            font-size: 1.1rem;
            margin-bottom: 2rem;
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
            padding: 1rem 2rem;
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

        /* Section Common */
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            color: #1a5f3d;
            margin-bottom: 2.5rem;
            text-align: center;
        }

        .stats-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Stats Section */
        .user-stats {
            padding: 4rem 2rem;
            background: white;
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

        .stat-date {
            color: #1a5f3d;
            font-size: 1rem;
            font-weight: 600;
        }

        /* Denunciations */
        .my-denunciations {
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
            padding: 0.5rem;
        }

        .action-btn:hover {
            color: #2d7a4f;
            transform: scale(1.2);
        }

        /* Quick Actions */
        .quick-actions {
            padding: 4rem 2rem;
            background: white;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }

        .action-item {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
            border-top: 4px solid #1a5f3d;
        }

        .action-item:hover {
            transform: translateY(-8px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
            width: 80px;
            height: 80px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2rem;
            margin: 0 auto 1rem;
        }

        .action-item h3 {
            color: #1a5f3d;
            font-size: 1.2rem;
            margin-bottom: 0.75rem;
        }

        .action-item p {
            color: #666;
            line-height: 1.6;
            font-size: 0.95rem;
        }

        /* Footer */
        .user-footer {
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
                font-size: 1.5rem;
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

            .actions-grid {
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
export class UserHome implements OnInit {
    currentUser: User | null = null;

    myDenunciations = [
        { id: 'DN101', date: '2024-04-05', category: 'Corruption', status: 'Pending' },
        { id: 'DN102', date: '2024-03-28', category: 'Malveillance', status: 'Approved' },
        { id: 'DN103', date: '2024-03-15', category: 'Fraude', status: 'Approved' }
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
        this.router.navigate(['/']);
    }
}
