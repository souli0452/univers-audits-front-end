import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PortalConfigItem {
  id:          string;
  configKey:   string;
  configValue: string;
  label:       string;
  description: string;
  valueType:   'TEXT' | 'IMAGE_URL' | 'COLOR' | 'PHONE' | 'URL' | 'HTML';
  groupName:   string;
  updatedAt:   string;
  updatedBy:   string;
}

@Injectable({ providedIn: 'root' })
export class PortalConfigService {

  private readonly httpDirect: HttpClient;
  private readonly http      = inject(HttpClient);
  private readonly publicUrl = `${environment.apiUrl}/public/portal-config`;
  private readonly adminUrl  = `${environment.apiUrl}/admin/portal-config`;

  private readonly configSubject = new BehaviorSubject<Record<string, string>>({});
  readonly config$ = this.configSubject.asObservable();

  constructor(handler: HttpBackend) {
    this.httpDirect = new HttpClient(handler);
  }

  async loadPublicConfig(): Promise<void> {
    try {
      const cfg = await firstValueFrom(
          this.httpDirect.get<Record<string, string>>(this.publicUrl)
      );
      if (cfg) this.configSubject.next(cfg);
    } catch {
    }
  }

  get(key: string, fallback = ''): string {
    return this.configSubject.getValue()[key] ?? fallback;
  }

  getAdminConfig() {
    return this.http.get<Record<string, PortalConfigItem[]>>(this.adminUrl);
  }

  updateBatch(updates: Record<string, string>) {
    return this.http.put<PortalConfigItem[]>(`${this.adminUrl}/batch`, updates);
  }

  updateOne(key: string, value: string) {
    return this.http.put<PortalConfigItem>(`${this.adminUrl}/${key}`, { value });
  }
}