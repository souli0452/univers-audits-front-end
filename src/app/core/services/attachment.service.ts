import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH } from '../interceptors/skip-auth.context';
import { AttachmentResponse } from '../models/attachment.model';

export type { AttachmentResponse } from '../models/attachment.model';

@Injectable({ providedIn: 'root' })
export class AttachmentService {

    private http    = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/attachments`;

    /**
     * @param anonymous à passer à true uniquement lors du dépôt public d'un
     * dossier (avant toute authentification) ; sinon le token de l'agent
     * connecté est joint à la requête, comme pour tout autre appel API.
     */
    upload(dossierId: string, files: File[], anonymous = false): Observable<any> {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f, f.name));
        return this.http.post(`${this.baseUrl}/dossier/${dossierId}`, formData,
            anonymous ? { context: new HttpContext().set(SKIP_AUTH, true) } : {});
    }

    uploadAudio(dossierId: string, audioBlob: Blob, anonymous = false): Observable<any> {
        const formData = new FormData();
        const audioFile = new File(
            [audioBlob],
            `audio_${Date.now()}.webm`,
            { type: 'audio/webm' }
        );
        formData.append('files', audioFile, audioFile.name);
        return this.http.post(`${this.baseUrl}/dossier/${dossierId}`, formData,
            anonymous ? { context: new HttpContext().set(SKIP_AUTH, true) } : {});
    }

    listByDossier(dossierId: string): Observable<AttachmentResponse[]> {
        return this.http.get<AttachmentResponse[]>(
            `${this.baseUrl}/dossier/${dossierId}`
        );
    }

    getDownloadUrl(attachmentId: string): string {
        return `${this.baseUrl}/${attachmentId}/download`;
    }

    delete(attachmentId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${attachmentId}`);
    }

    formatSize(bytes: number): string {
        if (!bytes) return '0 B';
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}