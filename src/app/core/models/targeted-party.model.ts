export interface TargetedPartyResponse {
    id: string;
    partyType: string;
    firstName?: string;
    name?: string;
    position?: string;
    institution?: string;
    organization?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    relationWithDeclarant?: string;
    allegedRole?: string;
    createdAt?: string;
}

export interface TargetedPartyRequest {
    partyType: string;
    firstName?: string;
    name?: string;
    position?: string;
    institution?: string;
    organization?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    relationWithDeclarant?: string;
    allegedRole?: string;
}
