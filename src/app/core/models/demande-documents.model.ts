export type EscalationLevel = 'INITIAL' | 'RELANCE' | 'SOMMATION' | 'SAISINE_JUDICIAIRE';

export interface DemandeDocumentsResponse {
    id: string;
    investigationId: string;
    recipientLabel: string;
    documentsRequested: string;
    requestedByName?: string;
    sentAt: string;
    deadline?: string;
    escalationLevel: EscalationLevel;
    received: boolean;
    receivedAt?: string;
    overdue: boolean;
}

export interface DemandeDocumentsCreateRequest {
    recipientLabel: string;
    documentsRequested: string;
}

export interface DemandeDocumentsAddressErrorRequest {
    correctedRecipientLabel: string;
}
