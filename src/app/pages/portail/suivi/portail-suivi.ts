import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse } from '../../../core/models/dossier.model';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-portail-suivi',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, InputTextModule, TagModule, ToastModule
    ],
    providers: [MessageService],
    styles: [`
        @keyframes slide-up {
            from { opacity:0; transform:translateY(20px); }
            to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes pulse-dot {
            0%,100% { transform:scale(1);   opacity:1; }
            50%      { transform:scale(1.4); opacity:.7; }
        }
        :host { display:block; }
        .page {
            min-height:100vh;
            background:linear-gradient(160deg,#f0fdf4 0%,#eff6ff 60%,#f8fafc 100%);
            display:flex; align-items:center; justify-content:center;
            padding:2rem 1rem;
        }
        .card {
            background:#fff; border-radius:20px; padding:2rem;
            border:1.5px solid #e5e7eb;
            box-shadow:0 4px 24px rgba(0,0,0,.07);
            animation:slide-up .35s ease;
        }
        .search-input {
            font-family:monospace; font-size:1.25rem; font-weight:700;
            letter-spacing:.3em; text-align:center; text-transform:uppercase;
            border:2.5px solid #e5e7eb; border-radius:12px; padding:.875rem 1.25rem;
            width:100%; outline:none; transition:border-color .2s;
            color:#111827; background:#fff;
        }
        .search-input:focus { border-color:#16a34a; }
        .step-line {
            width:2px; flex-shrink:0; margin:2px auto;
            min-height:20px;
        }
        .btn-complement {
            display:flex; align-items:center; justify-content:center; gap:.5rem;
            width:100%; padding:.875rem 1.5rem; border-radius:14px;
            background:linear-gradient(135deg,#f59e0b,#d97706);
            color:#fff; font-weight:800; font-size:.9rem;
            border:none; cursor:pointer; transition:all .2s;
            box-shadow:0 4px 12px rgba(245,158,11,.3);
            text-decoration:none;
        }
        .btn-complement:hover {
            transform:translateY(-1px);
            box-shadow:0 6px 16px rgba(245,158,11,.4);
        }
    `],
    template: `
<p-toast />

<div class="page">
    <div style="width:100%;max-width:600px;">

        <!-- ── Header ── -->
        <div style="text-align:center;margin-bottom:2rem;">
            <div style="width:96px;height:96px;border-radius:50%;border:4px solid #16a34a;
                overflow:hidden;margin:0 auto 1.25rem;background:#fff;
                box-shadow:0 8px 24px rgba(22,163,74,.2);">
                <img src="assets/logo-integrite.png" alt="Intégrité+"
                    style="width:100%;height:100%;object-fit:contain;" />
            </div>
            <h1 style="font-size:1.75rem;font-weight:900;color:#111827;margin-bottom:.375rem;">
                INTÉGRITÉ+
            </h1>
            <p style="color:#6b7280;font-size:.875rem;margin-bottom:.5rem;">
                Autorité Supérieure de Contrôle d'État et de Lutte contre la Corruption
            </p>
            <div style="display:inline-flex;align-items:center;gap:.5rem;
                background:#f0fdf4;border:1px solid #86efac;border-radius:24px;
                padding:5px 16px;font-size:.8rem;font-weight:700;color:#16a34a;">
                <i class="pi pi-search" style="font-size:.75rem;"></i>
                Suivi de votre dossier
            </div>
        </div>

        <!-- ── Formulaire recherche ── -->
        <div class="card" style="margin-bottom:1.25rem;">
            <p style="color:#6b7280;font-size:.875rem;text-align:center;
                margin-bottom:1.25rem;line-height:1.6;">
                Saisissez le code d'accès reçu lors du dépôt<br>
                de votre dossier <strong style="color:#374151;">(formulaire B4)</strong>
            </p>

            <div style="display:flex;gap:.75rem;margin-bottom:.875rem;">
                <input class="search-input"
                    [(ngModel)]="accessCode"
                    placeholder="EX: BCS5XHRG"
                    maxlength="8"
                    (keyup.enter)="search()"
                    (ngModelChange)="accessCode = $event?.toUpperCase(); notFound = false" />
                <button (click)="search()"
                    [disabled]="loading || !accessCode || accessCode.length < 6"
                    style="padding:0 1.5rem;border-radius:12px;border:none;cursor:pointer;
                        background:#16a34a;color:#fff;font-weight:700;font-size:.875rem;
                        display:flex;align-items:center;gap:.5rem;white-space:nowrap;
                        transition:all .2s;flex-shrink:0;"
                    [style.opacity]="loading || !accessCode || accessCode.length < 6
                        ? '0.5' : '1'">
                    <i [class]="loading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"></i>
                    {{ loading ? 'Recherche...' : 'Rechercher' }}
                </button>
            </div>

            <!-- Indicateur longueur -->
            <div style="display:flex;justify-content:center;gap:6px;margin-bottom:.5rem;">
                <div *ngFor="let i of codeSlots"
                    style="width:32px;height:4px;border-radius:2px;transition:background .2s;"
                    [style.background]="accessCode.length > i ? '#16a34a' : '#e5e7eb'">
                </div>
            </div>

            <!-- Erreur -->
            <div *ngIf="notFound"
                style="margin-top:.875rem;padding:.875rem;background:#fff5f5;
                    border-radius:12px;border:1.5px solid #fca5a5;
                    display:flex;align-items:flex-start;gap:.75rem;">
                <i class="pi pi-times-circle"
                    style="color:#ef4444;font-size:1.1rem;flex-shrink:0;"></i>
                <div>
                    <div style="font-weight:700;color:#b91c1c;font-size:.875rem;">
                        Aucun dossier trouvé
                    </div>
                    <div style="font-size:.775rem;color:#ef4444;margin-top:2px;">
                        Vérifiez le code sur votre reçu B4.
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Résultat ── -->
        <div *ngIf="dossier">

            <!-- ══ BANDEAU SPÉCIAL — Complément requis ══════════════════ -->
            <div *ngIf="dossier.status === 'EN_ATTENTE_COMPLEMENT'"
                class="card"
                style="margin-bottom:1.25rem;border:2px solid #fbbf24;
                       background:linear-gradient(135deg,#fffbeb,#fff7ed);">

                <!-- Icône + titre -->
                <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.25rem;">
                    <div style="width:48px;height:48px;border-radius:14px;
                                background:#fef3c7;flex-shrink:0;
                                display:flex;align-items:center;justify-content:center;">
                        <i class="pi pi-exclamation-triangle"
                            style="font-size:1.4rem;color:#d97706;"></i>
                    </div>
                    <div>
                        <h3 style="font-weight:900;color:#92400e;font-size:1rem;
                                   margin:0 0 4px;">
                            Action requise — Complément demandé
                        </h3>
                        <p style="color:#b45309;font-size:.8rem;margin:0;line-height:1.6;">
                            L'ASCE-LC a besoin d'informations supplémentaires
                            pour traiter votre dossier.
                        </p>
                    </div>
                </div>

                <!-- Ce qui est demandé (si disponible) -->
                <div *ngIf="dossier.complementMotif"
                    style="background:#fff;border:1px solid #fcd34d;
                           border-radius:12px;padding:1rem;margin-bottom:1.25rem;">
                    <div style="font-size:.7rem;font-weight:700;color:#d97706;
                                text-transform:uppercase;letter-spacing:1px;
                                margin-bottom:.5rem;">
                        Ce qui est demandé
                    </div>
                    <p style="font-size:.875rem;color:#78350f;line-height:1.7;margin:0;">
                        {{ dossier.complementMotif }}
                    </p>
                </div>

                <!-- Options de réponse -->
                <div style="font-size:.75rem;font-weight:700;color:#92400e;
                            text-transform:uppercase;letter-spacing:1px;
                            margin-bottom:.75rem;">
                    Comment soumettre votre complément
                </div>

                <!-- Option 1 — Portail en ligne -->
                <a [routerLink]="['/portail/complement']"
                   [queryParams]="{code: dossier.accessCode}"
                   class="btn-complement"
                   style="margin-bottom:.75rem;">
                    <i class="pi pi-upload" style="font-size:1rem;"></i>
                    <span>Soumettre en ligne maintenant</span>
                    <i class="pi pi-arrow-right" style="font-size:.75rem;margin-left:auto;"></i>
                </a>

                <!-- Option 2 — Guichet -->
                <div style="display:flex;align-items:center;gap:.75rem;
                            padding:.875rem;background:#fff;border-radius:12px;
                            border:1px solid #fde68a;">
                    <div style="width:36px;height:36px;border-radius:10px;
                                background:#fef9c3;flex-shrink:0;
                                display:flex;align-items:center;justify-content:center;">
                        <i class="pi pi-building" style="color:#d97706;font-size:.875rem;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:.8rem;font-weight:700;color:#78350f;">
                            Se présenter au guichet BRPD
                        </div>
                        <div style="font-size:.75rem;color:#b45309;margin-top:2px;">
                            Ouvert du lundi au vendredi — 7h30 à 16h30
                        </div>
                    </div>
                    <a href="tel:80001157"
                        style="font-size:.75rem;font-weight:700;color:#16a34a;
                               text-decoration:none;white-space:nowrap;">
                        <i class="pi pi-phone" style="font-size:.7rem;"></i>
                        80 00 11 57
                    </a>
                </div>
            </div>
            <!-- ══════════════════════════════════════════════════════════ -->

            <!-- Statut principal -->
            <div class="card" style="margin-bottom:1.25rem;">

                <div style="display:flex;align-items:flex-start;
                    justify-content:space-between;margin-bottom:1.25rem;gap:1rem;">
                    <div>
                        <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;
                            letter-spacing:1px;margin-bottom:.375rem;">Code de suivi</div>
                        <div style="font-family:monospace;font-size:1.4rem;font-weight:900;
                            color:#16a34a;letter-spacing:2px;">
                            {{ dossier.accessCode }}
                        </div>
                    </div>
                    <p-tag [value]="getStatusLabel(dossier.status)"
                        [severity]="getStatusSeverity(dossier.status)"
                        styleClass="text-sm" />
                </div>

                <div style="background:#f9fafb;border-radius:12px;padding:.875rem;
                    margin-bottom:.875rem;">
                    <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;
                        letter-spacing:1px;margin-bottom:.375rem;">Objet</div>
                    <div style="font-size:.875rem;font-weight:600;color:#111827;">
                        {{ dossier.object }}
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;
                    gap:.75rem;margin-bottom:1rem;">
                    <div style="background:#f9fafb;border-radius:12px;padding:.875rem;">
                        <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;
                            letter-spacing:1px;margin-bottom:.375rem;">Date de dépôt</div>
                        <div style="font-size:.875rem;font-weight:600;color:#111827;">
                            {{ dossier.createdAt | date:'dd/MM/yyyy' }}
                        </div>
                    </div>
                    <div *ngIf="dossier.receptionDate"
                        style="background:#f9fafb;border-radius:12px;padding:.875rem;">
                        <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;
                            letter-spacing:1px;margin-bottom:.375rem;">
                            Date de réception
                        </div>
                        <div style="font-size:.875rem;font-weight:600;color:#111827;">
                            {{ dossier.receptionDate | date:'dd/MM/yyyy' }}
                        </div>
                    </div>
                </div>

                <!-- Message statut -->
                <div style="padding:.875rem;border-radius:12px;border:1.5px solid;"
                    [style.background]="getStatusBg(dossier.status)"
                    [style.border-color]="getStatusBorder(dossier.status)">
                    <div style="display:flex;align-items:flex-start;gap:.75rem;">
                        <i [class]="getStatusIcon(dossier.status)"
                            style="font-size:1.1rem;flex-shrink:0;margin-top:1px;"
                            [style.color]="getStatusTextColor(dossier.status)"></i>
                        <p style="font-size:.8rem;line-height:1.7;margin:0;"
                            [style.color]="getStatusTextColor(dossier.status)">
                            {{ getStatusMessage(dossier.status) }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Progression -->
            <div class="card" style="margin-bottom:1.25rem;">
                <h3 style="font-weight:800;font-size:.95rem;color:#111827;
                    margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem;">
                    <i class="pi pi-list-check" style="color:#16a34a;"></i>
                    Progression de votre dossier
                </h3>

                <div style="display:flex;flex-direction:column;">
                    <div *ngFor="let step of progressSteps; let last = last"
                        style="display:flex;gap:.875rem;">
                        <div style="display:flex;flex-direction:column;align-items:center;">
                            <div style="width:36px;height:36px;border-radius:50%;
                                display:flex;align-items:center;justify-content:center;
                                flex-shrink:0;border:2.5px solid;transition:all .3s;"
                                [style.background]="step.done ? '#22c55e'
                                    : step.active ? '#f59e0b' : '#f3f4f6'"
                                [style.border-color]="step.done ? '#22c55e'
                                    : step.active ? '#f59e0b' : '#e5e7eb'">
                                <i *ngIf="step.done" class="pi pi-check"
                                    style="color:#fff;font-size:.75rem;"></i>
                                <i *ngIf="step.active && step.status === 'EN_ATTENTE_COMPLEMENT'"
                                    class="pi pi-exclamation-triangle"
                                    style="color:#fff;font-size:.75rem;"></i>
                                <i *ngIf="!step.done && step.status !== 'EN_ATTENTE_COMPLEMENT'"
                                    [class]="step.icon"
                                    style="font-size:.75rem;"
                                    [style.color]="step.active ? '#fff' : '#9ca3af'"></i>
                            </div>
                            <div *ngIf="!last" class="step-line"
                                [style.background]="step.done ? '#86efac' : '#e5e7eb'">
                            </div>
                        </div>
                        <div style="padding-bottom:1.25rem;flex:1;">
                            <div style="font-size:.875rem;font-weight:600;transition:color .3s;"
                                [style.color]="step.done ? '#16a34a'
                                    : step.active && step.status === 'EN_ATTENTE_COMPLEMENT'
                                        ? '#d97706'
                                    : step.active ? '#2563eb' : '#9ca3af'">
                                {{ step.label }}
                            </div>
                            <!-- Badge "Action requise" pour le complément -->
                            <div *ngIf="step.active && step.status === 'EN_ATTENTE_COMPLEMENT'"
                                style="display:inline-flex;align-items:center;gap:4px;
                                font-size:.75rem;color:#d97706;margin-top:3px;
                                background:#fef9c3;padding:2px 10px;border-radius:20px;
                                border:1px solid #fde68a;font-weight:700;">
                                <i class="pi pi-exclamation-circle"
                                    style="font-size:.7rem;"></i>
                                Action requise
                            </div>
                            <!-- Badge "En cours" pour les autres étapes actives -->
                            <div *ngIf="step.active && step.status !== 'EN_ATTENTE_COMPLEMENT'"
                                style="display:inline-flex;align-items:center;gap:4px;
                                font-size:.75rem;color:#3b82f6;margin-top:3px;
                                background:#eff6ff;padding:2px 10px;border-radius:20px;">
                                <div style="width:6px;height:6px;border-radius:50%;
                                    background:#3b82f6;
                                    animation:pulse-dot 1s infinite;"></div>
                                Étape en cours
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:.75rem;justify-content:center;
                margin-bottom:1rem;flex-wrap:wrap;">

                <!-- Bouton complément (si statut EN_ATTENTE_COMPLEMENT) -->
                <a *ngIf="dossier.status === 'EN_ATTENTE_COMPLEMENT'"
                   [routerLink]="['/portail/complement']"
                   [queryParams]="{code: dossier.accessCode}"
                   style="padding:.75rem 1.5rem;border-radius:12px;
                        background:#f59e0b;color:#fff;font-weight:700;
                        font-size:.875rem;text-decoration:none;
                        display:flex;align-items:center;gap:.5rem;">
                    <i class="pi pi-upload"></i>
                    Soumettre mon complément
                </a>

                <button (click)="reset()"
                    style="padding:.75rem 1.5rem;border-radius:12px;
                        border:1.5px solid #e5e7eb;background:#fff;
                        color:#374151;font-weight:600;font-size:.875rem;
                        cursor:pointer;display:flex;align-items:center;gap:.5rem;">
                    <i class="pi pi-refresh"></i>
                    Nouvelle recherche
                </button>

                <a routerLink="/portail"
                    style="padding:.75rem 1.5rem;border-radius:12px;
                        background:#16a34a;color:#fff;font-weight:600;
                        font-size:.875rem;text-decoration:none;
                        display:flex;align-items:center;gap:.5rem;">
                    <i class="pi pi-home"></i>
                    Accueil
                </a>
            </div>

        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:2rem;color:#9ca3af;font-size:.75rem;">
            <p>ASCE-LC — 03 BP 7204 Ouagadougou 03</p>
            <p style="margin-top:4px;">
                <i class="pi pi-phone" style="font-size:.75rem;margin-right:4px;"></i>
                Numéro vert : 80 00 11 57
            </p>
        </div>

    </div>
</div>
    `
})
export class PortailSuivi {

    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);

    accessCode    = '';
    loading       = false;
    notFound      = false;
    dossier: DossierResponse | null = null;
    progressSteps: any[] = [];

    readonly codeSlots = [0, 1, 2, 3, 4, 5, 6, 7];

    search(): void {
        if (!this.accessCode || this.accessCode.length < 6) return;
        this.loading  = true;
        this.notFound = false;
        this.dossier  = null;

        this.dossierService
            .trackByAccessCode(this.accessCode.toUpperCase())
            .subscribe({
                next: dossier => {
                    this.dossier = dossier;
                    this.buildProgressSteps(dossier);
                    this.loading = false;
                },
                error: () => {
                    this.notFound = true;
                    this.loading  = false;
                }
            });
    }

    reset(): void {
        this.dossier    = null;
        this.accessCode = '';
        this.notFound   = false;
    }

    private buildProgressSteps(dossier: DossierResponse): void {
        const steps = [
            { label: 'Dossier déposé',            status: 'SOUMIS',                icon: 'pi pi-upload'    },
            { label: 'Enregistré par le BRPD',    status: 'RECU',                  icon: 'pi pi-inbox'     },
            { label: 'Étude de recevabilité',      status: 'EN_ETUDE_OPPORTUNITE',  icon: 'pi pi-search'    },
            { label: 'Complément requis',          status: 'EN_ATTENTE_COMPLEMENT', icon: 'pi pi-exclamation-triangle' },
            { label: 'Examen par le CTADP',        status: 'EN_REVUE_CTADP',        icon: 'pi pi-users'     },
            { label: 'Décision de recevabilité',   status: 'RECEVABLE',             icon: 'pi pi-check'     },
            { label: 'Investigation en cours',     status: 'EN_INVESTIGATION',      icon: 'pi pi-eye'       },
            { label: "Rapport d'enquête produit",  status: 'RAPPORT_PRODUIT',       icon: 'pi pi-file'      },
            { label: 'Décision finale rendue',     status: 'DECISION_RENDUE',       icon: 'pi pi-hammer'    },
            { label: 'Dossier clôturé',            status: 'CLOS',                  icon: 'pi pi-lock'      }
        ];

        const order        = steps.map(s => s.status);
        const currentIndex = order.indexOf(dossier.status);

        const terminalStatuses = ['IRRECEVABLE', 'TRANSFERE', 'CLASSE'];
        if (terminalStatuses.includes(dossier.status)) {
            this.progressSteps = steps.slice(0, 5).map((step, index) => ({
                ...step,
                done:   index < 4,
                active: false
            }));
            this.progressSteps.push({
                label:  this.getStatusLabel(dossier.status),
                status: dossier.status,
                icon:   dossier.status === 'IRRECEVABLE'
                            ? 'pi pi-times-circle'
                            : dossier.status === 'TRANSFERE'
                                ? 'pi pi-send'
                                : 'pi pi-folder',
                done:   true,
                active: false
            });
            return;
        }

        this.progressSteps = steps.map((step, index) => ({
            ...step,
            done:   index < currentIndex,
            active: index === currentIndex
        }));
    }

    // ── Labels et styles ─────────────────────────────────────────────────

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            SOUMIS:                'Soumis',
            RECU:                  'Reçu',
            EN_ETUDE_OPPORTUNITE:  'En étude',
            EN_ATTENTE_COMPLEMENT: 'Complément requis',
            EN_REVUE_CTADP:        'En revue CTADP',
            RECEVABLE:             'Recevable',
            IRRECEVABLE:           'Irrecevable',
            TRANSFERE:             'Transféré',
            EN_INVESTIGATION:      'En investigation',
            RAPPORT_PRODUIT:       'Rapport produit',
            DECISION_RENDUE:       'Décision rendue',
            CLOS:                  'Clôturé',
            CLASSE:                'Classé'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            SOUMIS:                'info',
            RECU:                  'info',
            EN_ETUDE_OPPORTUNITE:  'warn',
            EN_ATTENTE_COMPLEMENT: 'warn',
            EN_REVUE_CTADP:        'warn',
            RECEVABLE:             'success',
            IRRECEVABLE:           'danger',
            TRANSFERE:             'secondary',
            EN_INVESTIGATION:      'warn',
            RAPPORT_PRODUIT:       'info',
            DECISION_RENDUE:       'success',
            CLOS:                  'success',
            CLASSE:                'secondary'
        };
        return map[status] ?? 'info';
    }

    getStatusMessage(status: string): string {
        const messages: Record<string, string> = {
            SOUMIS:
                "Votre dossier a été soumis et est en attente d'enregistrement " +
                "par le BRPD. Délai maximum : 7 jours ouvrables.",
            RECU:
                "Votre dossier a été officiellement enregistré. " +
                "Un accusé de réception vous sera transmis sous 3 jours.",
            EN_ETUDE_OPPORTUNITE:
                "Votre dossier est en cours d'examen par un conseiller juridique. " +
                "Cette étape peut durer jusqu'à 7 jours ouvrables.",
            EN_ATTENTE_COMPLEMENT:
                "Des informations complémentaires sont nécessaires pour traiter votre dossier. " +
                "Veuillez soumettre les éléments demandés dès que possible.",
            EN_REVUE_CTADP:
                "Votre dossier est soumis au Comité de Traitement et d'Analyse " +
                "des Dénonciations et Plaintes (CTADP) pour délibération.",
            RECEVABLE:
                "Votre dossier a été déclaré recevable par le CGE. " +
                "Une équipe d'investigation va être constituée.",
            IRRECEVABLE:
                "Votre dossier a été déclaré irrecevable. " +
                "Une réponse motivée vous sera transmise dans les 3 jours ouvrables.",
            TRANSFERE:
                "Votre dossier a été transmis à une institution compétente " +
                "pour traitement. Vous pouvez les contacter directement.",
            EN_INVESTIGATION:
                "Une équête est en cours. L'équipe dispose de 90 jours " +
                "pour ses investigations selon le Manuel des Procédures.",
            RAPPORT_PRODUIT:
                "Le rapport d'enquête a été produit par l'équipe d'investigation. " +
                "Il est en cours de validation par les autorités.",
            DECISION_RENDUE:
                "La décision finale a été rendue par le Contrôleur Général d'État. " +
                "Vous serez informé des suites données.",
            CLOS:
                "Votre dossier a été traité et officiellement clôturé. " +
                "Merci pour votre contribution à la lutte contre la corruption.",
            CLASSE:
                "Votre dossier a été classé. " +
                "Contactez l'ASCE-LC pour plus d'informations."
        };
        return messages[status] || 'Votre dossier est en cours de traitement.';
    }

    getStatusBg(status: string): string {
        const map: Record<string, string> = {
            SOUMIS:                '#eff6ff',
            RECU:                  '#eff6ff',
            EN_ETUDE_OPPORTUNITE:  '#fffbeb',
            EN_ATTENTE_COMPLEMENT: '#fff7ed',
            EN_REVUE_CTADP:        '#fffbeb',
            RECEVABLE:             '#f0fdf4',
            IRRECEVABLE:           '#fff5f5',
            TRANSFERE:             '#f9fafb',
            EN_INVESTIGATION:      '#faf5ff',
            RAPPORT_PRODUIT:       '#eff6ff',
            DECISION_RENDUE:       '#f0fdf4',
            CLOS:                  '#f0fdf4',
            CLASSE:                '#f9fafb'
        };
        return map[status] || '#eff6ff';
    }

    getStatusBorder(status: string): string {
        const map: Record<string, string> = {
            SOUMIS:                '#bfdbfe',
            RECU:                  '#bfdbfe',
            EN_ETUDE_OPPORTUNITE:  '#fde68a',
            EN_ATTENTE_COMPLEMENT: '#fed7aa',
            EN_REVUE_CTADP:        '#fde68a',
            RECEVABLE:             '#86efac',
            IRRECEVABLE:           '#fca5a5',
            TRANSFERE:             '#e5e7eb',
            EN_INVESTIGATION:      '#d8b4fe',
            RAPPORT_PRODUIT:       '#bfdbfe',
            DECISION_RENDUE:       '#86efac',
            CLOS:                  '#86efac',
            CLASSE:                '#e5e7eb'
        };
        return map[status] || '#bfdbfe';
    }

    getStatusTextColor(status: string): string {
        const map: Record<string, string> = {
            SOUMIS:                '#1e40af',
            RECU:                  '#1e40af',
            EN_ETUDE_OPPORTUNITE:  '#92400e',
            EN_ATTENTE_COMPLEMENT: '#9a3412',
            EN_REVUE_CTADP:        '#92400e',
            RECEVABLE:             '#166534',
            IRRECEVABLE:           '#991b1b',
            TRANSFERE:             '#374151',
            EN_INVESTIGATION:      '#6b21a8',
            RAPPORT_PRODUIT:       '#1e40af',
            DECISION_RENDUE:       '#166534',
            CLOS:                  '#166534',
            CLASSE:                '#374151'
        };
        return map[status] || '#1e40af';
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            SOUMIS:                'pi pi-info-circle',
            RECU:                  'pi pi-check-circle',
            EN_ETUDE_OPPORTUNITE:  'pi pi-clock',
            EN_ATTENTE_COMPLEMENT: 'pi pi-exclamation-triangle',
            EN_REVUE_CTADP:        'pi pi-clock',
            RECEVABLE:             'pi pi-check-circle',
            IRRECEVABLE:           'pi pi-times-circle',
            TRANSFERE:             'pi pi-arrow-right',
            EN_INVESTIGATION:      'pi pi-eye',
            RAPPORT_PRODUIT:       'pi pi-file',
            DECISION_RENDUE:       'pi pi-check-circle',
            CLOS:                  'pi pi-lock',
            CLASSE:                'pi pi-folder'
        };
        return icons[status] || 'pi pi-info-circle';
    }
}