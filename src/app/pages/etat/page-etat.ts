import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Page d'état plein écran (page introuvable, accès refusé, erreur) aux couleurs de l'ASCE-LC : fond blanc, vert
 * de la charte, logo qui ramène à l'accueil. Une seule mise en page pour que ces pages se ressemblent.
 */
@Component({
    selector: 'app-page-etat',
    standalone: true,
    imports: [RouterModule],
    // Les marges de p et h1 sont posées par la feuille de style globale ; on les neutralise ici et on espace par « gap ».
    styles: [`h1, p { margin: 0; }`],
    template: `
        <main class="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4 py-10 text-center border-t-4 border-primary-600">
            <a routerLink="/" class="inline-block" aria-label="Retour à l’accueil de l’ASCE-LC">
                <img src="assets/logo-asce.png" alt="ASCE-LC" class="h-16 w-auto" />
            </a>

            <div class="flex flex-col items-center gap-3">
                <p data-testid="code" class="text-7xl sm:text-8xl font-extrabold leading-none text-primary-600">{{ code() }}</p>
                <h1 class="text-2xl sm:text-3xl font-bold text-surface-900">{{ titre() }}</h1>
                <p class="max-w-md text-surface-600">{{ message() }}</p>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3">
                <a routerLink="/"
                   class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    <i class="pi pi-home"></i>Retour à l’accueil</a>
                <a routerLink="/app"
                   class="inline-flex items-center gap-2 rounded-lg border border-primary-600 px-5 py-2.5 font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    <i class="pi pi-sign-in"></i>Espace agent</a>
            </div>

            <p class="text-xs text-surface-500">Autorité Supérieure de Contrôle d’État et de Lutte contre la Corruption — Burkina Faso</p>
        </main>
    `
})
export class PageEtat {
    readonly code    = input.required<string>();
    readonly titre   = input.required<string>();
    readonly message = input.required<string>();
}
