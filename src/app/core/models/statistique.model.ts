export interface MonthlyCount {
    month:          string;
    count:          number;
    investigations: number;
}

/**
 * Statistiques du tableau de bord détaillé (StatistiqueService.getDashboard).
 * À ne pas confondre avec le StatistiqueResponse plus restreint de dossier.model.ts,
 * utilisé par DossierService.getStats().
 */
export interface StatistiqueResponse {
    period:      string;
    generatedAt: string;

    totalDossiers:   number;
    countByStatus:   Record<string, number>;
    monthlyTrend:    MonthlyCount[];

    countBySubmissionMode: Record<string, number>;

    inadmissibleCount:              number;
    investigatedCount:              number;
    transferredCount:               number;
    closedWithoutInvestigationCount:number;

    countByType: Record<string, number>;

    totalEstimatedLoss?: number;

    inProgressInvestigations: number;
    reportsProduced:          number;
    referredToJustice:        number;

    unfoundedWithoutInvestigation: number;
    unfoundedAfterInvestigation:   number;
    admissibilityRate:             number;

    avgRegistrationDelayDays?:    number;  // objectif : 7j
    avgOpportunityStudyDays?:     number;  // objectif : 7j
    avgAcknowledgmentDays?:       number;  // objectif : 3j
    avgInvestigationDurationDays?:number;  // objectif : 90j
    avgDeiApprovalDays?:          number;  // objectif : 15j
    avgCgeApprovalDays?:          number;  // objectif : 20j

    overdueAcknowledgments: number;
    overdueInvestigations:  number;
    overdueComplements:     number;
}

export interface PublicStats {
    totalDossiers:    number;
    dossiersNouveaux: number;
    dossiersEnCours:  number;
    dossiersTraites:  number;
    confidentiel:     string;
    /** Année en cours, base de la répartition par nature (absent d'un back plus ancien). */
    anneeCourante?:   number;
    /** Signalements reçus par année, de la plus ancienne à l'année en cours. */
    parAnnee?:        { annee: number; total: number }[];
    /** Signalements reçus dans l'année en cours, par nature (clé = type du dossier). */
    parType?:         Record<string, number>;
    /** Signalements reçus dans l'année en cours, par canal de dépôt (clé = mode de dépôt du dossier). */
    parCanal?:        Record<string, number>;
}

export interface DepassementItem {
    dossierId:      string;
    numero:         string;
    type:           string;
    echeance:       string;
    joursDeRetard:  number;
}

export interface ActeurDepassement {
    agentId:               string;
    matricule:             string;
    nomComplet:             string;
    departementLibelle:     string | null;
    dossiersEnDepassement:  DepassementItem[];
}

/** Étape du circuit de traitement dont l'échéance est dépassée, pour un dossier. */
export interface EtapeDepassement {
    dossierId:      string;
    numero:         string;
    code:           string;
    libelle:        string;
    echeance:       string;
    heuresDeRetard: number;
}

/** Étapes en retard regroupées par acteur du circuit (CGEA, CGE). */
export interface ActeurEtapeDepassement {
    acteur: string;
    etapes: EtapeDepassement[];
}
