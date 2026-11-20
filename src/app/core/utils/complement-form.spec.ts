import {
    COMPLEMENT_ACCEPT, COMPLEMENT_MAX_FILES, COMPLEMENT_MAX_MESSAGE, COMPLEMENT_MIN_MESSAGE, LIBELLE_EXTENSIONS,
    addComplementFiles, formatFileSize, isAllowedExtension, validateComplement
} from './complement-form';

const MB = 1024 * 1024;

function fichier(nom: string, taille = 10): File {
    const f = new File(['x'], nom);
    Object.defineProperty(f, 'size', { value: taille });
    return f;
}

describe('complement-form', () => {
    describe('formats de pièces acceptés (alignés sur le serveur)', () => {
        it('accepte les notes vocales de téléphone : M4A, AAC, OPUS (WhatsApp), OGG, WAV, WEBM', () => {
            for (const nom of ['note.m4a', 'note.aac', 'note.opus', 'note.ogg', 'note.wav', 'note.webm', 'NOTE.M4A']) {
                expect(isAllowedExtension(nom)).withContext(nom).toBeTrue();
            }
        });

        it('garde les formats d\'avant (PDF, Word, JPG, PNG, MP3, MP4, MOV, AVI)', () => {
            for (const nom of ['a.pdf', 'a.doc', 'a.docx', 'a.jpg', 'a.jpeg', 'a.png', 'a.mp3', 'a.mp4', 'a.mov', 'a.avi']) {
                expect(isAllowedExtension(nom)).withContext(nom).toBeTrue();
            }
        });

        it('refuse ce que le serveur refuse au dépôt public : programmes, GIF et WebP (métadonnées non retirables)', () => {
            for (const nom of ['virus.exe', 'script.sh', 'anim.gif', 'photo.webp', 'sans-extension']) {
                expect(isAllowedExtension(nom)).withContext(nom).toBeFalse();
            }
        });

        it('la liste lisible et l\'attribut « accept » du sélecteur de fichiers citent les mêmes formats', () => {
            expect(LIBELLE_EXTENSIONS).toContain('M4A');
            expect(LIBELLE_EXTENSIONS).toContain('OPUS');
            expect(COMPLEMENT_ACCEPT).toContain('.m4a');
            expect(COMPLEMENT_ACCEPT).toContain('.opus');
        });
    });

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
