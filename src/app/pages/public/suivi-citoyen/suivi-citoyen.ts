import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse } from '../../../core/models/dossier.model';

@Component({
    selector: 'app-suivi-citoyen',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule,
        InputTextModule, TagModule, TimelineModule,
        CardModule, ToastModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">

        <!-- En-tête ASCE-LC -->
        <div class="text-center mb-8">
            <div class="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i class="pi pi-shield text-white text-3xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">
                ASCE-LC
            </h1>
            <p class="text-gray-500 mt-1">
                Autorité Supérieure de Contrôle d'État
                et de Lutte contre la Corruption
            </p>
            <h2 class="text-xl font-semibold text-green-700 mt-3">
                Suivi de votre dossier
            </h2>
        </div>

        <!-- Formulaire de recherche -->
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <p class="text-gray-600 text-sm mb-4 text-center">
                Saisissez le code d'accès reçu lors du dépôt
                de votre dossier (formulaire B4)
            </p>

            <div class="flex gap-2">
                <input
                    pInputText
                    [(ngModel)]="accessCode"
                    placeholder="Ex: BCS5XHRG"
                    class="flex-1 uppercase font-mono text-lg tracking-widest text-center"
                    style="letter-spacing: 0.3em"
                    maxlength="8"
                    (keyup.enter)="search()"
                    (ngModelChange)="accessCode = $event?.toUpperCase()" />
                <p-button
                    label="Rechercher"
                    icon="pi pi-search"
                    [loading]="loading"
                    [disabled]="!accessCode || accessCode.length < 6"
                    (onClick)="search()" />
            </div>

            <div *ngIf="notFound" class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                <i class="pi pi-exclamation-circle text-red-500 mr-2"></i>
                <span class="text-red-700 text-sm">
                    Aucun dossier trouvé pour ce code.
                    Vérifiez le code sur votre reçu B4.
                </span>
            </div>
        </div>

        <!-- Résultat -->
        <div *ngIf="dossier" class="flex flex-col gap-4">

            <!-- Statut principal -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <div class="text-xs text-gray-400 mb-1">
                            Numéro officiel
                        </div>
                        <div class="font-mono font-bold text-xl text-green-700">
                            {{ dossier.number || 'En attente de numérotation' }}
                        </div>
                    </div>
                    <p-tag
                        [value]="getStatusLabel(dossier.status)"
                        [severity]="getStatusSeverity(dossier.status)"
                        styleClass="text-sm px-3 py-1" />
                </div>

                <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-xs text-gray-400 mb-1">Objet</div>
                    <div class="text-sm font-medium">{{ dossier.object }}</div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <div class="text-xs text-gray-400 mb-1">
                            Date de dépôt
                        </div>
                        <div class="font-medium">
                            {{ dossier.createdAt | date:'dd/MM/yyyy' }}
                        </div>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg"
                         *ngIf="dossier.receptionDate">
                        <div class="text-xs text-gray-400 mb-1">
                            Date de réception
                        </div>
                        <div class="font-medium">
                            {{ dossier.receptionDate | date:'dd/MM/yyyy' }}
                        </div>
                    </div>
                </div>

                <!-- Message selon statut -->
                <div class="mt-4 p-3 rounded-lg border"
                     [class]="getStatusMessageClass(dossier.status)">
                    <div class="flex items-start gap-2">
                        <i [class]="getStatusIcon(dossier.status) + ' mt-0.5'"></i>
                        <p class="text-sm">
                            {{ getStatusMessage(dossier.status) }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Timeline simplifié -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <h3 class="font-semibold mb-4 text-gray-800">
                    Progression de votre dossier
                </h3>

                <div class="flex flex-col gap-0">
                    <div *ngFor="let step of progressSteps; let last = last"
                         class="flex items-start gap-3">
                        <div class="flex flex-col items-center">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                 [class]="step.done
                                    ? 'bg-green-500'
                                    : step.active
                                        ? 'bg-blue-500 animate-pulse'
                                        : 'bg-gray-200'">
                                <i [class]="step.icon + ' text-xs'"
                                   [class.text-white]="step.done || step.active"
                                   [class.text-gray-400]="!step.done && !step.active"></i>
                            </div>
                            <div *ngIf="!last"
                                 class="w-0.5 h-6 mt-1"
                                 [class]="step.done ? 'bg-green-300' : 'bg-gray-200'">
                            </div>
                        </div>
                        <div class="pb-4">
                            <div class="text-sm font-medium"
                                 [class.text-green-600]="step.done"
                                 [class.text-blue-600]="step.active"
                                 [class.text-gray-400]="!step.done && !step.active">
                                {{ step.label }}
                            </div>
                            <div *ngIf="step.active" class="text-xs text-blue-500 mt-0.5">
                                Étape en cours
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Nouvelle recherche -->
            <div class="text-center">
                <p-button
                    label="Nouvelle recherche"
                    icon="pi pi-refresh"
                    severity="secondary"
                    outlined
                    (onClick)="reset()" />
            </div>

        </div>

        <!-- Footer -->
        <div class="text-center mt-8 text-xs text-gray-400">
            <p>ASCE-LC — 03 BP 7204 Ouagadougou 03</p>
            <p class="mt-1">Numéro vert : 80 00 11 57</p>
        </div>

    </div>
</div>
    `
})
export class SuiviCitoyen {

    private dossierService = inject(DossierService);
    private messageService = inject(MessageService);

    accessCode = '';
    loading = false;
    notFound = false;
    dossier: DossierResponse | null = null;
    progressSteps: any[] = [];

    search(): void {
        if (!this.accessCode) return;

        this.loading = true;
        this.notFound = false;
        this.dossier = null;

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
                    this.loading = false;
                }
            });
    }

    reset(): void {
        this.dossier = null;
        this.accessCode = '';
        this.notFound = false;
    }

    private buildProgressSteps(dossier: DossierResponse): void {
        const steps = [
            {
                label: 'Dossier déposé',
                status: 'SOUMIS',
                icon: 'pi pi-upload'
            },
            {
                label: 'Enregistré par le BRPD',
                status: 'RECU',
                icon: 'pi pi-inbox'
            },
            {
                label: 'Étude de recevabilité',
                status: 'EN_ETUDE_OPPORTUNITE',
                icon: 'pi pi-search'
            },
            {
                label: 'Examen par le CTADP',
                status: 'EN_REVUE_CTADP',
                icon: 'pi pi-users'
            },
            {
                label: 'Décision de recevabilité',
                status: 'RECEVABLE',
                icon: 'pi pi-check'
            },
            {
                label: 'Investigation en cours',
                status: 'EN_INVESTIGATION',
                icon: 'pi pi-eye'
            },
            {
                label: 'Rapport d\'enquête produit',
                status: 'RAPPORT_PRODUIT',
                icon: 'pi pi-file'
            },
            {
                label: 'Décision finale rendue',
                status: 'DECISION_RENDUE',
                icon: 'pi pi-gavel'
            },
            {
                label: 'Dossier clôturé',
                status: 'CLOS',
                icon: 'pi pi-lock'
            }
        ];

        const order = steps.map(s => s.status);
        const currentIndex = order.indexOf(dossier.status);

        this.progressSteps = steps.map((step, index) => ({
            ...step,
            done: index < currentIndex,
            active: index === currentIndex
        }));
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis',
            RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'En étude',
            EN_ATTENTE_COMPLEMENT: 'Complément requis',
            EN_REVUE_CTADP: 'En revue CTADP',
            RECEVABLE: 'Recevable',
            IRRECEVABLE: 'Irrecevable',
            TRANSFERE: 'Transféré',
            EN_INVESTIGATION: 'En investigation',
            RAPPORT_PRODUIT: 'Rapport produit',
            DECISION_RENDUE: 'Décision rendue',
            CLOS: 'Clôturé',
            CLASSE: 'Classé'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): any {
        const map: Record<string, string> = {
            SOUMIS: 'info', RECU: 'info',
            EN_ETUDE_OPPORTUNITE: 'warn',
            EN_ATTENTE_COMPLEMENT: 'warn',
            EN_REVUE_CTADP: 'warn',
            RECEVABLE: 'success',
            IRRECEVABLE: 'danger',
            TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn',
            RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success',
            CLOS: 'success',
            CLASSE: 'secondary'
        };
        return map[status] || 'info';
    }

    getStatusMessage(status: string): string {
        const messages: Record<string, string> = {
            SOUMIS: 'Votre dossier a été soumis et est en attente d\'enregistrement par le BRPD. Délai maximum : 7 jours ouvrables.',
            RECU: 'Votre dossier a été officiellement enregistré. Un numéro officiel vous a été attribué. Un accusé de réception vous sera transmis sous 3 jours.',
            EN_ETUDE_OPPORTUNITE: 'Votre dossier est en cours d\'examen par un conseiller juridique pour évaluer la compétence de l\'ASCE-LC.',
            EN_ATTENTE_COMPLEMENT: 'Des informations complémentaires vous ont été demandées. Veuillez contacter l\'ASCE-LC pour fournir les éléments manquants.',
            EN_REVUE_CTADP: 'Votre dossier est soumis au Comité de Traitement et d\'Analyse. Une décision sera rendue prochainement.',
            RECEVABLE: 'Votre dossier a été déclaré recevable. Une équipe d\'investigation va être constituée.',
            IRRECEVABLE: 'Votre dossier a été déclaré irrecevable. Une réponse motivée vous sera transmise dans les 3 jours.',
            TRANSFERE: 'Votre dossier a été transféré à une institution compétente. Vous serez informé de l\'institution destinataire.',
            EN_INVESTIGATION: 'Une enquête est en cours. L\'équipe dispose de 90 jours pour mener ses investigations.',
            RAPPORT_PRODUIT: 'Le rapport d\'enquête a été produit. Il est en cours d\'approbation par la hiérarchie.',
            DECISION_RENDUE: 'La décision finale a été rendue par le Contrôleur Général d\'État. Vous serez notifié.',
            CLOS: 'Votre dossier a été traité et officiellement clôturé. Merci pour votre contribution à la lutte contre la corruption.',
            CLASSE: 'Votre dossier a été classé. Vous pouvez contacter l\'ASCE-LC pour plus d\'informations.'
        };
        return messages[status] || 'Votre dossier est en cours de traitement.';
    }

    getStatusMessageClass(status: string): string {
        const classes: Record<string, string> = {
            SOUMIS: 'bg-blue-50 border-blue-200 text-blue-800',
            RECU: 'bg-blue-50 border-blue-200 text-blue-800',
            EN_ETUDE_OPPORTUNITE: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            EN_ATTENTE_COMPLEMENT: 'bg-orange-50 border-orange-200 text-orange-800',
            EN_REVUE_CTADP: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            RECEVABLE: 'bg-green-50 border-green-200 text-green-800',
            IRRECEVABLE: 'bg-red-50 border-red-200 text-red-800',
            TRANSFERE: 'bg-gray-50 border-gray-200 text-gray-800',
            EN_INVESTIGATION: 'bg-purple-50 border-purple-200 text-purple-800',
            RAPPORT_PRODUIT: 'bg-blue-50 border-blue-200 text-blue-800',
            DECISION_RENDUE: 'bg-green-50 border-green-200 text-green-800',
            CLOS: 'bg-green-50 border-green-200 text-green-800',
            CLASSE: 'bg-gray-50 border-gray-200 text-gray-800'
        };
        return classes[status] || 'bg-blue-50 border-blue-200 text-blue-800';
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            SOUMIS: 'pi pi-info-circle text-blue-500',
            RECU: 'pi pi-check-circle text-blue-500',
            EN_ETUDE_OPPORTUNITE: 'pi pi-clock text-yellow-500',
            EN_ATTENTE_COMPLEMENT: 'pi pi-exclamation-triangle text-orange-500',
            EN_REVUE_CTADP: 'pi pi-clock text-yellow-500',
            RECEVABLE: 'pi pi-check-circle text-green-500',
            IRRECEVABLE: 'pi pi-times-circle text-red-500',
            TRANSFERE: 'pi pi-arrow-right text-gray-500',
            EN_INVESTIGATION: 'pi pi-eye text-purple-500',
            RAPPORT_PRODUIT: 'pi pi-file text-blue-500',
            DECISION_RENDUE: 'pi pi-check-circle text-green-500',
            CLOS: 'pi pi-lock text-green-500',
            CLASSE: 'pi pi-folder text-gray-500'
        };
        return icons[status] || 'pi pi-info-circle text-blue-500';
    }
}