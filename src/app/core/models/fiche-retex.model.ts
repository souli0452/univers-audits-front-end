export interface FicheRetexResponse {
    id: string;
    investigationId: string;
    typeInfractionId?: string;
    typeInfractionLibelle?: string;
    lieu?: string;
    difficultesRencontrees?: string;
    origineSoupcons?: string;
    impactFinancier?: number;
    originaliteSchemas?: string;
    collaborateursPlanifies?: string;
    joursCharges?: number;
    contexte?: string;
    strategieMethodes?: string;
    syntheseResultats: string;
    enseignementsAxesAmelioration: string;
    redigeParNom: string;
    createdAt: string;
}

export interface FicheRetexRequest {
    typeInfractionId?: string;
    lieu?: string;
    difficultesRencontrees?: string;
    origineSoupcons?: string;
    impactFinancier?: number;
    originaliteSchemas?: string;
    collaborateursPlanifies?: string;
    joursCharges?: number;
    contexte?: string;
    strategieMethodes?: string;
    syntheseResultats: string;
    enseignementsAxesAmelioration: string;
}

export interface PublierLeconRequest {
    titre: string;
    resume: string;
}

export interface LeconAPartagerResponse {
    id: string;
    titre: string;
    resume: string;
    publieeParNom: string;
    investigationId: string;
    createdAt: string;
}
