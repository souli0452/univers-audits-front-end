import { Component } from '@angular/core';
import { PageEtat } from '../etat/page-etat';

@Component({
    selector: 'app-error',
    standalone: true,
    imports: [PageEtat],
    template: `<app-page-etat code="Erreur" titre="Une erreur est survenue"
        message="La ressource demandée n’est pas disponible pour le moment. Réessayez dans un instant, ou revenez à l’accueil." />`
})
export class Error {}
