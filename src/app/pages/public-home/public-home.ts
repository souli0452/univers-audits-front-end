import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-public-home',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
    template: `
        <!-- Navigation Bar -->
        <nav class="navbar">
            <div class="navbar-container">
                <!-- Logo -->
                <div class="logo-section">
                    <svg viewBox="0 0 100 100" class="logo-icon">
                        <circle cx="50" cy="50" r="48" fill="#4caf50" stroke="#66bb6a" stroke-width="2"/>
                        <path d="M35 35 L65 35 L70 50 L65 65 L35 65 L30 50 Z" fill="#ffffff"/>
                        <text x="50" y="55" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#4caf50" text-anchor="middle">ASCE-LC</text>
                    </svg>
                    <h1 class="org-name">ASCE-LC</h1>
                </div>

                <!-- Navigation Links -->
                <div class="nav-links">
                    <a href="#" class="nav-link active">Accueil</a>
                    <a href="#" class="nav-link">A propos</a>
                    <a href="#" class="nav-link">Dénoncer</a>
                </div>

                <!-- Auth Buttons -->
                <div class="auth-buttons">
                    <button class="btn-login" routerLink="/auth/login">Connexion</button>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="hero-section">
            <div class="hero-carousel-wrapper">
                <div class="hero-carousel-slide" *ngFor="let slide of carouselSlides; let i = index"
                     [style.opacity]="currentSlide === i ? 1 : 0">
                    <div class="hero-carousel-image" [style.backgroundImage]="'url(' + slide.image + ')'"></div>
                </div>
            </div>

            <div class="hero-overlay"></div>

            <!-- Logo ASCE-LC -->
            <div class="hero-logo-container">
                <svg viewBox="0 0 100 100" class="hero-logo-icon">
                    <circle cx="50" cy="50" r="48" fill="#4caf50" stroke="#66bb6a" stroke-width="2"/>
                    <path d="M35 35 L65 35 L70 50 L65 65 L35 65 L30 50 Z" fill="#ffffff"/>
                    <text x="50" y="55" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#4caf50" text-anchor="middle">ASCE-LC</text>
                </svg>
            </div>

            <div class="hero-content">
                <h2 class="hero-slogan">{{ carouselSlides[currentSlide].title }}</h2>
                <p class="hero-description">{{ carouselSlides[currentSlide].description }}</p>
                <div class="hero-buttons">
                    <button class="btn btn-primary" routerLink="/auth/login">
                        <i class="pi pi-exclamation-triangle"></i>
                        DÉNONCER
                    </button>
                    <button class="btn btn-success" routerLink="/auth/login">
                        <i class="pi pi-check-circle"></i>
                        SUIVRE MA DÉNONCIATION
                    </button>
                </div>
            </div>

            <!-- Carousel Controls -->
            <button class="hero-carousel-btn hero-carousel-prev" (click)="prevSlide()">
                <i class="pi pi-chevron-left"></i>
            </button>
            <button class="hero-carousel-btn hero-carousel-next" (click)="nextSlide()">
                <i class="pi pi-chevron-right"></i>
            </button>

            <!-- Carousel Indicators -->
            <div class="hero-carousel-indicators">
                <button *ngFor="let slide of carouselSlides; let i = index"
                        class="hero-indicator"
                        [class.active]="currentSlide === i"
                        (click)="goToSlide(i)">
                </button>
            </div>
        </section>

        <!-- About Section -->
        <section class="about-section">
            <div class="about-container">
                <h2 class="section-title">Qui sommes-nous ?</h2>
                <p class="section-description">
                    ASCE-LC est une cellule d'analyse et de traitement des plaintes et dénonciations des actes de corruption et de malveillance. 
                    Notre mission est de combattre la corruption par la collecte, le traitement et l'analyse des plaintes en toute confidentialité.
                </p>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <i class="pi pi-shield"></i>
                        </div>
                        <h3>Confidentiabilité</h3>
                        <p>Vos informations sont protégées et traitées de manière confidentielle</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                            <i class="pi pi-check"></i>
                        </div>
                        <h3>Efficacité</h3>
                        <p>Un traitement rapide et efficace de vos dénonciations</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                            <i class="pi pi-eye"></i>
                        </div>
                        <h3>Transparence</h3>
                        <p>Suivez l'état d'avancement de votre dénonciation</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                            <i class="pi pi-lock"></i>
                        </div>
                        <h3>Sécurité</h3>
                        <p>Protection contre les représailles et menaces</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Process Section -->
        <section class="process-section">
            <div class="process-container">
                <h2 class="section-title">Comment ça fonctionne ?</h2>

                <div class="process-steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <h3>Déposer une plainte</h3>
                        <p>Remplissez notre formulaire de dénonciation avec les détails</p>
                    </div>

                    <div class="step-arrow">
                        <i class="pi pi-arrow-right"></i>
                    </div>

                    <div class="step">
                        <div class="step-number">2</div>
                        <h3>Suivi en temps réel</h3>
                        <p>Obtenez un numéro de suivi pour consulter l'état</p>
                    </div>

                    <div class="step-arrow">
                        <i class="pi pi-arrow-right"></i>
                    </div>

                    <div class="step">
                        <div class="step-number">3</div>
                        <h3>Traitement</h3>
                        <p>Notre équipe analyse et traite votre plainte</p>
                    </div>

                    <div class="step-arrow">
                        <i class="pi pi-arrow-right"></i>
                    </div>

                    <div class="step">
                        <div class="step-number">4</div>
                        <h3>Résolution</h3>
                        <p>Notification du résultat et des actions prises</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="public-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>À propos</h4>
                    <ul>
                        <li><a href="#">Qui sommes-nous</a></li>
                        <li><a href="#">Notre mission</a></li>
                        <li><a href="#">Nos valeurs</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Ressources</h4>
                    <ul>
                        <li><a href="#">FAQ</a></li>
                        <li><a href="#">Contact</a></li>
                        <li><a href="#">Aide</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Légal</h4>
                    <ul>
                        <li><a href="#">Politique de confidentialité</a></li>
                        <li><a href="#">Conditions d'utilisation</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>ASCE-LC</h4>
                    <p>&copy; 2024 Tous droits réservés</p>
                </div>
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
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
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

        .auth-buttons {
            display: flex;
            gap: 1rem;
        }

        .btn-login {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.6rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .btn-login:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: white;
        }

        /* Hero Section */
        .hero-section {
            position: relative;
            height: 600px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            overflow: hidden;
        }

        .hero-carousel-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
        }

        .hero-carousel-slide {
            position: absolute;
            width: 100%;
            height: 100%;
            transition: opacity 0.8s ease-in-out;
            opacity: 0;
            pointer-events: none;
        }

        .hero-carousel-slide[style*="opacity: 1"] {
            opacity: 1;
            pointer-events: auto;
        }

        .hero-carousel-image {
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            transition: transform 0.8s ease;
        }

        .hero-carousel-slide[style*="opacity: 1"] .hero-carousel-image {
            animation: zoomIn 0.8s ease forwards;
        }

        @keyframes zoomIn {
            from {
                transform: scale(0.95);
            }
            to {
                transform: scale(1);
            }
        }

        .hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.5) 0%, rgba(102, 187, 106, 0.5) 100%);
            z-index: 2;
        }

        /* Hero Logo */
        .hero-logo-container {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            width: 140px;
            height: 140px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.25);
            animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-40px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }

        .hero-logo-icon {
            width: 100px;
            height: 100px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .hero-content {
            position: relative;
            z-index: 3;
            text-align: center;
            color: white;
            padding: 0 2rem 3rem;
            max-width: 900px;
            margin-top: auto;
        }

        .hero-slogan {
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            line-height: 1.3;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
        }

        .hero-description {
            font-size: 1.1rem;
            line-height: 1.6;
            opacity: 0.95;
            font-weight: 300;
            margin-bottom: 2rem;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
        }

        .hero-buttons {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        /* Hero Carousel Controls */
        .hero-carousel-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            transition: all 0.3s ease;
            z-index: 4;
        }

        .hero-carousel-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: white;
            transform: translateY(-50%) scale(1.1);
        }

        .hero-carousel-prev {
            left: 20px;
        }

        .hero-carousel-next {
            right: 20px;
        }

        /* Hero Carousel Indicators */
        .hero-carousel-indicators {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 4;
        }

        .hero-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.6);
            background: transparent;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .hero-indicator.active {
            background: white;
            width: 32px;
            border-radius: 6px;
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

        /* Section Common Styles */
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            color: #4caf50;
            margin-bottom: 1rem;
            text-align: center;
        }

        .section-description {
            font-size: 1.1rem;
            color: #666;
            text-align: center;
            max-width: 700px;
            margin: 0 auto 3rem;
            line-height: 1.8;
        }

        /* About Section */
        .about-section {
            padding: 5rem 2rem;
            background: white;
        }

        .about-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border-top: 4px solid #4caf50;
        }

        .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
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

        .feature-card h3 {
            color: #4caf50;
            font-size: 1.2rem;
            margin-bottom: 0.75rem;
        }

        .feature-card p {
            color: #666;
            line-height: 1.6;
        }

        /* Process Section */
        .process-section {
            padding: 5rem 2rem;
            background: #f9f9f9;
        }

        .process-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .process-steps {
            display: flex;
            justify-content: space-around;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin-top: 3rem;
        }

        .step {
            flex: 1;
            min-width: 200px;
            text-align: center;
        }

        .step-number {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            font-weight: 700;
            margin: 0 auto 1rem;
        }

        .step h3 {
            color: #4caf50;
            margin-bottom: 0.5rem;
        }

        .step p {
            color: #666;
            line-height: 1.6;
        }

        .step-arrow {
            color: #4caf50;
            font-size: 2rem;
            flex: 0.5;
            display: flex;
            justify-content: center;
        }

        /* CTA Section */
        .cta-section {
            padding: 4rem 2rem;
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            text-align: center;
            color: white;
        }

        .cta-content {
            max-width: 600px;
            margin: 0 auto;
        }

        .cta-section h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        .cta-section p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.95;
        }

        /* Footer */
        .public-footer {
            background: #1a1a1a;
            color: white;
            padding: 3rem 2rem 1rem;
        }

        .footer-content {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 2rem;
        }

        .footer-section h4 {
            color: #4caf50;
            margin-bottom: 1rem;
            font-size: 1rem;
        }

        .footer-section ul {
            list-style: none;
        }

        .footer-section ul li {
            margin-bottom: 0.5rem;
        }

        .footer-section a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .footer-section a:hover {
            color: #4caf50;
        }

        .footer-section p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }

            .hero-section {
                height: 400px;
            }

            .hero-carousel-btn {
                width: 40px;
                height: 40px;
                font-size: 1.2rem;
            }

            .hero-carousel-prev {
                left: 10px;
            }

            .hero-carousel-next {
                right: 10px;
            }

            .hero-logo-container {
                width: 100px;
                height: 100px;
                top: 15px;
            }

            .hero-logo-icon {
                width: 70px;
                height: 70px;
            }

            .hero-content {
                padding: 0 1rem 2rem;
            }

            .hero-buttons {
                flex-direction: column;
            }

            .btn {
                width: 100%;
                justify-content: center;
            }

            .process-steps {
                flex-direction: column;
            }

            .step-arrow {
                transform: rotate(90deg);
            }

            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class PublicHome implements OnInit, OnDestroy {
    currentSlide = 0;
    autoSlideInterval: any;

    carouselSlides = [
        {
            image: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?w=1600&h=700&fit=crop&q=80',
            title: 'Plainte et dénonciation seulement',
            description: 'Signalez les actes de corruption de manière sécurisée. Votre identité est protégée et vos informations restent confidentielles.'
        },
        {
            image: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?w=1600&h=700&fit=crop&q=80',
            title: 'Transparence et suivi',
            description: 'Suivi en temps réel de votre dénonciation. Recevez des mises à jour régulières sur l\'avancement du traitement de votre plainte.'
        },
        {
            image: 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?w=1600&h=700&fit=crop&q=80',
            title: 'Protection et sécurité',
            description: 'Bénéficiez d\'une protection juridique complète. Aucune représaille ni intimidation n\'est tolérée.'
        },
        {
            image: 'https://images.pexels.com/photos/3708995/pexels-photo-3708995.jpeg?w=1600&h=700&fit=crop&q=80',
            title: 'Justice pour tous',
            description: 'Ensemble, construisons une société sans corruption. Chaque dénonciation compte et contribue au changement.'
        }
    ];

    ngOnInit() {
        this.startAutoSlide();
    }

    ngOnDestroy() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.carouselSlides.length;
        this.resetAutoSlide();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.carouselSlides.length) % this.carouselSlides.length;
        this.resetAutoSlide();
    }

    goToSlide(index: number) {
        this.currentSlide = index;
        this.resetAutoSlide();
    }

    startAutoSlide() {
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }

    resetAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
        }
        this.startAutoSlide();
    }
}

