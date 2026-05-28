import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe }    from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { ButtonModule }              from 'primeng/button';
import { InputTextModule }           from 'primeng/inputtext';
import { SelectModule }              from 'primeng/select';
import { TagModule }                 from 'primeng/tag';
import { ToastModule }               from 'primeng/toast';
import { TooltipModule }             from 'primeng/tooltip';
import { MessageService }            from 'primeng/api';
import { AuditService, AuditLog, LoginLog, AuditStats } from '../../../core/services/audit.service';
 
type Sev = 'success'|'info'|'warn'|'danger'|'secondary'|null|undefined;
 
@Component({
  selector: 'app-audit-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe,
    ButtonModule, InputTextModule, SelectModule,
    TagModule, ToastModule, TooltipModule
  ],
  providers: [MessageService],
  template: `
<p-toast />
<div class="flex flex-col gap-6">
 
  <!-- En-tête -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Journal d'audit</h1>
      <p class="text-surface-400 text-sm mt-1">Traçabilité complète des actions et connexions</p>
    </div>
    <p-button icon="pi pi-refresh" label="Actualiser" severity="secondary" outlined (onClick)="reload()" />
  </div>
 
  <!-- KPI -->
  <div *ngIf="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <i class="pi pi-bolt text-blue-600"></i>
        </div>
        <span class="text-xs text-surface-400">Aujourd'hui</span>
      </div>
      <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ stats.actionsToday }}</div>
      <div class="text-sm text-surface-400 mt-1">Actions</div>
    </div>
 
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <i class="pi pi-calendar text-purple-600"></i>
        </div>
        <span class="text-xs text-surface-400">7 jours</span>
      </div>
      <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ stats.actionsWeek }}</div>
      <div class="text-sm text-surface-400 mt-1">Actions</div>
    </div>
 
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <i class="pi pi-sign-in text-green-600"></i>
        </div>
        <span class="text-xs text-surface-400">30 jours</span>
      </div>
      <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ stats.loginsSuccess30d }}</div>
      <div class="text-sm text-surface-400 mt-1">Connexions réussies</div>
    </div>
 
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <i class="pi pi-ban text-red-600"></i>
        </div>
        <span class="text-xs text-surface-400">30 jours</span>
      </div>
      <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ stats.loginsFailed30d }}</div>
      <div class="text-sm text-surface-400 mt-1">Échecs connexion</div>
    </div>
  </div>
 
  <!-- Top Actions + Top Agents -->
  <div *ngIf="stats" class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <h2 class="text-sm font-bold text-surface-900 dark:text-surface-0 mb-4">Actions les plus fréquentes</h2>
      <div class="flex flex-col gap-2">
        <div *ngFor="let entry of topActions" class="flex items-center gap-3">
          <span class="text-xs font-mono text-surface-500 w-44 truncate">{{ entry.key }}</span>
          <div class="flex-1 bg-surface-100 rounded-full h-2">
            <div class="bg-primary-500 h-2 rounded-full"
                [style.width]="getBarWidth(entry.value, maxActionCount) + '%'"></div>
          </div>
          <span class="text-sm font-bold text-surface-900 dark:text-surface-0 w-6 text-right">{{ entry.value }}</span>
        </div>
        <div *ngIf="!topActions.length" class="text-xs text-surface-400 italic">Aucune action</div>
      </div>
    </div>
 
    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5">
      <h2 class="text-sm font-bold text-surface-900 dark:text-surface-0 mb-4">Agents les plus actifs</h2>
      <div class="flex flex-col gap-2">
        <div *ngFor="let entry of topAgents" class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-user text-primary-600" style="font-size:10px"></i>
          </div>
          <span class="text-xs text-surface-700 dark:text-surface-300 flex-1 truncate">{{ entry.key }}</span>
          <span class="text-sm font-bold text-surface-900 dark:text-surface-0">{{ entry.value }}</span>
        </div>
        <div *ngIf="!topAgents.length" class="text-xs text-surface-400 italic">Aucune donnée</div>
      </div>
    </div>
  </div>
 
  <!-- Onglets -->
  <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700">
 
    <div class="flex border-b border-surface-100 dark:border-surface-700">
      <button (click)="activeTab='actions'"
          class="px-6 py-4 text-sm font-semibold transition-colors"
          [class.text-primary-600]="activeTab==='actions'"
          [class.border-b-2]="activeTab==='actions'"
          [class.border-primary-500]="activeTab==='actions'"
          [class.text-surface-400]="activeTab!=='actions'">
        <i class="pi pi-list mr-2"></i>Actions métier
        <span class="ml-2 px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 text-xs">
          {{ stats?.totalActions || 0 }}
        </span>
      </button>
      <button (click)="activeTab='logins'"
          class="px-6 py-4 text-sm font-semibold transition-colors"
          [class.text-primary-600]="activeTab==='logins'"
          [class.border-b-2]="activeTab==='logins'"
          [class.border-primary-500]="activeTab==='logins'"
          [class.text-surface-400]="activeTab!=='logins'">
        <i class="pi pi-sign-in mr-2"></i>Connexions
        <span class="ml-2 px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 text-xs">
          {{ stats?.totalLogins || 0 }}
        </span>
      </button>
    </div>
 
    <!-- Filtres actions -->
    <div *ngIf="activeTab==='actions'"
        class="p-4 border-b border-surface-50 dark:border-surface-700 flex flex-wrap gap-3">
      <input pInputText [(ngModel)]="filterAgentName"
          placeholder="Nom ou matricule agent" class="text-sm" style="width:200px" />
      <p-select [(ngModel)]="filterAction"
          [options]="actionOptions" optionLabel="label" optionValue="value"
          placeholder="Toutes les actions" [showClear]="true"
          styleClass="text-sm" appendTo="body" style="width:220px" />
      <input pInputText type="date" [(ngModel)]="filterDateFrom" class="text-sm" style="width:150px" />
      <input pInputText type="date" [(ngModel)]="filterDateTo"   class="text-sm" style="width:150px" />
      <p-button label="Filtrer" icon="pi pi-search" size="small" (onClick)="applyFilters()" />
      <p-button label="Réinitialiser" severity="secondary" outlined size="small" (onClick)="resetFilters()" />
    </div>
 
    <!-- Filtres connexions -->
    <div *ngIf="activeTab==='logins'"
        class="p-4 border-b border-surface-50 dark:border-surface-700 flex flex-wrap gap-3">
      <input pInputText [(ngModel)]="filterLoginAgentName"
          placeholder="Nom ou matricule agent" class="text-sm" style="width:200px" />
      <p-button label="Filtrer" icon="pi pi-search" size="small" (onClick)="applyLoginFilters()" />
      <p-button label="Réinitialiser" severity="secondary" outlined size="small" (onClick)="resetLoginFilters()" />
    </div>
 
    <!-- Tableau actions -->
    <div *ngIf="activeTab==='actions'" class="overflow-x-auto">
      <div *ngIf="loadingLogs" class="p-8 flex justify-center">
        <i class="pi pi-spin pi-spinner text-2xl text-primary-500"></i>
      </div>
      <table *ngIf="!loadingLogs" class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-100 dark:border-surface-700">
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Date</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Agent</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Action</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Entité</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Description</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">IP</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of auditLogs"
              class="border-b border-surface-50 dark:border-surface-700
                     hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
            <td class="px-4 py-3 text-xs text-surface-400 whitespace-nowrap">
              {{ log.createdAt | date:'dd/MM/yy HH:mm' }}
            </td>
            <td class="px-4 py-3">
              <div class="text-sm font-semibold text-surface-900 dark:text-surface-0">
                {{ log.agentName || 'Inconnu' }}
              </div>
              <div class="text-xs text-surface-400 font-mono">{{ log.agentRole }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-lg text-xs font-mono font-semibold"
                  [class]="getActionClass(log.action)">
                {{ log.action }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-surface-500">
              {{ log.entityType }}
              <span *ngIf="log.entityId" class="font-mono text-surface-400">
                #{{ log.entityId | slice:0:8 }}…
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-surface-500 max-w-xs truncate" [title]="log.description">
              {{ log.description }}
            </td>
            <td class="px-4 py-3 text-xs font-mono text-surface-400">
              {{ formatIp(log.ipAddress) }}
            </td>
          </tr>
          <tr *ngIf="!auditLogs.length">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-surface-400">
              Aucune action enregistrée
            </td>
          </tr>
        </tbody>
      </table>
 
      <div *ngIf="totalAuditPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-surface-50 dark:border-surface-700">
        <span class="text-xs text-surface-400">Page {{ auditPage + 1 }} / {{ totalAuditPages }}</span>
        <div class="flex gap-2">
          <p-button icon="pi pi-chevron-left" severity="secondary" text size="small"
              [disabled]="auditPage === 0" (onClick)="loadLogs(auditPage - 1)" />
          <p-button icon="pi pi-chevron-right" severity="secondary" text size="small"
              [disabled]="auditPage >= totalAuditPages - 1" (onClick)="loadLogs(auditPage + 1)" />
        </div>
      </div>
    </div>
 
    <!-- Tableau connexions -->
    <div *ngIf="activeTab==='logins'" class="overflow-x-auto">
      <div *ngIf="loadingLogins" class="p-8 flex justify-center">
        <i class="pi pi-spin pi-spinner text-2xl text-primary-500"></i>
      </div>
      <table *ngIf="!loadingLogins" class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-100 dark:border-surface-700">
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Date</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Agent</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Statut</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Adresse IP</th>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-surface-400">Raison échec</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let log of loginLogs"
              class="border-b border-surface-50 dark:border-surface-700
                     hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
            <td class="px-4 py-3 text-xs text-surface-400 whitespace-nowrap">
              {{ log.createdAt | date:'dd/MM/yy HH:mm' }}
            </td>
            <td class="px-4 py-3">
              <div class="text-sm font-semibold text-surface-900 dark:text-surface-0">
                {{ log.agentName || log.agentId }}
              </div>
            </td>
            <td class="px-4 py-3">
              <p-tag [severity]="log.success ? 'success' : 'danger'"
                  [value]="log.success ? 'Succès' : 'Échec'" styleClass="text-xs" />
            </td>
            <td class="px-4 py-3 text-xs font-mono text-surface-400">
              {{ formatIp(log.ipAddress) }}
            </td>
            <td class="px-4 py-3 text-xs text-surface-500">{{ log.failureReason || '—' }}</td>
          </tr>
          <tr *ngIf="!loginLogs.length">
            <td colspan="5" class="px-4 py-8 text-center text-sm text-surface-400">
              Aucune connexion enregistrée
            </td>
          </tr>
        </tbody>
      </table>
 
      <div *ngIf="totalLoginPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-surface-50 dark:border-surface-700">
        <span class="text-xs text-surface-400">Page {{ loginPage + 1 }} / {{ totalLoginPages }}</span>
        <div class="flex gap-2">
          <p-button icon="pi pi-chevron-left" severity="secondary" text size="small"
              [disabled]="loginPage === 0" (onClick)="loadLogins(loginPage - 1)" />
          <p-button icon="pi pi-chevron-right" severity="secondary" text size="small"
              [disabled]="loginPage >= totalLoginPages - 1" (onClick)="loadLogins(loginPage + 1)" />
        </div>
      </div>
    </div>
 
  </div>
</div>
  `
})
export class AuditDashboard implements OnInit {
 
  private svc = inject(AuditService);
  private msg = inject(MessageService);
 
  stats:      AuditStats | null = null;
  auditLogs:  AuditLog[]        = [];
  loginLogs:  LoginLog[]        = [];
  topActions: { key: string; value: number }[] = [];
  topAgents:  { key: string; value: number }[] = [];
  maxActionCount = 1;
 
  activeTab     = 'actions';
  loadingLogs   = true;
  loadingLogins = true;
 
  auditPage       = 0;
  totalAuditPages = 1;
  loginPage       = 0;
  totalLoginPages = 1;
 
  filterAgentName = '';
  filterAction    = '';
  filterDateFrom  = '';
  filterDateTo    = '';
 
  filterLoginAgentName = '';
 
  readonly actionOptions = [
    { label: 'Créer dossier',        value: 'CREER_DOSSIER'        },
    { label: 'Modifier dossier',     value: 'MODIFIER_DOSSIER'     },
    { label: 'Clôturer dossier',     value: 'CLOTURER_DOSSIER'     },
    { label: 'Déclarer recevable',   value: 'DECLARER_RECEVABLE'   },
    { label: 'Déclarer irrecevable', value: 'DECLARER_IRRECEVABLE' },
    { label: 'Transférer dossier',   value: 'TRANSFERER_DOSSIER'   },
    { label: 'Soumettre CTADP',      value: 'SOUMETTRE_CTADP'      },
    { label: 'Créer agent',          value: 'CREER_AGENT'          },
    { label: 'Modifier agent',       value: 'MODIFIER_AGENT'       },
    { label: 'Activer agent',        value: 'ACTIVER_AGENT'        },
    { label: 'Désactiver agent',     value: 'DESACTIVER_AGENT'     },
    { label: 'Ouvrir investigation', value: 'OUVRIR_INVESTIGATION' },
    { label: 'Soumettre rapport',    value: 'SOUMETTRE_RAPPORT'    },
    { label: 'Créer rôle',           value: 'CREER_ROLE'           },
    { label: 'Modifier rôle',        value: 'MODIFIER_ROLE'        },
    { label: 'Supprimer rôle',       value: 'SUPPRIMER_ROLE'       },
  ];
 
  ngOnInit(): void {
    this.loadStats();
    this.loadLogs(0);
    this.loadLogins(0);
  }
 
  reload(): void {
    this.loadStats();
    this.loadLogs(0);
    this.loadLogins(0);
  }
 
  private loadStats(): void {
    this.svc.getStats().subscribe({
      next: s => {
        this.stats = s;
        this.topActions = Object.entries(s.topActions || {})
            .map(([key, value]) => ({ key, value: value as number }));
        this.topAgents  = Object.entries(s.topAgents  || {})
            .map(([key, value]) => ({ key, value: value as number }));
        this.maxActionCount = this.topActions.length
            ? Math.max(...this.topActions.map(e => e.value)) : 1;
      },
      error: () => this.msg.add({
        severity: 'error', summary: 'Erreur',
        detail: 'Impossible de charger les statistiques'
      })
    });
  }
 
  loadLogs(page: number): void {
    this.loadingLogs = true;
    this.auditPage   = page;
    this.svc.getLogs({
      agentName: this.filterAgentName || undefined,
      action:    this.filterAction    || undefined,
      dateFrom:  this.filterDateFrom  || undefined,
      dateTo:    this.filterDateTo    || undefined,
      page, size: 20
    }).subscribe({
      next: r => {
        this.auditLogs       = r.content;
        this.totalAuditPages = r.page.totalPages;
        this.loadingLogs     = false;
      },
      error: () => { this.loadingLogs = false; }
    });
  }
 
  loadLogins(page: number): void {
    this.loadingLogins = true;
    this.loginPage     = page;
    this.svc.getLogins(this.filterLoginAgentName || undefined, page).subscribe({
      next: r => {
        this.loginLogs       = r.content;
        this.totalLoginPages = r.page.totalPages;
        this.loadingLogins   = false;
      },
      error: () => { this.loadingLogins = false; }
    });
  }
 
  applyFilters():      void { this.loadLogs(0);   }
  applyLoginFilters(): void { this.loadLogins(0); }
 
  resetFilters(): void {
    this.filterAgentName = ''; this.filterAction = '';
    this.filterDateFrom  = ''; this.filterDateTo  = '';
    this.loadLogs(0);
  }
 
  resetLoginFilters(): void {
    this.filterLoginAgentName = '';
    this.loadLogins(0);
  }
 
  getBarWidth(value: number, max: number): number {
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }
 
  formatIp(ip: string | null | undefined): string {
    if (!ip) return '—';
    if (ip === '0:0:0:0:0:0:0:1' || ip === '::1') return '127.0.0.1 (local)';
    return ip;
  }
 
  getActionClass(action: string): string {
    if (action.includes('SUPPRIMER') || action.includes('CLOTURER') || action.includes('IRRECEVABLE'))
      return 'bg-red-50 text-red-700 border border-red-100';
    if (action.includes('CREER') || action.includes('DECLARER_RECEVABLE') || action.includes('OUVRIR') || action.includes('ACTIVER'))
      return 'bg-green-50 text-green-700 border border-green-100';
    if (action.includes('MODIFIER') || action.includes('CHANGER') || action.includes('PROLONGER') || action.includes('DESACTIVER'))
      return 'bg-amber-50 text-amber-700 border border-amber-100';
    return 'bg-surface-100 text-surface-600 border border-surface-200';
  }
}