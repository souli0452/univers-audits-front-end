export type StatutSeanceCtadp = 'PLANIFIEE' | 'TENUE' | 'ANNULEE';
export type RecommandationCtadp =
    | 'VALIDATION_INVESTIGATION'
    | 'CLASSEMENT'
    | 'TRANSMISSION_INSTITUTION_PARTENAIRE'
    | 'ORIENTATION_ADMINISTRATIVE';

export interface SeanceCtadpDossierResponse {
    id: string;
    dossierId: string;
    dossierNumber?: string;
    dossierObject?: string;
    recommandation?: RecommandationCtadp;
    commentaire?: string;
}

export interface SeanceCtadpResponse {
    id: string;
    dateSeance: string;
    statut: StatutSeanceCtadp;
    participants?: string;
    procesVerbal?: string;
    dossiers: SeanceCtadpDossierResponse[];
}

export interface SeanceCtadpCreateRequest {
    dateSeance: string;
    participants?: string;
}

export interface AddDossierToSeanceRequest {
    dossierId: string;
}

export interface RecommandationCtadpRequest {
    recommandation: RecommandationCtadp;
    commentaire?: string;
}

export interface TenirSeanceRequest {
    procesVerbal?: string;
}
