import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StatistiqueService, PublicationTrimestrielle, LignePublication } from '../../../core/services/statistique.service';
import { PERIODES, nomDuFichier, periodeARapporter, versCsv } from '../../../core/utils/publication-trimestrielle';

interface TableauAffiche {
    titre: string;
    colonne: string;
    lignes: LignePublication[];
    complement?: string;
}

@Component({
    selector: 'app-publication-trimestrielle',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SelectModule, SkeletonModule, ToastModule],
    providers: [MessageService],
    styles: [`
        .barre { height: 6px; border-radius: 3px; background: #e6efe9; overflow: hidden; }
        .barre > span { display: block; height: 100%; background: #1f7a4d; }
        td, th { padding: .55rem .75rem; }
    `],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div class="flex items-start justify-between flex-wrap gap-3">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Chiffres à publier</h1>
            <p class="text-surface-500 text-sm mt-1 max-w-2xl">
                Chiffres de la « Situation des plaintes et dénonciations » pour un trimestre, un semestre ou l'année.
                Ce sont des totaux : aucun nom, aucune identité, aucun détail de dossier.
            </p>
        </div>
        <div class="flex items-end gap-3 flex-wrap">
            <div class="flex flex-col gap-1">
                <label class="text-xs text-surface-500">Année</label>
                <p-select [options]="annees" [(ngModel)]="annee" (onChange)="charger()"
                    styleClass="w-32" aria-label="Année" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-xs text-surface-500">Période</label>
                <p-select [options]="periodes" optionLabel="label" optionValue="value"
                    [(ngModel)]="periode" (onChange)="charger()" styleClass="w-48" aria-label="Période" />
            </div>
            <p-button label="Exporter (CSV)" icon="pi pi-download" [outlined]="true"
                [disabled]="!situation" (onClick)="exporter()" />
        </div>
    </div>

    @if (erreur) {
        <div class="rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm p-4">{{ erreur }}</div>
    }

    @if (chargement) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            @for (i of [1,2,3,4]; track i) { <p-skeleton height="12rem" /> }
        </div>
    }

    @if (situation && !chargement) {
        <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex items-baseline gap-4 flex-wrap">
            <span class="text-4xl font-bold text-primary">{{ situation.total }}</span>
            <span class="text-surface-600 dark:text-surface-300">
                dossiers enregistrés au {{ situation.periode }}
            </span>
            @if (situation.total === 0) {
                <span class="text-sm text-surface-500">Aucun dossier enregistré sur cette période.</span>
            }
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
            @for (t of tableaux; track t.titre) {
                <section class="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                    <h2 class="text-base font-semibold px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                        {{ t.titre }}
                    </h2>
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-surface-500">
                                <th>{{ t.colonne }}</th>
                                <th class="text-right">Nombre</th>
                                <th class="text-right">Part</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (l of t.lignes; track l.code) {
                                <tr class="border-t border-surface-100 dark:border-surface-700">
                                    <td>
                                        {{ l.libelle }}
                                        <div class="barre mt-1" aria-hidden="true"><span [style.width.%]="l.taux"></span></div>
                                    </td>
                                    <td class="text-right font-medium">{{ l.nombre }}</td>
                                    <td class="text-right text-surface-500">{{ nombre(l.taux, 2) }} %</td>
                                </tr>
                            } @empty {
                                <tr><td colspan="3" class="text-surface-400 text-center py-4">Aucune donnée sur la période.</td></tr>
                            }
                        </tbody>
                    </table>
                    @if (t.complement) {
                        <p class="px-4 py-3 text-sm border-t border-surface-200 dark:border-surface-700">{{ t.complement }}</p>
                    }
                </section>
            }

            <section class="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                <h2 class="text-base font-semibold px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                    Vélocité du traitement
                </h2>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-surface-500">
                            <th>Phase</th><th class="text-right">Dossiers</th><th class="text-right">Délai moyen</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (p of situation.velocite; track p.code) {
                            <tr class="border-t border-surface-100 dark:border-surface-700">
                                <td>{{ p.libelle }}</td>
                                <td class="text-right font-medium">{{ p.nombre }}</td>
                                <td class="text-right text-surface-500">
                                    {{ p.delaiMoyenJours == null ? 'non mesuré' : nombre(p.delaiMoyenJours, 1) + ' jours' }}
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </section>
        </div>

        <ul class="text-xs text-surface-500 list-disc pl-5 flex flex-col gap-1">
            @for (n of situation.notes; track n) { <li>{{ n }}</li> }
        </ul>
    }
</div>
    `
})
export class PublicationTrimestrielleComponent implements OnInit {

    private readonly service = inject(StatistiqueService);
    private readonly toast = inject(MessageService);

    situation: PublicationTrimestrielle | null = null;
    chargement = false;
    erreur = '';

    private readonly depart = periodeARapporter(new Date());
    annee = this.depart.annee;
    periode = this.depart.periode;

    readonly annees = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);
    readonly periodes = PERIODES;

    ngOnInit(): void {
        this.charger();
    }

    charger(): void {
        this.chargement = true;
        this.erreur = '';
        this.service.getPublicationTrimestrielle(this.annee, this.periode).subscribe({
            next: s => { this.situation = s; this.chargement = false; },
            error: () => {
                this.situation = null;
                this.chargement = false;
                this.erreur = 'Impossible de charger la situation de cette période. Réessayez dans un instant.';
            }
        });
    }

    get tableaux(): TableauAffiche[] {
        const s = this.situation;
        if (!s) { return []; }
        return [
            { titre: 'Catégories', colonne: 'Catégorie', lignes: s.categories },
            { titre: 'Modes de saisine', colonne: 'Mode', lignes: s.modesDeSaisine },
            { titre: 'Typologie institutionnelle', colonne: 'Type d\'institution', lignes: s.typologiesInstitutionnelles },
            { titre: 'Allégations', colonne: 'Infraction', lignes: s.allegations },
            {
                titre: 'Situation de traitement', colonne: 'Situation', lignes: s.traitement,
                complement: `Enjeux financiers estimés : ${this.nombre(s.enjeuxFinanciers)} FCFA`
            },
            { titre: 'Recevabilité', colonne: 'Décision', lignes: s.recevabilite },
            { titre: 'Origine géographique', colonne: 'Zone', lignes: s.originesGeographiques }
        ];
    }

    /** Nombre à la française (virgule décimale, espace entre les milliers), sans dépendre des données de langue. */
    nombre(valeur: number, decimales = 0): string {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimales }).format(valeur);
    }

    exporter(): void {
        if (!this.situation) { return; }
        const blob = new Blob(['﻿' + versCsv(this.situation)], { type: 'text/csv;charset=utf-8' });
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(blob);
        lien.download = nomDuFichier(this.situation);
        lien.click();
        URL.revokeObjectURL(lien.href);
        this.toast.add({ severity: 'success', summary: 'Export prêt', detail: lien.download, life: 3000 });
    }
}
