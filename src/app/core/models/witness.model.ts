export interface WitnessResponse {
    id: string;
    firstName?: string;
    lastName?: string;
    profession?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    testimonyNature?: string;
    relationWithParties?: string;
    interrogationDate?: string;
    consentToContact: boolean;
    anonymous: boolean;
    createdAt?: string;
}

export interface WitnessRequest {
    firstName?: string;
    lastName?: string;
    profession?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    testimonyNature?: string;
    relationWithParties?: string;
    interrogationDate?: string;
    consentToContact?: boolean;
    anonymous?: boolean;
}
