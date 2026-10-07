import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventairePieceItemResponse } from '../models/inventaire-pieces.model';

export type {
    InventairePieceItemResponse,
    AttachmentSource,
    ModeObtention,
    AttachmentStatus
} from '../models/inventaire-pieces.model';

@Injectable({ providedIn: 'root' })
export class InventairePiecesService {

    private http = inject(HttpClient);

    getInventaire(investigationId: string): Observable<InventairePieceItemResponse[]> {
        return this.http.get<InventairePieceItemResponse[]>(
            `${environment.apiUrl}/investigations/${investigationId}/inventaire-pieces`);
    }
}
