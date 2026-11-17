import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrigineGeographique } from './origine-geographique';
import { GeographieService } from '../../core/services/geographie.service';
import { Geographie, OrigineSaisie } from '../../core/models/geographie.model';

const arbre: Geographie = {
    code: 'BF', libelle: 'Burkina Faso',
    regions: [
        { id: 'r-gui', libelle: 'Guiriko', zone: 'GUIRIKO', provinces: [
            { id: 'p-houet', libelle: 'Houet', communes: [
                { id: 'c-bobo', libelle: 'Bobo-Dioulasso', categorie: 'STATUT_PARTICULIER' },
                { id: 'c-bama', libelle: 'Bama', categorie: 'PLEIN' }] },
            { id: 'p-tuy', libelle: 'Tuy', communes: [{ id: 'c-houndé', libelle: 'Houndé', categorie: 'PLEIN' }] }] },
        { id: 'r-kad', libelle: 'Kadiogo', zone: 'KADIOGO', provinces: [
            { id: 'p-kad', libelle: 'Kadiogo', communes: [{ id: 'c-ouaga', libelle: 'Ouagadougou', categorie: 'STATUT_PARTICULIER' }] }] }
    ]
};

describe('OrigineGeographique', () => {
    let fixture: ComponentFixture<OrigineGeographique>;
    let composant: OrigineGeographique;
    let emis: OrigineSaisie[];

    function creer(geographie: { getArbre: jasmine.Spy }): void {
        TestBed.configureTestingModule({
            imports: [OrigineGeographique],
            providers: [{ provide: GeographieService, useValue: geographie }]
        });
        fixture = TestBed.createComponent(OrigineGeographique);
        composant = fixture.componentInstance;
        emis = [];
        composant.origineChange.subscribe(o => emis.push(o));
        fixture.detectChanges();
    }

    const dernier = (): OrigineSaisie => emis[emis.length - 1];
    const selects = (): HTMLSelectElement[] => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('select'));

    beforeEach(() => creer({ getArbre: jasmine.createSpy('getArbre').and.returnValue(of(arbre)) }));

    it('propose le Burkina Faso par défaut, avec toutes les régions', () => {
        expect(composant.regions.map(r => r.libelle)).toEqual(['Guiriko', 'Kadiogo']);
        expect(composant.horsBurkina).toBeFalse();
        expect(selects().length).toBe(2);      // pays + région : la province et la commune attendent la région
    });

    it('ne propose les provinces qu\'une fois la région choisie, puis les communes une fois la province choisie', () => {
        composant.choisirRegion('r-gui');
        fixture.detectChanges();
        expect(composant.provinces.map(p => p.libelle)).toEqual(['Houet', 'Tuy']);
        expect(selects().length).toBe(3);

        composant.choisirProvince('p-houet');
        fixture.detectChanges();
        expect(composant.communes.map(c => c.libelle)).toEqual(['Bobo-Dioulasso', 'Bama']);
        expect(selects().length).toBe(4);
    });

    it('émet la région, la province et la commune choisies', () => {
        composant.choisirRegion('r-gui');
        composant.choisirProvince('p-houet');
        composant.choisirCommune('c-bama');

        expect(dernier()).toEqual({ origineRegionId: 'r-gui', origineProvinceId: 'p-houet', origineCommuneId: 'c-bama' });
    });

    it('efface la province et la commune quand on change de région', () => {
        composant.choisirRegion('r-gui');
        composant.choisirProvince('p-houet');
        composant.choisirCommune('c-bama');

        composant.choisirRegion('r-kad');

        expect(dernier()).toEqual({ origineRegionId: 'r-kad' });
        expect(composant.provinceId).toBeNull();
        expect(composant.communeId).toBeNull();
    });

    it('efface la commune quand on change de province', () => {
        composant.choisirRegion('r-gui');
        composant.choisirProvince('p-houet');
        composant.choisirCommune('c-bama');

        composant.choisirProvince('p-tuy');

        expect(dernier()).toEqual({ origineRegionId: 'r-gui', origineProvinceId: 'p-tuy' });
    });

    it('n\'émet rien d\'autre qu\'un objet vide quand on revient à « je préfère ne pas préciser »', () => {
        composant.choisirRegion('r-gui');

        composant.choisirRegion(null);

        expect(dernier()).toEqual({});
    });

    it('pour un autre pays : demande le pays, masque la géographie du Burkina et n\'émet que le pays', () => {
        composant.choisirRegion('r-gui');
        composant.choisirPays(true);
        composant.saisirPays('  Côte d\'Ivoire ');
        fixture.detectChanges();

        expect(dernier()).toEqual({ paysOrigine: 'Côte d\'Ivoire' });
        expect(selects().length).toBe(1);
        expect((fixture.nativeElement as HTMLElement).querySelector('input[type=text]')).not.toBeNull();
    });

    it('revenir au Burkina Faso retire le pays étranger', () => {
        composant.choisirPays(true);
        composant.saisirPays('Mali');

        composant.choisirPays(false);

        expect(dernier()).toEqual({});
        expect(composant.paysEtranger).toBe('');
    });

    it('disparaît en silence quand le référentiel ne se charge pas : le dépôt continue sans', () => {
        TestBed.resetTestingModule();
        creer({ getArbre: jasmine.createSpy('getArbre').and.returnValue(throwError(() => new Error('500'))) });

        expect(selects().length).toBe(0);
        expect(((fixture.nativeElement as HTMLElement).textContent ?? '').trim()).toBe('');
        expect(emis.length).toBe(0);
    });
});
