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
    delaiJours:       number;
}
