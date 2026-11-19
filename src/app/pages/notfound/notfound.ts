import { Component } from '@angular/core';
import { PageEtat } from '../etat/page-etat';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [PageEtat],
    template: `<app-page-etat code="404" titre="Page introuvable"
        message="La page demandée n’existe pas ou a été déplacée. Vérifiez l’adresse, ou revenez à l’accueil." />`
})
export class Notfound {}
