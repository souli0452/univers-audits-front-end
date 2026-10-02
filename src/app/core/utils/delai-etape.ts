import { DelaiEtapeResponse, StatutDelaiEtape } from '../models/dossier.model';

/** Durée en heures affichée en jours et heures, par exemple « 1 j 4 h ». */
export function formaterDuree(heures: number): string {
    const h = Math.abs(Math.trunc(heures));
    if (h < 1) return "moins d'1 h";
    const jours = Math.floor(h / 24);
    const reste = h % 24;
    if (jours === 0) return `${reste} h`;
    return reste > 0 ? `${jours} j ${reste} h` : `${jours} j`;
}

/** Texte de l'état d'une étape : temps restant, retard, ou issue d'une étape terminée. */
export function libelleEtatDelai(etape: DelaiEtapeResponse): string {
    const heures = etape.heuresRestantes ?? 0;
    switch (etape.statut) {
        case 'EN_COURS':
        case 'PROCHE':           return `Reste ${formaterDuree(heures)}`;
        case 'DEPASSE':          return `En retard de ${formaterDuree(heures)}`;
        case 'RESPECTE':         return 'Dans le délai';
        case 'TERMINE_EN_RETARD': return 'Terminé en retard';
    }
}

/** Classes Tailwind du badge d'état d'une étape. */
export function classeEtatDelai(statut: StatutDelaiEtape): string {
    switch (statut) {
        case 'DEPASSE':           return 'bg-red-50 text-red-700';
        case 'TERMINE_EN_RETARD': return 'bg-orange-50 text-orange-700';
        case 'PROCHE':            return 'bg-amber-50 text-amber-700';
        case 'RESPECTE':          return 'bg-green-50 text-green-700';
        default:                  return 'bg-blue-50 text-blue-700';
    }
}
