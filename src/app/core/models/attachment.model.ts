export interface AttachmentResponse {
    id: string;
    originalName: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadedAt: string;
    isAudio: boolean;
    status: string;
}
