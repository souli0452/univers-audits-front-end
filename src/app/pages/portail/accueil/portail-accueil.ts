import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { trigger, style, animate, transition } from '@angular/animations';
import { StatistiqueService, PublicStats } from '../../../core/services/statistique.service';

@Component({
    selector: 'app-portail-accueil',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(24px)' }),
                animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ],
    styles: [`
        :host {
            --red:   #EF2B2D;
            --green: #009A44;
            --gold:  #FFD700;
            --dark:  #111827;
            display: block;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }

        /* ── Topbar ── */
        .topbar {
            position: relative;
            background: linear-gradient(90deg,
                rgba(239,43,45,.95) 0%,
                rgba(239,43,45,.9) 45%,
                rgba(0,154,68,.9) 55%,
                rgba(0,154,68,.95) 100%);
            color: #fff;
            display: flex; align-items: center; justify-content: space-between;
            min-height: 60px; padding: 0 2rem; overflow: hidden;
        }
        .topbar::before {
            content: ''; position: absolute; inset: 0;
            background:
                radial-gradient(circle at 50% 50%, rgba(255,215,0,.25) 0%, transparent 55%),
                repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,.03) 50px, rgba(255,255,255,.03) 51px);
            pointer-events: none;
        }
        .topbar-left  { display:flex; align-items:center; gap:1rem; position:relative; z-index:1; }
        .topbar-text  { font-size:.875rem; font-weight:600; letter-spacing:.5px; text-shadow:0 1px 4px rgba(0,0,0,.3); }
        .topbar-right { position:relative; z-index:1; }
        .hotline {
            background:rgba(255,215,0,.95); color:var(--dark);
            padding:8px 20px; border-radius:24px;
            font-weight:800; font-size:.9rem;
            display:flex; align-items:center; gap:8px;
            box-shadow:0 4px 12px rgba(0,0,0,.2);
        }
        .hotline i { color:var(--red); font-size:1rem; }
        .star-deco {
            position:absolute; top:50%; left:50%;
            transform:translate(-50%,-50%);
            font-size:36px; color:#FFD700;
            text-shadow:0 0 20px rgba(255,215,0,.6);
            z-index:0; animation:pulse-star 3s infinite;
        }
        @keyframes pulse-star {
            0%,100% { opacity:.8; transform:translate(-50%,-50%) scale(1); }
            50%      { opacity:1;  transform:translate(-50%,-50%) scale(1.12); }
        }

        /* ── Navbar ── */
        .navbar {
            background:#fff; padding:1rem 2rem;
            display:flex; align-items:center; justify-content:space-between;
            box-shadow:0 2px 12px rgba(0,0,0,.07);
            position:sticky; top:0; z-index:200; transition:box-shadow .3s;
        }
        .navbar.scrolled { box-shadow:0 4px 20px rgba(0,0,0,.12); }
        .navbar-brand { display:flex; align-items:center; gap:1rem; }
        .navbar-logo {
            width:64px; height:64px; border-radius:50%;
            border:3px solid var(--gold); overflow:hidden;
            background:#fff; display:flex; align-items:center; justify-content:center;
        }
        .navbar-logo img { width:100%; height:100%; object-fit:contain; }
        .brand-text { font-size:2rem; font-weight:900; letter-spacing:2px; display:flex; align-items:center; }
        .brand-red   { color:var(--red); }
        .brand-green { color:var(--green); }
        .brand-plus  { color:var(--gold); margin-left:3px; font-size:2.25rem; animation:pulse-plus 2s infinite; }
        @keyframes pulse-plus {
            0%,100% { transform:scale(1); }
            50%      { transform:scale(1.18); }
        }
        .nav-actions { display:flex; align-items:center; gap:.875rem; }
        .btn-nav-track {
            background:transparent; border:2px solid var(--green);
            color:var(--green); padding:10px 22px; border-radius:8px;
            font-weight:700; font-size:.875rem; cursor:pointer;
            display:inline-flex; align-items:center; gap:8px; transition:all .2s;
        }
        .btn-nav-track:hover { background:var(--green); color:#fff; }
        .btn-nav-report {
            background:var(--red); color:#fff;
            padding:11px 26px; border-radius:8px; border:none;
            font-weight:700; font-size:.875rem; cursor:pointer;
            display:inline-flex; align-items:center; gap:8px; transition:all .2s;
        }
        .btn-nav-report:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(239,43,45,.4); }

        /* ── Hero ── */
        .hero {
            position:relative;
            background: linear-gradient(135deg, #005c2a 0%, #003d1c 100%);
            min-height:580px; display:flex; align-items:center; overflow:hidden;
            border-bottom: 4px solid var(--green);
        }
        .hero::before { display:none; }

        /* Slideshow */
        .hero-bg {
            position:absolute; inset:0;
            background-size:cover; background-position:center;
            opacity:0;
        }
        .hero-bg-1 {
            background-image:url('/assets/banner1.png');
            animation: slide-bg 18s infinite 0s;
        }
        .hero-bg-2 {
            background-image:url('/assets/banner2.png');
            background-size: cover;
            background-position: center center;
            animation: slide-bg 18s infinite 6s;
        }
        .hero-bg-3 {
            background-image:url('/assets/banner3.png');
            background-size: cover;
            background-position: center center;
            animation: slide-bg 18s infinite 12s;
        }
        @keyframes slide-bg {
            0%     { opacity:0; }
            5.5%   { opacity:1; }
            27.7%  { opacity:1; }
            33.3%  { opacity:0; }
            100%   { opacity:0; }
        }
        /* Voile léger uniquement pour la lisibilité du texte */
        .hero-overlay {
            position:absolute; inset:0; z-index:1;
            background:linear-gradient(
                to bottom,
                rgba(0,0,0,.25) 0%,
                rgba(0,0,0,.10) 50%,
                rgba(0,0,0,.35) 100%
            );
        }

        /* Cercles décoratifs */
        .hero-circles { position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:2; }
        .hc {
            position:absolute; border-radius:50%;
            background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
        }
        .hc1 { width:420px; height:420px; top:-120px; right:5%; }
        .hc2 { width:200px; height:200px; bottom:-50px; left:10%; }
        .hc3 { width:90px;  height:90px;  top:30%;     left:28%; }

        /* Contenu centré */
        .hero-content {
            position:relative; z-index:3;
            max-width:760px; margin:0 auto;
            padding:5rem 2rem; width:100%; text-align:center;
        }

        /* Badge */
        .hero-badge {
            display:inline-flex; align-items:center; gap:.5rem;
            background:rgba(255,255,255,.15); backdrop-filter:blur(8px);
            color:#fff; border:1px solid rgba(255,255,255,.3);
            padding:7px 20px; border-radius:24px;
            font-size:.75rem; font-weight:800; letter-spacing:1.5px;
            text-transform:uppercase; margin-bottom:1.75rem;
        }

        /* Titre */
        .hero-title {
            font-size:3.1rem; font-weight:900; color:#fff;
            text-transform:uppercase; line-height:1.12;
            margin-bottom:1.25rem; letter-spacing:-0.5px;
            text-shadow:0 3px 16px rgba(0,0,0,.4);
        }
        .hero-title span { color:var(--gold); }

        /* Sous-titre */
        .hero-subtitle {
            font-size:1.05rem; color:rgba(255,255,255,.9);
            max-width:540px; margin:0 auto 2.5rem; line-height:1.8;
            text-shadow:0 1px 6px rgba(0,0,0,.3);
        }

        /* Stats */
        .hero-stats {
            display:inline-flex; justify-content:center; gap:0;
            margin-bottom:2.75rem; flex-wrap:wrap;
            background:rgba(255,255,255,.12); backdrop-filter:blur(12px);
            border-radius:20px; border:1px solid rgba(255,255,255,.2);
            padding:.75rem 2rem;
        }
        .hero-stat { text-align:center; padding:.75rem 1.5rem; }
        .hero-stat-num {
            font-size:2rem; font-weight:900; color:var(--gold);
            min-width:70px; display:block; line-height:1.1;
        }
        .hero-stat-num.loading {
            background:rgba(255,255,255,.2); border-radius:8px;
            animation:shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0%,100% { opacity:.6; } 50% { opacity:1; }
        }
        .hero-stat-lbl {
            font-size:.68rem; color:rgba(255,255,255,.75);
            text-transform:uppercase; letter-spacing:1px; margin-top:2px;
        }
        .stat-divider {
            width:1px; background:rgba(255,255,255,.2);
            align-self:stretch; margin:8px 0;
        }

        /* Pills */
        .action-pills { display:flex; justify-content:center; gap:0; flex-wrap:wrap; }
        .pill {
            height:68px; padding:0 3rem; border:none; cursor:pointer;
            display:flex; align-items:center; gap:1rem;
            font-weight:800; font-size:.95rem; text-transform:uppercase;
            transition:all .3s; box-shadow:0 6px 20px rgba(0,0,0,.2);
        }
        .pill:hover { transform:translateY(-4px); box-shadow:0 12px 30px rgba(0,0,0,.3); }
        .pill-left  { background:var(--red); color:#fff; border-radius:34px 0 0 34px; padding-left:3.5rem; }
        .pill-right { background:#005c2a; color:#fff; border-radius:0 34px 34px 0; padding-right:3.5rem; margin-left:-1.5rem; }
        .pill-icon  {
            width:46px; height:46px; border-radius:50%; background:#fff;
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .pill-left  .pill-icon i { color:var(--red);    font-size:1.3rem; }
        .pill-right .pill-icon i { color:#005c2a; font-size:1.3rem; }

        /* ── Sections communes ── */
        .section-label {
            font-size:.7rem; font-weight:900; color:var(--green);
            letter-spacing:3px; text-transform:uppercase; margin-bottom:.5rem;
        }
        .section-title { font-size:2rem; font-weight:900; color:var(--dark); margin-bottom:.75rem; }
        .section-sub   { font-size:.95rem; color:#6b7280; max-width:500px; margin:0 auto 3rem; }

        /* ── Comment ça marche ── */
        .how { padding:5rem 2rem; background:#fff; text-align:center; }
        .steps-row {
            display:grid; grid-template-columns:repeat(4,1fr);
            gap:1.5rem; max-width:1000px; margin:0 auto; position:relative;
        }
        .steps-row::before {
            content:'';
            position:absolute; top:52px;
            left:calc(12.5% + 24px); right:calc(12.5% + 24px);
            height:2px; background:linear-gradient(90deg, var(--green), var(--gold));
            z-index:0;
        }
        .how-step { position:relative; z-index:1; }
        .step-icon-wrap {
            width:72px; height:72px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 1.25rem; box-shadow:0 8px 20px rgba(0,0,0,.12);
        }
        .step-icon-wrap i { font-size:1.75rem; color:#fff; }
        .how-step-title { font-weight:800; font-size:.95rem; color:var(--dark); margin-bottom:.375rem; }
        .how-step-desc  { font-size:.8rem; color:#9ca3af; line-height:1.6; }

        /* ── Trust ── */
        .trust {
            background:linear-gradient(135deg,#f0fdf4 0%,#f8fafc 100%);
            padding:4rem 2rem; text-align:center;
        }
        .trust-grid {
            display:grid; grid-template-columns:repeat(3,1fr);
            gap:1.5rem; max-width:860px; margin:2rem auto 0;
        }
        .trust-card {
            background:#fff; border-radius:20px; padding:2rem;
            border:1.5px solid #e5e7eb;
            box-shadow:0 4px 16px rgba(0,0,0,.05); transition:all .3s;
        }
        .trust-card:hover { transform:translateY(-6px); box-shadow:0 12px 28px rgba(0,0,0,.1); }
        .trust-icon {
            width:68px; height:68px; border-radius:18px;
            display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem;
        }
        .trust-icon i { font-size:1.75rem; }
        .trust-card h3 { font-weight:800; font-size:1rem; color:var(--dark); margin-bottom:.375rem; }
        .trust-card p  { font-size:.8rem; color:#9ca3af; line-height:1.6; }

        /* ── Canaux ── */
        .channels { padding:4rem 2rem; background:#fff; }
        .channels-inner { max-width:1000px; margin:0 auto; }
        .channels-grid {
            display:grid; grid-template-columns:repeat(3,1fr);
            gap:1rem; margin-top:2.5rem;
        }
        .channel-card {
            border:1.5px solid #e5e7eb; border-radius:16px; padding:1.5rem;
            display:flex; align-items:flex-start; gap:1rem;
            transition:all .25s; cursor:default;
        }
        .channel-card:hover { border-color:var(--green); background:#f0fdf4; transform:translateY(-3px); }
        .channel-icon {
            width:48px; height:48px; border-radius:12px; flex-shrink:0;
            display:flex; align-items:center; justify-content:center;
        }
        .channel-icon i { font-size:1.25rem; }
        .channel-name { font-weight:700; font-size:.875rem; color:var(--dark); }
        .channel-desc { font-size:.775rem; color:#9ca3af; margin-top:3px; }

        /* ── CTA Banner ── */
        .cta-banner {
            background:linear-gradient(135deg, var(--red) 0%, #c81e20 100%);
            padding:4rem 2rem; text-align:center; position:relative; overflow:hidden;
        }
        .cta-banner::before {
            content:''; position:absolute; inset:0;
            background:repeating-linear-gradient(45deg, transparent, transparent 30px,
                rgba(255,255,255,.03) 30px, rgba(255,255,255,.03) 31px);
        }
        .cta-inner { position:relative; z-index:1; max-width:700px; margin:0 auto; }
        .cta-banner h2 { font-size:2rem; font-weight:900; color:#fff; margin-bottom:.75rem; }
        .cta-banner p  { color:rgba(255,255,255,.85); font-size:.95rem; margin-bottom:2rem; }
        .cta-buttons { display:flex; justify-content:center; gap:1rem; flex-wrap:wrap; }
        .btn-cta-white {
            background:#fff; color:var(--red); padding:14px 32px; border-radius:10px;
            font-weight:800; font-size:.95rem; cursor:pointer; border:none;
            display:inline-flex; align-items:center; gap:8px;
            box-shadow:0 4px 16px rgba(0,0,0,.2); transition:all .2s;
        }
        .btn-cta-white:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.3); }
        .btn-cta-outline {
            background:transparent; color:#fff; padding:13px 32px; border-radius:10px;
            font-weight:700; font-size:.95rem; cursor:pointer;
            border:2px solid rgba(255,255,255,.6);
            display:inline-flex; align-items:center; gap:8px; transition:all .2s;
        }
        .btn-cta-outline:hover { background:rgba(255,255,255,.15); border-color:#fff; }

        /* ── Footer ── */
        .footer {
            background:linear-gradient(135deg,#005c2a 0%,#003d1c 100%);
            color:#fff; padding:4rem 2rem 1.5rem;
        }
        .footer-inner {
            max-width:1100px; margin:0 auto;
            display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr;
            gap:3rem; margin-bottom:2.5rem;
            align-items: start;
        }

        /* ── Colonne brand ── */
        .footer-brand {
            display:flex; flex-direction:column;
            align-items:flex-start; gap:1.25rem;
        }
        .footer-logo {
            width:90px; height:90px; border-radius:50%;
            border:3px solid var(--gold); overflow:hidden; background:#fff;
        }
        .footer-logo img { width:100%; height:100%; object-fit:contain; }
        .footer-brand p { color:rgba(255,255,255,.8); font-size:.8rem; line-height:1.7; }

        /* ── Réseaux sociaux centrés sous la grille ── */
        .social-row {
            display:flex; gap:.625rem;
            justify-content:center;
            width:100%;
            margin-bottom:2rem;
        }
        .social-btn {
            width:38px; height:38px; border-radius:8px;
            background:rgba(255,255,255,.1);
            display:flex; align-items:center; justify-content:center;
            color:#fff; font-size:1rem; cursor:pointer;
            transition:all .2s; text-decoration:none;
        }
        .social-btn:hover { background:var(--gold); color:var(--dark); transform:translateY(-3px); }

        .footer-col h4 { font-size:1rem; font-weight:800; color:var(--gold); margin-bottom:1.25rem; }
        .footer-col ul { list-style:none; display:flex; flex-direction:column; gap:.75rem; }
        .footer-col a {
            color:rgba(255,255,255,.8); font-size:.825rem;
            display:flex; align-items:center; gap:.5rem; transition:all .2s;
        }
        .footer-col a:hover { color:var(--gold); padding-left:4px; }
        .footer-col a i { color:var(--red); font-size:.75rem; }
        .footer-phone { font-size:1.5rem; font-weight:900; color:var(--gold); display:flex; align-items:center; gap:.5rem; }
        .footer-hr { border:none; border-top:1px solid rgba(255,255,255,.15); margin-bottom:1.25rem; }
        .footer-bottom {
            max-width:1100px; margin:0 auto;
            text-align:center; color:rgba(255,255,255,.6); font-size:.775rem;
        }
        .footer-bottom em { font-style:italic; color:var(--gold); }

        /* ── Back to top ── */
        .btt {
            position:fixed; bottom:2rem; right:2rem;
            width:48px; height:48px; border-radius:50%;
            background:var(--gold); color:var(--dark);
            display:flex; align-items:center; justify-content:center;
            cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,.25);
            transition:all .3s; z-index:300; opacity:0; pointer-events:none;
        }
        .btt.visible { opacity:1; pointer-events:all; }
        .btt:hover { transform:translateY(-4px); }

        /* ── Dialog ── */
        .overlay {
            position:fixed; inset:0; background:rgba(0,0,0,.55);
            display:flex; align-items:center; justify-content:center;
            z-index:9999; backdrop-filter:blur(6px); padding:1rem;
        }
        .dialog {
            background:#fff; border-radius:24px; padding:3rem 2.5rem;
            max-width:520px; width:100%; text-align:center;
            box-shadow:0 24px 60px rgba(0,0,0,.3); position:relative;
            animation:dialog-in .35s ease-out;
        }
        @keyframes dialog-in {
            from { opacity:0; transform:scale(.92) translateY(20px); }
            to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
        .dialog-close {
            position:absolute; top:1rem; right:1.25rem;
            width:32px; height:32px; border-radius:50%;
            background:#f3f4f6; border:none; font-size:.95rem;
            cursor:pointer; color:#6b7280;
            display:flex; align-items:center; justify-content:center; transition:all .2s;
        }
        .dialog-close:hover { background:#e5e7eb; color:#111827; }
        .dialog h2     { font-size:1.35rem; font-weight:900; color:#111827; margin-bottom:.375rem; }
        .dialog-sub    { font-size:.875rem; color:#9ca3af; margin-bottom:2rem; }
        .dialog-choices { display:flex; gap:1.25rem; justify-content:center; }
        .d-choice {
            flex:1; min-width:160px; max-width:200px;
            border:2.5px solid #e5e7eb; border-radius:18px; padding:2rem 1.25rem;
            cursor:pointer; transition:all .25s; background:#fff;
            display:flex; flex-direction:column; align-items:center; gap:.875rem;
        }
        .d-choice:hover { transform:translateY(-8px); box-shadow:0 16px 32px rgba(0,0,0,.1); }
        .d-choice.c-form:hover  { border-color:var(--green); background:#f0fdf4; }
        .d-choice.c-audio:hover { border-color:var(--red);   background:#fff5f5; }
        .d-icon {
            width:72px; height:72px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
        }
        .c-form  .d-icon { background:var(--green); }
        .c-audio .d-icon { background:var(--red);   }
        .d-icon i  { font-size:2rem; color:#fff; }
        .d-label   { font-size:.95rem; font-weight:800; color:#111827; }
        .d-hint    { font-size:.775rem; color:#9ca3af; line-height:1.5; }
        .dialog-note {
            margin-top:1.75rem; padding:.875rem 1.25rem;
            background:#fffbeb; border-radius:12px; border-left:3px solid var(--gold);
            font-size:.8rem; color:#6b7280; text-align:left;
        }

        @media (max-width:900px) {
            .topbar { flex-direction:column; gap:10px; padding:12px 1rem; text-align:center; }
            .hero-title { font-size:2rem; }
            .hero-horse { width:160px; }
            .hero-stats { padding:.5rem 1rem; }
            .hero-stat  { padding:.5rem .75rem; }
            .stat-divider { display:none; }
            .steps-row   { grid-template-columns:repeat(2,1fr); }
            .steps-row::before { display:none; }
            .trust-grid  { grid-template-columns:1fr; max-width:380px; }
            .channels-grid { grid-template-columns:repeat(2,1fr); }
            .footer-inner  { grid-template-columns:1fr; text-align:center; gap:2rem; }
            .footer-brand  { align-items:center; }
            .social-row    { justify-content:center; }
            .brand-text    { font-size:1.5rem; }
            .brand-plus    { font-size:1.75rem; }
        }
        @media (max-width:560px) {
            .hero-horse { display:none; }
            .action-pills { flex-direction:column; align-items:center; gap:1rem; }
            .pill { border-radius:34px !important; margin:0 !important; padding:0 2.5rem !important; }
            .channels-grid { grid-template-columns:1fr; }
            .dialog-choices { flex-direction:column; align-items:center; }
            .d-choice { max-width:100%; width:100%; }
            .steps-row { grid-template-columns:1fr; }
            .nav-actions .btn-nav-track { display:none; }
        }
    `],
    template: `
<div>

    <!-- ── Topbar ── -->
    <div class="topbar" @fadeIn>
        <div class="star-deco">★</div>
        <div class="topbar-left">
            <span class="topbar-text">
                ASCE-LC — Au nom de notre intégrité, luttons contre la corruption
            </span>
        </div>
        <div class="topbar-right">
            <div class="hotline">
                <i class="pi pi-phone"></i>
                <span>N° VERT : 80 00 11 11</span>
            </div>
        </div>
    </div>

    <!-- ── Navbar ── -->
    <nav class="navbar" [class.scrolled]="scrolled" @fadeIn>
        <div class="navbar-brand">
            <div class="navbar-logo">
                <img src="/assets/logo-integrite.png" alt="Intégrité+" />
            </div>
            <div class="brand-text">
                <span class="brand-red">INTÉG</span>
                <span class="brand-green">RITÉ</span>
                <span class="brand-plus">+</span>
            </div>
        </div>
        <div class="nav-actions">
            <button class="btn-nav-track" routerLink="/portail/suivi">
                <i class="pi pi-search"></i> Suivre mon dossier
            </button>
            <button class="btn-nav-report" (click)="showDialog = true">
                <i class="pi pi-flag"></i> Faire un signalement
            </button>
        </div>
    </nav>

    <!-- ── Hero ── -->
    <section class="hero">

        <!-- Calque 1 : banner1.png -->
        <div class="hero-bg hero-bg-1"></div>
        <!-- Calque 2 : banner2.png -->
        <div class="hero-bg hero-bg-2"></div>
        <!-- Calque 3 : banner3.png -->
        <div class="hero-bg hero-bg-3"></div>
        <!-- Voile sombre -->
        <div class="hero-overlay"></div>

        <div class="hero-circles">
            <div class="hc hc1"></div>
            <div class="hc hc2"></div>
            <div class="hc hc3"></div>
        </div>
        <div class="hero-content">

            <div class="hero-badge" @fadeIn>
                <i class="pi pi-shield" style="font-size:.8rem;"></i>
                Plateforme officielle sécurisée
            </div>

            <h2 class="hero-title" @fadeIn>
                Dénonciations des actes<br>de <span>corruption</span>
            </h2>

            <p class="hero-subtitle" @fadeIn>
                La corruption n'est pas une fatalité. Votre voix compte.
                Signalez en toute sécurité et confidentialité.
            </p>

            <!-- Stats réelles -->
            <div class="hero-stats" @fadeIn>
                <div class="hero-stat">
                    <span class="hero-stat-num" [class.loading]="statsLoading">
                        {{ statsLoading ? '—' : (stats.dossiersTraites | number) + '+' }}
                    </span>
                    <span class="hero-stat-lbl">Dossiers traités</span>
                </div>
                <div class="stat-divider"></div>
                <div class="hero-stat">
                    <span class="hero-stat-num" [class.loading]="statsLoading">
                        {{ statsLoading ? '—' : (stats.dossiersNouveaux | number) }}
                    </span>
                    <span class="hero-stat-lbl">Nouveaux</span>
                </div>
                <div class="stat-divider"></div>
                <div class="hero-stat">
                    <span class="hero-stat-num" [class.loading]="statsLoading">
                        {{ statsLoading ? '—' : (stats.dossiersEnCours | number) }}
                    </span>
                    <span class="hero-stat-lbl">En cours</span>
                </div>
                <div class="stat-divider"></div>
                <div class="hero-stat">
                    <span class="hero-stat-num" [class.loading]="statsLoading">
                        {{ statsLoading ? '—' : stats.confidentiel }}
                    </span>
                    <span class="hero-stat-lbl">Confidentiel</span>
                </div>
            </div>

            <div class="action-pills" @fadeIn>
                <button class="pill pill-left" (click)="showDialog = true">
                    <div class="pill-icon"><i class="pi pi-volume-up"></i></div>
                    DÉNONCER
                </button>
                <button class="pill pill-right" routerLink="/portail/suivi">
                    <div class="pill-icon"><i class="pi pi-shield"></i></div>
                    SUIVRE MA DÉNONCIATION
                </button>
            </div>

        </div>
    </section>

    <!-- ── Comment ça marche ── -->
    <section class="how">
        <div class="section-label">PROCESSUS</div>
        <h2 class="section-title">Comment ça marche ?</h2>
        <p class="section-sub">Un processus simple, sécurisé et confidentiel en 4 étapes</p>

        <div class="steps-row">
            <div class="how-step" *ngFor="let step of howSteps">
                <div class="step-icon-wrap" [style.background]="step.bg">
                    <i [class]="step.icon"></i>
                </div>
                <div class="how-step-title">{{ step.title }}</div>
                <div class="how-step-desc">{{ step.desc }}</div>
            </div>
        </div>
    </section>

    <!-- ── Confiance ── -->
    <section class="trust">
        <div class="section-label">GARANTIES</div>
        <h2 class="section-title">Pourquoi nous faire confiance ?</h2>
        <div class="trust-grid">
            <div class="trust-card" *ngFor="let t of trustItems">
                <div class="trust-icon" [style.background]="t.bg">
                    <i [class]="t.icon" [style.color]="t.color"></i>
                </div>
                <h3>{{ t.title }}</h3>
                <p>{{ t.desc }}</p>
            </div>
        </div>
    </section>

    <!-- ── Canaux ── -->
    <section class="channels">
        <div class="channels-inner">
            <div style="text-align:center;">
                <div class="section-label">CANAUX</div>
                <h2 class="section-title">Comment nous contacter ?</h2>
                <p class="section-sub">Plusieurs façons de soumettre votre signalement</p>
            </div>
            <div class="channels-grid">
                <div class="channel-card" *ngFor="let c of channels">
                    <div class="channel-icon" [style.background]="c.bg">
                        <i [class]="c.icon" [style.color]="c.color"></i>
                    </div>
                    <div>
                        <div class="channel-name">{{ c.name }}</div>
                        <div class="channel-desc">{{ c.desc }}</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ── CTA ── -->
    <section class="cta-banner">
        <div class="cta-inner">
            <h2>Prêt à agir contre la corruption ?</h2>
            <p>Chaque signalement compte. Votre témoignage peut changer les choses.</p>
            <div class="cta-buttons">
                <button class="btn-cta-white" (click)="showDialog = true">
                    <i class="pi pi-flag"></i>
                    Faire un signalement maintenant
                </button>
                <button class="btn-cta-outline" routerLink="/portail/suivi">
                    <i class="pi pi-search"></i>
                    Suivre mon dossier
                </button>
            </div>
        </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="footer">

        <!-- Grille principale -->
        <div class="footer-inner">

            <!-- Colonne brand : logo + texte -->
            <div class="footer-brand">
                <div class="footer-logo">
                    <img src="/assets/logo-asce.png" alt="ASCE-LC" />
                </div>
                <p>
                    Autorité Supérieure de Contrôle d'État<br>
                    et de Lutte contre la Corruption
                </p>
            </div>

            <div class="footer-col">
                <h4>LIENS RAPIDES</h4>
                <ul>
                    <li><a style="cursor:pointer" (click)="showDialog = true">
                        <i class="pi pi-angle-right"></i>Faire un signalement</a></li>
                    <li><a routerLink="/portail/suivi">
                        <i class="pi pi-angle-right"></i>Suivre un dossier</a></li>
                    <li><a href="#">
                        <i class="pi pi-angle-right"></i>Nos missions</a></li>
                    <li><a href="#">
                        <i class="pi pi-angle-right"></i>Textes juridiques</a></li>
                    <li><a href="#">
                        <i class="pi pi-angle-right"></i>FAQ</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>CONTACT</h4>
                <ul>
                    <li><div class="footer-phone">
                        <i class="pi pi-phone"></i> 80 00 11 11</div></li>
                    <li><a href="mailto:contact@asce-lc.bf">
                        <i class="pi pi-envelope"></i>contact@asce-lc.bf</a></li>
                    <li><a href="https://www.asce-lc.bf" target="_blank">
                        <i class="pi pi-globe"></i>www.asce-lc.bf</a></li>
                    <li><a href="#">
                        <i class="pi pi-map-marker"></i>Ouagadougou, Burkina Faso</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>INFORMATIONS</h4>
                <ul>
                    <li><a href="#"><i class="pi pi-angle-right"></i>Mentions légales</a></li>
                    <li><a href="#"><i class="pi pi-angle-right"></i>Confidentialité</a></li>
                    <li><a href="#"><i class="pi pi-angle-right"></i>Conditions d'utilisation</a></li>
                    <li><a href="#"><i class="pi pi-angle-right"></i>Rapport annuel</a></li>
                </ul>
            </div>

        </div>

        <!-- ── Réseaux sociaux centrés sous la grille ── -->
        <div class="social-row">
            <a class="social-btn"
               href="https://www.facebook.com/ascelcbf"
               target="_blank" rel="noopener" title="Facebook ASCE-LC">
                <i class="pi pi-facebook"></i>
            </a>
            <a class="social-btn"
               href="#"
               target="_blank" rel="noopener" title="Twitter / X">
                <i class="pi pi-twitter"></i>
            </a>
            <a class="social-btn"
               href="#"
               target="_blank" rel="noopener" title="LinkedIn">
                <i class="pi pi-linkedin"></i>
            </a>
            <a class="social-btn"
               href="https://www.youtube.com/@ascelcbf"
               target="_blank" rel="noopener" title="YouTube ASCE-LC">
                <i class="pi pi-youtube"></i>
            </a>
        </div>

        <hr class="footer-hr" />
        <div class="footer-bottom">
            <p>© 2026 ASCE-LC Burkina Faso — Tous droits réservés</p>
            <p style="margin-top:6px;"><em>"La Patrie ou la Mort, nous vaincrons"</em></p>
        </div>
    </footer>

    <!-- Back to top -->
    <div class="btt" [class.visible]="scrolled" (click)="scrollToTop()">
        <i class="pi pi-arrow-up"></i>
    </div>

    <!-- ── Dialog choix dépôt ── -->
    <div class="overlay" *ngIf="showDialog" (click)="showDialog = false">
        <div class="dialog" (click)="$event.stopPropagation()">
            <button class="dialog-close" (click)="showDialog = false">
                <i class="pi pi-times"></i>
            </button>
            <h2>Comment voulez-vous déposer ?</h2>
            <p class="dialog-sub">Les deux options sont totalement confidentielles</p>

            <div class="dialog-choices">
                <div class="d-choice c-form" (click)="goTo('/portail/deposer')">
                    <div class="d-icon"><i class="pi pi-file-edit"></i></div>
                    <div class="d-label">Formulaire écrit</div>
                    <div class="d-hint">Remplir un formulaire<br>avec pièces jointes</div>
                </div>
                <div class="d-choice c-audio" (click)="goTo('/portail/vocal')">
                    <div class="d-icon"><i class="pi pi-microphone"></i></div>
                    <div class="d-label">Témoignage vocal</div>
                    <div class="d-hint">Enregistrer votre voix<br>directement</div>
                </div>
            </div>

            <div class="dialog-note">
                <i class="pi pi-shield" style="color:#009A44;margin-right:6px;"></i>
                <strong>Confidentialité garantie</strong> —
                Votre identité est protégée conformément à la loi N°010-2004/AN.
            </div>
        </div>
    </div>

</div>
    `
})
export class PortailAccueil implements OnInit {

    private router       = inject(Router);
    private statsService = inject(StatistiqueService);

    showDialog   = false;
    scrolled     = false;
    statsLoading = true;

    stats: PublicStats = {
        totalDossiers:    0,
        dossiersNouveaux: 0,
        dossiersEnCours:  0,
        dossiersTraites:  0,
        confidentiel:     '100%',
        delaiJours:       7
    };

    @HostListener('window:scroll')
    onScroll(): void {
        this.scrolled = window.scrollY > 80;
    }

    ngOnInit(): void {
        this.statsService.getPublicStats().subscribe({
            next:  s  => { this.stats = s; this.statsLoading = false; },
            error: () => { this.statsLoading = false; }
        });
    }

    readonly howSteps = [
        { icon: 'pi pi-file-edit',    bg: '#16a34a', title: 'Soumission',     desc: 'Remplissez le formulaire ou enregistrez votre témoignage vocal' },
        { icon: 'pi pi-check-circle', bg: '#2563eb', title: 'Enregistrement', desc: 'Votre dossier reçoit un numéro officiel et un code de suivi B4' },
        { icon: 'pi pi-search',       bg: '#d97706', title: 'Instruction',    desc: "Un agent instruit le dossier et mène l'enquête si nécessaire" },
        { icon: 'pi pi-gavel',        bg: '#7c3aed', title: 'Décision',       desc: 'Une décision officielle est rendue et vous est communiquée' }
    ];

    readonly trustItems = [
        { icon: 'pi pi-lock',         color: '#16a34a', bg: '#dcfce7', title: 'Anonymat garanti',       desc: 'Votre identité est strictement protégée. Vous pouvez déposer sans révéler qui vous êtes.' },
        { icon: 'pi pi-shield',       color: '#2563eb', bg: '#dbeafe', title: 'Plateforme sécurisée',   desc: 'Toutes les données sont chiffrées. Aucune information ne peut être interceptée.' },
        { icon: 'pi pi-check-circle', color: '#7c3aed', bg: '#ede9fe', title: 'Institution officielle', desc: "Organe d'État habilité par la loi à recevoir et traiter les plaintes anticorruption." }
    ];

    readonly channels = [
        { icon: 'pi pi-globe',      color: '#16a34a', bg: '#dcfce7', name: 'Formulaire Web',   desc: "Déposez en ligne 24h/24 depuis n'importe quel appareil" },
        { icon: 'pi pi-microphone', color: '#ef4444', bg: '#fee2e2', name: 'Témoignage Vocal', desc: 'Enregistrez votre voix dans votre langue maternelle' },
        { icon: 'pi pi-phone',      color: '#d97706', bg: '#fef3c7', name: 'Numéro Vert',      desc: 'Appelez gratuitement le 80 00 11 11 — disponible 24h/24' },
        { icon: 'pi pi-building',   color: '#2563eb', bg: '#dbeafe', name: 'Guichet BRPD',     desc: 'Venez en personne au Bureau de Réception des Plaintes' },
        { icon: 'pi pi-envelope',   color: '#7c3aed', bg: '#ede9fe', name: 'Email',            desc: 'Envoyez vos documents à contact@asce-lc.bf' },
        { icon: 'pi pi-send',       color: '#0891b2', bg: '#cffafe', name: 'Courrier Postal',  desc: 'Envoyez votre témoignage écrit par courrier officiel' }
    ];

    goTo(path: string): void {
        this.showDialog = false;
        this.router.navigate([path]);
    }

    scrollToTop(): void {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}