import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { TextareaModule }      from 'primeng/textarea';
import { SelectModule }        from 'primeng/select';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { DialogModule }        from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { CheckboxModule }      from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  RoleManagementService, RoleDto, PermissionDto,
  CreateRoleRequest, UpdateRoleRequest
} from '../../../core/services/role-management.service';

type Sev = 'success'|'info'|'warn'|'danger'|'secondary'|'contrast'|null|undefined;

@Component({
  selector: 'app-roles-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule, SelectModule,
    TagModule, ToastModule, DialogModule, ConfirmDialogModule,
    TooltipModule, CheckboxModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
<p-toast />
<p-confirmDialog />

<p-dialog [(visible)]="showDialog"
    [header]="editing ? 'Modifier le rôle' : 'Nouveau rôle'"
    [modal]="true" [style]="{width:'640px'}" [draggable]="false">

  <div class="flex flex-col gap-4 py-2">

    <div *ngIf="!editing"
        class="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <i class="pi pi-exclamation-triangle text-amber-500 flex-shrink-0 mt-0.5"></i>
      <p class="text-sm text-amber-700 leading-relaxed">
        Après création ici, créez aussi ce rôle dans
        <strong>Keycloak Console → Realm asce-lc → Realm roles</strong>
        avec exactement la même clé.
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-semibold">Clé Keycloak <span class="text-red-500">*</span></label>
      <input pInputText [formControl]="f['roleKey']"
          placeholder="EX: INSPECTEUR_REGIONAL" class="w-full font-mono"
          [readonly]="!!editing" />
      <small class="text-red-500 text-xs"
          *ngIf="f['roleKey'].invalid && f['roleKey'].touched">
        Majuscules et underscores uniquement
      </small>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-semibold">Libellé <span class="text-red-500">*</span></label>
      <input pInputText [formControl]="f['label']"
          placeholder="Ex: Inspecteur Régional" class="w-full" />
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-semibold">Description</label>
      <textarea pTextarea [formControl]="f['description']"
          rows="2" class="w-full resize-none"
          placeholder="Rôles et responsabilités"></textarea>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold">Icône</label>
        <input pInputText [formControl]="f['icon']"
            placeholder="pi pi-shield" class="w-full text-sm" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold">Couleur</label>
        <p-select [formControl]="f['severity']"
            [options]="severityOpts" optionLabel="label" optionValue="value"
            styleClass="w-full" appendTo="body" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold">Ordre</label>
        <input pInputText type="number" [formControl]="f['displayOrder']"
            class="w-full text-sm" />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-sm font-semibold">Permissions</label>
      <div *ngIf="loadingPerms" class="text-xs text-surface-400">Chargement…</div>
      <div *ngIf="!loadingPerms"
          class="border border-surface-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
        <div *ngFor="let cat of permissionCategories"
            class="border-b border-surface-100 last:border-0">
          <div class="px-4 py-2 bg-surface-50 text-xs font-bold uppercase tracking-wide text-surface-500">
            {{ cat }}
          </div>
          <div class="grid grid-cols-2 gap-1 px-4 py-2">
            <div *ngFor="let perm of permsByCategory[cat]"
                class="flex items-center gap-2">
              <p-checkbox [value]="perm.permissionKey"
                  [(ngModel)]="selectedPermKeys"
                  [inputId]="perm.permissionKey" />
              <label [for]="perm.permissionKey"
                  class="text-sm cursor-pointer" [title]="perm.description || ''">
                {{ perm.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="f['label'].value"
        class="p-3 bg-surface-50 rounded-xl border border-surface-100">
      <div class="text-xs text-surface-400 uppercase tracking-wide mb-2">Aperçu</div>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
          <i [class]="(f['icon'].value || 'pi pi-user') + ' text-primary-600 text-sm'"></i>
        </div>
        <div>
          <div class="text-sm font-semibold">{{ f['label'].value }}</div>
          <div class="text-xs text-surface-400">{{ f['roleKey'].value }}</div>
        </div>
        <p-tag [value]="f['label'].value"
            [severity]="getSev(f['severity'].value)"
            styleClass="text-xs ml-auto" />
      </div>
    </div>

  </div>

  <ng-template pTemplate="footer">
    <p-button label="Annuler" severity="secondary" outlined (onClick)="showDialog=false" />
    <p-button [label]="editing ? 'Enregistrer' : 'Créer'"
        [icon]="editing ? 'pi pi-save' : 'pi pi-plus'"
        [loading]="saving" (onClick)="save()" />
  </ng-template>
</p-dialog>

<div class="flex flex-col gap-6">

  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Rôles & Permissions</h1>
      <p class="text-surface-400 text-sm mt-1">{{ roles.length }} rôle(s) actif(s)</p>
    </div>
    <p-button label="Nouveau rôle" icon="pi pi-plus" (onClick)="openCreate()" />
  </div>

  <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <div *ngFor="let i of [1,2,3,4,5,6,7]"
        class="h-52 bg-surface-100 rounded-2xl animate-pulse"></div>
  </div>

  <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

    <div *ngFor="let role of roles"
        class="bg-white dark:bg-surface-800 rounded-2xl border
               border-surface-100 dark:border-surface-700 p-5
               hover:border-primary-200 transition-colors flex flex-col">

      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900
                    flex items-center justify-center flex-shrink-0">
          <i [class]="role.icon + ' text-primary-600 dark:text-primary-400'"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-surface-900 dark:text-surface-0 text-sm">{{ role.label }}</div>
          <div class="font-mono text-xs text-surface-400 mt-0.5">{{ role.roleKey }}</div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <i *ngIf="role.isProtected" class="pi pi-lock text-amber-400 text-xs"
              pTooltip="Rôle protégé" tooltipPosition="top"></i>
          <p-tag [severity]="getSev(role.severity)" [value]="role.severity" styleClass="text-xs" />
        </div>
      </div>

      <p *ngIf="role.description"
          class="text-xs text-surface-500 mb-3 leading-relaxed line-clamp-2">
        {{ role.description }}
      </p>

      <div class="flex flex-wrap gap-1 mb-4 min-h-[28px]">
        <ng-container *ngIf="role.permissions?.length; else noPerms">
          <span *ngFor="let p of role.permissions | slice:0:3"
              class="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950
                     text-primary-700 dark:text-primary-300 text-xs border
                     border-primary-100 dark:border-primary-900">
            {{ p.label }}
          </span>
          <span *ngIf="(role.permissions?.length || 0) > 3"
              class="px-2 py-0.5 rounded-full bg-surface-100 text-surface-500 text-xs">
            +{{ (role.permissions.length - 3) }} autres
          </span>
        </ng-container>
        <ng-template #noPerms>
          <span class="text-xs text-surface-300 italic">Aucune permission</span>
        </ng-template>
      </div>

      <div class="flex gap-2 mt-auto pt-3 border-t border-surface-50 dark:border-surface-700">
        <p-button icon="pi pi-pencil" label="Modifier"
            severity="info" outlined size="small" styleClass="flex-1 justify-center"
            (onClick)="openEdit(role)" />
        <p-button icon="pi pi-trash" severity="danger" text size="small"
            [disabled]="role.isProtected"
            [pTooltip]="role.isProtected ? 'Rôle protégé' : 'Supprimer'"
            tooltipPosition="top"
            (onClick)="confirmDelete(role)" />
      </div>
    </div>

    <div class="rounded-2xl border-2 border-dashed border-surface-200
                dark:border-surface-600 p-5 flex flex-col items-center
                justify-center gap-3 cursor-pointer min-h-[200px]
                hover:border-primary-300 hover:bg-primary-50
                dark:hover:bg-primary-950 transition-all"
        (click)="openCreate()">
      <div class="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-700
                  flex items-center justify-center">
        <i class="pi pi-plus text-surface-400 text-xl"></i>
      </div>
      <p class="text-sm text-surface-400 font-medium">Créer un nouveau rôle</p>
    </div>

  </div>
</div>
  `
})
export class RolesManagement implements OnInit {

  private svc  = inject(RoleManagementService);
  private msg  = inject(MessageService);
  private conf = inject(ConfirmationService);
  private fb   = inject(FormBuilder);

  roles:    RoleDto[]       = [];
  allPerms: PermissionDto[] = [];
  permsByCategory: Record<string, PermissionDto[]> = {};
  permissionCategories: string[] = [];
  selectedPermKeys: string[] = [];

  loading      = true;
  loadingPerms = true;
  saving       = false;
  showDialog   = false;
  editing:     RoleDto | null = null;

  form = this.fb.group({
    roleKey:      ['', [Validators.required, Validators.pattern(/^[A-Z][A-Z0-9_]{1,59}$/)]],
    label:        ['', Validators.required],
    description:  [''],
    icon:         ['pi pi-user'],
    severity:     ['info'],
    displayOrder: [99]
  });

  get f() { return this.form.controls; }

  readonly severityOpts = [
    { label: 'Info (bleu)',       value: 'info'      },
    { label: 'Succès (vert)',     value: 'success'   },
    { label: 'Attention (ambre)', value: 'warn'      },
    { label: 'Danger (rouge)',    value: 'danger'    },
    { label: 'Secondaire',        value: 'secondary' }
  ];

  getSev(v: string | null | undefined): Sev {
    const ok = ['success','info','warn','danger','secondary','contrast'];
    return (v && ok.includes(v)) ? v as Sev : 'info';
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  private loadRoles(): void {
    this.loading = true;
    this.svc.listAll().subscribe({
      next:  r  => { this.roles = r; this.loading = false; },
      error: () => { this.loading = false; this.toast('error', 'Impossible de charger les rôles'); }
    });
  }

  private loadPermissions(): void {
    this.loadingPerms = true;
    this.svc.listPermissions().subscribe({
      next: perms => {
        this.allPerms = perms;
        this.permsByCategory = perms.reduce((acc, p) => {
          const cat = p.category || 'Autres';
          (acc[cat] = acc[cat] || []).push(p);
          return acc;
        }, {} as Record<string, PermissionDto[]>);
        this.permissionCategories = Object.keys(this.permsByCategory).sort();
        this.loadingPerms = false;
      },
      error: () => { this.loadingPerms = false; }
    });
  }

  openCreate(): void {
    this.editing = null;
    this.selectedPermKeys = [];
    this.form.reset({ roleKey:'', label:'', description:'',
                      icon:'pi pi-user', severity:'info', displayOrder:99 });
    this.f['roleKey'].enable();
    this.showDialog = true;
  }

  openEdit(role: RoleDto): void {
    this.svc.getOne(role.roleKey).subscribe(detail => {
      this.editing = detail;
      this.selectedPermKeys = detail.permissions.map(p => p.permissionKey);
      this.form.patchValue({
        roleKey: detail.roleKey, label: detail.label,
        description: detail.description, icon: detail.icon,
        severity: detail.severity, displayOrder: detail.displayOrder
      });
      this.f['roleKey'].disable();
      this.showDialog = true;
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    if (this.editing) {
      const req: UpdateRoleRequest = {
        label: this.f['label'].value!, description: this.f['description'].value || undefined,
        icon: this.f['icon'].value!, severity: this.f['severity'].value!,
        displayOrder: this.f['displayOrder'].value!, permissionKeys: this.selectedPermKeys
      };
      this.svc.update(this.editing.roleKey, req).subscribe({
        next: updated => {
          const i = this.roles.findIndex(r => r.roleKey === updated.roleKey);
          if (i !== -1) this.roles[i] = updated;
          this.roles = [...this.roles];
          this.saving = false; this.showDialog = false;
          this.toast('success', `Rôle ${updated.roleKey} mis à jour`);
        },
        error: e => this.onErr(e)
      });
    } else {
      const req: CreateRoleRequest = {
        roleKey: this.f['roleKey'].value!.toUpperCase(),
        label: this.f['label'].value!,
        description: this.f['description'].value || undefined,
        icon: this.f['icon'].value!, severity: this.f['severity'].value!,
        displayOrder: this.f['displayOrder'].value!, permissionKeys: this.selectedPermKeys
      };
      this.svc.create(req).subscribe({
        next: created => {
          this.roles = [...this.roles, created].sort((a,b) => a.displayOrder - b.displayOrder);
          this.saving = false; this.showDialog = false;
          this.toast('success', `Rôle ${created.roleKey} créé`);
        },
        error: e => this.onErr(e)
      });
    }
  }

  confirmDelete(role: RoleDto): void {
    this.conf.confirm({
      header: `Supprimer ${role.roleKey} ?`,
      message: `Le rôle "${role.label}" sera désactivé.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer', rejectLabel: 'Annuler',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.svc.delete(role.roleKey).subscribe({
          next:  () => { this.roles = this.roles.filter(r => r.roleKey !== role.roleKey); this.toast('warn', `${role.roleKey} supprimé`); },
          error: e  => this.toast('error', e.error?.message || 'Erreur suppression')
        });
      }
    });
  }

  private onErr(e: any): void {
    this.saving = false;
    this.toast('error', e.error?.message || 'Une erreur est survenue');
  }

  private toast(s: string, detail: string): void {
    this.msg.add({ severity: s, summary: s === 'error' ? 'Erreur' : s === 'warn' ? 'Attention' : 'Succès', detail });
  }
}