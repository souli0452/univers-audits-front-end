import { Component } from '@angular/core';
import { PageEtat } from '../etat/page-etat';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [PageEtat],
    template: `<app-page-etat code="403" titre="Accès refusé"
        message="Vous n’avez pas les droits nécessaires pour ouvrir cette page. Si vous pensez qu’il s’agit d’une erreur, contactez l’administrateur." />`
})
export class Access {}
