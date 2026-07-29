import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { trigger, style, animate, transition } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { StatistiqueService, PublicStats } from '../../../core/services/statistique.service';
import { PortalConfigService } from '../../../core/services/portal-config.service';

@Component({
    selector: 'app-portail-accueil',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ButtonModule],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(16px)' }),
                animate('420ms cubic-bezier(.22,.61,.36,1)', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ],
    styles: [`
        :host{
            --green:#009640; --red:#E30613; --yellow:#FFD800;
            --ink:#003617; --paper:#FFFFFF; --mist:#F2F8F4;
            --ink-60:rgba(0,54,23,.62); --ink-40:rgba(0,54,23,.4);
            --hair:#E4E9E6;
            --font: 'Lato', system-ui, sans-serif;
            --mono: ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, monospace;
            display:block; font-family:var(--font); color:var(--ink); background:var(--paper);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none;color:inherit}
        button{font-family:inherit}

        /* ── Bloc logo + actions, intégré au hero (pas de navbar séparée) ── */
        .hero-topbar{position:relative;z-index:2;max-width:1120px;margin:0 auto;padding:1.5rem 2rem 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem}
        .navbar-brand{display:flex;align-items:center;gap:.75rem}
        .navbar-logo{display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,255,255,.94);border-radius:12px;padding:9px 16px;box-shadow:0 2px 10px rgba(0,0,0,.15)}
        .navbar-logo img{height:52px;width:auto;object-fit:contain;display:block}
        .nav-actions{display:flex;align-items:center;gap:.75rem}
        .btn-ghost{background:transparent;border:1.5px solid rgba(255,255,255,.55);color:#fff;padding:9px 18px;border-radius:6px;font-weight:700;font-size:.825rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .18s}
        .btn-ghost:hover{background:rgba(255,255,255,.12);border-color:#fff}
        .btn-primary{background:var(--red);color:#fff;padding:10px 20px;border-radius:6px;border:none;font-weight:700;font-size:.825rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .18s}
        .btn-primary:hover{background:#c00511;transform:translateY(-1px)}

        /* ── Hero ───────────────────────────────────────────── */
        .hero{position:relative;background:var(--green);overflow:hidden;border-bottom:3px solid var(--yellow)}
        .hero-rings{position:absolute;inset:0;pointer-events:none;overflow:hidden}
        .ring{position:absolute;border-radius:50%;border:1px solid rgba(255,255,255,.14)}
        .ring1{width:640px;height:640px;top:-260px;right:-140px}
        .ring2{width:320px;height:320px;bottom:-160px;left:-80px}
        .hero-grid{position:relative;z-index:2;max-width:1120px;margin:0 auto;padding:3rem 2rem 4.5rem;display:grid;grid-template-columns:1.15fr .85fr;gap:3rem;align-items:center}

        .hero-title{font-size:2.3rem;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-.5px;margin-bottom:1rem;text-transform:uppercase}
        .letter-icon{font-size:.8em;color:var(--yellow);vertical-align:middle;margin:0 .02em}
        .hero-subtitle{font-size:1rem;color:rgba(255,255,255,.88);max-width:460px;margin:0 0 .85rem;line-height:1.7}
        .hero-legal{font-size:.72rem;font-weight:700;letter-spacing:.5px;color:var(--yellow);text-transform:uppercase;margin-bottom:2rem}

        .hero-actions{display:flex;justify-content:flex-start;gap:1rem;flex-wrap:wrap}
        .btn-hero-primary{background:var(--red);color:#fff;border:none;padding:0 1.85rem;height:52px;border-radius:8px;font-weight:800;font-size:.87rem;letter-spacing:.3px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;transition:all .2s;box-shadow:0 6px 18px rgba(227,6,19,.35)}
        .btn-hero-primary:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(227,6,19,.45)}
        .btn-hero-secondary{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.55);padding:0 1.85rem;height:52px;border-radius:8px;font-weight:700;font-size:.87rem;letter-spacing:.3px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;transition:all .2s}
        .btn-hero-secondary:hover{background:rgba(255,255,255,.12);border-color:#fff}

        /* ── Carte de suivi (hero, colonne droite) ──────────── */
        .track-card{background:#fff;border-radius:14px;padding:2rem;box-shadow:0 24px 55px rgba(0,0,0,.22)}
        .track-card h3{font-size:1.05rem;font-weight:800;color:var(--ink);margin-bottom:.4rem}
        .track-card p{font-size:.82rem;color:var(--ink-60);margin-bottom:1.4rem;line-height:1.6}
        .track-input-row{display:flex;gap:.5rem}
        .track-input{flex:1;min-width:0;height:46px;border:1.5px solid var(--hair);border-radius:8px;padding:0 1rem;font-size:.85rem;font-family:var(--mono);text-transform:uppercase;outline:none;transition:border-color .15s;color:var(--ink)}
        .track-input:focus{border-color:var(--green)}
        .track-btn{height:46px;width:46px;border-radius:8px;background:var(--green);border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .15s}
        .track-btn:hover{background:#007a34}
        .track-hint{font-size:.72rem;color:var(--ink-40);margin-top:.85rem}

        /* ── Carte "second parcours" (témoignage vocal) ─────── */
        .vocal-card-wrap{background:#fff;padding:3rem 2rem;display:flex;justify-content:center}
        .vocal-card{background:#fff;border:1px solid var(--hair);box-shadow:0 10px 30px rgba(0,0,0,.06);border-radius:14px;padding:2.25rem 2rem;max-width:720px;width:100%;text-align:center}
        .vocal-card-icons{display:flex;align-items:center;justify-content:center;gap:.75rem;margin-bottom:.5rem}
        .vocal-card-icons i{font-size:1.3rem;color:var(--green)}
        .vocal-card h2{font-size:1.3rem;font-weight:900;color:var(--ink)}
        .vocal-card p{font-size:.9rem;color:var(--ink-60);margin-top:.5rem;line-height:1.6}
        .vocal-card .btn-hero-primary{margin:1.5rem auto 0}

        /* ── Bandeau de statistiques ─────────────────────────── */
        .stats-strip{background:#fff;border-bottom:1px solid var(--hair);padding:1.5rem 2rem}
        .stats-strip-inner{max-width:820px;margin:0 auto;display:flex;justify-content:center;flex-wrap:wrap}
        .stat{padding:0 2rem;text-align:center;position:relative}
        .stat+.stat::before{content:'';position:absolute;left:0;top:4px;bottom:4px;width:1px;background:var(--hair)}
        .stat-num{font-family:var(--mono);font-size:1.5rem;font-weight:700;color:var(--ink);display:block;line-height:1}
        .stat-num.is-loading{color:var(--ink-40)}
        .stat-lbl{font-size:.66rem;color:var(--ink-60);text-transform:uppercase;letter-spacing:1px;margin-top:.3rem;font-weight:600}

        /* ── Section shell ──────────────────────────────────── */
        .section-eyebrow{font-size:.7rem;font-weight:800;color:var(--green);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:.6rem}
        .section-title{font-size:1.85rem;font-weight:900;color:var(--ink);margin-bottom:.65rem}
        .section-sub{font-size:.95rem;color:var(--ink-60);max-width:480px;margin:0 auto 3rem;line-height:1.6}

        /* ── Processus ──────────────────────────────────────── */
        .how{padding:5rem 2rem;background:#fff;text-align:center}
        .steps-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;max-width:980px;margin:0 auto;position:relative}
        .steps-row::before{content:'';position:absolute;top:26px;left:calc(12.5% + 26px);right:calc(12.5% + 26px);height:1px;background:var(--hair)}
        .how-step{position:relative;z-index:1;text-align:left}
        .step-num{font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--paper);background:var(--green);width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:1.1rem;border:4px solid #fff;box-shadow:0 0 0 1px var(--hair)}
        .how-step-title{font-weight:800;font-size:.95rem;color:var(--ink);margin-bottom:.375rem}
        .how-step-desc{font-size:.82rem;color:var(--ink-60);line-height:1.6}

        /* ── Bord "papier déchiré" entre deux sections ──────── */
        .torn-top{position:relative}
        .torn-top::before{
            content:'';position:absolute;top:-1px;left:0;right:0;height:18px;
            background:var(--paper);
            clip-path:polygon(
                0% 100%,2% 35%,5% 92%,8% 28%,11% 88%,14% 22%,17% 82%,20% 32%,
                23% 92%,26% 18%,29% 78%,32% 38%,35% 88%,38% 12%,41% 72%,44% 28%,
                47% 92%,50% 18%,53% 82%,56% 32%,59% 88%,62% 22%,65% 78%,68% 38%,
                71% 92%,74% 12%,77% 72%,80% 28%,83% 88%,86% 18%,89% 82%,92% 32%,
                95% 92%,98% 22%,100% 100%
            );
        }

        /* ── Vos garanties (aplat vert, cartes blanches) ────── */
        .garanties{background:var(--green);padding:3.5rem 2rem 4rem;text-align:center}
        .garanties .section-eyebrow{color:var(--yellow)}
        .garanties .section-title{color:#fff}
        .garanties .section-sub{color:rgba(255,255,255,.82)}
        .garanties-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;max-width:960px;margin:2.5rem auto 0}
        .garantie-card{background:#fff;border-radius:14px;padding:1.75rem 1.5rem;text-align:left}
        .garantie-icon{width:42px;height:42px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem}
        .garantie-icon.tone-green{background:var(--green)} .garantie-icon.tone-ink{background:var(--ink)}
        .garantie-icon i{font-size:1.1rem;color:#fff}
        .garantie-card h3{font-weight:800;font-size:.95rem;color:var(--ink);margin-bottom:.4rem}
        .garantie-card p{font-size:.8rem;color:var(--ink-60);line-height:1.6}

        /* ── Canaux (liste compacte) ─────────────────────────── */
        .channels{background:#fff;padding:4rem 2rem;text-align:center}
        .channels-list{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem 3rem;max-width:820px;margin:2.5rem auto 0;text-align:left}
        .channel-row{display:flex;gap:1rem;align-items:flex-start}
        .channel-icon{width:38px;height:38px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--mist)}
        .channel-icon i{font-size:1rem;color:var(--ink)}
        .channel-row h4{font-weight:800;font-size:.88rem;color:var(--ink);margin-bottom:.25rem}
        .channel-row p{font-size:.78rem;color:var(--ink-60);line-height:1.55}

        /* ── Accès rapide (grosses pastilles, CTA final) ────── */
        .quick-access{background:var(--mist);padding:4.5rem 2rem;text-align:center}
        .quick-grid{display:flex;justify-content:center;gap:3.5rem;flex-wrap:wrap;margin-top:2.5rem}
        .quick-item{display:flex;flex-direction:column;align-items:center;gap:1rem;cursor:pointer;background:none;border:none;font-family:inherit}
        .quick-circle{width:104px;height:104px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .2s;box-shadow:0 10px 26px rgba(0,0,0,.14)}
        .quick-item:hover .quick-circle{transform:translateY(-4px)}
        .quick-circle.is-red{background:var(--red)} .quick-circle.is-green{background:var(--green)}
        .quick-circle i{font-size:2.1rem;color:#fff}
        .quick-item span{font-weight:800;font-size:.85rem;color:var(--ink);letter-spacing:.3px;text-transform:uppercase}

        /* ── Pied de page ───────────────────────────────────── */
        .footer{background:var(--red);color:#fff;padding:4.5rem 2rem 1.5rem}
        .footer-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:3rem;margin-bottom:2.5rem;align-items:start}
        .footer-brand{display:flex;flex-direction:column;align-items:flex-start;gap:1.1rem}
        .footer-logo{display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,255,255,.94);border-radius:12px;padding:10px 16px;box-shadow:0 2px 10px rgba(0,0,0,.15)}
        .footer-logo img{height:48px;width:auto;object-fit:contain;display:block}
        .footer-brand p{color:rgba(255,255,255,.82);font-size:.8rem;line-height:1.7}
        .footer-col h4{font-size:.78rem;font-weight:800;color:var(--yellow);letter-spacing:1.5px;margin-bottom:1.15rem}
        .footer-col ul{list-style:none;display:flex;flex-direction:column;gap:.7rem}
        .footer-col a,.footer-phone{color:rgba(255,255,255,.85);font-size:.82rem;display:flex;align-items:center;gap:.5rem;transition:all .15s}
        .footer-col a:hover{color:var(--yellow);padding-left:3px}
        .footer-phone{font-family:var(--mono);font-size:1.15rem;font-weight:700;color:#fff}
        .social-row{display:flex;gap:.6rem;justify-content:center;width:100%;margin-bottom:2rem}
        .social-btn{width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.95rem;cursor:pointer;transition:all .18s}
        .social-btn:hover{background:var(--yellow);color:var(--ink)}
        .footer-hr{border:none;border-top:1px solid rgba(255,255,255,.18);margin-bottom:1.25rem}
        .footer-bottom{max-width:1100px;margin:0 auto;text-align:center;color:rgba(255,255,255,.68);font-size:.775rem}
        .footer-bottom em{font-style:normal;color:var(--yellow)}

        /* ── Retour en haut ─────────────────────────────────── */
        .btt{position:fixed;bottom:2rem;right:2rem;width:44px;height:44px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25);transition:opacity .2s,transform .2s;z-index:300;opacity:0;pointer-events:none}
        .btt.visible{opacity:1;pointer-events:all} .btt:hover{transform:translateY(-3px)}

        /* ── Dialogue de dépôt ──────────────────────────────── */
        .overlay{position:fixed;inset:0;background:rgba(0,54,23,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
        .dialog{background:#fff;border-radius:16px;padding:2.75rem 2.5rem;max-width:520px;width:100%;text-align:center;box-shadow:0 30px 70px rgba(0,0,0,.3);position:relative;animation:dialog-in .25s ease-out}
        @keyframes dialog-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .dialog-close{position:absolute;top:1rem;right:1.1rem;width:30px;height:30px;border-radius:50%;background:var(--mist);border:none;font-size:.9rem;cursor:pointer;color:var(--ink-60);display:flex;align-items:center;justify-content:center;transition:background .15s}
        .dialog-close:hover{background:var(--hair)}
        .dialog h2{font-size:1.25rem;font-weight:900;color:var(--ink);margin-bottom:.35rem}
        .dialog-sub{font-size:.85rem;color:var(--ink-60);margin-bottom:2rem}
        .dialog-choices{display:flex;gap:1rem;justify-content:center}
        .d-choice{flex:1;min-width:150px;max-width:200px;border:1.5px solid var(--hair);border-radius:12px;padding:1.75rem 1.1rem;cursor:pointer;transition:all .2s;background:#fff;display:flex;flex-direction:column;align-items:center;gap:.75rem}
        .d-choice:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(0,0,0,.08)}
        .d-choice.c-form:hover{border-color:var(--green)} .d-choice.c-audio:hover{border-color:var(--red)}
        .d-icon{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .c-form .d-icon{background:var(--green)} .c-audio .d-icon{background:var(--red)}
        .d-icon i{font-size:1.4rem;color:#fff}
        .d-label{font-size:.9rem;font-weight:800;color:var(--ink)}
        .d-hint{font-size:.75rem;color:var(--ink-60);line-height:1.5}
        .dialog-note{margin-top:1.5rem;padding:.85rem 1.1rem;background:var(--mist);border-radius:10px;border-left:3px solid var(--green);font-size:.78rem;color:var(--ink-60);text-align:left;line-height:1.5}

        @media (max-width:860px){
            .steps-row,.tc-grid{grid-template-columns:1fr}
            .steps-row::before{display:none}
            .footer-inner{grid-template-columns:1fr 1fr;gap:2rem}
            .hero-grid{grid-template-columns:1fr}
            .hero-title{font-size:2.1rem}
            .hero-left,.hero-title,.hero-subtitle,.hero-actions{text-align:left}
            .tc-grid{gap:2.5rem}
            .stats-strip-inner{gap:0}
            .stat{padding:0 1rem}
        }
    `],
    template: `
<div>
    <section class="hero">
        <div class="hero-rings"><div class="ring ring1"></div><div class="ring ring2"></div></div>

        <div class="hero-topbar" @fadeIn>
            <div class="navbar-brand">
                <div class="navbar-logo">
                    <img src="/assets/logo-asce.png" alt="ASCE-LC" />
                </div>
            </div>
            <div class="nav-actions">
                <button class="btn-ghost" routerLink="/portail/suivi"><i class="pi pi-search"></i> Suivre mon dossier</button>
                <button class="btn-primary" (click)="showDialog=true"><i class="pi pi-flag"></i> Faire un signalement</button>
            </div>
        </div>

        <div class="hero-grid">
            <div class="hero-left">
                <h1 class="hero-title" @fadeIn>
                    DÉNONCIATI<i class="pi pi-search letter-icon"></i>N DES<br>
                    ACTES DE CORRUPTI<i class="pi pi-search letter-icon"></i>N
                </h1>
                <p class="hero-subtitle" @fadeIn>{{ heroSubtitle }}</p>
                <p class="hero-legal" @fadeIn>Plateforme officielle sécurisée — Loi N°010-2004/AN</p>
                <div class="hero-actions" @fadeIn>
                    <button class="btn-hero-primary" (click)="showDialog=true"><i class="pi pi-flag"></i> Faire un signalement</button>
                    <button class="btn-hero-secondary" routerLink="/portail/suivi"><i class="pi pi-search"></i> Suivre ma dénonciation</button>
                </div>
            </div>
            <div class="track-card" @fadeIn>
                <h3>Suivre mon dossier</h3>
                <p>Entrez votre code de suivi pour connaître l'état d'avancement de votre dossier.</p>
                <div class="track-input-row">
                    <input class="track-input" type="text" placeholder="Ex. A1B2C3D4"
                        [(ngModel)]="trackingCode" (keyup.enter)="goToTracking()" maxlength="10" />
                    <button class="track-btn" (click)="goToTracking()" aria-label="Suivre">
                        <i class="pi pi-arrow-right"></i>
                    </button>
                </div>
                <div class="track-hint">Le code vous a été remis lors du dépôt de votre signalement.</div>
            </div>
        </div>
    </section>

    <div class="vocal-card-wrap">
        <div class="vocal-card">
            <div class="vocal-card-icons"><i class="pi pi-microphone"></i><h2>Témoignez de vive voix, en toute confiance</h2><i class="pi pi-microphone"></i></div>
            <p>Vous préférez raconter les faits plutôt que les écrire ? Enregistrez votre témoignage vocal directement depuis votre téléphone, dans votre langue, en toute confidentialité.</p>
            <button class="btn-hero-primary" routerLink="/portail/vocal"><i class="pi pi-microphone"></i> Accéder à l'enregistrement vocal</button>
        </div>
    </div>

    <div class="stats-strip">
        <div class="stats-strip-inner">
            <div class="stat">
                <span class="stat-num" [class.is-loading]="statsLoading">{{ statsLoading ? '···' : (stats.dossiersTraites | number)+'+' }}</span>
                <span class="stat-lbl">Dossiers traités</span>
            </div>
            <div class="stat">
                <span class="stat-num" [class.is-loading]="statsLoading">{{ statsLoading ? '···' : (stats.dossiersNouveaux | number) }}</span>
                <span class="stat-lbl">Nouveaux</span>
            </div>
            <div class="stat">
                <span class="stat-num" [class.is-loading]="statsLoading">{{ statsLoading ? '···' : (stats.dossiersEnCours | number) }}</span>
                <span class="stat-lbl">En cours</span>
            </div>
            <div class="stat">
                <span class="stat-num">{{ stats.confidentiel }}</span>
                <span class="stat-lbl">Confidentiel</span>
            </div>
        </div>
    </div>

    <section class="how">
        <div class="section-eyebrow">Processus</div>
        <h2 class="section-title">Comment ça marche ?</h2>
        <p class="section-sub">Un processus simple, sécurisé et confidentiel en 4 étapes</p>
        <div class="steps-row">
            <div class="how-step" *ngFor="let step of howSteps; let i = index">
                <div class="step-num">{{ i + 1 }}</div>
                <div class="how-step-title">{{ step.title }}</div>
                <div class="how-step-desc">{{ step.desc }}</div>
            </div>
        </div>
    </section>

    <section class="garanties torn-top">
        <div class="section-eyebrow">Garanties</div>
        <h2 class="section-title">Vos garanties en tant que dénonciateur</h2>
        <p class="section-sub">L'ASCE-LC veille à ce que ces garanties soient respectées à chaque étape</p>
        <div class="garanties-grid">
            <div class="garantie-card" *ngFor="let t of trustItems">
                <div class="garantie-icon" [class.tone-green]="t.tone==='green'" [class.tone-ink]="t.tone==='ink'"><i [class]="t.icon"></i></div>
                <h3>{{ t.title }}</h3><p>{{ t.desc }}</p>
            </div>
        </div>
    </section>

    <section class="channels">
        <div class="section-eyebrow">Canaux</div>
        <h2 class="section-title">Comment nous contacter ?</h2>
        <p class="section-sub">Plusieurs façons de soumettre votre signalement</p>
        <div class="channels-list">
            <div class="channel-row" *ngFor="let ch of channels">
                <div class="channel-icon"><i [class]="ch.icon"></i></div>
                <div><h4>{{ ch.name }}</h4><p>{{ ch.desc }}</p></div>
            </div>
        </div>
    </section>

    <section class="quick-access">
        <div class="section-eyebrow">Accès rapide</div>
        <h2 class="section-title">Prêt à agir contre la corruption ?</h2>
        <p class="section-sub">Chaque signalement compte. Votre témoignage peut changer les choses.</p>
        <div class="quick-grid">
            <button class="quick-item" (click)="showDialog=true">
                <div class="quick-circle is-red"><i class="pi pi-flag"></i></div>
                <span>Faire un signalement</span>
            </button>
            <button class="quick-item" routerLink="/portail/suivi">
                <div class="quick-circle is-green"><i class="pi pi-search"></i></div>
                <span>Suivre mon dossier</span>
            </button>
        </div>
    </section>

    <footer class="footer torn-top">
        <div class="footer-inner">
            <div class="footer-brand">
                <div class="footer-logo"><img src="/assets/logo-asce.png" alt="ASCE-LC" /></div>
                <p>{{ footerAbout }}</p>
            </div>
            <div class="footer-col">
                <h4>LIENS RAPIDES</h4>
                <ul>
                    <li><a style="cursor:pointer" (click)="showDialog=true"><i class="pi pi-angle-right"></i>Faire un signalement</a></li>
                    <li><a routerLink="/portail/suivi"><i class="pi pi-angle-right"></i>Suivre un dossier</a></li>
                    <li><a href="#"><i class="pi pi-angle-right"></i>Nos missions</a></li>
                    <li><a href="#"><i class="pi pi-angle-right"></i>Textes juridiques</a></li>
                    <li><a href="#"><i class="pi pi-angle-right"></i>FAQ</a></li>
                </ul>
            </div>
            <div class="footer-col">
                <h4>CONTACT</h4>
                <ul>
                    <li><div class="footer-phone">{{ c['hotline_number'] || '80 00 11 11' }}</div></li>
                    <li><a [href]="'mailto:'+(c['email_contact']||'contact@asce-lc.bf')"><i class="pi pi-envelope"></i>{{ c['email_contact'] || 'contact@asce-lc.bf' }}</a></li>
                    <li><a [href]="c['website_url'] || 'https://www.asce-lc.bf'" target="_blank"><i class="pi pi-globe"></i>{{ c['website_url'] || 'www.asce-lc.bf' }}</a></li>
                    <li><a href="#"><i class="pi pi-map-marker"></i>{{ c['address'] || 'Ouagadougou, Burkina Faso' }}</a></li>
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
        <div class="social-row">
            <a class="social-btn" [href]="c['facebook_url'] || 'https://www.facebook.com/ascelcbf'" target="_blank"><i class="pi pi-facebook"></i></a>
            <a class="social-btn" [href]="c['twitter_url'] || '#'" target="_blank"><i class="pi pi-twitter"></i></a>
            <a class="social-btn" [href]="c['linkedin_url'] || '#'" target="_blank"><i class="pi pi-linkedin"></i></a>
            <a class="social-btn" [href]="c['youtube_url'] || 'https://www.youtube.com/@ascelcbf'" target="_blank"><i class="pi pi-youtube"></i></a>
        </div>
        <hr class="footer-hr" />
        <div class="footer-bottom">
            <p>© 2026 ASCE-LC Burkina Faso — Tous droits réservés</p>
            <p style="margin-top:6px;"><em>{{ c['site_tagline'] || 'La Patrie ou la Mort, nous vaincrons' }}</em></p>
        </div>
    </footer>

    <div class="btt" [class.visible]="scrolled" (click)="scrollToTop()"><i class="pi pi-arrow-up"></i></div>

    <div class="overlay" *ngIf="showDialog" (click)="showDialog=false">
        <div class="dialog" (click)="$event.stopPropagation()">
            <button class="dialog-close" (click)="showDialog=false"><i class="pi pi-times"></i></button>
            <h2>Comment voulez-vous déposer ?</h2>
            <p class="dialog-sub">Les deux options sont totalement confidentielles</p>
            <div class="dialog-choices">
                <div class="d-choice c-form" (click)="goTo('/portail/deposer')">
                    <div class="d-icon"><i class="pi pi-file-edit"></i></div>
                    <div><div class="d-label">Formulaire écrit</div><div class="d-hint">Remplir un formulaire<br>avec pièces jointes</div></div>
                </div>
                <div class="d-choice c-audio" (click)="goTo('/portail/vocal')">
                    <div class="d-icon"><i class="pi pi-microphone"></i></div>
                    <div><div class="d-label">Témoignage vocal</div><div class="d-hint">Enregistrer votre voix<br>directement</div></div>
                </div>
            </div>
            <div class="dialog-note">
                <i class="pi pi-shield" style="color:var(--green);margin-right:6px;"></i>
                <strong>Confidentialité garantie</strong> — Votre identité est protégée conformément à la loi N°010-2004/AN.
            </div>
        </div>
    </div>
</div>
    `
})
export class PortailAccueil implements OnInit, OnDestroy {

    private router       = inject(Router);
    private statsService = inject(StatistiqueService);
    private cfgService   = inject(PortalConfigService);

    c: Record<string, string> = {};
    private destroy$ = new Subject<void>();

    showDialog   = false;
    scrolled     = false;
    statsLoading = true;
    trackingCode = '';
    heroSubtitle = 'La corruption n\'est pas une fatalité. Votre voix compte.';
    footerAbout  = 'Autorité Supérieure de Contrôle d\'État et de Lutte contre la Corruption';

    stats: PublicStats = {
        totalDossiers: 0, dossiersNouveaux: 0, dossiersEnCours: 0,
        dossiersTraites: 0, confidentiel: '100%', delaiJours: 7
    };

    @HostListener('window:scroll')
    onScroll(): void { this.scrolled = window.scrollY > 80; }

    ngOnInit(): void {
        this.cfgService.config$
            .pipe(takeUntil(this.destroy$))
            .subscribe(cfg => {
                this.c = { ...cfg };
                if (cfg['hero_subtitle']) this.heroSubtitle = cfg['hero_subtitle'];
                if (cfg['footer_about'])  this.footerAbout  = cfg['footer_about'];
            });

        this.cfgService.loadPublicConfig();

        this.statsService.getPublicStats().subscribe({
            next:  s  => { this.stats = s; this.statsLoading = false; },
            error: () => { this.statsLoading = false; }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get howSteps() {
        return [
            { title: this.c['step1_title'] || 'Soumission',
              desc:  this.c['step1_desc']  || 'Remplissez le formulaire ou enregistrez votre témoignage vocal' },
            { title: this.c['step2_title'] || 'Enregistrement',
              desc:  this.c['step2_desc']  || 'Votre dossier reçoit un numéro officiel et un code de suivi' },
            { title: this.c['step3_title'] || 'Instruction',
              desc:  this.c['step3_desc']  || "Un agent instruit le dossier et mène l'enquête si nécessaire" },
            { title: this.c['step4_title'] || 'Décision',
              desc:  this.c['step4_desc']  || 'Une décision officielle est rendue et vous est communiquée' },
        ];
    }

    readonly trustItems = [
        { icon:'pi pi-lock',         tone:'green', title:'Anonymat garanti',
          desc:"Votre identité est strictement protégée. Vous pouvez déposer sans révéler qui vous êtes." },
        { icon:'pi pi-shield',       tone:'green', title:'Plateforme sécurisée',
          desc:'Toutes les données sont chiffrées. Aucune information ne peut être interceptée.' },
        { icon:'pi pi-check-circle', tone:'green', title:'Institution officielle',
          desc:"Organe d'État habilité par la loi à recevoir et traiter les plaintes anticorruption." }
    ];

    get channels() {
        return [
            { icon:'pi pi-globe',      name:'Formulaire Web',
              desc:"Déposez en ligne 24h/24 depuis n'importe quel appareil" },
            { icon:'pi pi-microphone', name:'Témoignage Vocal',
              desc:'Enregistrez votre voix dans votre langue maternelle' },
            { icon:'pi pi-phone',      name:'Numéro Vert',
              desc:'Appelez gratuitement le ' + (this.c['hotline_number'] || '80 00 11 11') },
            { icon:'pi pi-building',   name:'Guichet BRPD',
              desc:'Venez en personne au Bureau de Réception des Plaintes' },
            { icon:'pi pi-envelope',   name:'Email',
              desc:'Envoyez vos documents à ' + (this.c['email_contact'] || 'contact@asce-lc.bf') },
            { icon:'pi pi-send',       name:'Courrier Postal',
              desc:'Envoyez votre témoignage écrit par courrier officiel' }
        ];
    }

    goTo(path: string): void { this.showDialog = false; this.router.navigate([path]); }

    goToTracking(): void {
        const code = this.trackingCode.trim();
        if (!code) { this.router.navigate(['/portail/suivi']); return; }
        this.router.navigate(['/portail/suivi'], { queryParams: { code } });
    }
    scrollToTop(): void { window.scrollTo({ top: 0, behavior: 'smooth' }); }
}
