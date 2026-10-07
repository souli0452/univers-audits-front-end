import { Component, inject, OnInit } from '@angular/core';
import { StatistiqueService } from '../../../core/services/statistique.service';
import { PublicStats } from '../../../core/models/statistique.model';
import { PortailPage } from '../shared/portail-page';
import { ApercuChiffres, SEUIL_TAUX_TRAITEMENT } from '../shared/apercu-chiffres';

export { versBarres, LIBELLES_TYPE, LIBELLES_CANAL } from '../shared/apercu-chiffres';
export type { LigneBarre } from '../shared/apercu-chiffres';

/**
 * Chiffres publics : synthèse, avancement des dossiers, évolution sur cinq ans, répartition par nature et
 * par canal. Uniquement des totaux agrégés fournis par `/stats/public`, aucune donnée personnelle.
 */
@Component({
    selector: 'app-portail-chiffres',
    standalone: true,
    imports: [PortailPage, ApercuChiffres],
    styles: [`
        :host{--ink-60:rgba(0,54,23,.74)}
        .note{font-size:.78rem;color:var(--ink-60);line-height:1.6;margin:1.25rem 0 0}
    `],
    template: `
        <app-portail-page titre="Chiffres" intro="Le volume des signalements reçus et leur évolution. Ces chiffres sont des totaux : aucune information personnelle n'est affichée.">
            <app-apercu-chiffres [stats]="stats" [chargement]="chargement" [erreur]="erreur" />
            @if (stats) {
                <p class="note">Les chiffres couvrent les signalements enregistrés sur la plateforme. Un dossier est « nouveau » tant qu'il n'a pas été pris en charge, « en cours » pendant l'instruction, et « traité » une fois décidé, classé, clos ou déclaré irrecevable. Le taux de traitement, part de dossiers traités parmi ceux reçus, est publié à partir de {{ seuil }} dossiers reçus : en dessous, il ne refléterait pas l'activité du service.</p>
            }
        </app-portail-page>
    `
})
export class PortailChiffres implements OnInit {
    private readonly service = inject(StatistiqueService);

    stats: PublicStats | null = null;
    readonly seuil = SEUIL_TAUX_TRAITEMENT;
    chargement = true;
    erreur = false;

    ngOnInit(): void {
        this.service.getPublicStats().subscribe({
            next: s => { this.stats = s; this.chargement = false; },
            error: () => { this.erreur = true; this.chargement = false; }
        });
    }
}
