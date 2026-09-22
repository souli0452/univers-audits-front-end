# Fiche d'affectation des dossiers — Plan d'implémentation (Frontend)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exposer dans l'UI agent le circuit d'affectation des dossiers
(BRPD → Cabinet CGE → CGEA → département/conseiller juridique désigné →
suivi) livré côté backend par
`docs/superpowers/plans/2026-09-22-fiche-affectation-backend.md` (dépôt
`back-end`, branche `feature/workflow-denociation-asce-fix`).

**Architecture:** Nouveau modèle + service HTTP (patron
`StatistiqueService`/`AttachmentService`), nouveau composant standalone
autonome `FicheAffectationTab` (fichier séparé, pas ajouté directement dans
l'énorme `dossier-detail.ts`/`.html` — principe "fichiers plus petits et
focalisés"), embarqué dans un nouvel onglet "Affectation" de
`dossier-detail.html` au même niveau que l'onglet "Pièces jointes" existant.

**Tech Stack:** Angular 20 (standalone components), PrimeNG, Tailwind CSS 4,
`HttpClient`, aucune librairie de state management.

**Spec:** `docs/superpowers/specs/2026-09-22-fiche-affectation-design.md`
(dépôt `back-end` — ce plan frontend en est la contrepartie UI).

## Global Constraints

- **Aucun fichier `.spec.ts` n'existe dans ce dépôt** (vérifié —
  `find src/app -name "*.spec.ts"` retourne 0 résultat) : ce chantier ne
  doit pas introduire de nouvelle convention de test unitaire isolée. La
  vérification se fait par `npm run build` (compilation stricte TypeScript)
  après chaque tâche, plus une vérification manuelle finale décrite en fin
  de plan.
- **Endpoint départements déjà existant côté backend, ne pas le recréer** :
  `GET /api/v1/config/departements` (`ConfigController.java:44-58`, rôle
  `isAuthenticated()`) retourne déjà `[{id, code, libelle}, ...]` pour tous
  les départements actifs. Le frontend filtre côté client sur
  `code === 'DEI' || code === 'DAC'`.
- **Endpoint conseillers juridiques** : `GET /api/v1/agents/by-role/{roleName}`
  (nouveau, livré par le plan backend Task 3) — appeler avec
  `roleName = 'CONSEILLER_JURIDIQUE'`.
- La fiche d'affectation est **non bloquante** : ne jamais désactiver ou
  masquer les autres onglets/actions du dossier en fonction de son état.
- Suivre exactement les conventions déjà établies dans ce dépôt (confirmées
  en lisant `statistique.service.ts`, `attachment.service.ts`,
  `dossier-detail.ts`) : `@Injectable({providedIn:'root'})`,
  `HttpClient` via `inject()`, base URL `${environment.apiUrl}/...`,
  `Observable<T>` simple, pas de mapper JSON manuel.
- **Décision de simplification (Ruling)** : le design approuvé mentionnait
  un onglet "visible pour les rôles concernés". Après étude du composant
  `dossier-detail.ts`, aucun des 4 onglets existants (Parties visées,
  Témoins, Observations, Pièces jointes) n'a de logique de visibilité
  conditionnelle — l'accès fin se fait déjà par bouton d'action, pas par
  onglet. Ce plan suit ce même principe pour rester cohérent avec le
  composant existant : l'onglet "Affectation" est **toujours visible**,
  et c'est le contenu du composant enfant qui affiche un état vide, un
  état "lecture seule", ou un message d'accès refusé selon la réponse du
  backend (qui reste la seule autorité de sécurité réelle — voir Task 3).

---

### Task 1: Modèle `FicheAffectation`

**Files:**
- Create: `src/app/core/models/fiche-affectation.model.ts`

**Interfaces:**
- Produces: `FicheAffectation`, `FicheAffectationCreateRequest`,
  `FicheAffectationAffectationRequest`, `FicheAffectationSuiviRequest`,
  `DepartementOption`, `AgentSummary` — consommés par le service (Task 2)
  et le composant (Task 3).

- [ ] **Step 1: Écrire le fichier modèle**

```typescript
// src/app/core/models/fiche-affectation.model.ts

export type DecisionCgeAffectation = 'AFFECTATION_DIRECTE_CGEA' | 'ECHANGE_PREALABLE';
export type TypeDesignation        = 'DEPARTEMENT' | 'AGENT_CJ' | 'BRPD';
export type EtatAvancementAffectation = 'EN_COURS' | 'CLOTURE' | 'AUTRE';

export interface FicheAffectation {
    id:                        string;
    dossierId:                 string;

    decisionCge?:              DecisionCgeAffectation;
    observationsCge?:          string;
    agentCgeNom?:               string;
    dateDecisionCge?:          string;

    typeDesignation?:          TypeDesignation;
    departementDesigneId?:     string;
    departementDesigneLibelle?: string;
    agentDesigneId?:           string;
    agentDesigneNom?:          string;
    observationsCgea?:         string;
    agentCgeaNom?:              string;
    dateImputation?:           string;

    dateRetour?:               string;
    etatAvancement?:           EtatAvancementAffectation;
    etatAvancementPrecision?:  string;
    commentairesSuivi?:        string;
    agentSuiviNom?:            string;

    createdAt:                 string;
    updatedAt?:                string;
}

export interface FicheAffectationCreateRequest {
    decisionCge: DecisionCgeAffectation;
    observationsCge?: string;
}

export interface FicheAffectationAffectationRequest {
    typeDesignation: TypeDesignation;
    departementDesigneId?: string;
    agentDesigneId?: string;
    observationsCgea?: string;
}

export interface FicheAffectationSuiviRequest {
    etatAvancement: EtatAvancementAffectation;
    etatAvancementPrecision?: string;
    commentairesSuivi?: string;
}

/** Sous-ensemble de la réponse GET /api/v1/config/departements. */
export interface DepartementOption {
    id: string;
    code: string;
    libelle: string;
}

/** Sous-ensemble d'AgentSummaryResponse (backend), pour le sélecteur de conseiller juridique. */
export interface AgentSummary {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    departementLabel?: string;
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npm run build`
Expected: succès (ce fichier n'est encore importé nulle part, donc aucune
régression possible — la vérification porte sur l'absence d'erreur de
syntaxe TypeScript).

- [ ] **Step 3: Commit**

```bash
git add src/app/core/models/fiche-affectation.model.ts
git commit -m "feat(fiche-affectation): modèle TypeScript"
```

---

### Task 2: Service `FicheAffectationService`

**Files:**
- Create: `src/app/core/services/fiche-affectation.service.ts`

**Interfaces:**
- Consumes: `FicheAffectation`, `FicheAffectationCreateRequest`,
  `FicheAffectationAffectationRequest`, `FicheAffectationSuiviRequest`,
  `DepartementOption`, `AgentSummary` (Task 1).
- Produces: `FicheAffectationService.get/create/affecter/suivre/getDepartementsEligibles/getConseillersJuridiques`
  — consommées par le composant (Task 3).

- [ ] **Step 1: Écrire le service**

```typescript
// src/app/core/services/fiche-affectation.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    FicheAffectation,
    FicheAffectationCreateRequest,
    FicheAffectationAffectationRequest,
    FicheAffectationSuiviRequest,
    DepartementOption,
    AgentSummary
} from '../models/fiche-affectation.model';

export type {
    FicheAffectation,
    FicheAffectationCreateRequest,
    FicheAffectationAffectationRequest,
    FicheAffectationSuiviRequest,
    DepartementOption,
    AgentSummary,
    DecisionCgeAffectation,
    TypeDesignation,
    EtatAvancementAffectation
} from '../models/fiche-affectation.model';

const DEPARTEMENTS_ELIGIBLES = ['DEI', 'DAC'];

@Injectable({ providedIn: 'root' })
export class FicheAffectationService {

    private http    = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    get(dossierId: string): Observable<FicheAffectation | null> {
        return this.http.get<FicheAffectation | null>(
            `${this.baseUrl}/dossiers/${dossierId}/fiche-affectation`
        );
    }

    create(dossierId: string, request: FicheAffectationCreateRequest): Observable<FicheAffectation> {
        return this.http.post<FicheAffectation>(
            `${this.baseUrl}/dossiers/${dossierId}/fiche-affectation`, request
        );
    }

    affecter(dossierId: string, request: FicheAffectationAffectationRequest): Observable<FicheAffectation> {
        return this.http.patch<FicheAffectation>(
            `${this.baseUrl}/dossiers/${dossierId}/fiche-affectation/affectation`, request
        );
    }

    suivre(dossierId: string, request: FicheAffectationSuiviRequest): Observable<FicheAffectation> {
        return this.http.patch<FicheAffectation>(
            `${this.baseUrl}/dossiers/${dossierId}/fiche-affectation/suivi`, request
        );
    }

    getDepartementsEligibles(): Observable<DepartementOption[]> {
        return this.http.get<DepartementOption[]>(`${this.baseUrl}/config/departements`).pipe(
            map(departements => departements.filter(d => DEPARTEMENTS_ELIGIBLES.includes(d.code)))
        );
    }

    getConseillersJuridiques(): Observable<AgentSummary[]> {
        return this.http.get<AgentSummary[]>(`${this.baseUrl}/agents/by-role/CONSEILLER_JURIDIQUE`);
    }
}
```

Note : `get()` renvoie `Observable<FicheAffectation | null>` — le backend
répond `204 No Content` (corps vide) quand aucune fiche n'existe encore
pour ce dossier ; `HttpClient` résout un `204` en `next(null)`, pas en
`error`, donc le composant (Task 3) doit gérer `null` comme un état normal
("pas encore créée"), et réserver le bloc `error` aux vrais échecs HTTP
(403 accès refusé, 500, réseau).

- [ ] **Step 2: Vérifier la compilation**

Run: `npm run build`
Expected: succès.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/fiche-affectation.service.ts
git commit -m "feat(fiche-affectation): service HTTP"
```

---

### Task 3: Composant `FicheAffectationTab`

**Files:**
- Create: `src/app/pages/dossiers/dossier-detail/fiche-affectation-tab/fiche-affectation-tab.ts`

**Interfaces:**
- Consumes: `FicheAffectationService` (Task 2), `KeycloakService.hasAnyRole(string[]): boolean`
  (existant, déjà utilisé partout dans ce dépôt — voir
  `src/app/layout/component/app.menu.ts:101-103`).
- Produces: composant standalone `<app-fiche-affectation-tab [dossierId]="..." [dossierNumber]="..." />`
  — consommé par `dossier-detail.html` (Task 4).

- [ ] **Step 1: Écrire le composant**

```typescript
// src/app/pages/dossiers/dossier-detail/fiche-affectation-tab/fiche-affectation-tab.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import {
    FicheAffectationService,
    FicheAffectation,
    DepartementOption,
    AgentSummary,
    DecisionCgeAffectation,
    TypeDesignation,
    EtatAvancementAffectation
} from '../../../../core/services/fiche-affectation.service';

@Component({
    selector: 'app-fiche-affectation-tab',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, SelectModule,
        TextareaModule, TagModule, SkeletonModule, ToastModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div *ngIf="loading" class="flex flex-col gap-3">
    <p-skeleton height="120px" borderRadius="12px"/>
</div>

<div *ngIf="!loading && accessDenied"
    class="bg-white dark:bg-surface-800 rounded-2xl p-10 border border-surface-100 text-center">
    <i class="pi pi-lock text-2xl text-surface-300 mb-3"></i>
    <p class="font-semibold text-surface-500">Accès restreint</p>
    <p class="text-xs text-surface-400 mt-1">
        Cette fiche d'affectation ne vous a pas été assignée.
    </p>
</div>

<div *ngIf="!loading && !accessDenied" class="flex flex-col gap-4">

    <!-- Section 2 : Transmission par le Cabinet du CGE -->
    <div class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-100 dark:border-surface-700">
        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-3">
            2. Transmission par le Cabinet du CGE
        </h3>

        <div *ngIf="!fiche">
            <p class="text-sm text-surface-400 mb-3" *ngIf="!canCge">
                Aucune fiche d'affectation n'a encore été créée pour ce dossier.
            </p>
            <div *ngIf="canCge" class="flex flex-col gap-3">
                <p-select [(ngModel)]="formDecisionCge"
                    [options]="decisionCgeOptions" optionLabel="label" optionValue="value"
                    placeholder="Décision du CGE" styleClass="w-full"/>
                <textarea pTextarea [(ngModel)]="formObservationsCge" rows="2"
                    placeholder="Observations / instructions particulières du CGE" class="w-full"></textarea>
                <p-button label="Créer la fiche d'affectation" icon="pi pi-check"
                    [loading]="saving" [disabled]="!formDecisionCge"
                    (onClick)="creer()"/>
            </div>
        </div>

        <div *ngIf="fiche" class="flex flex-col gap-1 text-sm">
            <span><b>Décision :</b> {{ decisionLabel(fiche.decisionCge) }}</span>
            <span *ngIf="fiche.observationsCge"><b>Observations :</b> {{ fiche.observationsCge }}</span>
            <span class="text-xs text-surface-400">
                Par {{ fiche.agentCgeNom }} — {{ fiche.dateDecisionCge | date:'dd/MM/yyyy HH:mm' }}
            </span>
        </div>
    </div>

    <!-- Section 3 : Affectation par le CGEA -->
    <div *ngIf="fiche" class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-100 dark:border-surface-700">
        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-3">
            3. Affectation par le CGEA
        </h3>

        <div *ngIf="!fiche.typeDesignation">
            <p class="text-sm text-surface-400 mb-3" *ngIf="!canCgea">
                En attente de désignation par le CGEA.
            </p>
            <div *ngIf="canCgea" class="flex flex-col gap-3">
                <p-select [(ngModel)]="formTypeDesignation"
                    [options]="typeDesignationOptions" optionLabel="label" optionValue="value"
                    placeholder="Désignation" styleClass="w-full"
                    (onChange)="onTypeDesignationChange()"/>

                <p-select *ngIf="formTypeDesignation === 'DEPARTEMENT'"
                    [(ngModel)]="formDepartementId"
                    [options]="departements" optionLabel="libelle" optionValue="id"
                    placeholder="Département" styleClass="w-full"/>

                <p-select *ngIf="formTypeDesignation === 'AGENT_CJ'"
                    [(ngModel)]="formAgentId"
                    [options]="conseillersJuridiques" optionLabel="nomComplet" optionValue="id"
                    placeholder="Conseiller juridique" styleClass="w-full"/>

                <textarea pTextarea [(ngModel)]="formObservationsCgea" rows="2"
                    placeholder="Observations complémentaires du CGEA" class="w-full"></textarea>
                <p-button label="Valider l'affectation" icon="pi pi-check"
                    [loading]="saving" [disabled]="!canSubmitAffectation()"
                    (onClick)="affecter()"/>
            </div>
        </div>

        <div *ngIf="fiche.typeDesignation" class="flex flex-col gap-1 text-sm">
            <span><b>Désignation :</b> {{ designationLabel(fiche) }}</span>
            <span *ngIf="fiche.observationsCgea"><b>Observations :</b> {{ fiche.observationsCgea }}</span>
            <span class="text-xs text-surface-400">
                Par {{ fiche.agentCgeaNom }} — {{ fiche.dateImputation | date:'dd/MM/yyyy HH:mm' }}
            </span>
        </div>
    </div>

    <!-- Section 4 : Suivi et traçabilité -->
    <div *ngIf="fiche && fiche.typeDesignation" class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-100 dark:border-surface-700">
        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-3">
            4. Suivi et traçabilité
        </h3>

        <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2" *ngIf="fiche.etatAvancement">
                <p-tag [value]="etatLabel(fiche.etatAvancement)"
                    [severity]="fiche.etatAvancement === 'CLOTURE' ? 'success' : 'warn'"/>
                <span class="text-xs text-surface-400">
                    {{ fiche.dateRetour | date:'dd/MM/yyyy HH:mm' }}
                </span>
            </div>
            <p class="text-sm" *ngIf="fiche.commentairesSuivi">{{ fiche.commentairesSuivi }}</p>
            <span class="text-xs text-surface-400" *ngIf="fiche.agentSuiviNom">
                Par {{ fiche.agentSuiviNom }}
            </span>

            <div class="flex flex-col gap-3 mt-2">
                <p-select [(ngModel)]="formEtatAvancement"
                    [options]="etatAvancementOptions" optionLabel="label" optionValue="value"
                    placeholder="État d'avancement" styleClass="w-full"/>
                <input *ngIf="formEtatAvancement === 'AUTRE'"
                    type="text" pInputText [(ngModel)]="formEtatPrecision"
                    placeholder="Précision (obligatoire)" class="w-full"/>
                <textarea pTextarea [(ngModel)]="formCommentairesSuivi" rows="2"
                    placeholder="Commentaires / recommandations" class="w-full"></textarea>
                <p-button label="Mettre à jour le suivi" icon="pi pi-save"
                    [loading]="saving" [disabled]="!formEtatAvancement"
                    (onClick)="suivre()"/>
            </div>
        </div>
    </div>

</div>
    `
})
export class FicheAffectationTab implements OnInit, OnChanges {

    @Input({ required: true }) dossierId!: string;
    @Input({ required: true }) dossierNumber!: string;

    private ficheAffectationService = inject(FicheAffectationService);
    private keycloakService         = inject(KeycloakService);
    private messageService          = inject(MessageService);

    loading      = true;
    saving       = false;
    accessDenied = false;
    fiche: FicheAffectation | null = null;

    departements:           DepartementOption[] = [];
    conseillersJuridiques:  (AgentSummary & { nomComplet: string })[] = [];

    formDecisionCge:        DecisionCgeAffectation | null = null;
    formObservationsCge     = '';

    formTypeDesignation:    TypeDesignation | null = null;
    formDepartementId:      string | null = null;
    formAgentId:            string | null = null;
    formObservationsCgea    = '';

    formEtatAvancement:     EtatAvancementAffectation | null = null;
    formEtatPrecision       = '';
    formCommentairesSuivi   = '';

    readonly decisionCgeOptions = [
        { label: 'Affectation directe au CGEA pour imputation',            value: 'AFFECTATION_DIRECTE_CGEA' },
        { label: 'Échange préalable CGE ↔ CGEA pour orientations complémentaires', value: 'ECHANGE_PREALABLE' }
    ];
    readonly typeDesignationOptions = [
        { label: 'Département (DEI ou DAC)',   value: 'DEPARTEMENT' },
        { label: 'Conseiller juridique nommé', value: 'AGENT_CJ'    },
        { label: 'BRPD',                       value: 'BRPD'        }
    ];
    readonly etatAvancementOptions = [
        { label: 'En cours', value: 'EN_COURS' },
        { label: 'Clôturé',  value: 'CLOTURE'   },
        { label: 'Autre',    value: 'AUTRE'     }
    ];

    get canCge():  boolean { return this.keycloakService.hasAnyRole(['CGE', 'ADMIN_DDIC']); }
    get canCgea(): boolean { return this.keycloakService.hasAnyRole(['CGEA', 'ADMIN_DDIC']); }

    ngOnInit(): void {
        this.load();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['dossierId'] && !changes['dossierId'].firstChange) {
            this.load();
        }
    }

    private load(): void {
        this.loading = true;
        this.accessDenied = false;
        this.ficheAffectationService.get(this.dossierId).subscribe({
            next: fiche => {
                this.fiche = fiche;
                this.loading = false;
                if (this.canCge) this.loadDepartementsEtConseillers();
                else if (this.canCgea) this.loadDepartementsEtConseillers();
            },
            error: () => {
                this.fiche = null;
                this.accessDenied = true;
                this.loading = false;
            }
        });
    }

    private loadDepartementsEtConseillers(): void {
        this.ficheAffectationService.getDepartementsEligibles().subscribe({
            next: d => { this.departements = d; }, error: () => {}
        });
        this.ficheAffectationService.getConseillersJuridiques().subscribe({
            next: agents => {
                this.conseillersJuridiques = agents.map(a => ({
                    ...a, nomComplet: `${a.firstName} ${a.lastName}`
                }));
            },
            error: () => {}
        });
    }

    onTypeDesignationChange(): void {
        this.formDepartementId = null;
        this.formAgentId = null;
    }

    canSubmitAffectation(): boolean {
        if (!this.formTypeDesignation) return false;
        if (this.formTypeDesignation === 'DEPARTEMENT') return !!this.formDepartementId;
        if (this.formTypeDesignation === 'AGENT_CJ')    return !!this.formAgentId;
        return true; // BRPD n'a besoin d'aucune sélection supplémentaire
    }

    creer(): void {
        if (!this.formDecisionCge) return;
        this.saving = true;
        this.ficheAffectationService.create(this.dossierId, {
            decisionCge: this.formDecisionCge,
            observationsCge: this.formObservationsCge || undefined
        }).subscribe({
            next: fiche => { this.fiche = fiche; this.saving = false; },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error', summary: 'Fiche d\'affectation',
                    detail: 'Impossible de créer la fiche'
                });
            }
        });
    }

    affecter(): void {
        if (!this.formTypeDesignation) return;
        this.saving = true;
        this.ficheAffectationService.affecter(this.dossierId, {
            typeDesignation: this.formTypeDesignation,
            departementDesigneId: this.formTypeDesignation === 'DEPARTEMENT' ? this.formDepartementId ?? undefined : undefined,
            agentDesigneId: this.formTypeDesignation === 'AGENT_CJ' ? this.formAgentId ?? undefined : undefined,
            observationsCgea: this.formObservationsCgea || undefined
        }).subscribe({
            next: fiche => { this.fiche = fiche; this.saving = false; },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error', summary: 'Fiche d\'affectation',
                    detail: 'Impossible d\'enregistrer l\'affectation'
                });
            }
        });
    }

    suivre(): void {
        if (!this.formEtatAvancement) return;
        if (this.formEtatAvancement === 'AUTRE' && !this.formEtatPrecision.trim()) {
            this.messageService.add({
                severity: 'warn', summary: 'Fiche d\'affectation',
                detail: 'Une précision est requise pour l\'état "Autre"'
            });
            return;
        }
        this.saving = true;
        this.ficheAffectationService.suivre(this.dossierId, {
            etatAvancement: this.formEtatAvancement,
            etatAvancementPrecision: this.formEtatAvancement === 'AUTRE' ? this.formEtatPrecision : undefined,
            commentairesSuivi: this.formCommentairesSuivi || undefined
        }).subscribe({
            next: fiche => {
                this.fiche = fiche;
                this.saving = false;
                this.formCommentairesSuivi = '';
            },
            error: () => {
                this.saving = false;
                this.messageService.add({
                    severity: 'error', summary: 'Fiche d\'affectation',
                    detail: 'Impossible d\'enregistrer le suivi'
                });
            }
        });
    }

    decisionLabel(v?: DecisionCgeAffectation): string {
        return this.decisionCgeOptions.find(o => o.value === v)?.label ?? (v ?? '');
    }

    designationLabel(f: FicheAffectation): string {
        if (f.typeDesignation === 'DEPARTEMENT') return `Département ${f.departementDesigneLibelle}`;
        if (f.typeDesignation === 'AGENT_CJ')    return `${f.agentDesigneNom} (Conseiller Juridique)`;
        if (f.typeDesignation === 'BRPD')        return 'BRPD';
        return '';
    }

    etatLabel(v?: EtatAvancementAffectation): string {
        return this.etatAvancementOptions.find(o => o.value === v)?.label ?? (v ?? '');
    }
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npm run build`
Expected: succès (composant pas encore importé nulle part).

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/dossiers/dossier-detail/fiche-affectation-tab/fiche-affectation-tab.ts
git commit -m "feat(fiche-affectation): composant d'onglet"
```

---

### Task 4: Intégration dans `dossier-detail`

**Files:**
- Modify: `src/app/pages/dossiers/dossier-detail/dossier-detail.ts`
- Modify: `src/app/pages/dossiers/dossier-detail/dossier-detail.html`

**Interfaces:**
- Consumes: `FicheAffectationTab` (Task 3, sélecteur `app-fiche-affectation-tab`,
  `@Input() dossierId`, `@Input() dossierNumber`).

- [ ] **Step 1: Importer le composant et l'ajouter aux `imports`/`tabs`**

Dans `dossier-detail.ts` :
1. Ajouter l'import en haut du fichier (après les autres imports de
   services/composants de sous-ressources) :
   ```typescript
   import { FicheAffectationTab } from './fiche-affectation-tab/fiche-affectation-tab';
   ```
2. Ajouter `FicheAffectationTab` au tableau `imports: [...]` du `@Component`
   (ligne ~50-55, aux côtés de `ConfirmDialogModule, TooltipModule, SelectModule`).
3. Ajouter une entrée au tableau `tabs` existant (ligne 139-148), après
   l'entrée `'attachments'` :
   ```typescript
   { key: 'affectation', label: 'Affectation', icon: 'pi pi-sitemap',
     count: () => 0 }
   ```
   (`count` retourne `0` en dur : contrairement aux 4 onglets existants qui
   comptent une liste chargée dans le parent, la fiche d'affectation est
   0 ou 1 élément géré entièrement par le composant enfant — pas de
   compteur pertinent à afficher sur le badge de l'onglet).

- [ ] **Step 2: Ajouter le bloc de contenu de l'onglet**

Dans `dossier-detail.html`, localiser le bloc
`<div *ngIf="activeTab === 'attachments'" class="p-5">` (ligne 949) et
ajouter juste après la fermeture de ce bloc `</div>` correspondant :

```html
<div *ngIf="activeTab === 'affectation' && dossier" class="p-5">
    <app-fiche-affectation-tab
        [dossierId]="dossier.id!"
        [dossierNumber]="dossier.number || ''"/>
</div>
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npm run build`
Expected: succès.

- [ ] **Step 4: Vérification manuelle (recommandée, non automatisée dans ce dépôt)**

Démarrer le backend (`mvn spring-boot:run` dans `back-end/`, avec les
migrations `016`/`017` du plan backend appliquées) et le frontend
(`ng serve`), se connecter avec un compte ayant le rôle `CGE`, ouvrir un
dossier existant, cliquer sur l'onglet "Affectation", créer une fiche,
vérifier que la section 2 s'affiche en lecture seule après création. Se
reconnecter avec un compte `CGEA` pour compléter la section 3, puis avec un
compte du département désigné (ou `AGENT_BRPD`/le conseiller juridique
nommé selon le cas choisi) pour vérifier la section 4 et confirmer qu'un
compte non concerné voit bien le message "Accès restreint".

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/dossiers/dossier-detail/dossier-detail.ts \
        src/app/pages/dossiers/dossier-detail/dossier-detail.html
git commit -m "feat(fiche-affectation): intégration dans l'onglet dossier"
```

---

## Vérification finale (avant revue de branche)

- [ ] `npm run build` — succès, sans nouvelle erreur/warning TypeScript
  autre que les warnings CommonJS déjà connus des dépendances tierces.
- [ ] Confirmer que le backend (`docs/superpowers/plans/2026-09-22-fiche-affectation-backend.md`)
  est livré et mergé **avant** de démarrer la vérification manuelle de la
  Task 4 — sans lui, les 4 endpoints `/dossiers/{id}/fiche-affectation*`
  et `/agents/by-role/{roleName}` n'existent pas encore.
