import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessMatrixService, MatriceAcces, ModuleAcces } from '../../../core/services/access-matrix.service';

type Niveau = 'tout' | 'partiel' | 'aucun' | 'sans';

/**
 * « Accès par rôle » : ce que chaque rôle peut consulter ou faire, calculé à partir des contrôles d'accès
 * réellement présents dans le code. Page en lecture seule : elle ne donne ni ne retire aucun droit.
 */
@Component({
    selector: 'app-acces-roles',
    standalone: true,
    imports: [CommonModule],
    template: `
<div class="flex flex-col gap-6">

    <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Accès par rôle</h1>
    </div>

    <div *ngIf="loading" class="h-64 bg-surface-100 rounded-2xl animate-pulse"></div>

    <div *ngIf="error" class="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
        Impossible de charger les accès. Réessayez dans un instant.
    </div>

    <div *ngIf="matrice && !loading"
        class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100
               dark:border-surface-700 overflow-x-auto">

        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-surface-100">
                    <th class="text-left py-3 px-4 text-xs text-surface-400 font-semibold
                               uppercase tracking-wide sticky left-0 bg-white
                               dark:bg-surface-800 min-w-48">Module</th>
                    <th *ngFor="let r of matrice.roles"
                        class="py-3 px-3 text-center min-w-36 align-bottom">
                        <div class="font-semibold text-surface-700 dark:text-surface-100 text-xs">
                            {{ roleLabel(r.code) }}
                        </div>
                        <div class="text-xs text-surface-400 font-normal mt-0.5">
                            {{ r.agents }} agent{{ r.agents > 1 ? 's' : '' }}
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let m of matrice.modules" class="border-b border-surface-50 last:border-0">
                    <td class="py-3 px-4 font-medium text-surface-800 dark:text-surface-100
                               sticky left-0 bg-white dark:bg-surface-800">
                        {{ m.libelle }}
                    </td>
                    <td *ngFor="let r of matrice.roles" class="py-2 px-3 text-center align-middle">
                        <div class="flex flex-col items-center gap-1">
                            <span *ngIf="niveau(m, r.code, 'consulter') !== 'sans'"
                                class="text-xs px-2 py-0.5 rounded-md whitespace-nowrap"
                                [ngClass]="classe(niveau(m, r.code, 'consulter'))">
                                Voir · {{ texte(m, r.code, 'consulter') }}
                            </span>
                            <span *ngIf="niveau(m, r.code, 'agir') !== 'sans'"
                                class="text-xs px-2 py-0.5 rounded-md whitespace-nowrap"
                                [ngClass]="classe(niveau(m, r.code, 'agir'))">
                                Agir · {{ texte(m, r.code, 'agir') }}
                            </span>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div *ngIf="matrice && !loading" class="text-xs text-surface-500 flex flex-wrap gap-x-6 gap-y-2">
        <span><span class="px-2 py-0.5 rounded-md bg-green-50 text-green-700">Voir · tout</span>
            accès à toutes les consultations du module</span>
        <span><span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">Voir · 3/7</span>
            accès à une partie seulement</span>
        <span><span class="text-surface-300">aucune pastille</span> : pas d'accès (ou module sans consultation / action)</span>
    </div>
</div>
    `
})
export class AccesRoles implements OnInit {

    private readonly service = inject(AccessMatrixService);

    matrice: MatriceAcces | null = null;
    loading = true;
    error = false;

    ngOnInit(): void {
        this.service.get().subscribe({
            next: m => { this.matrice = m; this.loading = false; },
            error: () => { this.error = true; this.loading = false; }
        });
    }

    roleLabel(role: string): string {
        const labels: Record<string, string> = {
            ADMIN_DDIC: 'Administrateur DDIC', AGENT_BRPD: 'Agent BRPD',
            CGE: "Contrôleur Général d'État", CGEA: 'Contrôleur Général Adjoint',
            CONSEILLER_JURIDIQUE: 'Conseiller Juridique', CONTROLEUR_ETAT: "Contrôleur d'État",
            MEMBRE_CTADP: 'Membre CTADP', DCP: 'DCP'
        };
        return labels[role] || role;
    }

    niveau(m: ModuleAcces, role: string, genre: 'consulter' | 'agir'): Niveau {
        const total = genre === 'consulter' ? m.totalConsulter : m.totalAgir;
        if (total === 0) return 'sans';
        const n = m.parRole[role]?.[genre] ?? 0;
        if (n === 0) return 'sans';
        return n >= total ? 'tout' : 'partiel';
    }

    texte(m: ModuleAcces, role: string, genre: 'consulter' | 'agir'): string {
        const total = genre === 'consulter' ? m.totalConsulter : m.totalAgir;
        const n = m.parRole[role]?.[genre] ?? 0;
        return n >= total ? 'tout' : `${n}/${total}`;
    }

    classe(niveau: Niveau): string {
        return niveau === 'tout' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700';
    }
}
