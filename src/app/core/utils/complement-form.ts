/** Règles de saisie de la réponse à une demande de complément (alignées sur le back). */
export const COMPLEMENT_MIN_MESSAGE = 10;
export const COMPLEMENT_MAX_MESSAGE = 2000;
export const COMPLEMENT_MAX_FILES = 5;
export const COMPLEMENT_MAX_FILE_MB = 25;
export const COMPLEMENT_MAX_TOTAL_MB = 50;

const EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'mp3', 'mp4', 'avi', 'mov'];
export const COMPLEMENT_ACCEPT = EXTENSIONS.map(e => `.${e}`).join(',');

const MB = 1024 * 1024;

function isAllowedExtension(name: string): boolean {
    const dot = name.lastIndexOf('.');
    return dot > -1 && EXTENSIONS.includes(name.slice(dot + 1).toLowerCase());
}

/** Erreurs de saisie ; liste vide si la réponse peut être envoyée. */
export function validateComplement(message: string, files: File[]): string[] {
    const errors: string[] = [];
    const text = message.trim();
    if (text.length < COMPLEMENT_MIN_MESSAGE) {
        errors.push(`Votre réponse doit contenir au moins ${COMPLEMENT_MIN_MESSAGE} caractères.`);
    }
    if (text.length > COMPLEMENT_MAX_MESSAGE) {
        errors.push(`Votre réponse ne doit pas dépasser ${COMPLEMENT_MAX_MESSAGE} caractères.`);
    }
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (total > COMPLEMENT_MAX_TOTAL_MB * MB) {
        errors.push(`Le total des fichiers ne doit pas dépasser ${COMPLEMENT_MAX_TOTAL_MB} Mo.`);
    }
    return errors;
}

/** Ajoute des fichiers à la sélection en refusant type, taille et nombre hors règles. */
export function addComplementFiles(current: File[], incoming: File[]): { files: File[]; rejected: string[] } {
    const files = [...current];
    const rejected: string[] = [];
    for (const f of incoming) {
        if (!isAllowedExtension(f.name)) {
            rejected.push(`${f.name} : type de fichier non autorisé`);
        } else if (f.size > COMPLEMENT_MAX_FILE_MB * MB) {
            rejected.push(`${f.name} : dépasse ${COMPLEMENT_MAX_FILE_MB} Mo`);
        } else if (files.length >= COMPLEMENT_MAX_FILES) {
            rejected.push(`${f.name} : ${COMPLEMENT_MAX_FILES} fichiers maximum`);
        } else {
            files.push(f);
        }
    }
    return { files, rejected };
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < MB) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / MB).toFixed(1)} Mo`;
}
