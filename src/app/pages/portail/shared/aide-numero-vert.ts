import { Component } from '@angular/core';
import { NUMERO_VERT, lienTelephone } from '../../../core/constants/numero-vert';

/** Numéro vert toujours visible (pages de dépôt, de suivi, FAQ) : une seule aide humaine, un clic. */
@Component({
    selector: 'app-aide-numero-vert',
    standalone: true,
    styles: [`
        a{display:inline-flex;align-items:center;gap:.5rem;color:inherit;text-decoration:none;font-size:.78rem;font-weight:700;min-height:36px;padding:0 .25rem}
        strong{font-family:ui-monospace,Consolas,monospace;font-size:.95rem}
        a:focus-visible{outline:3px solid #FFD800;outline-offset:2px;border-radius:6px}
        @media (max-width:520px){.lib{display:none}}
    `],
    template: `
        <a [href]="lien" aria-label="Appeler le numéro vert {{ numero }}">
            <i class="pi pi-phone"></i><span class="lib">Besoin d'aide ? Numéro vert</span> <strong>{{ numero }}</strong>
        </a>
    `
})
export class AideNumeroVert {
    readonly numero = NUMERO_VERT;
    readonly lien = lienTelephone(NUMERO_VERT);
}
