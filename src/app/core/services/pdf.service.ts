import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PdfService {

    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/pdf`;

    exportDossier(dossierId: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/dossier/${dossierId}`, { responseType: 'blob' });
    }

    downloadRecepisse(dossierId: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/recepisse/${dossierId}`, { responseType: 'blob' });
    }

    downloadAccuseReception(dossierId: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/accuse-reception/${dossierId}`, { responseType: 'blob' });
    }

    downloadPublicRecepisse(accessCode: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/public/recepisse/${accessCode}`, { responseType: 'blob' });
    }

    downloadReponseMotivee(dossierId: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/reponse-motivee/${dossierId}`, { responseType: 'blob' });
    }

    downloadResumeCloture(dossierId: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/resume-cloture/${dossierId}`, { responseType: 'blob' });
    }

    /** Déclenche le téléchargement d'un blob PDF avec le nom de fichier donné. */
    triggerDownload(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
