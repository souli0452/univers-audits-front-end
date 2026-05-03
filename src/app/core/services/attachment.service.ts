import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttachmentResponse {
    id: string;
    originalName: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
    isAudio: boolean;
}

@Injectable({ providedIn: 'root' })
export class AttachmentService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/attachments`;

    upload(
        dossierId: string,
        files: File[]
    ): Observable<any> {
        const formData = new FormData();
        // Chaque fichier doit être ajouté avec le nom 'files'
        files.forEach(f => {
            formData.append('files', f, f.name);
        });
        // NE PAS mettre Content-Type manuellement
        // Angular le gère automatiquement avec le boundary
        return this.http.post(
            `${this.baseUrl}/dossier/${dossierId}`,
            formData
        );
    }

    uploadAudio(
        dossierId: string,
        audioBlob: Blob
    ): Observable<any> {
        const formData = new FormData();
        const audioFile = new File(
            [audioBlob],
            `audio_${Date.now()}.webm`,
            { type: 'audio/webm' }
        );
        formData.append('files', audioFile, audioFile.name);
        return this.http.post(
            `${this.baseUrl}/dossier/${dossierId}`,
            formData
        );
    }

    listByDossier(
        dossierId: string
    ): Observable<AttachmentResponse[]> {
        return this.http.get<AttachmentResponse[]>(
            `${this.baseUrl}/dossier/${dossierId}`
        );
    }

    getDownloadUrl(attachmentId: string): string {
        return `${this.baseUrl}/${attachmentId}/download`;
    }

    delete(attachmentId: string): Observable<any> {
        return this.http.delete(
            `${this.baseUrl}/${attachmentId}`
        );
    }

    formatSize(bytes: number): string {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}