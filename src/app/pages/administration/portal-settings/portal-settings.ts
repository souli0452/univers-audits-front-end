import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { HttpClient }      from '@angular/common/http';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule }  from 'primeng/textarea';
import { ToastModule }     from 'primeng/toast';
import { TooltipModule }   from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService }  from 'primeng/api';
import { PortalConfigService, PortalConfigItem } from '../../../core/services/portal-config.service';
import { environment } from '../../../../environments/environment';

const GROUP_LABELS: Record<string, string> = {
    IDENTITE: 'Identité & Logos',
    CONTACT:  'Contact',
    HERO:     "Section Héro (page d'accueil)",
    ETAPES:   'Étapes "Comment ça marche"',
    FOOTER:   'Footer & Réseaux sociaux',
    TOPBAR:   'Barre supérieure',
};

const GROUP_ICONS: Record<string, string> = {
    IDENTITE: 'pi pi-id-card',
    CONTACT:  'pi pi-phone',
    HERO:     'pi pi-image',
    ETAPES:   'pi pi-list-check',
    FOOTER:   'pi pi-globe',
    TOPBAR:   'pi pi-window-maximize',
};

@Component({
    selector: 'app-portal-settings',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, InputTextModule, TextareaModule,
        ToastModule, TooltipModule, ProgressBarModule
    ],
    providers: [MessageService],
    template: `
<p-toast />

<!-- Input file caché — déclenché par les boutons Upload -->
<input #fileInput type="file"
    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
    style="display:none"
    (change)="onFileSelected($event)" />

<div class="flex flex-col gap-6">

    <!-- En-tête -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                Paramètres du portail
            </h1>
            <p class="text-surface-400 text-sm mt-1">
                Configurez le contenu visible sur le portail public INTÉGRITÉ+
            </p>
        </div>
        <div class="flex gap-2">
            <p-button label="Aperçu portail" icon="pi pi-external-link"
                severity="secondary" outlined (onClick)="openPortal()" />
            <p-button label="Enregistrer tout" icon="pi pi-save"
                [loading]="saving" (onClick)="saveAll()" />
        </div>
    </div>

    <!-- Barre de progression upload -->
    <div *ngIf="uploading"
        class="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <i class="pi pi-spin pi-spinner text-blue-600"></i>
        <span class="text-sm text-blue-700">Upload en cours : {{ uploadingFor }}...</span>
        <p-progressbar mode="indeterminate" styleClass="flex-1 h-2" />
    </div>

    <!-- Skeleton -->
    <div *ngIf="loading" class="flex flex-col gap-4">
        <div *ngFor="let i of [1,2,3]" class="h-40 bg-surface-100 rounded-2xl animate-pulse"></div>
    </div>

    <!-- Groupes -->
    <div *ngIf="!loading" class="flex flex-col gap-4">
        <div *ngFor="let group of groupKeys"
            class="bg-white dark:bg-surface-800 rounded-2xl border
                   border-surface-100 dark:border-surface-700 overflow-hidden">

            <!-- En-tête groupe -->
            <div class="flex items-center gap-3 px-6 py-4 cursor-pointer
                        bg-surface-50 dark:bg-surface-900 border-b
                        border-surface-100 dark:border-surface-700
                        hover:bg-surface-100 transition-colors"
                (click)="toggleGroup(group)">
                <div class="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900
                            flex items-center justify-center flex-shrink-0">
                    <i [class]="getGroupIcon(group) + ' text-primary-600 text-sm'"></i>
                </div>
                <div class="flex-1">
                    <div class="font-bold text-surface-900 dark:text-surface-0 text-sm">
                        {{ getGroupLabel(group) }}
                    </div>
                    <div class="text-xs text-surface-400">
                        {{ configGroups[group]?.length || 0 }} paramètre(s)
                    </div>
                </div>
                <i [class]="'pi text-surface-400 text-sm ' +
                    (collapsedGroups[group] ? 'pi-chevron-down' : 'pi-chevron-up')"></i>
            </div>

            <!-- Corps -->
            <div *ngIf="!collapsedGroups[group]" class="p-6">
                <div class="grid grid-cols-1 gap-5">
                    <div *ngFor="let item of configGroups[group]" class="flex flex-col gap-2">

                        <!-- Label -->
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                {{ item.label }}
                            </label>
                            <i *ngIf="item.description"
                                class="pi pi-info-circle text-xs text-surface-400"
                                [pTooltip]="item.description" tooltipPosition="right"></i>
                            <span class="ml-auto text-xs px-2 py-0.5 rounded-full
                                         bg-surface-100 dark:bg-surface-700 text-surface-500">
                                {{ item.valueType }}
                            </span>
                        </div>

                        <div *ngIf="item.valueType === 'IMAGE_URL'" class="flex gap-3 items-start">

                            <div class="w-20 h-20 rounded-xl border-2 border-dashed
                                        border-surface-200 dark:border-surface-600
                                        bg-surface-50 dark:bg-surface-900
                                        flex items-center justify-center overflow-hidden
                                        flex-shrink-0 cursor-pointer hover:border-primary-400
                                        transition-colors relative group"
                                (click)="triggerUpload(item.configKey)">
                                <img *ngIf="editValues[item.configKey]"
                                    [src]="editValues[item.configKey]"
                                    class="w-full h-full object-cover"
                                    (error)="onImgError($event)" />
                                <div *ngIf="!editValues[item.configKey]"
                                    class="flex flex-col items-center gap-1">
                                    <i class="pi pi-image text-surface-300 text-2xl"></i>
                                </div>
                                <!-- Overlay au hover -->
                                <div class="absolute inset-0 bg-black/40 rounded-xl
                                            flex items-center justify-center
                                            opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="pi pi-upload text-white text-xl"></i>
                                </div>
                            </div>

                            <div class="flex-1 flex flex-col gap-2">
                                <!-- Bouton upload principal -->
                                <p-button
                                    label="Choisir une image"
                                    icon="pi pi-upload"
                                    severity="info"
                                    outlined
                                    size="small"
                                    [loading]="uploading && uploadingKey === item.configKey"
                                    (onClick)="triggerUpload(item.configKey)" />

                                <!-- Champ URL manuel (optionnel) -->
                                <div class="flex items-center gap-2">
                                    <input pInputText
                                        [(ngModel)]="editValues[item.configKey]"
                                        placeholder="ou saisissez une URL manuellement"
                                        class="flex-1 text-xs font-mono" />
                                </div>

                                <!-- Info fichier uploadé -->
                                <div *ngIf="uploadedFiles[item.configKey]"
                                    class="flex items-center gap-2 text-xs text-green-600
                                           bg-green-50 px-2 py-1 rounded-lg">
                                    <i class="pi pi-check-circle flex-shrink-0"></i>
                                    {{ uploadedFiles[item.configKey] }} uploadé
                                </div>

                                <small class="text-surface-400 text-xs">
                                    Formats : JPG, PNG, GIF, WEBP, SVG — Max 5 Mo
                                </small>
                            </div>
                        </div>

                        <textarea *ngIf="item.valueType === 'TEXT' && isLongText(item.configKey)"
                            pTextarea [(ngModel)]="editValues[item.configKey]"
                            rows="3" class="w-full text-sm resize-none"></textarea>

                        <!-- TEXT court, PHONE, URL : input -->
                        <input *ngIf="(item.valueType !== 'IMAGE_URL' && item.valueType !== 'HTML')
                                      && !isLongText(item.configKey)"
                            pInputText [(ngModel)]="editValues[item.configKey]"
                            [placeholder]="getPlaceholder(item.valueType)"
                            class="w-full text-sm" />

                        <!-- Indicateur modification -->
                        <div *ngIf="isDirty(item.configKey)"
                            class="flex items-center gap-1.5 text-xs text-amber-600">
                            <i class="pi pi-circle-fill" style="font-size:6px"></i>
                            Modifié
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Barre sticky modifications -->
    <div *ngIf="hasDirtyFields"
        class="sticky bottom-4 flex justify-end">
        <div class="bg-white dark:bg-surface-800 border border-surface-200
                    dark:border-surface-600 rounded-2xl shadow-lg px-5 py-3
                    flex items-center gap-4">
            <span class="text-sm text-amber-600 font-semibold">
                <i class="pi pi-exclamation-circle mr-2"></i>
                {{ dirtyCount }} modification(s) non sauvegardée(s)
            </span>
            <p-button label="Annuler" severity="secondary" outlined size="small"
                (onClick)="resetDirty()" />
            <p-button label="Enregistrer tout" icon="pi pi-save" size="small"
                [loading]="saving" (onClick)="saveAll()" />
        </div>
    </div>

</div>
    `
})
export class PortalSettings implements OnInit {

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    private svc  = inject(PortalConfigService);
    private http = inject(HttpClient);
    private msg  = inject(MessageService);

    private readonly uploadUrl = `${environment.apiUrl}/admin/images/upload`;

    configGroups:    Record<string, PortalConfigItem[]> = {};
    groupKeys:       string[] = [];
    editValues:      Record<string, string> = {};
    originalValues:  Record<string, string> = {};
    collapsedGroups: Record<string, boolean> = {};
    uploadedFiles:   Record<string, string>  = {}; 

    loading      = true;
    saving       = false;
    uploading    = false;
    uploadingKey = '';
    uploadingFor = '';

    private currentUploadKey = '';

    private readonly LONG_TEXT_KEYS = new Set([
        'hero_title', 'hero_subtitle', 'footer_about', 'topbar_message',
        'step1_desc', 'step2_desc', 'step3_desc', 'step4_desc'
    ]);

    ngOnInit(): void {
        this.svc.getAdminConfig().subscribe({
            next: groups => {
                this.configGroups = groups;
                this.groupKeys    = Object.keys(groups);
                for (const items of Object.values(groups)) {
                    for (const item of items) {
                        this.editValues[item.configKey]     = item.configValue ?? '';
                        this.originalValues[item.configKey] = item.configValue ?? '';
                    }
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.msg.add({ severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger la configuration' });
            }
        });
    }


    triggerUpload(configKey: string): void {
        this.currentUploadKey = configKey;
        this.fileInput.nativeElement.value = '';
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const key  = this.currentUploadKey;

        const context = key.includes('banner') ? 'banner'
                      : key.includes('logo')   ? 'logo'
                      : 'portal';

        if (file.size > 5 * 1024 * 1024) {
            this.msg.add({ severity: 'error', summary: 'Fichier trop grand',
                detail: 'Taille maximum : 5 Mo' });
            return;
        }

        this.uploading    = true;
        this.uploadingKey = key;
        this.uploadingFor = file.name;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('context', context);

        this.http.post<{ url: string; filename: string }>(this.uploadUrl, formData)
            .subscribe({
                next: res => {
                    this.editValues[key] = res.url + '?t=' + Date.now();
                    this.uploadedFiles[key] = res.filename;

                    this.uploading    = false;
                    this.uploadingKey = '';
                    this.uploadingFor = '';

                    this.msg.add({ severity: 'success', summary: 'Image uploadée',
                        detail: file.name + ' — cliquez "Enregistrer tout" pour appliquer' });
                },
                error: err => {
                    this.uploading    = false;
                    this.uploadingKey = '';
                    this.msg.add({ severity: 'error', summary: 'Erreur upload',
                        detail: err.error?.error || 'Impossible d\'uploader le fichier' });
                }
            });
    }


    getGroupLabel(group: string): string { return GROUP_LABELS[group] || group; }
    getGroupIcon(group: string):  string { return GROUP_ICONS[group]  || 'pi pi-cog'; }
    toggleGroup(group: string):   void   { this.collapsedGroups[group] = !this.collapsedGroups[group]; }
    isLongText(key: string):      boolean { return this.LONG_TEXT_KEYS.has(key); }

    getPlaceholder(type: string): string {
        switch (type) {
            case 'PHONE': return 'Ex: 80 00 11 11';
            case 'URL':   return 'https://...';
            default:      return '';
        }
    }

    isDirty(key: string): boolean { return this.editValues[key] !== this.originalValues[key]; }

    get hasDirtyFields(): boolean {
        return Object.keys(this.editValues).some(k => this.isDirty(k));
    }

    get dirtyCount(): number {
        return Object.keys(this.editValues).filter(k => this.isDirty(k)).length;
    }

    saveAll(): void {
        const dirty = Object.fromEntries(
            Object.entries(this.editValues).filter(([k]) => this.isDirty(k))
        );
        if (!Object.keys(dirty).length) {
            this.msg.add({ severity: 'info', summary: 'Info',
                detail: 'Aucune modification à enregistrer' });
            return;
        }
        this.saving = true;
        this.svc.updateBatch(dirty).subscribe({
            next: () => {
                Object.assign(this.originalValues, this.editValues);
                this.svc.loadPublicConfig();
                this.saving = false;
                this.msg.add({ severity: 'success', summary: 'Enregistré',
                    detail: Object.keys(dirty).length + ' paramètre(s) mis à jour' });
            },
            error: () => {
                this.saving = false;
                this.msg.add({ severity: 'error', summary: 'Erreur',
                    detail: "Impossible d'enregistrer les modifications" });
            }
        });
    }

    resetDirty():  void { Object.assign(this.editValues, this.originalValues); }
    openPortal():  void { window.open('/portail', '_blank'); }
    onImgError(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }
}