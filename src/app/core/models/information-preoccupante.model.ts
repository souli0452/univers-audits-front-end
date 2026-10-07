export type AutoReferralSource =
    | 'WRITTEN_PRESS'
    | 'TELEVISION'
    | 'RADIO'
    | 'SOCIAL_MEDIA'
    | 'AUDIT_REPORT'
    | 'INSPECTION_REPORT'
    | 'INTERNAL_TIP'
    | 'PARTNER_INSTITUTION'
    | 'PROSECUTOR_REFERRAL'
    | 'OTHER';

export type StatutInformationPreoccupante =
    | 'NOUVELLE'
    | 'RATTACHEE'
    | 'AUTO_SAISINE_DECLENCHEE'
    | 'CLASSEE_SANS_SUITE';

export interface DossierRattacheResponse {
    dossierId: string;
    dossierNumber?: string;
    commentaire?: string;
    linkedAt: string;
}

export interface InformationPreoccupanteResponse {
    id: string;
    objet: string;
    description: string;
    source: AutoReferralSource;
    sourceReference?: string;
    dateReception: string;
    statut: StatutInformationPreoccupante;
    createdAt: string;
    dossiersRattaches: DossierRattacheResponse[];
}

export interface InformationPreoccupanteCreateRequest {
    objet: string;
    description: string;
    source: AutoReferralSource;
    sourceReference?: string;
    dateReception: string;
}

export interface RattacherDossierRequest {
    commentaire?: string;
}
