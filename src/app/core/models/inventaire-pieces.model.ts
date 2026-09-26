export type AttachmentSource =
    | 'INITIAL_SUBMISSION'
    | 'FIELD_INVESTIGATION'
    | 'SOCIAL_MEDIA'
    | 'PRESS_MEDIA'
    | 'EXTERNAL_AUDIT'
    | 'OTHER';

export type ModeObtention = 'VOLONTAIRE' | 'REQUISITION';

export type AttachmentStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'ARCHIVED';

export interface InventairePieceItemResponse {
    attachmentId: string;
    code?: string;
    description?: string;
    source: AttachmentSource;
    uploadedAt: string;
    modeObtention: ModeObtention;
    status: AttachmentStatus;
}
