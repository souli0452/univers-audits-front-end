export interface AgentResponse {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    grade?: string;
    actif: boolean;
    keycloakId?: string;
    createdAt?: string;
    departementLabel?: string;
}

export interface CreateAgentRequest {
    matricule: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    grade?: string;
    keycloakRoles?: string[];
}

export interface UpdateAgentRequest {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    grade?: string;
    keycloakRoles?: string[];
}
