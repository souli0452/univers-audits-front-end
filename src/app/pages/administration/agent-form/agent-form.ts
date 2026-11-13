import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { AgentService, AgentResponse } from '../../../core/services/agent.service';
import { RoleManagementService, RegleCumulRoles } from '../../../core/services/role-management.service';

@Component({
    selector: 'app-agent-form',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
        ButtonModule, InputTextModule, SelectModule, CheckboxModule,
        TagModule, ToastModule, SkeletonModule, CardModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-4">

    <!-- En-tête -->
    <div class="flex items-center gap-3">
        <p-button icon="pi pi-arrow-left" severity="secondary"
            text routerLink="/app/administration/agents" />
        <div>
            <h1 class="text-2xl font-bold">
                {{ isEdit ? "Modifier l'agent" : "Nouvel Agent" }}
            </h1>
            <p class="text-surface-500 text-sm mt-1" *ngIf="agent">
                {{ agent.matricule }} — {{ agent.firstName }} {{ agent.lastName }}
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Formulaire principal -->
        <div class="lg:col-span-2 flex flex-col gap-4">

            <!-- Informations personnelles -->
            <div class="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200">
                <h3 class="font-semibold mb-4">Informations personnelles</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium">Matricule *</label>
                        <input pInputText [formControl]="f['matricule']"
                            placeholder="Ex: ASCE-001" class="w-full"
                            [readonly]="isEdit" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium">Grade / Fonction</label>
                        <p-select [formControl]="f['grade']"
                            [options]="gradeOptions" optionLabel="label"
                            optionValue="value" placeholder="Sélectionner"
                            [showClear]="true" styleClass="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium">Prénom *</label>
                        <input pInputText [formControl]="f['firstName']"
                            placeholder="Prénom" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium">Nom *</label>
                        <input pInputText [formControl]="f['lastName']"
                            placeholder="Nom de famille" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium">Email *</label>
                        <input pInputText [formControl]="f['email']"
                            placeholder="email@asce-lc.bf" type="email"
                            class="w-full" />
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-medium">Téléphone</label>
                        <input pInputText [formControl]="f['phoneNumber']"
                            placeholder="+226 XX XX XX XX" class="w-full" />
                    </div>

                </div>

                <!-- Info email automatique -->
                <div *ngIf="!isEdit"
                    class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                    <div class="text-sm text-blue-700">
                        Un email sera envoyé automatiquement à l'agent
                        pour qu'il définisse son mot de passe.
                    </div>
                </div>

            </div>

            <!-- Rôles Keycloak -->
            <div class="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200">
                <h3 class="font-semibold mb-1 flex items-center gap-2">
                    <i class="pi pi-shield text-primary-600"></i>
                    Gérer les Permissions
                </h3>
                <p class="text-surface-400 text-xs mb-4">
                    Les rôles sélectionnés seront assignés directement dans Keycloak.
                </p>

                <!-- Squelettes de chargement -->
                <div *ngIf="loadingRoles" class="grid grid-cols-2 gap-2">
                    <p-skeleton *ngFor="let i of [1,2,3,4,5,6]"
                        height="52px" borderRadius="8px" />
                </div>

                <!-- Liste des rôles -->
                <div *ngIf="!loadingRoles" class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div *ngFor="let role of availableRoles"
                        class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                        [class.border-primary-300]="isRoleSelected(role)"
                        [class.bg-primary-50]="isRoleSelected(role)"
                        [class.border-surface-200]="!isRoleSelected(role)"
                        [class.bg-surface-50]="!isRoleSelected(role)"
                        (click)="toggleRole(role)">
                        <p-checkbox [binary]="true"
                            [ngModel]="isRoleSelected(role)"
                            (ngModelChange)="toggleRole(role)"
                            (click)="$event.stopPropagation()" />
                        <div>
                            <div class="text-sm font-medium">
                                {{ getRoleLabel(role) }}
                            </div>
                            <div class="text-xs text-surface-400">{{ role }}</div>
                        </div>
                    </div>
                </div>

                <!-- Aucun rôle chargé -->
                <div *ngIf="!loadingRoles && availableRoles.length === 0"
                    class="text-center py-6 text-surface-400">
                    <i class="pi pi-exclamation-triangle text-2xl mb-2 block"></i>
                    Impossible de charger les rôles Keycloak
                </div>

                <!-- Cumuls de rôles -->
                <div *ngIf="cumulsInterdits.length > 0" role="alert"
                    class="mt-4 rounded-lg border border-red-300 bg-white p-3 text-sm text-red-700">
                    <div class="font-semibold mb-1">Cumul de rôles interdit</div>
                    <ul class="list-disc pl-5 space-y-1">
                        <li *ngFor="let c of cumulsInterdits">
                            <strong>{{ getRoleLabel(c.roleA) }} + {{ getRoleLabel(c.roleB) }}</strong> : {{ c.raison }}
                        </li>
                    </ul>
                    <div class="mt-2 text-xs">Retire l'un de ces rôles pour pouvoir enregistrer.</div>
                </div>
                <div *ngIf="cumulsASurveiller.length > 0" role="status"
                    class="mt-4 rounded-lg border border-amber-300 bg-white p-3 text-sm text-amber-800">
                    <div class="font-semibold mb-1">Cumul de rôles à justifier</div>
                    <ul class="list-disc pl-5 space-y-1">
                        <li *ngFor="let c of cumulsASurveiller">
                            <strong>{{ getRoleLabel(c.roleA) }} + {{ getRoleLabel(c.roleB) }}</strong> : {{ c.raison }}
                        </li>
                    </ul>
                </div>

                <!-- Rôles sélectionnés -->
                <div *ngIf="selectedRoles.length > 0"
                    class="mt-4 pt-4 border-t border-surface-100">
                    <div class="text-xs text-surface-400 mb-2">Rôles sélectionnés :</div>
                    <div class="flex flex-wrap gap-2">
                        <p-tag *ngFor="let role of selectedRoles"
                            [value]="getRoleLabel(role)"
                            severity="success" styleClass="text-xs" />
                    </div>
                </div>

            </div>

            <!-- Boutons -->
            <div class="flex justify-end gap-2">
                <p-button label="Annuler" severity="secondary" outlined
                    routerLink="/app/administration/agents" />
                <p-button
                    [label]="isEdit ? 'Enregistrer les modifications' : 'Creer'"
                    icon="pi pi-save" [loading]="saving"
                    [disabled]="cumulsInterdits.length > 0" (onClick)="save()" />
            </div>

        </div>

        <!-- Colonne droite -->
        <div class="flex flex-col gap-4">

            <!-- Résumé des accès -->
            <div class="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200">
                <h3 class="font-semibold mb-3 flex items-center gap-2">
                    <i class="pi pi-key text-primary-600"></i>
                    Accès accordés
                </h3>

                <div *ngIf="selectedRoles.length === 0"
                    class="text-surface-400 text-sm text-center py-4">
                    Aucun rôle sélectionné
                </div>

                <div class="flex flex-col gap-2">
                    <div *ngFor="let perm of getSelectedPermissions()"
                        class="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                        <i [class]="perm.icon + ' text-green-500 text-sm'"></i>
                        <div>
                            <div class="text-sm font-medium text-green-800">
                                {{ perm.label }}
                            </div>
                            <div class="text-xs text-green-600">{{ perm.role }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Informations système (mode édition) -->
            <div *ngIf="isEdit && agent"
                class="bg-surface-50 rounded-xl p-4 border border-surface-200">
                <h4 class="text-sm font-medium mb-3 text-surface-500">
                    Informations système
                </h4>
                <div class="flex flex-col gap-2 text-xs text-surface-400">
                    <div>Créé le : {{ agent.createdAt | date:'dd/MM/yyyy' }}</div>
                </div>
            </div>

        </div>
    </div>

</div>
    `
})
export class AgentForm implements OnInit {

    private fb             = inject(FormBuilder);
    private agentService   = inject(AgentService);
    private route          = inject(ActivatedRoute);
    private router         = inject(Router);
    private messageService = inject(MessageService);
    private roleService    = inject(RoleManagementService);

    agent: AgentResponse | null = null;
    isEdit       = false;
    saving       = false;
    loadingRoles = false;

    availableRoles: string[] = [];
    selectedRoles:  string[] = [];

    /** Cumuls de rôles publiés par le back (déduits du workflow). */
    reglesCumul: RegleCumulRoles[] = [];

    private cumulsApplicables(niveau: 'INTERDIT' | 'A_SURVEILLER'): RegleCumulRoles[] {
        const roles = this.selectedRoles;
        // ADMIN_DDIC : compte technique, les cumuls interdits ne bloquent plus (mêmes règles que le serveur)
        const admin = roles.includes('ADMIN_DDIC');
        return this.reglesCumul.filter(r => {
            if (!roles.includes(r.roleA) || !roles.includes(r.roleB)) return false;
            if (niveau === 'INTERDIT') return !admin && r.niveau === 'INTERDIT';
            return r.niveau === 'A_SURVEILLER' || (admin && r.niveau === 'INTERDIT');
        });
    }

    get cumulsInterdits():   RegleCumulRoles[] { return this.cumulsApplicables('INTERDIT'); }
    get cumulsASurveiller(): RegleCumulRoles[] { return this.cumulsApplicables('A_SURVEILLER'); }

    form = this.fb.group({
        matricule:   ['', Validators.required],
        firstName:   ['', Validators.required],
        lastName:    ['', Validators.required],
        email:       ['', [Validators.required, Validators.email]],
        phoneNumber: [''],
        grade:       ['']
    });

    get f() { return this.form.controls; }

    private roleLabels: Record<string, string> = {
        ADMIN_DDIC:           "Administrateur DDIC",
        AGENT_BRPD:           "Agent BRPD",
        CGE:                  "Contrôleur Général d'État",
        CGEA:                 "Contrôleur Général Adjoint",
        CONSEILLER_JURIDIQUE: "Conseiller Juridique",
        CONTROLEUR_ETAT:      "Contrôleur d'État",
        MEMBRE_CTADP:         "Membre CTADP"
    };

    private rolePermissions: Record<string, { label: string; icon: string }> = {
        ADMIN_DDIC:           { label: "Administration système",   icon: "pi pi-cog" },
        AGENT_BRPD:           { label: "Enregistrer les dossiers", icon: "pi pi-inbox" },
        CGE:                  { label: "Décision CGE",             icon: "pi pi-gavel" },
        CGEA:                 { label: "Supervision CGEA",         icon: "pi pi-eye" },
        CONSEILLER_JURIDIQUE: { label: "Étude opportunité",        icon: "pi pi-search" },
        CONTROLEUR_ETAT:      { label: "Enquêtes terrain",         icon: "pi pi-map-marker" },
        MEMBRE_CTADP:         { label: "Revue CTADP",              icon: "pi pi-users" }
    };

    gradeOptions = [
        { label: "Contrôleur Général d'État",  value: "CGE" },
        { label: "Contrôleur Général Adjoint",  value: "CGEA" },
        { label: "Contrôleur d'État",           value: "CONTROLEUR" },
        { label: "Conseiller Juridique",         value: "JURISTE" },
        { label: "Agent BRPD",                   value: "AGENT_BRPD" },
        { label: "Directeur",                    value: "DIRECTEUR" },
        { label: "Agent",                        value: "AGENT" },
        { label: "Analyste",                     value: "ANALYSTE" },
        { label: "Informaticien",                value: "INFORMATICIEN" }
    ];

    ngOnInit(): void {
        this.loadAvailableRoles();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit = true;
            this.loadAgent(id);
            this.loadAgentRoles(id);
        }
    }

    private loadAvailableRoles(): void {
        this.loadingRoles = true;
        this.agentService.getAvailableRoles().subscribe({
            next:  roles => { this.availableRoles = roles; this.loadingRoles = false; },
            error: ()    => { this.loadingRoles = false; }
        });
        // Sans ces règles le formulaire reste utilisable : le serveur refuse de toute façon un cumul interdit.
        this.roleService.listCombinations().subscribe({
            next:  regles => { this.reglesCumul = regles; },
            error: ()     => { this.reglesCumul = []; }
        });
    }

    private loadAgent(id: string): void {
        this.agentService.findById(id).subscribe({
            next: agent => {
                this.agent = agent;
                this.form.patchValue({
                    matricule:   agent.matricule,
                    firstName:   agent.firstName,
                    lastName:    agent.lastName,
                    email:       agent.email,
                    phoneNumber: agent.phoneNumber || '',
                    grade:       agent.grade || ''
                });
                this.f['matricule'].disable();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur', detail: 'Agent introuvable'
            })
        });
    }

    private loadAgentRoles(id: string): void {
        this.agentService.getAgentRoles(id).subscribe({
            next: roles => { this.selectedRoles = roles; }
        });
    }

    isRoleSelected(role: string): boolean {
        return this.selectedRoles.includes(role);
    }

    toggleRole(role: string): void {
        const idx = this.selectedRoles.indexOf(role);
        if (idx === -1) this.selectedRoles.push(role);
        else            this.selectedRoles.splice(idx, 1);
    }

    getRoleLabel(role: string): string {
        return this.roleLabels[role] || role;
    }

    getSelectedPermissions(): Array<{ label: string; icon: string; role: string }> {
        return this.selectedRoles
            .filter(r => this.rolePermissions[r])
            .map(r => ({ ...this.rolePermissions[r], role: r }));
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.saving = true;

        if (this.isEdit && this.agent) {
            forkJoin([
                this.agentService.update(this.agent.id, {
                    firstName:     this.f['firstName'].value!,
                    lastName:      this.f['lastName'].value!,
                    email:         this.f['email'].value!,
                    phoneNumber:   this.f['phoneNumber'].value || undefined,
                    grade:         this.f['grade'].value || undefined,
                    keycloakRoles: this.selectedRoles
                }),
                this.agentService.updateRoles(this.agent.id, this.selectedRoles)
            ]).subscribe({
                next:  () => this.onSuccess('Agent mis à jour'),
                error: (err) => this.onError(err)
            });
        } else {
            this.agentService.create({
                matricule:     this.f['matricule'].value!,
                firstName:     this.f['firstName'].value!,
                lastName:      this.f['lastName'].value!,
                email:         this.f['email'].value!,
                phoneNumber:   this.f['phoneNumber'].value || undefined,
                grade:         this.f['grade'].value || undefined,
                keycloakRoles: this.selectedRoles
            }).subscribe({
                next:  (a) => this.onSuccess(`Agent ${a.matricule} créé — email envoyé`),
                error: (err) => this.onError(err)
            });
        }
    }

    private onSuccess(detail: string): void {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail });
        setTimeout(() => this.router.navigate(['/app/administration/agents']), 1500);
    }

    private onError(err: any): void {
        this.saving = false;
        this.messageService.add({
            severity: 'error', summary: 'Erreur',
            detail: err.error?.message || 'Action impossible'
        });
    }
}