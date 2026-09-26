export type TypeSectionDossierTravail =
    | 'ADMINISTRATION_MISSION'
    | 'PRISE_CONNAISSANCE_ENTITE'
    | 'PRISE_CONNAISSANCE_ENVIRONNEMENT'
    | 'DETAIL';

export type OrganisationDetail = 'PAR_ETAPE' | 'PAR_ENTITE' | 'PAR_SITE' | 'PAR_CYCLE_COMPTABLE';

export interface SectionDossierTravailResponse {
    id: string;
    type: TypeSectionDossierTravail;
    libelle?: string;
    nombrePieces: number;
}

export interface OrganisationDetailRequest {
    organisationDetail: OrganisationDetail;
}

export interface SectionDetailCreateRequest {
    libelle: string;
}
