/**
 * Type réel d'un enregistrement vocal fait dans le navigateur.
 *
 * Chrome et Android produisent de l'audio/webm, Safari (iPhone) de l'audio/mp4, Firefox de l'audio/ogg. Étiqueter
 * un enregistrement d'iPhone « webm » le rendrait illisible chez l'agent ; on garde donc le vrai type, sans
 * paramètres (« audio/webm;codecs=opus » devient « audio/webm »), avec l'extension qui lui correspond.
 * Tous ces types sont acceptés par le serveur.
 */
export function typeAudioEnregistre(mime?: string | null): { type: string; extension: string } {
    const base = (mime ?? '').split(';')[0].trim().toLowerCase();
    if (base.includes('mp4') || base.includes('m4a')) { return { type: 'audio/mp4', extension: 'm4a' }; }
    if (base.includes('ogg')) { return { type: 'audio/ogg', extension: 'ogg' }; }
    if (base.includes('aac')) { return { type: 'audio/aac', extension: 'aac' }; }
    return { type: 'audio/webm', extension: 'webm' };
}
