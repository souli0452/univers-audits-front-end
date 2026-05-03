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
    selector: 'app-suivi-citoyen',
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
            <p style="color:#6b7280;font-size:.875rem;text-align:center;margin-bottom:1.25rem;line-height:1.6;">
                Saisissez le code d'accès reçu lors du dépôt<br>
                de votre dossier <strong style="color:#374151;">(formulaire B4)</strong>
            </p>

            <div style="display:flex;gap:.75rem;margin-bottom:.875rem;">
                <input
                    class="search-input"
                    [(ngModel)]="accessCode"
                    placeholder="EX: BCS5XHRG"
                    maxlength="8"
                    (keyup.enter)="search()"
                    (ngModelChange)="accessCode = $event?.toUpperCase(); notFound = false" />
                <button
                    (click)="search()"
                    [disabled]="loading || !accessCode || accessCode.length < 6"
                    style="padding:0 1.5rem;border-radius:12px;border:none;cursor:pointer;
                        background:#16a34a;color:#fff;font-weight:700;font-size:.875rem;
                        display:flex;align-items:center;gap:.5rem;white-space:nowrap;
                        opacity:1;transition:all .2s;flex-shrink:0;"
                    [style.opacity]="loading || !accessCode || accessCode.length < 6 ? '0.5' : '1'">
                    <i [class]="loading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"></i>
                    {{ loading ? 'Recherche...' : 'Rechercher' }}
                </button>
            </div>

            <!-- Indicateur longueur code -->
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
                <i class="pi pi-times-circle" style="color:#ef4444;font-size:1.1rem;flex-shrink:0;"></i>
                <div>
                    <div style="font-weight:700;color:#b91c1c;font-size:.875rem;">
                        Aucun dossier trouvé
                    </div>
                    <div style="font-size:.775rem;color:#ef4444;margin-top:2px;">
                        Vérifiez le code sur votre reçu B4. Les lettres I, O, 0 peuvent être confondues.
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Résultat ── -->
        <div *ngIf="dossier">

            <!-- Carte statut principal -->
            <div class="card" style="margin-bottom:1.25rem;">

                <!-- En-tête statut -->
                <div style="display:flex;align-items:flex-start;justify-content:space-between;
                    margin-bottom:1.25rem;gap:1rem;">
                    <div>
                        <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;
                            letter-spacing:1px;margin-bottom:.375rem;">
                            Numéro officiel
                        </div>
                        <div style="font-family:monospace;font-size:1.4rem;font-weight:900;
                            color:#16a34a;letter-spacing:2px;">
                            {{ dossier.number || 'En attente' }}
                        </div>
                    </div>
                    <p-tag [value]="getStatusLabel(dossier.status)"
                        [severity]="getStatusSeverity(dossier.status)"
                        styleClass="text-sm" />
                </div>

                <!-- Objet -->
                <div style="background:#f9fafb;border-radius:12px;padding:.875rem;margin-bottom:.875rem;">
                    <div style="font-size:.7rem;color:#9ca3af;text-transform:uppercase;
                        letter-spacing:1px;margin-bottom:.375rem;">Objet</div>
                    <div style="font-size:.875rem;font-weight:600;color:#111827;">
                        {{ dossier.object }}
                    </div>
                </div>

                <!-- Dates -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem;">
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
                            letter-spacing:1px;margin-bottom:.375rem;">Date de réception</div>
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
                            style="font-size:1.1rem;flex-shrink:0;margin-top:1px;"></i>
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
                                [style.background]="step.done ? '#22c55e' : step.active ? '#3b82f6' : '#f3f4f6'"
                                [style.border-color]="step.done ? '#22c55e' : step.active ? '#3b82f6' : '#e5e7eb'">
                                <i *ngIf="step.done" class="pi pi-check"
                                    style="color:#fff;font-size:.75rem;"></i>
                                <i *ngIf="!step.done" [class]="step.icon"
                                    style="font-size:.75rem;"
                                    [style.color]="step.active ? '#fff' : '#9ca3af'"></i>
                                <!-- Point pulsant si actif -->
                                <div *ngIf="step.active && !step.done"
                                    style="position:absolute;width:36px;height:36px;
                                    border-radius:50%;border:2px solid #3b82f6;
                                    animation:pulse-dot 1.5s infinite;opacity:.5;"></div>
                            </div>
                            <div *ngIf="!last" class="step-line"
                                [style.background]="step.done ? '#86efac' : '#e5e7eb'">
                            </div>
                        </div>

                        <div style="padding-bottom:1.25rem;flex:1;">
                            <div style="font-size:.875rem;font-weight:600;transition:color .3s;"
                                [style.color]="step.done ? '#16a34a' : step.active ? '#2563eb' : '#9ca3af'">
                                {{ step.label }}
                            </div>
                            <div *ngIf="step.active"
                                style="display:inline-flex;align-items:center;gap:4px;
                                font-size:.75rem;color:#3b82f6;margin-top:3px;
                                background:#eff6ff;padding:2px 10px;border-radius:20px;">
                                <div style="width:6px;height:6px;border-radius:50%;
                                    background:#3b82f6;animation:pulse-dot 1s infinite;"></div>
                                Étape en cours
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:.75rem;justify-content:center;margin-bottom:1rem;">
                <button (click)="reset()"
                    style="padding:.75rem 1.5rem;border-radius:12px;
                        border:1.5px solid #e5e7eb;background:#fff;
                        color:#374151;font-weight:600;font-size:.875rem;
                        cursor:pointer;display:flex;align-items:center;gap:.5rem;
                        transition:all .2s;">
                    <i class="pi pi-refresh"></i>
                    Nouvelle recherche
                </button>
                <a routerLink="/portail"
                    style="padding:.75rem 1.5rem;border-radius:12px;
                        background:#16a34a;color:#fff;font-weight:600;
                        font-size:.875rem;cursor:pointer;text-decoration:none;
                        display:flex;align-items:center;gap:.5rem;transition:all .2s;">
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
export class SuiviCitoyen {

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
            { label: 'Dossier déposé',              status: 'SOUMIS',               icon: 'pi pi-upload'   },
            { label: 'Enregistré par le BRPD',      status: 'RECU',                 icon: 'pi pi-inbox'    },
            { label: 'Étude de recevabilité',        status: 'EN_ETUDE_OPPORTUNITE', icon: 'pi pi-search'   },
            { label: 'Examen par le CTADP',          status: 'EN_REVUE_CTADP',       icon: 'pi pi-users'    },
            { label: 'Décision de recevabilité',     status: 'RECEVABLE',            icon: 'pi pi-check'    },
            { label: 'Investigation en cours',       status: 'EN_INVESTIGATION',     icon: 'pi pi-eye'      },
            { label: "Rapport d'enquête produit",    status: 'RAPPORT_PRODUIT',      icon: 'pi pi-file'     },
            { label: 'Décision finale rendue',       status: 'DECISION_RENDUE',      icon: 'pi pi-gavel'    },
            { label: 'Dossier clôturé',              status: 'CLOS',                 icon: 'pi pi-lock'     }
        ];

        const order        = steps.map(s => s.status);
        const currentIndex = order.indexOf(dossier.status);

        this.progressSteps = steps.map((step, index) => ({
            ...step,
            done:   index < currentIndex,
            active: index === currentIndex
        }));
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'En étude', EN_ATTENTE_COMPLEMENT: 'Complément requis',
            EN_REVUE_CTADP: 'En revue CTADP', RECEVABLE: 'Recevable',
            IRRECEVABLE: 'Irrecevable', TRANSFERE: 'Transféré',
            EN_INVESTIGATION: 'En investigation', RAPPORT_PRODUIT: 'Rapport produit',
            DECISION_RENDUE: 'Décision rendue', CLOS: 'Clôturé', CLASSE: 'Classé'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            SOUMIS: 'info', RECU: 'info',
            EN_ETUDE_OPPORTUNITE: 'warn', EN_ATTENTE_COMPLEMENT: 'warn', EN_REVUE_CTADP: 'warn',
            RECEVABLE: 'success', IRRECEVABLE: 'danger', TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn', RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success', CLOS: 'success', CLASSE: 'secondary'
        };
        return map[status] ?? 'info';
    }

    getStatusMessage(status: string): string {
        const messages: Record<string, string> = {
            SOUMIS:                "Votre dossier a été soumis et est en attente d'enregistrement par le BRPD. Délai maximum : 7 jours ouvrables.",
            RECU:                  "Votre dossier a été officiellement enregistré. Un accusé de réception vous sera transmis sous 3 jours.",
            EN_ETUDE_OPPORTUNITE:  "Votre dossier est en cours d'examen par un conseiller juridique pour évaluer la compétence de l'ASCE-LC.",
            EN_ATTENTE_COMPLEMENT: "Des informations complémentaires vous ont été demandées. Veuillez contacter l'ASCE-LC pour fournir les éléments manquants.",
            EN_REVUE_CTADP:        "Votre dossier est soumis au Comité de Traitement et d'Analyse. Une décision sera rendue prochainement.",
            RECEVABLE:             "Votre dossier a été déclaré recevable. Une équipe d'investigation va être constituée.",
            IRRECEVABLE:           "Votre dossier a été déclaré irrecevable. Une réponse motivée vous sera transmise dans les 3 jours.",
            TRANSFERE:             "Votre dossier a été transféré à une institution compétente.",
            EN_INVESTIGATION:      "Une enquête est en cours. L'équipe dispose de 90 jours pour mener ses investigations.",
            RAPPORT_PRODUIT:       "Le rapport d'enquête a été produit. Il est en cours d'approbation par la hiérarchie.",
            DECISION_RENDUE:       "La décision finale a été rendue par le Contrôleur Général d'État. Vous serez notifié.",
            CLOS:                  "Votre dossier a été traité et officiellement clôturé. Merci pour votre contribution.",
            CLASSE:                "Votre dossier a été classé. Contactez l'ASCE-LC pour plus d'informations."
        };
        return messages[status] || 'Votre dossier est en cours de traitement.';
    }

    getStatusBg(status: string): string {
        const map: Record<string, string> = {
            SOUMIS: '#eff6ff', RECU: '#eff6ff',
            EN_ETUDE_OPPORTUNITE: '#fffbeb', EN_ATTENTE_COMPLEMENT: '#fff7ed',
            EN_REVUE_CTADP: '#fffbeb', RECEVABLE: '#f0fdf4',
            IRRECEVABLE: '#fff5f5', TRANSFERE: '#f9fafb',
            EN_INVESTIGATION: '#faf5ff', RAPPORT_PRODUIT: '#eff6ff',
            DECISION_RENDUE: '#f0fdf4', CLOS: '#f0fdf4', CLASSE: '#f9fafb'
        };
        return map[status] || '#eff6ff';
    }

    getStatusBorder(status: string): string {
        const map: Record<string, string> = {
            SOUMIS: '#bfdbfe', RECU: '#bfdbfe',
            EN_ETUDE_OPPORTUNITE: '#fde68a', EN_ATTENTE_COMPLEMENT: '#fed7aa',
            EN_REVUE_CTADP: '#fde68a', RECEVABLE: '#86efac',
            IRRECEVABLE: '#fca5a5', TRANSFERE: '#e5e7eb',
            EN_INVESTIGATION: '#d8b4fe', RAPPORT_PRODUIT: '#bfdbfe',
            DECISION_RENDUE: '#86efac', CLOS: '#86efac', CLASSE: '#e5e7eb'
        };
        return map[status] || '#bfdbfe';
    }

    getStatusTextColor(status: string): string {
        const map: Record<string, string> = {
            SOUMIS: '#1e40af', RECU: '#1e40af',
            EN_ETUDE_OPPORTUNITE: '#92400e', EN_ATTENTE_COMPLEMENT: '#9a3412',
            EN_REVUE_CTADP: '#92400e', RECEVABLE: '#166534',
            IRRECEVABLE: '#991b1b', TRANSFERE: '#374151',
            EN_INVESTIGATION: '#6b21a8', RAPPORT_PRODUIT: '#1e40af',
            DECISION_RENDUE: '#166534', CLOS: '#166534', CLASSE: '#374151'
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