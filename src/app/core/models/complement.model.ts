/** Ce que le back renvoie au déclarant pour une demande de complément (aucune donnée d’identité). */
export interface ComplementRequestResponse {
    status: string;
    motif: string;
    requestedAt: string;
    deadline: string | null;
    overdue: boolean;
}

export interface ComplementSubmissionResponse {
    status: string;
    late: boolean;
    filesUploaded: number;
}
