import { AgentSummaryResponse } from './dossier.model';

export type HabilitationSource = 'AGENT_IN_CHARGE' | 'INVESTIGATION_TEAM' | 'MANUAL';

export interface DossierHabilitationResponse {
    id: string;
    agent: AgentSummaryResponse;
    source: HabilitationSource;
    grantedBy?: AgentSummaryResponse;
    reason?: string;
    grantedAt: string;
    revokedAt?: string;
    revokedBy?: AgentSummaryResponse;
    revocationReason?: string;
    active: boolean;
}

export interface HabilitationGrantRequest {
    agentId: string;
    reason: string;
}
