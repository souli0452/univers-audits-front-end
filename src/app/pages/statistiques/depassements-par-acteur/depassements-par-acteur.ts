import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { StatistiqueService, ActeurDepassement } from '../../../core/services/statistique.service';

const TYPE_LABELS: Record<string, string> = {
    ACCUSE_RECEPTION:    'Accusé de réception',
    COMPLEMENT:          'Complément',
    INVESTIGATION:       'Investigation',
    DEMANDE_DOCUMENTS:   'Demande de documents'
};

@Component({
    selector: 'app-depassements-par-acteur',
    standalone: true,
    imports: [
        CommonModule, RouterModule, ButtonModule,
        SkeletonModule, TagModule, ToastModule, TooltipModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Dépassements par acteur
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Dossiers en dépassement de délai, regroupés par agent en charge
            </p>
        </div>
        <p-button icon="pi pi-refresh" severity="secondary" outlined
            pTooltip="Actualiser" (onClick)="load()"/>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-red-100 dark:bg-red-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-users text-red-600 dark:text-red-400"></i>
                </div>
                <span class="text-surface-400 text-sm">Acteurs concernés</span>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black text-surface-900 dark:text-surface-0">
                    {{ acteurs.length }}
                </div>
            </ng-container>
        </div>

        <div class="bg-white dark:bg-surface-800 rounded-2xl p-5
                    border border-surface-100 dark:border-surface-700 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900
                            rounded-xl flex items-center justify-center">
                    <i class="pi pi-folder-open text-amber-600 dark:text-amber-400"></i>
                </div>
                <span class="text-surface-400 text-sm">Dossiers en dépassement</span>
            </div>
            <ng-container *ngIf="!loading; else skKpi">
                <div class="text-3xl font-black text-amber-600">
                    {{ totalDossiers }}
                </div>
            </ng-container>
        </div>
    </div>

    <div *ngIf="loading" class="flex flex-col gap-3">
        <p-skeleton *ngFor="let i of [1,2,3,4]" height="120px" borderRadius="16px"/>
    </div>

    <div *ngIf="!loading && acteurs.length === 0"
        class="bg-white dark:bg-surface-800 rounded-2xl p-16
               border border-surface-100 text-center">
        <div class="w-16 h-16 rounded-2xl bg-green-100
                    flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-check-circle text-2xl text-green-500"></i>
        </div>
        <p class="font-semibold text-surface-500">Aucun dépassement</p>
        <p class="text-xs text-surface-400 mt-1">
            Tous les dossiers sont dans les délais réglementaires
        </p>
    </div>

    <div *ngIf="!loading && acteurs.length > 0" class="flex flex-col gap-4">
        <div *ngFor="let acteur of acteurs"
            class="bg-white dark:bg-surface-800 rounded-2xl p-5
                   border border-surface-100 dark:border-surface-700 shadow-sm">

            <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900
                                rounded-xl flex items-center justify-center">
                        <i class="pi pi-user text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div>
                        <p class="font-bold text-surface-900 dark:text-surface-0">
                            {{ acteur.nomComplet }}
                        </p>
                        <p class="text-xs text-surface-400">
                            {{ acteur.matricule }}
                            <span *ngIf="acteur.departementLibelle">
                                · {{ acteur.departementLibelle }}
                            </span>
                        </p>
                    </div>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium border
                             bg-red-50 text-red-700 border-red-200">
                    {{ acteur.dossiersEnDepassement.length }} dossier(s)
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-surface-100 dark:border-surface-700">
                            <th class="text-left py-2 px-3 text-xs text-surface-400
                                       font-semibold uppercase tracking-wide">Dossier</th>
                            <th class="text-left py-2 px-3 text-xs text-surface-400
                                       font-semibold uppercase tracking-wide">Type</th>
                            <th class="text-left py-2 px-3 text-xs text-surface-400
                                       font-semibold uppercase tracking-wide">Échéance</th>
                            <th class="text-right py-2 px-3 text-xs text-surface-400
                                       font-semibold uppercase tracking-wide">Retard</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let item of acteur.dossiersEnDepassement"
                            class="border-b border-surface-50 dark:border-surface-700
                                   hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors
                                   cursor-pointer"
                            [routerLink]="['/app/dossiers', item.dossierId]">
                            <td class="py-2.5 px-3 font-mono font-semibold text-primary-600">
                                {{ item.numero }}
                            </td>
                            <td class="py-2.5 px-3">
                                <p-tag [value]="getTypeLabel(item.type)" severity="warn"
                                    styleClass="text-xs"/>
                            </td>
                            <td class="py-2.5 px-3 text-surface-500">
                                {{ item.echeance | date:'dd/MM/yyyy' }}
                            </td>
                            <td class="text-right py-2.5 px-3 font-black text-red-600">
                                {{ item.joursDeRetard }}j
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</div>

<ng-template #skKpi>
    <p-skeleton height="2.5rem" borderRadius="8px"/>
</ng-template>
    `
})
export class DepassementsParActeur implements OnInit {

    private statistiqueService = inject(StatistiqueService);
    private messageService     = inject(MessageService);

    loading = true;
    acteurs: ActeurDepassement[] = [];

    get totalDossiers(): number {
        return this.acteurs.reduce((sum, a) => sum + a.dossiersEnDepassement.length, 0);
    }

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.statistiqueService.getDepassementsParActeur().subscribe({
            next: acteurs => {
                this.acteurs = acteurs;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'warn', summary: 'Dépassements',
                    detail: 'Impossible de charger le tableau des dépassements'
                });
            }
        });
    }

    getTypeLabel(type: string): string {
        return TYPE_LABELS[type] ?? type;
    }
}
