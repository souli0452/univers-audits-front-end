import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { ProfileService } from '../../core/services/profile.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-profil',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        ButtonModule, TagModule, DividerModule,
        ToastModule, DialogModule, InputTextModule, PasswordModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<!-- ── Modale modifier profil ─────────────────────────────── -->
<p-dialog
    header="Modifier mon profil"
    [(visible)]="showEditProfile"
    [modal]="true"
    [style]="{width: '480px'}"
    [draggable]="false">

    <div class="flex flex-col gap-4 py-2">

        <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-surface-700">Prénom *</label>
            <input pInputText [formControl]="profileForm.controls['firstName']"
                placeholder="Prénom" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-surface-700">Nom *</label>
            <input pInputText [formControl]="profileForm.controls['lastName']"
                placeholder="Nom" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-surface-700">Email *</label>
            <input pInputText [formControl]="profileForm.controls['email']"
                placeholder="email@asce-lc.bf" type="email" class="w-full" />
        </div>

    </div>

    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showEditProfile = false" />
        <p-button label="Enregistrer" icon="pi pi-save"
            [loading]="savingProfile" (onClick)="saveProfile()" />
    </ng-template>
</p-dialog>

<!-- ── Modale changer mot de passe ────────────────────────── -->
<p-dialog
    header="Changer mon mot de passe"
    [(visible)]="showChangePassword"
    [modal]="true"
    [style]="{width: '480px'}"
    [draggable]="false">

    <div class="flex flex-col gap-4 py-2">

        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
            <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
            <p class="text-sm text-blue-700">
                Le mot de passe doit contenir au moins 8 caractères.
            </p>
        </div>

        <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-surface-700">
                Nouveau mot de passe *
            </label>
            <p-password
                [formControl]="passwordForm.controls['newPassword']"
                placeholder="Nouveau mot de passe"
                [toggleMask]="true"
                styleClass="w-full"
                [feedback]="true" />
        </div>

        <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-surface-700">
                Confirmer le mot de passe *
            </label>
            <p-password
                [formControl]="passwordForm.controls['confirmPassword']"
                placeholder="Confirmer le mot de passe"
                [toggleMask]="true"
                styleClass="w-full"
                [feedback]="false" />
        </div>

        <!-- Erreur confirmation -->
        <div *ngIf="passwordMismatch"
            class="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <i class="pi pi-times-circle text-red-500"></i>
            <p class="text-sm text-red-700">Les mots de passe ne correspondent pas.</p>
        </div>

    </div>

    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined
            (onClick)="showChangePassword = false" />
        <p-button label="Changer" icon="pi pi-lock"
            [loading]="savingPassword" (onClick)="savePassword()" />
    </ng-template>
</p-dialog>

<!-- ── Page principale ────────────────────────────────────── -->
<div class="flex flex-col gap-6">

    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Mon Profil
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Informations de votre compte ASCE-LC
            </p>
        </div>
        <p-button label="Se déconnecter" icon="pi pi-sign-out"
            severity="danger" outlined (onClick)="logout()" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- ── Carte profil ────────────────────────────────── -->
        <div class="lg:col-span-1">
            <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden">

                <div class="h-28 bg-gradient-to-br from-primary-600 via-primary-500 to-green-400"></div>

                <div class="px-6 pb-6">
                    <div class="flex justify-center -mt-14 mb-4">
                        <div class="w-28 h-28 rounded-2xl border-4 border-white dark:border-surface-800 shadow-xl flex items-center justify-center text-4xl font-bold text-white"
                            style="background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-700))">
                            {{ initials }}
                        </div>
                    </div>

                    <div class="text-center mb-4">
                        <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">
                            {{ userInfo.fullName }}
                        </h2>
                        <p class="text-surface-400 text-sm mt-1">{{ userInfo.email }}</p>
                        <p class="text-surface-300 text-xs mt-0.5 font-mono">
                            @{{ userInfo.username }}
                        </p>
                    </div>

                    <div class="flex justify-center mb-4">
                        <div class="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
                            <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            Session active
                        </div>
                    </div>

                    <p-divider />

                    <div class="mb-4">
                        <h4 class="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">
                            Rôles assignés
                        </h4>
                        <div *ngIf="filteredRoles.length === 0"
                            class="text-surface-300 text-sm text-center py-2">
                            Aucun rôle assigné
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <p-tag *ngFor="let role of filteredRoles"
                                [value]="getRoleLabel(role)"
                                [severity]="getRoleSeverity(role)"
                                styleClass="text-xs" />
                        </div>
                    </div>

                    <p-divider />

                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-surface-400">Realm</span>
                            <span class="font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">asce-lc</span>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                            <span class="text-surface-400">Client</span>
                            <span class="font-mono bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded">asce-lc-frontend</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Colonne droite ──────────────────────────────── -->
        <div class="lg:col-span-2 flex flex-col gap-4">

            <!-- Informations du compte -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-100 dark:border-surface-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold flex items-center gap-2 text-surface-900 dark:text-surface-0">
                        <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                            <i class="pi pi-user text-primary-600 text-sm"></i>
                        </div>
                        Informations du compte
                    </h3>
                    <p-button
                        label="Modifier"
                        icon="pi pi-pencil"
                        severity="secondary"
                        outlined
                        size="small"
                        (onClick)="openEditProfile()" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                        <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Prénom</div>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">
                            {{ userInfo.firstName || '—' }}
                        </div>
                    </div>
                    <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                        <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Nom</div>
                        <div class="font-semibold text-surface-900 dark:text-surface-0">
                            {{ userInfo.lastName || '—' }}
                        </div>
                    </div>
                    <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                        <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Nom d'utilisateur</div>
                        <div class="font-semibold font-mono text-surface-900 dark:text-surface-0">
                            {{ userInfo.username }}
                        </div>
                    </div>
                    <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl">
                        <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">Email</div>
                        <div class="font-semibold text-surface-900 dark:text-surface-0 truncate">
                            {{ userInfo.email || '—' }}
                        </div>
                    </div>
                    <div class="p-3 bg-surface-50 dark:bg-surface-700 rounded-xl md:col-span-2">
                        <div class="text-xs text-surface-400 uppercase tracking-wide mb-1">ID Keycloak</div>
                        <div class="font-mono text-xs text-surface-500 break-all">{{ userInfo.id }}</div>
                    </div>
                </div>
            </div>

            <!-- Sécurité -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-100 dark:border-surface-700">
                <h3 class="font-semibold flex items-center gap-2 mb-4 text-surface-900 dark:text-surface-0">
                    <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <i class="pi pi-lock text-amber-600 text-sm"></i>
                    </div>
                    Sécurité du compte
                </h3>

                <div class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl border border-surface-100 dark:border-surface-600">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <i class="pi pi-key text-amber-600"></i>
                        </div>
                        <div>
                            <div class="font-medium text-sm text-surface-900 dark:text-surface-0">
                                Mot de passe
                            </div>
                            <div class="text-xs text-surface-400 mt-0.5">
                                Modifier votre mot de passe de connexion
                            </div>
                        </div>
                    </div>
                    <p-button
                        label="Changer"
                        icon="pi pi-lock"
                        severity="warn"
                        outlined
                        size="small"
                        (onClick)="openChangePassword()" />
                </div>
            </div>

            <!-- Permissions -->
            <div class="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-100 dark:border-surface-700">
                <h3 class="font-semibold mb-4 flex items-center gap-2 text-surface-900 dark:text-surface-0">
                    <div class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <i class="pi pi-shield text-primary-600 text-sm"></i>
                    </div>
                    Permissions et Accès
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div *ngFor="let perm of permissions"
                        class="flex items-center gap-3 p-3 rounded-xl border transition-all"
                        [class.bg-green-50]="perm.granted"
                        [class.border-green-200]="perm.granted"
                        [class.bg-surface-50]="!perm.granted"
                        [class.border-surface-100]="!perm.granted"
                        [class.opacity-50]="!perm.granted">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            [class.bg-green-100]="perm.granted"
                            [class.bg-surface-100]="!perm.granted">
                            <i [class]="perm.icon + ' text-sm'"
                               [class.text-green-600]="perm.granted"
                               [class.text-surface-400]="!perm.granted"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-surface-900 dark:text-surface-0">
                                {{ perm.label }}
                            </div>
                            <div class="text-xs text-surface-400">{{ perm.description }}</div>
                        </div>
                        <i [class]="perm.granted
                            ? 'pi pi-check-circle text-green-500 text-lg'
                            : 'pi pi-times-circle text-surface-300 text-lg'"></i>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>
    `
})
export class Profil implements OnInit {

    private keycloakService = inject(KeycloakService);
    private profileService  = inject(ProfileService);
    private messageService  = inject(MessageService);
    private fb              = inject(FormBuilder);

    userInfo = this.keycloakService.getUserInfo();

    showEditProfile    = false;
    showChangePassword = false;
    savingProfile      = false;
    savingPassword     = false;

    profileForm = this.fb.group({
        firstName: ['', Validators.required],
        lastName:  ['', Validators.required],
        email:     ['', [Validators.required, Validators.email]]
    });

    passwordForm = this.fb.group({
        newPassword:     ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
    });

    get passwordMismatch(): boolean {
        const f = this.passwordForm.value;
        return !!(f.confirmPassword && f.newPassword !== f.confirmPassword);
    }

    get initials(): string {
        return (
            (this.userInfo.firstName?.[0] || '') +
            (this.userInfo.lastName?.[0]  || '')
        ).toUpperCase() || this.userInfo.username?.[0]?.toUpperCase() || '?';
    }

    get filteredRoles(): string[] {
        const systemRoles = [
            'offline_access', 'uma_authorization', 'default-roles-asce-lc'
        ];
        return this.userInfo.roles.filter(r => !systemRoles.includes(r));
    }

    permissions = [
        { label: 'Enregistrer les dossiers', description: 'Rôle AGENT_BRPD',          icon: 'pi pi-inbox',      granted: false },
        { label: 'Étude opportunité',         description: 'Rôle CONSEILLER_JURIDIQUE', icon: 'pi pi-search',     granted: false },
        { label: 'Revue CTADP',               description: 'Rôle MEMBRE_CTADP',         icon: 'pi pi-users',      granted: false },
        { label: 'Décision CGE',              description: 'Rôle CGE',                  icon: 'pi pi-gavel',      granted: false },
        { label: 'Supervision CGEA',          description: 'Rôle CGEA',                 icon: 'pi pi-eye',        granted: false },
        { label: 'Enquêtes terrain',          description: 'Rôle CONTROLEUR_ETAT',      icon: 'pi pi-map-marker', granted: false },
        { label: 'Administration système',    description: 'Rôle ADMIN_DDIC',           icon: 'pi pi-cog',        granted: false },
        { label: 'Statistiques',              description: 'Tous les rôles',            icon: 'pi pi-chart-bar',  granted: true  }
    ];

    ngOnInit(): void { this.buildPermissions(); }

    private buildPermissions(): void {
        const roleMap: Record<string, number> = {
            AGENT_BRPD: 0, CONSEILLER_JURIDIQUE: 1, MEMBRE_CTADP: 2,
            CGE: 3, CGEA: 4, CONTROLEUR_ETAT: 5, ADMIN_DDIC: 6
        };
        this.userInfo.roles.forEach(role => {
            const idx = roleMap[role];
            if (idx !== undefined) this.permissions[idx].granted = true;
        });
    }

    // ── Modifier profil ───────────────────────────────────────

    openEditProfile(): void {
        this.profileForm.patchValue({
            firstName: this.userInfo.firstName || '',
            lastName:  this.userInfo.lastName  || '',
            email:     this.userInfo.email     || ''
        });
        this.showEditProfile = true;
    }

    saveProfile(): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }
        this.savingProfile = true;
        this.profileService.updateProfile({
            firstName: this.profileForm.value.firstName!,
            lastName:  this.profileForm.value.lastName!,
            email:     this.profileForm.value.email!
        }).subscribe({
            next: () => {
                this.savingProfile    = false;
                this.showEditProfile  = false;
                // Mettre à jour l'affichage local
                this.userInfo = {
                    ...this.userInfo,
                    firstName: this.profileForm.value.firstName!,
                    lastName:  this.profileForm.value.lastName!,
                    email:     this.profileForm.value.email!,
                    fullName:  `${this.profileForm.value.firstName} ${this.profileForm.value.lastName}`
                };
                this.messageService.add({
                    severity: 'success',
                    summary:  'Profil mis à jour',
                    detail:   'Vos informations ont été enregistrées'
                });
            },
            error: (err) => {
                this.savingProfile = false;
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   err.error?.message || 'Impossible de modifier le profil'
                });
            }
        });
    }

    // ── Changer mot de passe ──────────────────────────────────

    openChangePassword(): void {
        this.passwordForm.reset();
        this.showChangePassword = true;
    }

    savePassword(): void {
        if (this.passwordForm.invalid || this.passwordMismatch) {
            this.passwordForm.markAllAsTouched();
            return;
        }
        this.savingPassword = true;
        this.profileService.changePassword({
            newPassword:     this.passwordForm.value.newPassword!,
            confirmPassword: this.passwordForm.value.confirmPassword!
        }).subscribe({
            next: () => {
                this.savingPassword     = false;
                this.showChangePassword = false;
                this.passwordForm.reset();
                this.messageService.add({
                    severity: 'success',
                    summary:  'Mot de passe modifié',
                    detail:   'Votre nouveau mot de passe est actif'
                });
            },
            error: (err) => {
                this.savingPassword = false;
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   err.error?.message || 'Impossible de changer le mot de passe'
                });
            }
        });
    }

    getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            AGENT_BRPD: 'Agent BRPD', CONSEILLER_JURIDIQUE: 'Conseiller Juridique',
            MEMBRE_CTADP: 'Membre CTADP', CGEA: 'CGEA', CGE: 'CGE',
            CONTROLEUR_ETAT: "Contrôleur d'État", ADMIN_DDIC: 'Admin DDIC'
        };
        return labels[role] || role;
    }

    getRoleSeverity(role: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            CGE: 'danger', CGEA: 'danger', ADMIN_DDIC: 'warn',
            CONSEILLER_JURIDIQUE: 'info', AGENT_BRPD: 'success',
            MEMBRE_CTADP: 'info', CONTROLEUR_ETAT: 'secondary'
        };
        return map[role] ?? 'info';
    }

    openKeycloakAccount(): void {
        window.open('http://localhost:8080/realms/asce-lc/account', '_blank');
    }

    logout(): void { this.keycloakService.logout(); }
}