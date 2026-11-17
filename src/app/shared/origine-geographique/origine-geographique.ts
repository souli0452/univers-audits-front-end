import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeoCommune, GeoProvince, GeoRegion, Geographie, OrigineSaisie } from '../../core/models/geographie.model';
import { GeographieService } from '../../core/services/geographie.service';

let compteur = 0;

/**
 * D'où écrit le déclarant : Pays → Région → Province → Commune, en listes liées. Tout est facultatif.
 * Pour un autre pays que le Burkina Faso, on demande seulement le pays (diaspora).
 */
@Component({
    selector: 'app-origine-geographique',
    standalone: true,
    imports: [CommonModule, FormsModule],
    styles: [`
        :host { display: block; }
        .champ { display: flex; flex-direction: column; gap: .25rem; }
        .grille { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); }
        label { font-size: .8125rem; font-weight: 600; }
        select, input {
            width: 100%; border: 1.5px solid var(--hair, #d4d4d8); border-radius: 8px;
            padding: .55rem .75rem; font-size: .875rem; background: #fff; color: inherit;
        }
        select:focus-visible, input:focus-visible { outline: 2px solid #16a34a; outline-offset: 1px; }
        .aide { font-size: .75rem; color: #6b7280; }
    `],
    template: `
<div class="grille">
    <div class="champ">
        <label [for]="id + '-pays'">Pays</label>
        <select [id]="id + '-pays'" [ngModel]="horsBurkina ? 'AUTRE' : 'BF'"
            (ngModelChange)="choisirPays($event === 'AUTRE')">
            <option value="BF">Burkina Faso</option>
            <option value="AUTRE">Autre pays (diaspora)</option>
        </select>
    </div>

    @if (horsBurkina) {
        <div class="champ">
            <label [for]="id + '-etranger'">Pays de résidence</label>
            <input type="text" [id]="id + '-etranger'" maxlength="80" autocomplete="off"
                [ngModel]="paysEtranger" (ngModelChange)="saisirPays($event)" placeholder="Ex. : Côte d'Ivoire" />
        </div>
    } @else if (chargementEchoue) {
        <p class="aide">La liste des localités n'a pas pu être chargée ; vous pouvez continuer sans la renseigner.</p>
    } @else {
        <div class="champ">
            <label [for]="id + '-region'">Région</label>
            <select [id]="id + '-region'" [ngModel]="regionId" (ngModelChange)="choisirRegion($event)">
                <option [ngValue]="null">Je préfère ne pas préciser</option>
                @for (r of regions; track r.id) { <option [ngValue]="r.id">{{ r.libelle }}</option> }
            </select>
        </div>
        @if (regionId) {
            <div class="champ">
                <label [for]="id + '-province'">Province</label>
                <select [id]="id + '-province'" [ngModel]="provinceId" (ngModelChange)="choisirProvince($event)">
                    <option [ngValue]="null">Toutes</option>
                    @for (p of provinces; track p.id) { <option [ngValue]="p.id">{{ p.libelle }}</option> }
                </select>
            </div>
        }
        @if (provinceId) {
            <div class="champ">
                <label [for]="id + '-commune'">Commune</label>
                <select [id]="id + '-commune'" [ngModel]="communeId" (ngModelChange)="choisirCommune($event)">
                    <option [ngValue]="null">Toutes</option>
                    @for (c of communes; track c.id) { <option [ngValue]="c.id">{{ c.libelle }}</option> }
                </select>
            </div>
        }
    }
</div>
    `
})
export class OrigineGeographique implements OnInit {

    private readonly geographie = inject(GeographieService);

    @Output() origineChange = new EventEmitter<OrigineSaisie>();

    readonly id = 'origine-' + (++compteur);
    arbre: Geographie | null = null;
    chargementEchoue = false;

    horsBurkina = false;
    paysEtranger = '';
    regionId: string | null = null;
    provinceId: string | null = null;
    communeId: string | null = null;

    ngOnInit(): void {
        this.geographie.getArbre().subscribe({
            next: a => this.arbre = a,
            error: () => this.chargementEchoue = true
        });
    }

    get regions(): GeoRegion[] {
        return this.arbre?.regions ?? [];
    }

    get provinces(): GeoProvince[] {
        return this.regions.find(r => r.id === this.regionId)?.provinces ?? [];
    }

    get communes(): GeoCommune[] {
        return this.provinces.find(p => p.id === this.provinceId)?.communes ?? [];
    }

    choisirPays(horsBurkina: boolean): void {
        this.horsBurkina = horsBurkina;
        this.paysEtranger = '';
        this.regionId = this.provinceId = this.communeId = null;
        this.emettre();
    }

    saisirPays(texte: string): void {
        this.paysEtranger = texte;
        this.emettre();
    }

    choisirRegion(id: string | null): void {
        this.regionId = id;
        this.provinceId = this.communeId = null;
        this.emettre();
    }

    choisirProvince(id: string | null): void {
        this.provinceId = id;
        this.communeId = null;
        this.emettre();
    }

    choisirCommune(id: string | null): void {
        this.communeId = id;
        this.emettre();
    }

    private emettre(): void {
        const origine: OrigineSaisie = {};
        if (this.horsBurkina) {
            const pays = this.paysEtranger.trim();
            if (pays) { origine.paysOrigine = pays; }
        } else {
            if (this.regionId) { origine.origineRegionId = this.regionId; }
            if (this.provinceId) { origine.origineProvinceId = this.provinceId; }
            if (this.communeId) { origine.origineCommuneId = this.communeId; }
        }
        this.origineChange.emit(origine);
    }
}
