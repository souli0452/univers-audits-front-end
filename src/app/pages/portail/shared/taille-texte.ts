import { Component, OnInit } from '@angular/core';

const CLE = 'portail_taille_texte';
const PALIERS = [100, 112, 125];

/** Applique la taille choisie à toute la page (les tailles du portail sont en rem). */
function appliquer(pourcent: number): void {
    document.documentElement.style.fontSize = pourcent === 100 ? '' : pourcent + '%';
}

/** Boutons « A- / A+ » : taille du texte réglable, mémorisée dans le navigateur. */
@Component({
    selector: 'app-taille-texte',
    standalone: true,
    styles: [`
        :host{display:inline-flex;gap:.25rem;align-items:center}
        button{min-width:36px;height:36px;border-radius:8px;border:1.5px solid currentColor;background:transparent;color:inherit;font-weight:800;cursor:pointer;font-family:inherit}
        button:disabled{opacity:.4;cursor:default}
        button:focus-visible{outline:3px solid #FFD800;outline-offset:2px}
    `],
    template: `
        <button type="button" (click)="changer(-1)" [disabled]="indice === 0" aria-label="Réduire la taille du texte" title="Réduire le texte">A−</button>
        <button type="button" (click)="changer(1)" [disabled]="indice === paliers.length - 1" aria-label="Agrandir la taille du texte" title="Agrandir le texte">A+</button>
    `
})
export class TailleTexte implements OnInit {
    readonly paliers = PALIERS;
    indice = 0;

    ngOnInit(): void {
        try {
            const i = PALIERS.indexOf(Number(localStorage.getItem(CLE)));
            if (i > 0) { this.indice = i; appliquer(PALIERS[i]); }
        } catch { /* stockage indisponible : taille par défaut */ }
    }

    changer(sens: number): void {
        this.indice = Math.min(PALIERS.length - 1, Math.max(0, this.indice + sens));
        appliquer(PALIERS[this.indice]);
        try { localStorage.setItem(CLE, String(PALIERS[this.indice])); } catch { /* sans effet */ }
    }
}
