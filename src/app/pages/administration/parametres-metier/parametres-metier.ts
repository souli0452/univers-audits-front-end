import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import {
    ParametreDelaiService, ParametreDelai,
    JourFerieService, JourFerie,
    IndiceFraudeService, IndiceFraude,
    TypeInfractionService, TypeInfraction,
    PointChecklistDossierTravailAdminService, PointChecklistDossierTravail
} from '../../../core/services/parametres-metier.service';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

@Component({
    selector: 'app-parametres-metier',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TagModule, DialogModule,
        TextareaModule, InputTextModule, InputNumberModule, CheckboxModule,
        DatePickerModule, ToastModule, ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">
    <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Paramètres métier</h1>
        <p class="text-surface-400 text-sm mt-1">
            Catalogues utilisés par les investigations : délais, jours fériés, indices de fraude,
            types d'infraction et check-list du dossier de travail.
        </p>
    </div>

    <div class="bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 overflow-hidden">
        <div class="flex border-b border-surface-100 dark:border-surface-700 overflow-x-auto">
            <button *ngFor="let tab of tabs" (click)="activeTab = tab.key"
                class="flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap
                       transition-all border-b-2 -mb-px"
                [class.border-primary-500]="activeTab === tab.key"
                [class.text-primary-600]="activeTab === tab.key"
                [class.border-transparent]="activeTab !== tab.key"
                [class.text-surface-400]="activeTab !== tab.key">
                <i [class]="tab.icon + ' text-xs'"></i>
                {{ tab.label }}
            </button>
        </div>

        <!-- ── Paramètres de délai ──────────────────────────────── -->
        <div *ngIf="activeTab === 'delais'" class="p-5">
            <div *ngIf="loadingDelais" class="flex justify-center py-8"><p-progressSpinner strokeWidth="4"/></div>
            <div *ngIf="!loadingDelais" class="flex flex-col gap-2">
                <div *ngFor="let d of delais" class="flex items-center justify-between p-3 rounded-xl border border-surface-100 dark:border-surface-600 bg-surface-50 dark:bg-surface-700">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold text-surface-800 flex items-center gap-2">
                            {{ d.libelle }}
                            <span class="text-xs text-surface-400 font-normal">({{ d.code }})</span>
                            <p-tag *ngIf="!d.actif" value="Inactif" severity="secondary" styleClass="text-xs"/>
                        </div>
                        <div class="text-xs text-surface-500 mt-0.5">
                            {{ d.valeurJours ?? '—' }} jour(s) {{ d.joursOuvrables ? 'ouvrables' : 'calendaires' }}
                        </div>
                    </div>
                    <p-button icon="pi pi-pencil" severity="info" text size="small" (onClick)="openDelaiDialog(d)"/>
                </div>
            </div>
        </div>

        <!-- ── Jours fériés ──────────────────────────────────────── -->
        <div *ngIf="activeTab === 'joursFeries'" class="p-5">
            <div class="flex justify-end mb-4">
                <p-button icon="pi pi-plus" label="Ajouter un jour férié" size="small" outlined (onClick)="openJourFerieDialog()"/>
            </div>
            <div *ngIf="loadingJoursFeries" class="flex justify-center py-8"><p-progressSpinner strokeWidth="4"/></div>
            <div *ngIf="!loadingJoursFeries && !joursFeries.length" class="text-center py-10 text-surface-400 text-sm">Aucun jour férié enregistré</div>
            <div *ngIf="!loadingJoursFeries" class="flex flex-col gap-2">
                <div *ngFor="let j of joursFeries" class="flex items-center justify-between p-3 rounded-xl border border-surface-100 dark:border-surface-600 bg-surface-50 dark:bg-surface-700">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold text-surface-800 flex items-center gap-2">
                            {{ j.libelle }}
                            <p-tag *ngIf="!j.actif" value="Inactif" severity="secondary" styleClass="text-xs"/>
                        </div>
                        <div class="text-xs text-surface-500 mt-0.5">{{ j.date | date:'dd/MM/yyyy' }}</div>
                    </div>
                    <p-button icon="pi pi-pencil" severity="info" text size="small" (onClick)="openJourFerieDialog(j)"/>
                </div>
            </div>
        </div>

        <!-- ── Indices de fraude ───────────────────────────────────── -->
        <div *ngIf="activeTab === 'indicesFraude'" class="p-5">
            <div class="flex justify-end mb-4">
                <p-button icon="pi pi-plus" label="Ajouter un indice" size="small" outlined (onClick)="openIndiceFraudeDialog()"/>
            </div>
            <div *ngIf="loadingIndicesFraude" class="flex justify-center py-8"><p-progressSpinner strokeWidth="4"/></div>
            <div *ngIf="!loadingIndicesFraude && !indicesFraude.length" class="text-center py-10 text-surface-400 text-sm">Aucun indice de fraude enregistré</div>
            <div *ngIf="!loadingIndicesFraude" class="flex flex-col gap-2">
                <div *ngFor="let i of indicesFraude" class="flex items-center justify-between p-3 rounded-xl border border-surface-100 dark:border-surface-600 bg-surface-50 dark:bg-surface-700">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold text-surface-800 flex items-center gap-2">
                            {{ i.libelle }}
                            <span class="text-xs text-surface-400 font-normal">({{ i.code }})</span>
                            <p-tag *ngIf="!i.actif" value="Inactif" severity="secondary" styleClass="text-xs"/>
                        </div>
                        <div *ngIf="i.categorie" class="text-xs text-surface-500 mt-0.5">{{ i.categorie }}</div>
                        <div *ngIf="i.description" class="text-xs text-surface-400 mt-0.5">{{ i.description }}</div>
                    </div>
                    <p-button icon="pi pi-pencil" severity="info" text size="small" (onClick)="openIndiceFraudeDialog(i)"/>
                </div>
            </div>
        </div>

        <!-- ── Types d'infraction ──────────────────────────────────── -->
        <div *ngIf="activeTab === 'typesInfraction'" class="p-5">
            <div class="flex justify-end mb-4">
                <p-button icon="pi pi-plus" label="Ajouter un type" size="small" outlined (onClick)="openTypeInfractionDialog()"/>
            </div>
            <div *ngIf="loadingTypesInfraction" class="flex justify-center py-8"><p-progressSpinner strokeWidth="4"/></div>
            <div *ngIf="!loadingTypesInfraction && !typesInfraction.length" class="text-center py-10 text-surface-400 text-sm">Aucun type d'infraction enregistré</div>
            <div *ngIf="!loadingTypesInfraction" class="flex flex-col gap-2">
                <div *ngFor="let t of typesInfraction" class="flex items-center justify-between p-3 rounded-xl border border-surface-100 dark:border-surface-600 bg-surface-50 dark:bg-surface-700">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold text-surface-800 flex items-center gap-2 flex-wrap">
                            {{ t.libelle }}
                            <span class="text-xs text-surface-400 font-normal">({{ t.code }})</span>
                            <p-tag *ngIf="t.impliqueDdip" value="DDIP" severity="warn" styleClass="text-xs"/>
                            <p-tag *ngIf="!t.actif" value="Inactif" severity="secondary" styleClass="text-xs"/>
                        </div>
                        <div class="text-xs text-surface-500 mt-0.5">
                            <span *ngIf="t.articleCodePenal">Code pénal : {{ t.articleCodePenal }}</span>
                            <span *ngIf="t.articleCodePenal && t.articleLoi004"> · </span>
                            <span *ngIf="t.articleLoi004">Loi 004 : {{ t.articleLoi004 }}</span>
                        </div>
                    </div>
                    <p-button icon="pi pi-pencil" severity="info" text size="small" (onClick)="openTypeInfractionDialog(t)"/>
                </div>
            </div>
        </div>

        <!-- ── Points de check-list ────────────────────────────────── -->
        <div *ngIf="activeTab === 'checklist'" class="p-5">
            <div class="flex justify-end mb-4">
                <p-button icon="pi pi-plus" label="Ajouter un point" size="small" outlined (onClick)="openChecklistPointDialog()"/>
            </div>
            <div *ngIf="loadingChecklistPoints" class="flex justify-center py-8"><p-progressSpinner strokeWidth="4"/></div>
            <div *ngIf="!loadingChecklistPoints" class="flex flex-col gap-2">
                <div *ngFor="let p of checklistPoints" class="flex items-center justify-between p-3 rounded-xl border border-surface-100 dark:border-surface-600 bg-surface-50 dark:bg-surface-700">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold text-surface-800 flex items-center gap-2">
                            {{ p.libelle }}
                            <span class="text-xs text-surface-400 font-normal">({{ p.code }})</span>
                            <p-tag *ngIf="!p.actif" value="Inactif" severity="secondary" styleClass="text-xs"/>
                        </div>
                        <div *ngIf="p.categorie" class="text-xs text-surface-500 mt-0.5">{{ p.categorie }} — ordre {{ p.ordre }}</div>
                    </div>
                    <p-button icon="pi pi-pencil" severity="info" text size="small" (onClick)="openChecklistPointDialog(p)"/>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- ── Dialog délai ───────────────────────────────────────────── -->
<p-dialog [(visible)]="showDelaiDialog" header="Modifier le paramètre de délai" [modal]="true" [style]="{width:'480px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Libellé <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="delaiForm.libelle" class="w-full"/>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Valeur (jours)</label>
                <p-inputnumber [(ngModel)]="delaiForm.valeurJours" [min]="0" styleClass="w-full" inputStyleClass="w-full"/>
            </div>
            <div class="flex items-center gap-2 mt-5">
                <p-checkbox [(ngModel)]="delaiForm.joursOuvrables" [binary]="true" inputId="joursOuvrables"/>
                <label for="joursOuvrables" class="text-sm">Jours ouvrables</label>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="delaiForm.actif" [binary]="true" inputId="delaiActif"/>
            <label for="delaiActif" class="text-sm">Actif</label>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showDelaiDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check" [loading]="savingDelai" [disabled]="!delaiForm.libelle.trim()" (onClick)="executeSaveDelai()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog jour férié ──────────────────────────────────────── -->
<p-dialog [(visible)]="showJourFerieDialog" [header]="editingJourFerie ? 'Modifier le jour férié' : 'Nouveau jour férié'" [modal]="true" [style]="{width:'460px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Date <span class="text-red-500">*</span></label>
            <p-datepicker [(ngModel)]="jourFerieForm.date" dateFormat="dd/mm/yy" showIcon styleClass="w-full" appendTo="body"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Libellé <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="jourFerieForm.libelle" class="w-full"/>
        </div>
        <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="jourFerieForm.actif" [binary]="true" inputId="jfActif"/>
            <label for="jfActif" class="text-sm">Actif</label>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showJourFerieDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check" [loading]="savingJourFerie"
            [disabled]="!jourFerieForm.libelle.trim() || !jourFerieForm.date" (onClick)="executeSaveJourFerie()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog indice de fraude ────────────────────────────────── -->
<p-dialog [(visible)]="showIndiceFraudeDialog" [header]="indiceFraudeDialogHeader" [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Code <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="indiceFraudeForm.code" class="w-full" [disabled]="!!editingIndiceFraude"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Libellé <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="indiceFraudeForm.libelle" class="w-full"/>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Catégorie</label>
                <input pInputText [(ngModel)]="indiceFraudeForm.categorie" class="w-full"/>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Ordre</label>
                <p-inputnumber [(ngModel)]="indiceFraudeForm.ordre" [min]="0" styleClass="w-full" inputStyleClass="w-full"/>
            </div>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Description</label>
            <textarea pTextarea [(ngModel)]="indiceFraudeForm.description" rows="3" class="w-full"></textarea>
        </div>
        <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="indiceFraudeForm.actif" [binary]="true" inputId="ifActif"/>
            <label for="ifActif" class="text-sm">Actif</label>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showIndiceFraudeDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check" [loading]="savingIndiceFraude"
            [disabled]="!indiceFraudeForm.code.trim() || !indiceFraudeForm.libelle.trim()" (onClick)="executeSaveIndiceFraude()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog type d'infraction ───────────────────────────────── -->
<p-dialog [(visible)]="showTypeInfractionDialog" [header]="typeInfractionDialogHeader" [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Code <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="typeInfractionForm.code" class="w-full" [disabled]="!!editingTypeInfraction"/>
        </div>
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Libellé <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="typeInfractionForm.libelle" class="w-full"/>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Article code pénal</label>
                <input pInputText [(ngModel)]="typeInfractionForm.articleCodePenal" class="w-full"/>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Article loi 004</label>
                <input pInputText [(ngModel)]="typeInfractionForm.articleLoi004" class="w-full"/>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-2 mt-5">
                <p-checkbox [(ngModel)]="typeInfractionForm.impliqueDdip" [binary]="true" inputId="tiDdip"/>
                <label for="tiDdip" class="text-sm">Implique la DDIP</label>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Ordre</label>
                <p-inputnumber [(ngModel)]="typeInfractionForm.ordre" [min]="0" styleClass="w-full" inputStyleClass="w-full"/>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="typeInfractionForm.actif" [binary]="true" inputId="tiActif"/>
            <label for="tiActif" class="text-sm">Actif</label>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showTypeInfractionDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check" [loading]="savingTypeInfraction"
            [disabled]="!typeInfractionForm.code.trim() || !typeInfractionForm.libelle.trim()" (onClick)="executeSaveTypeInfraction()"/>
    </ng-template>
</p-dialog>

<!-- ── Dialog point de check-list ─────────────────────────────── -->
<p-dialog [(visible)]="showChecklistPointDialog" [header]="editingChecklistPoint ? 'Modifier le point de check-list' : 'Nouveau point de check-list'" [modal]="true" [style]="{width:'520px'}" [draggable]="false">
    <div class="flex flex-col gap-4 py-2">
        <div>
            <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Libellé <span class="text-red-500">*</span></label>
            <textarea pTextarea [(ngModel)]="checklistPointForm.libelle" rows="3" class="w-full"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Catégorie</label>
                <input pInputText [(ngModel)]="checklistPointForm.categorie" class="w-full"/>
            </div>
            <div>
                <label class="text-xs font-medium text-surface-500 mb-1 block uppercase tracking-wide">Ordre <span class="text-red-500">*</span></label>
                <p-inputnumber [(ngModel)]="checklistPointForm.ordre" [min]="0" styleClass="w-full" inputStyleClass="w-full"/>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <p-checkbox [(ngModel)]="checklistPointForm.actif" [binary]="true" inputId="cpActif"/>
            <label for="cpActif" class="text-sm">Actif</label>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" outlined (onClick)="showChecklistPointDialog=false"/>
        <p-button label="Enregistrer" icon="pi pi-check" [loading]="savingChecklistPoint"
            [disabled]="!checklistPointForm.libelle.trim() || checklistPointForm.ordre===null" (onClick)="executeSaveChecklistPoint()"/>
    </ng-template>
</p-dialog>
    `
})
export class ParametresMetier implements OnInit {

    private parametreDelaiService = inject(ParametreDelaiService);
    private jourFerieService = inject(JourFerieService);
    private indiceFraudeService = inject(IndiceFraudeService);
    private typeInfractionService = inject(TypeInfractionService);
    private checklistPointService = inject(PointChecklistDossierTravailAdminService);
    private messageService = inject(MessageService);

    activeTab = 'delais';
    readonly tabs = [
        { key: 'delais',         label: 'Délais',                icon: 'pi pi-clock' },
        { key: 'joursFeries',    label: 'Jours fériés',           icon: 'pi pi-calendar' },
        { key: 'indicesFraude',  label: 'Indices de fraude',      icon: 'pi pi-exclamation-triangle' },
        { key: 'typesInfraction', label: "Types d'infraction",    icon: 'pi pi-book' },
        { key: 'checklist',      label: 'Check-list dossier',     icon: 'pi pi-check-square' }
    ];

    // ── Délais ──────────────────────────────────────────────────
    delais: ParametreDelai[] = [];
    loadingDelais = false;
    showDelaiDialog = false;
    savingDelai = false;
    editingDelai: ParametreDelai | null = null;
    delaiForm: { libelle: string; valeurJours: number | null; joursOuvrables: boolean; actif: boolean } =
        { libelle: '', valeurJours: null, joursOuvrables: true, actif: true };

    // ── Jours fériés ────────────────────────────────────────────
    joursFeries: JourFerie[] = [];
    loadingJoursFeries = false;
    showJourFerieDialog = false;
    savingJourFerie = false;
    editingJourFerie: JourFerie | null = null;
    jourFerieForm: { date: Date | null; libelle: string; actif: boolean } =
        { date: new Date(), libelle: '', actif: true };

    // ── Indices de fraude ───────────────────────────────────────
    indicesFraude: IndiceFraude[] = [];
    loadingIndicesFraude = false;
    showIndiceFraudeDialog = false;
    savingIndiceFraude = false;
    editingIndiceFraude: IndiceFraude | null = null;
    indiceFraudeForm: { code: string; libelle: string; categorie: string; description: string; ordre: number | null; actif: boolean } =
        { code: '', libelle: '', categorie: '', description: '', ordre: null, actif: true };

    get indiceFraudeDialogHeader(): string {
        return this.editingIndiceFraude ? "Modifier l'indice de fraude" : 'Nouvel indice de fraude';
    }

    // ── Types d'infraction ──────────────────────────────────────
    typesInfraction: TypeInfraction[] = [];
    loadingTypesInfraction = false;
    showTypeInfractionDialog = false;
    savingTypeInfraction = false;
    editingTypeInfraction: TypeInfraction | null = null;
    typeInfractionForm: {
        code: string; libelle: string; articleCodePenal: string; articleLoi004: string;
        impliqueDdip: boolean; ordre: number | null; actif: boolean;
    } = { code: '', libelle: '', articleCodePenal: '', articleLoi004: '', impliqueDdip: false, ordre: null, actif: true };

    get typeInfractionDialogHeader(): string {
        return this.editingTypeInfraction ? "Modifier le type d'infraction" : "Nouveau type d'infraction";
    }

    // ── Points de check-list ─────────────────────────────────────
    checklistPoints: PointChecklistDossierTravail[] = [];
    loadingChecklistPoints = false;
    showChecklistPointDialog = false;
    savingChecklistPoint = false;
    editingChecklistPoint: PointChecklistDossierTravail | null = null;
    checklistPointForm: { libelle: string; categorie: string; ordre: number | null; actif: boolean } =
        { libelle: '', categorie: '', ordre: null, actif: true };

    ngOnInit(): void {
        this.loadDelais();
        this.loadJoursFeries();
        this.loadIndicesFraude();
        this.loadTypesInfraction();
        this.loadChecklistPoints();
    }

    // ── Délais ──────────────────────────────────────────────────
    private loadDelais(): void {
        this.loadingDelais = true;
        this.parametreDelaiService.findAll().subscribe({
            next: list => { this.delais = list; this.loadingDelais = false; },
            error: () => { this.loadingDelais = false; }
        });
    }

    openDelaiDialog(d: ParametreDelai): void {
        this.editingDelai = d;
        this.delaiForm = { libelle: d.libelle, valeurJours: d.valeurJours ?? null, joursOuvrables: d.joursOuvrables, actif: d.actif };
        this.showDelaiDialog = true;
    }

    executeSaveDelai(): void {
        if (!this.editingDelai || !this.delaiForm.libelle.trim()) return;
        this.savingDelai = true;
        this.parametreDelaiService.update(this.editingDelai.code, {
            libelle: this.delaiForm.libelle.trim(),
            valeurJours: this.delaiForm.valeurJours ?? undefined,
            joursOuvrables: this.delaiForm.joursOuvrables,
            actif: this.delaiForm.actif
        }).subscribe({
            next: updated => {
                this.delais = this.delais.map(x => x.id === updated.id ? updated : x);
                this.savingDelai = false;
                this.showDelaiDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Paramètre enregistré' });
            },
            error: err => {
                this.savingDelai = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Enregistrement impossible' });
            }
        });
    }

    // ── Jours fériés ────────────────────────────────────────────
    private loadJoursFeries(): void {
        this.loadingJoursFeries = true;
        this.jourFerieService.findAll().subscribe({
            next: list => { this.joursFeries = list; this.loadingJoursFeries = false; },
            error: () => { this.loadingJoursFeries = false; }
        });
    }

    openJourFerieDialog(j?: JourFerie): void {
        this.editingJourFerie = j ?? null;
        this.jourFerieForm = j
            ? { date: new Date(j.date), libelle: j.libelle, actif: j.actif }
            : { date: new Date(), libelle: '', actif: true };
        this.showJourFerieDialog = true;
    }

    executeSaveJourFerie(): void {
        if (!this.jourFerieForm.libelle.trim() || !this.jourFerieForm.date) return;
        this.savingJourFerie = true;
        const req = {
            date: this.jourFerieForm.date.toISOString().split('T')[0],
            libelle: this.jourFerieForm.libelle.trim(),
            actif: this.jourFerieForm.actif
        };
        const obs = this.editingJourFerie
            ? this.jourFerieService.update(this.editingJourFerie.id, req)
            : this.jourFerieService.create(req);
        obs.subscribe({
            next: saved => {
                this.joursFeries = this.editingJourFerie
                    ? this.joursFeries.map(x => x.id === saved.id ? saved : x)
                    : [...this.joursFeries, saved];
                this.savingJourFerie = false;
                this.showJourFerieDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Jour férié enregistré' });
            },
            error: err => {
                this.savingJourFerie = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Enregistrement impossible' });
            }
        });
    }

    // ── Indices de fraude ───────────────────────────────────────
    private loadIndicesFraude(): void {
        this.loadingIndicesFraude = true;
        this.indiceFraudeService.findAll().subscribe({
            next: list => { this.indicesFraude = list; this.loadingIndicesFraude = false; },
            error: () => { this.loadingIndicesFraude = false; }
        });
    }

    openIndiceFraudeDialog(i?: IndiceFraude): void {
        this.editingIndiceFraude = i ?? null;
        this.indiceFraudeForm = i
            ? { code: i.code, libelle: i.libelle, categorie: i.categorie ?? '', description: i.description ?? '', ordre: i.ordre, actif: i.actif }
            : { code: '', libelle: '', categorie: '', description: '', ordre: null, actif: true };
        this.showIndiceFraudeDialog = true;
    }

    executeSaveIndiceFraude(): void {
        if (!this.indiceFraudeForm.code.trim() || !this.indiceFraudeForm.libelle.trim()) return;
        this.savingIndiceFraude = true;
        const req = {
            code: this.indiceFraudeForm.code.trim(),
            libelle: this.indiceFraudeForm.libelle.trim(),
            categorie: this.indiceFraudeForm.categorie.trim() || undefined,
            description: this.indiceFraudeForm.description.trim() || undefined,
            ordre: this.indiceFraudeForm.ordre ?? undefined,
            actif: this.indiceFraudeForm.actif
        };
        const obs = this.editingIndiceFraude
            ? this.indiceFraudeService.update(this.editingIndiceFraude.code, req)
            : this.indiceFraudeService.create(req);
        obs.subscribe({
            next: saved => {
                this.indicesFraude = this.editingIndiceFraude
                    ? this.indicesFraude.map(x => x.code === saved.code ? saved : x)
                    : [...this.indicesFraude, saved];
                this.savingIndiceFraude = false;
                this.showIndiceFraudeDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Indice de fraude enregistré' });
            },
            error: err => {
                this.savingIndiceFraude = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Enregistrement impossible' });
            }
        });
    }

    // ── Types d'infraction ──────────────────────────────────────
    private loadTypesInfraction(): void {
        this.loadingTypesInfraction = true;
        this.typeInfractionService.findAll().subscribe({
            next: list => { this.typesInfraction = list; this.loadingTypesInfraction = false; },
            error: () => { this.loadingTypesInfraction = false; }
        });
    }

    openTypeInfractionDialog(t?: TypeInfraction): void {
        this.editingTypeInfraction = t ?? null;
        this.typeInfractionForm = t
            ? { code: t.code, libelle: t.libelle, articleCodePenal: t.articleCodePenal ?? '', articleLoi004: t.articleLoi004 ?? '', impliqueDdip: t.impliqueDdip, ordre: t.ordre, actif: t.actif }
            : { code: '', libelle: '', articleCodePenal: '', articleLoi004: '', impliqueDdip: false, ordre: null, actif: true };
        this.showTypeInfractionDialog = true;
    }

    executeSaveTypeInfraction(): void {
        if (!this.typeInfractionForm.code.trim() || !this.typeInfractionForm.libelle.trim()) return;
        this.savingTypeInfraction = true;
        const req = {
            code: this.typeInfractionForm.code.trim(),
            libelle: this.typeInfractionForm.libelle.trim(),
            articleCodePenal: this.typeInfractionForm.articleCodePenal.trim() || undefined,
            articleLoi004: this.typeInfractionForm.articleLoi004.trim() || undefined,
            impliqueDdip: this.typeInfractionForm.impliqueDdip,
            ordre: this.typeInfractionForm.ordre ?? undefined,
            actif: this.typeInfractionForm.actif
        };
        const obs = this.editingTypeInfraction
            ? this.typeInfractionService.update(this.editingTypeInfraction.code, req)
            : this.typeInfractionService.create(req);
        obs.subscribe({
            next: saved => {
                this.typesInfraction = this.editingTypeInfraction
                    ? this.typesInfraction.map(x => x.code === saved.code ? saved : x)
                    : [...this.typesInfraction, saved];
                this.savingTypeInfraction = false;
                this.showTypeInfractionDialog = false;
                this.messageService.add({ severity: 'success', summary: "Type d'infraction enregistré" });
            },
            error: err => {
                this.savingTypeInfraction = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Enregistrement impossible' });
            }
        });
    }

    // ── Points de check-list ─────────────────────────────────────
    private loadChecklistPoints(): void {
        this.loadingChecklistPoints = true;
        this.checklistPointService.findAll().subscribe({
            next: list => { this.checklistPoints = list; this.loadingChecklistPoints = false; },
            error: () => { this.loadingChecklistPoints = false; }
        });
    }

    openChecklistPointDialog(p?: PointChecklistDossierTravail): void {
        this.editingChecklistPoint = p ?? null;
        this.checklistPointForm = p
            ? { libelle: p.libelle, categorie: p.categorie ?? '', ordre: p.ordre, actif: p.actif }
            : { libelle: '', categorie: '', ordre: this.checklistPoints.length + 1, actif: true };
        this.showChecklistPointDialog = true;
    }

    executeSaveChecklistPoint(): void {
        if (!this.checklistPointForm.libelle.trim() || this.checklistPointForm.ordre === null) return;
        this.savingChecklistPoint = true;
        const req = {
            libelle: this.checklistPointForm.libelle.trim(),
            categorie: this.checklistPointForm.categorie.trim() || undefined,
            ordre: this.checklistPointForm.ordre,
            actif: this.checklistPointForm.actif
        };
        const obs = this.editingChecklistPoint
            ? this.checklistPointService.update(this.editingChecklistPoint.code, req)
            : this.checklistPointService.create(req);
        obs.subscribe({
            next: saved => {
                this.checklistPoints = this.editingChecklistPoint
                    ? this.checklistPoints.map(x => x.code === saved.code ? saved : x)
                    : [...this.checklistPoints, saved];
                this.savingChecklistPoint = false;
                this.showChecklistPointDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Point de check-list enregistré' });
            },
            error: err => {
                this.savingChecklistPoint = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Enregistrement impossible' });
            }
        });
    }
}
