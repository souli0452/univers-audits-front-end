import { ConseillerJuridique, etiquetteDe, etiquettesCj, initiales } from './etiquettes-cj';

describe('étiquettes « CJ/initiales » des conseillers juridiques', () => {
    const cj = (id: string, firstName: string, lastName: string, matricule = id): ConseillerJuridique =>
        ({ id, firstName, lastName, matricule });

    it('prend la première lettre du prénom et du nom, en majuscules', () => {
        expect(initiales('olivier', 'rouamba')).toBe('OR');
    });

    it('ignore les accents et les espaces', () => {
        expect(initiales('  Édouard ', ' Ouédraogo')).toBe('EO');
    });

    it('fonctionne avec un seul conseiller juridique', () => {
        const etiquettes = etiquettesCj([cj('1', 'Awa', 'Kaboré')]);
        expect(etiquettes.get('1')).toBe('CJ/AK');
    });

    it('fonctionne avec deux conseillers juridiques', () => {
        const etiquettes = etiquettesCj([cj('1', 'Olivier', 'Rouamba'), cj('2', 'Awa', 'Kaboré')]);
        expect(etiquettes.get('1')).toBe('CJ/OR');
        expect(etiquettes.get('2')).toBe('CJ/AK');
    });

    it('fonctionne avec plus de trois conseillers juridiques, sans liste figée', () => {
        const noms: [string, string][] = [
            ['Awa', 'Kaboré'], ['Olivier', 'Rouamba'], ['Issa', 'Sawadogo'], ['Mariam', 'Zongo'], ['Paul', 'Ilboudo'],
            ['Salif', 'Compaoré']
        ];
        const liste = noms.map(([p, n], i) => cj(String(i + 1), p, n));
        const etiquettes = etiquettesCj(liste);
        expect(etiquettes.size).toBe(6);
        expect(new Set(etiquettes.values()).size).toBe(6);
        expect(etiquettes.get('4')).toBe('CJ/MZ');
    });

    it('ne renvoie rien quand il n\'y a aucun conseiller juridique', () => {
        expect(etiquettesCj([]).size).toBe(0);
    });

    it('distingue deux conseillers aux mêmes initiales, le premier inscrit gardant l\'étiquette simple', () => {
        const a = cj('a', 'Awa', 'Kaboré', 'M-001');
        const b = cj('b', 'Adama', 'Kéré', 'M-002');
        const etiquettes = etiquettesCj([b, a]);
        expect(etiquettes.get('a')).toBe('CJ/AK');
        expect(etiquettes.get('b')).toBe('CJ/AK2');
    });

    it('ne change pas l\'étiquette d\'un conseiller déjà là quand un nouveau arrive', () => {
        const avant = etiquettesCj([cj('a', 'Awa', 'Kaboré', 'M-001')]);
        const apres = etiquettesCj([cj('a', 'Awa', 'Kaboré', 'M-001'), cj('c', 'Adama', 'Kéré', 'M-003')]);
        expect(apres.get('a')).toBe(avant.get('a'));
    });

    it('gère un nom ou un prénom manquant', () => {
        expect(initiales(undefined, 'Kaboré')).toBe('K');
        expect(initiales('Awa', '')).toBe('A');
        expect(initiales(undefined, undefined)).toBe('');
        expect(etiquettesCj([cj('1', '', '')]).get('1')).toBe('CJ');
    });

    it('retrouve l\'étiquette d\'un agent désigné, ou rien s\'il n\'est plus dans la liste', () => {
        const etiquettes = etiquettesCj([cj('1', 'Awa', 'Kaboré')]);
        expect(etiquetteDe(etiquettes, '1')).toBe('CJ/AK');
        expect(etiquetteDe(etiquettes, 'parti')).toBe('');
        expect(etiquetteDe(etiquettes, undefined)).toBe('');
    });
});
