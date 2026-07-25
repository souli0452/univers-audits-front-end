export interface ObservationResponse {
    id: string;
    type: string;
    content: string;
    confidential: boolean;
    authorFullName: string;
    statusSnapshot: string;
    createdAt: string;
}

export interface ObservationRequest {
    type: string;
    content: string;
    confidential?: boolean;
}
