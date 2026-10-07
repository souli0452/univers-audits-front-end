import {
    COMPLEMENT_MAX_FILES, COMPLEMENT_MAX_MESSAGE, COMPLEMENT_MIN_MESSAGE,
    addComplementFiles, formatFileSize, validateComplement
} from './complement-form';

const MB = 1024 * 1024;

function fichier(nom: string, taille = 10): File {
    const f = new File(['x'], nom);
    Object.defineProperty(f, 'size', { value: taille });
    return f;
}

describe('complement-form', () => {
    describe('validateComplement', () => {
        it('accepte un message de 10 caractères ou plus', () => {
            expect(validateComplement('x'.repeat(COMPLEMENT_MIN_MESSAGE), [])).toEqual([]);
        });

        it('refuse un message trop court, en ignorant les espaces autour', () => {
            const erreurs = validateComplement('   court   ', []);
            expect(erreurs.length).toBe(1);
            expect(erreurs[0]).toContain('10 caractères');
        });

        it('refuse un message vide', () => {
            expect(validateComplement('', []).length).toBe(1);
        });

        it('refuse un message de plus de 2 000 caractères', () => {
            const erreurs = validateComplement('x'.repeat(COMPLEMENT_MAX_MESSAGE + 1), []);
            expect(erreurs.some(e => e.includes('2000'))).toBeTrue();
        });

        it('refuse un total de fichiers de plus de 50 Mo', () => {
            const erreurs = validateComplement('Un message assez long', [fichier('a.pdf', 30 * MB), fichier('b.pdf', 25 * MB)]);
            expect(erreurs.some(e => e.includes('50 Mo'))).toBeTrue();
        });

        it('accepte des fichiers dont le total reste sous 50 Mo', () => {
            expect(validateComplement('Un message assez long', [fichier('a.pdf', 20 * MB), fichier('b.pdf', 20 * MB)])).toEqual([]);
        });
    });

    describe('addComplementFiles', () => {
        it('ajoute les fichiers autorisés', () => {
            const r = addComplementFiles([], [fichier('preuve.pdf'), fichier('photo.JPG')]);
            expect(r.files.map(f => f.name)).toEqual(['preuve.pdf', 'photo.JPG']);
            expect(r.rejected).toEqual([]);
        });

        it('refuse un type non autorisé, y compris déposé par glisser-déposer', () => {
            const r = addComplementFiles([], [fichier('script.html'), fichier('virus.exe'), fichier('ok.pdf')]);
            expect(r.files.map(f => f.name)).toEqual(['ok.pdf']);
            expect(r.rejected.length).toBe(2);
            expect(r.rejected[0]).toContain('script.html');
        });

        it('refuse un fichier de plus de 25 Mo', () => {
            const r = addComplementFiles([], [fichier('gros.pdf', 26 * MB)]);
            expect(r.files).toEqual([]);
            expect(r.rejected[0]).toContain('25 Mo');
        });

        it('limite à 5 fichiers et signale les suivants', () => {
            const courants = Array.from({ length: COMPLEMENT_MAX_FILES - 1 }, (_, i) => fichier(`f${i}.pdf`));
            const r = addComplementFiles(courants, [fichier('cinq.pdf'), fichier('six.pdf')]);
            expect(r.files.length).toBe(COMPLEMENT_MAX_FILES);
            expect(r.rejected.length).toBe(1);
            expect(r.rejected[0]).toContain('six.pdf');
        });

        it('ne modifie pas le tableau d’origine', () => {
            const courants = [fichier('a.pdf')];
            addComplementFiles(courants, [fichier('b.pdf')]);
            expect(courants.length).toBe(1);
        });
    });

    describe('formatFileSize', () => {
        it('formate en octets, Ko et Mo', () => {
            expect(formatFileSize(0)).toBe('0 o');
            expect(formatFileSize(512)).toBe('512 o');
            expect(formatFileSize(2048)).toBe('2.0 Ko');
            expect(formatFileSize(3 * MB)).toBe('3.0 Mo');
        });
    });
});
