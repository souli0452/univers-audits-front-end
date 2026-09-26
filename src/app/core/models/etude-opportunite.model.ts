export type NatureQualification = 'PENALE' | 'ADMINISTRATIVE';
export type QualificationNonPenale = 'IRREGULARITE' | 'FRAUDE' | 'ACTE_COLLUSION' | 'ACTES_ILLICITES';

export interface EtudeOpportuniteResponse {
    id: string;
    preoccupationReelle?: boolean;
    preoccupationReelleCommentaire?: string;
    competenceAsceLc?: boolean;
    competenceAsceLcCommentaire?: string;
    natureQualification?: NatureQualification;
    typeInfractionId?: string;
    typeInfractionLibelle?: string;
    qualificationNonPenale?: QualificationNonPenale;
    preuvesSuffisantes?: boolean;
    preuvesSuffisantesCommentaire?: string;
    enqueteComplementaireNecessaire?: boolean;
    enqueteComplementaireNecessaireCommentaire?: string;
    urgenceSecurisationPreuves?: boolean;
    urgenceSecurisationPreuvesCommentaire?: string;
    opportuniteSaisirProcureur?: boolean;
    opportuniteSaisirProcureurCommentaire?: string;
    secteurSensible?: boolean;
    secteurPrecision?: string;
    soliditeAllegation?: boolean;
    soliditeAllegationCommentaire?: string;
    avisGeneral?: string;
}

export interface EtudeOpportuniteRequest {
    preoccupationReelle?: boolean | null;
    preoccupationReelleCommentaire?: string;
    competenceAsceLc?: boolean | null;
    competenceAsceLcCommentaire?: string;
    natureQualification?: NatureQualification | null;
    typeInfractionId?: string | null;
    qualificationNonPenale?: QualificationNonPenale | null;
    preuvesSuffisantes?: boolean | null;
    preuvesSuffisantesCommentaire?: string;
    enqueteComplementaireNecessaire?: boolean | null;
    enqueteComplementaireNecessaireCommentaire?: string;
    urgenceSecurisationPreuves?: boolean | null;
    urgenceSecurisationPreuvesCommentaire?: string;
    opportuniteSaisirProcureur?: boolean | null;
    opportuniteSaisirProcureurCommentaire?: string;
    secteurSensible?: boolean | null;
    secteurPrecision?: string;
    soliditeAllegation?: boolean | null;
    soliditeAllegationCommentaire?: string;
    avisGeneral?: string;
}

export interface TypeInfractionOption {
    id: string;
    code: string;
    libelle: string;
}
