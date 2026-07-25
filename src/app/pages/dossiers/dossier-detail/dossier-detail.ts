import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DossierService } from '../../../core/services/dossier.service';
import { DossierResponse, DossierStatus, isVersionConflict } from '../../../core/models/dossier.model';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { AttachmentService, AttachmentResponse } from '../../../core/services/attachment.service';
import {
    TargetedPartyService,
    TargetedPartyResponse,
    TargetedPartyRequest
} from '../../../core/services/targeted-party.service';
import {
    WitnessService,
    WitnessResponse,
    WitnessRequest
} from '../../../core/services/witness.service';
import {
    ObservationService,
    ObservationResponse,
    ObservationRequest
} from '../../../core/services/observation.service';
import { InvestigationService } from '../../../core/services/investigation.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as mammoth from 'mammoth';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined;

interface WorkflowStep {
    label: string; status: DossierStatus; icon: string;
    date?: string; active: boolean; completed: boolean;
}

@Component({
    selector: 'app-dossier-detail',
    standalone: true,
    imports: [
        CommonModule, RouterModule, FormsModule,
        ButtonModule, TagModule, DialogModule,
        TextareaModule, ToastModule, SkeletonModule,
        ConfirmDialogModule, TooltipModule, SelectModule
    ],
    providers: [MessageService, ConfirmationService],
    styles: [`
        .btn-cloture {
            background-color: #991B1B !important;
            border-color: #991B1B !important;
            color: #fff !important;
        }
        .btn-cloture:hover {
            background-color: #7F1D1D !important;
            border-color: #7F1D1D !important;
        }
        .badge-classe {
            background: #991B1B; color: #fff;
            font-size: 11px; font-weight: 800;
            padding: 3px 10px; border-radius: 20px;
            letter-spacing: 1px; text-transform: uppercase;
        }
        .badge-clos {
            background: #166534; color: #fff;
            font-size: 11px; font-weight: 800;
            padding: 3px 10px; border-radius: 20px;
            letter-spacing: 1px; text-transform: uppercase;
        }
        .badge-decision {
            background: #1e40af; color: #fff;
            font-size: 11px; font-weight: 800;
            padding: 3px 10px; border-radius: 20px;
            letter-spacing: 1px; text-transform: uppercase;
        }
    `],
    templateUrl: './dossier-detail.html'
})
export class DossierDetail implements OnInit {

    private route                = inject(ActivatedRoute);
    private router               = inject(Router);
    private dossierService       = inject(DossierService);
    private investigationService = inject(InvestigationService);
    private keycloakService      = inject(KeycloakService);
    private messageService       = inject(MessageService);
    private http                 = inject(HttpClient);
    private attachmentService    = inject(AttachmentService);
    private targetedPartyService = inject(TargetedPartyService);
    private witnessService       = inject(WitnessService);
    private observationService   = inject(ObservationService);
    private sanitizer            = inject(DomSanitizer);

    dossier:              DossierResponse | null  = null;
    loading               = true;
    transitioning         = false;
    openingInvestigation  = false;
    exportingPdf          = false;   
    openDays              = 90;
    attachments:          AttachmentResponse[]    = [];
    parties:              TargetedPartyResponse[] = [];
    witnesses:            WitnessResponse[]       = [];
    observations:         ObservationResponse[]   = [];
    attachmentBlobs:      { [id: string]: string } = {};
    previewId:            string | null = null;
    docxHtml:             { [id: string]: string } = {};
    staleVersion                  = 0;
    showVersionConflictDialog     = false;
    conflictRefreshing            = false;
    justRefreshedAfterConflict    = false;
    showConfidentialDialog        = false;
    confidentialReason            = '';
    savingConfidential            = false;

    showComplementDialog  = false;
    complementMotif       = '';
    complementMotifError  = false;

    showPriorityDialog  = false;
    savingPriority      = false;
    priorityReasonError = false;

    priorityForm: {
        level:       string;
        reason:      string;
        deadlineStr: string;
    } = { level: 'NORMAL', reason: '', deadlineStr: '' };

    activeTab = 'parties';
    tabs = [
        { key: 'parties',      label: 'Parties visées', icon: 'pi pi-user-minus',
          count: () => this.parties.length      },
        { key: 'witnesses',    label: 'Témoins',        icon: 'pi pi-eye',
          count: () => this.witnesses.length    },
        { key: 'observations', label: 'Observations',   icon: 'pi pi-comments',
          count: () => this.observations.length },
        { key: 'attachments',  label: 'Pièces jointes', icon: 'pi pi-paperclip',
          count: () => this.attachments.length  }
    ];

    showTransitionDialog  = false;
    transitionDialogTitle = '';
    transitionPlaceholder = '';
    transitionReason      = '';
    currentTransitionType = '';
    workflowSteps: WorkflowStep[] = [];

    showPartyDialog   = false;
    showWitnessDialog = false;
    showObsDialog     = false;

    editingParty:   TargetedPartyResponse | null = null;
    editingWitness: WitnessResponse | null       = null;

    savingParty   = false;
    savingWitness = false;
    savingObs     = false;

    partyForm:   TargetedPartyRequest = this.emptyPartyForm();
    witnessForm: WitnessRequest       = this.emptyWitnessForm();
    obsForm:     ObservationRequest   = { type: '', content: '', confidential: false };

    readonly partyTypeOptions = [
        { label: 'Personne physique', value: 'PRIVATE_PERSON'  },
        { label: 'Entreprise',        value: 'COMPANY'          },
        { label: 'Agent public',      value: 'PUBLIC_AGENT'     },
        { label: 'Autorité publique', value: 'PUBLIC_AUTHORITY' }
    ];
    readonly allegedRoleOptions = [
        { label: 'Auteur principal', value: 'MAIN_PERPETRATOR' },
        { label: 'Complice',         value: 'ACCOMPLICE'        },
        { label: 'Bénéficiaire',     value: 'BENEFICIARY'       },
        { label: 'Instigateur',      value: 'INSTIGATOR'        }
    ];
    readonly obsTypeOptions = [
        { label: 'Note interne',          value: 'INTERNAL_NOTE'          },
        { label: 'Analyse recevabilité',  value: 'ADMISSIBILITY_ANALYSIS' },
        { label: 'Avis CTADP',           value: 'CTADP_OPINION'          },
        { label: 'Demande de complément', value: 'COMPLEMENT_REQUEST'     },
        { label: 'Décision CGE',         value: 'CGE_DECISION'           },
        { label: 'Constat terrain',       value: 'FIELD_FINDING'          },
        { label: 'Note de transfert',     value: 'TRANSFER_NOTE'          }
    ];

    private readonly investigationStatuses: DossierStatus[] = [
        'RECEVABLE', 'EN_INVESTIGATION', 'RAPPORT_PRODUIT', 'DECISION_RENDUE'
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) this.loadDossier(id);
    }

    private loadDossier(id: string): void {
        this.loading = true;
        this.dossierService.findById(id).subscribe({
            next: dossier => {
                this.dossier = dossier;
                this.buildWorkflowSteps(dossier);
                this.loading = false;
                this.loadRelatedData(id);
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Dossier introuvable'
                });
            }
        });
    }

    private loadRelatedData(id: string): void {
        this.attachmentService.listByDossier(id).subscribe({
            next: a => { this.attachments = a; a.forEach(att => this.loadBlob(att)); },
            error: () => {}
        });
        this.targetedPartyService.findAll(id).subscribe({
            next: p => { this.parties = p; }, error: () => {}
        });
        this.witnessService.findAll(id).subscribe({
            next: w => { this.witnesses = w; }, error: () => {}
        });
        this.observationService.findAll(id).subscribe({
            next: o => { this.observations = o; }, error: () => {}
        });
    }

    get todayStr(): string {
        return new Date().toISOString().split('T')[0];
    }

    openPriorityDialog(): void {
        const dl = this.dossier?.priorityDeadline
            ? new Date(this.dossier.priorityDeadline).toISOString().split('T')[0]
            : '';
        this.priorityForm = {
            level:       this.dossier?.priority || 'NORMAL',
            reason:      this.dossier?.priorityReason || '',
            deadlineStr: dl
        };
        this.priorityReasonError = false;
        this.showPriorityDialog  = true;
    }

    executeSavePriority(): void {
        if (this.priorityForm.level !== 'NORMAL'
            && !this.priorityForm.reason.trim()) {
            this.priorityReasonError = true;
            return;
        }
        if (!this.dossier) return;

        this.savingPriority = true;

        const deadline = this.priorityForm.deadlineStr
            ? new Date(this.priorityForm.deadlineStr).toISOString()
            : null;

        this.dossierService.setPriority(this.dossier.id, {
            priority: this.priorityForm.level,
            reason:   this.priorityForm.reason.trim() || null,
            deadline,
            version:  this.dossier.version
        }).subscribe({
            next: updated => {
                this.dossier            = updated;
                this.buildWorkflowSteps(updated);
                this.savingPriority     = false;
                this.showPriorityDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary:  'Priorité mise à jour',
                    detail:   this.getPriorityButtonLabel(updated.priority)
                });
            },
            error: err => {
                this.savingPriority = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de mettre à jour'
                });
            }
        });
    }

    getPriorityButtonLabel(p: string | null | undefined): string {
        return {
            CRITIQUE: 'Critique',
            URGENT:   'Urgent',
            NORMAL:   'Normal',
            FAIBLE:   'Faible'
        }[p || 'NORMAL'] || 'Normal';
    }

    openComplementDialog(): void {
        this.complementMotif      = '';
        this.complementMotifError = false;
        this.showComplementDialog = true;
    }

    executeRequestComplement(): void {
        if (!this.complementMotif.trim()) {
            this.complementMotifError = true;
            return;
        }
        if (!this.dossier) return;
        this.transitioning = true;
        this.dossierService.requestComplement(this.dossier.id, {
            version: this.dossier.version,
            reason:  this.complementMotif.trim()
        }).subscribe({
            next: (updated: DossierResponse) => {
                this.dossier              = updated;
                this.buildWorkflowSteps(updated);
                this.transitioning        = false;
                this.showComplementDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary:  'Demande de complément envoyée',
                    detail:   'Le dossier est en attente du complément du déclarant'
                });
            },
            error: (err: any) => {
                this.transitioning = false;
                this.handleTransitionError(err);
            }
        });
    }

    openComplementReceived(): void {
        this.openTransition(
            'complement-received', 'Complément reçu',
            "Le complément a été reçu. Le dossier reprendra son étude d'opportunité."
        );
    }

    canSeeConfidential(): boolean {
        return this.keycloakService.hasAnyRole(['CGE', 'CGEA', 'ADMIN_DDIC']);
    }

    isWhistleblowerProtected(): boolean {
        return !!this.dossier?.declarant?.protectionRequested;
    }

    canEditDossier(): boolean {
        if (this.isClosed()) return false;
        if (this.isWhistleblowerProtected() && !this.hasRole(['CGE', 'CGEA'])) return false;
        return this.hasRole([
            'AGENT_BRPD', 'CONTROLEUR_ETAT', 'CONSEILLER_JURIDIQUE',
            'CGEA', 'CGE', 'ADMIN_DDIC'
        ]);
    }

    isClosed(): boolean {
        return ['CLOS', 'CLASSE', 'TRANSFERE'].includes(this.dossier?.status || '');
    }

    isInvestigationVisible(): boolean {
        return this.investigationStatuses.includes(
            this.dossier?.status as DossierStatus
        );
    }

    private handleTransitionError(err: any): void {
        this.transitioning = false;
        if (isVersionConflict(err)) {
            this.staleVersion              = this.dossier?.version ?? 0;
            this.showTransitionDialog      = false;
            this.showVersionConflictDialog = true;
            this.conflictRefreshing        = true;
            this.dossierService.refreshById(this.dossier!.id).subscribe({
                next: fresh => {
                    this.dossier            = fresh;
                    this.buildWorkflowSteps(fresh);
                    this.conflictRefreshing = false;
                },
                error: () => {
                    this.conflictRefreshing = false;
                    this.messageService.add({
                        severity: 'error', summary: 'Erreur de rechargement',
                        detail: 'Impossible de recharger le dossier.'
                    });
                }
            });
        } else {
            this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: err.error?.message || 'Transition échouée'
            });
        }
    }

    closeVersionConflictDialog(): void {
        this.showVersionConflictDialog  = false;
        this.justRefreshedAfterConflict = true;
        setTimeout(() => { this.justRefreshedAfterConflict = false; }, 5000);
    }

    openInvestigation(): void {
        if (!this.dossier) return;
        this.openingInvestigation = true;
        this.investigationService
            .open(this.dossier.id, { plannedDurationDays: this.openDays })
            .subscribe({
                next: inv => {
                    this.openingInvestigation = false;
                    this.messageService.add({
                        severity: 'success',
                        summary:  'Investigation ouverte', detail: 'Redirection...'
                    });
                    setTimeout(() => {
                        this.router.navigate(['/app/investigations', inv.id]);
                    }, 800);
                },
                error: err => {
                    this.openingInvestigation = false;
                    this.messageService.add({
                        severity: 'error', summary: 'Erreur',
                        detail: err.error?.message || "Erreur lors de l'ouverture"
                    });
                }
            });
    }

    openAddParty(): void {
        this.editingParty    = null;
        this.partyForm       = this.emptyPartyForm();
        this.showPartyDialog = true;
    }

    openEditParty(p: TargetedPartyResponse): void {
        this.editingParty = p;
        this.partyForm = {
            partyType: p.partyType, firstName: p.firstName, name: p.name,
            position: p.position, institution: p.institution,
            organization: p.organization, address: p.address,
            phoneNumber: p.phoneNumber, email: p.email,
            relationWithDeclarant: p.relationWithDeclarant, allegedRole: p.allegedRole
        };
        this.showPartyDialog = true;
    }

    saveParty(): void {
        if (!this.dossier || !this.partyForm.partyType
            || !this.partyForm.firstName?.trim() || !this.partyForm.name?.trim()) {
            this.messageService.add({
                severity: 'warn', summary: 'Champs obligatoires',
                detail: 'Type de partie, Prénom et Nom sont requis.'
            });
            return;
        }
        this.savingParty = true;
        const obs$ = this.editingParty
            ? this.targetedPartyService.update(
                this.dossier.id, this.editingParty.id, this.partyForm)
            : this.targetedPartyService.create(this.dossier.id, this.partyForm);
        obs$.subscribe({
            next: () => {
                this.targetedPartyService.findAll(this.dossier!.id).subscribe({
                    next: p => {
                        this.parties = p;
                        this.savingParty = false; this.showPartyDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: this.editingParty ? 'Partie modifiée' : 'Partie ajoutée'
                        });
                    },
                    error: () => { this.savingParty = false; this.showPartyDialog = false; }
                });
            },
            error: err => {
                this.savingParty = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Erreur lors de la sauvegarde'
                });
            }
        });
    }

    deleteParty(partyId: string): void {
        if (!this.dossier) return;
        this.targetedPartyService.delete(this.dossier.id, partyId).subscribe({
            next: () => {
                this.targetedPartyService.findAll(this.dossier!.id).subscribe({
                    next: p => {
                        this.parties = p;
                        this.messageService.add({ severity: 'info', summary: 'Partie supprimée' });
                    },
                    error: () => {}
                });
            },
            error: err => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Suppression échouée'
                });
            }
        });
    }

    openAddWitness(): void {
        this.editingWitness    = null;
        this.witnessForm       = this.emptyWitnessForm();
        this.showWitnessDialog = true;
    }

    openEditWitness(w: WitnessResponse): void {
        this.editingWitness = w;
        this.witnessForm = {
            firstName: w.firstName, lastName: w.lastName,
            profession: w.profession, phoneNumber: w.phoneNumber,
            email: w.email, address: w.address,
            testimonyNature: w.testimonyNature,
            relationWithParties: w.relationWithParties,
            interrogationDate: w.interrogationDate,
            consentToContact: w.consentToContact, anonymous: w.anonymous
        };
        this.showWitnessDialog = true;
    }

    saveWitness(): void {
        if (!this.dossier || !this.witnessForm.firstName?.trim()) {
            this.messageService.add({
                severity: 'warn', summary: 'Champs obligatoires',
                detail: 'Le prénom est requis.'
            });
            return;
        }
        this.savingWitness = true;
        const obs$ = this.editingWitness
            ? this.witnessService.update(
                this.dossier.id, this.editingWitness.id, this.witnessForm)
            : this.witnessService.create(this.dossier.id, this.witnessForm);
        obs$.subscribe({
            next: () => {
                this.witnessService.findAll(this.dossier!.id).subscribe({
                    next: w => {
                        this.witnesses = w;
                        this.savingWitness = false; this.showWitnessDialog = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: this.editingWitness ? 'Témoin modifié' : 'Témoin ajouté'
                        });
                    },
                    error: () => {
                        this.savingWitness = false; this.showWitnessDialog = false;
                    }
                });
            },
            error: err => {
                this.savingWitness = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Erreur lors de la sauvegarde'
                });
            }
        });
    }

    deleteWitness(witnessId: string): void {
        if (!this.dossier) return;
        this.witnessService.delete(this.dossier.id, witnessId).subscribe({
            next: () => {
                this.witnessService.findAll(this.dossier!.id).subscribe({
                    next: w => {
                        this.witnesses = w;
                        this.messageService.add({ severity: 'info', summary: 'Témoin supprimé' });
                    },
                    error: () => {}
                });
            },
            error: err => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Suppression échouée'
                });
            }
        });
    }

    saveObservation(): void {
        if (!this.dossier || !this.obsForm.type || !this.obsForm.content) return;
        this.savingObs = true;
        this.observationService.create(this.dossier.id, this.obsForm).subscribe({
            next: obs => {
                this.observations  = [obs, ...this.observations];
                this.savingObs     = false;
                this.showObsDialog = false;
                this.obsForm       = { type: '', content: '', confidential: false };
                this.messageService.add({ severity: 'success', summary: 'Observation ajoutée' });
            },
            error: err => {
                this.savingObs = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Erreur'
                });
            }
        });
    }

    loadBlob(att: AttachmentResponse): void {
        const url = this.attachmentService.getDownloadUrl(att.id);
        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: blob => {
                this.attachmentBlobs = {
                    ...this.attachmentBlobs,
                    [att.id]: URL.createObjectURL(blob)
                };
            },
            error: () => {}
        });
    }

    getBlobUrl(id: string): string { return this.attachmentBlobs[id] || ''; }

    getSafeUrl(id: string): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            this.attachmentBlobs[id] || ''
        );
    }

    togglePreview(att: AttachmentResponse): void {
        if (this.previewId === att.id) {
            this.previewId = null;
        } else {
            this.previewId = att.id;
            if (this.isWord(att) && !this.docxHtml[att.id]) this.convertDocx(att);
        }
    }

    private convertDocx(att: AttachmentResponse): void {
        const blobUrl = this.attachmentBlobs[att.id];
        if (!blobUrl) return;
        fetch(blobUrl)
            .then(r => r.arrayBuffer())
            .then(buf => (mammoth as any).convertToHtml({ arrayBuffer: buf }))
            .then((res: any) => {
                this.docxHtml = { ...this.docxHtml, [att.id]: res.value };
            })
            .catch(() => {
                this.docxHtml = {
                    ...this.docxHtml,
                    [att.id]: '<p style="color:#ef4444;padding:16px;">Impossible de convertir.</p>'
                };
            });
    }

    isAudio(att: AttachmentResponse): boolean {
        return att.mimeType.startsWith('audio/') || att.isAudio;
    }
    isPdf(att: AttachmentResponse): boolean { return att.mimeType.includes('pdf'); }
    isImage(att: AttachmentResponse): boolean { return att.mimeType.startsWith('image/'); }
    isWord(att: AttachmentResponse): boolean {
        return att.mimeType.includes('word')
            || att.mimeType.includes('officedocument.wordprocessingml')
            || att.originalName.toLowerCase().endsWith('.docx')
            || att.originalName.toLowerCase().endsWith('.doc');
    }
    isVideo(att: AttachmentResponse): boolean { return att.mimeType.startsWith('video/'); }
    isOther(att: AttachmentResponse): boolean {
        return !this.isAudio(att) && !this.isPdf(att) && !this.isImage(att)
            && !this.isWord(att) && !this.isVideo(att);
    }

    buildWorkflowSteps(dossier: DossierResponse): void {
        const order: DossierStatus[] = [
            'SOUMIS', 'RECU', 'EN_ETUDE_OPPORTUNITE', 'EN_ATTENTE_COMPLEMENT',
            'EN_REVUE_CTADP', 'RECEVABLE', 'EN_INVESTIGATION',
            'RAPPORT_PRODUIT', 'DECISION_RENDUE', 'CLOS', 'CLASSE'
        ];
        const labels: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu — B4 remis',
            EN_ETUDE_OPPORTUNITE: 'Étude opportunité',
            EN_ATTENTE_COMPLEMENT: 'Attente complément',
            EN_REVUE_CTADP: 'Revue CTADP', RECEVABLE: 'Déclaré recevable',
            EN_INVESTIGATION: 'En investigation', RAPPORT_PRODUIT: 'Rapport produit',
            DECISION_RENDUE: 'Décision rendue', CLOS: 'Dossier clôturé',
            CLASSE: 'Classé sans suite'
        };
        const icons: Record<string, string> = {
            SOUMIS: 'pi pi-upload', RECU: 'pi pi-inbox',
            EN_ETUDE_OPPORTUNITE: 'pi pi-search',
            EN_ATTENTE_COMPLEMENT: 'pi pi-clock',
            EN_REVUE_CTADP: 'pi pi-users', RECEVABLE: 'pi pi-check',
            EN_INVESTIGATION: 'pi pi-eye', RAPPORT_PRODUIT: 'pi pi-file',
            DECISION_RENDUE: 'pi pi-hammer', CLOS: 'pi pi-lock',
            CLASSE: 'pi pi-lock'
        };
        const idx = order.indexOf(dossier.status);
        this.workflowSteps = order
            .filter(s => s !== 'IRRECEVABLE' && s !== 'TRANSFERE')
            .map((status, i) => ({
                label:     labels[status] || status,
                status,
                icon:      icons[status] || 'pi pi-circle',
                active:    status === dossier.status,
                completed: i < idx,
                date: i === 0 ? dossier.createdAt
                    : i === 1 ? dossier.receptionDate
                    : undefined
            }));
    }

    openTransition(type: string, title: string, placeholder: string): void {
        this.currentTransitionType = type;
        this.transitionDialogTitle = title;
        this.transitionPlaceholder = placeholder;
        this.transitionReason      = '';
        this.showTransitionDialog  = true;
    }

    openRegister(): void {
        this.openTransition('register', 'Enregistrer le dossier',
            'Le dossier sera enregistré et un numéro B4 attribué au déclarant.');
    }
    openStartStudy(): void {
        this.openTransition('start-study', 'Démarrer étude opportunité',
            "L'étude d'opportunité sera lancée par le conseiller juridique.");
    }
    openSubmitCtadp(): void {
        this.openTransition('submit-ctadp', 'Soumettre au CTADP',
            "Le dossier sera transmis au Comité de Traitement et d'Analyse.");
    }
    openDeclareAdmissible(): void {
        this.openTransition('declare-admissible', 'Déclarer recevable',
            'Le dossier sera déclaré recevable et une enquête pourra être ouverte.');
    }
    openDeclareInadmissible(): void {
        this.openTransition('declare-inadmissible', 'Déclarer irrecevable',
            'Le CGEA adressera une réponse motivée au déclarant dans 3 jours ouvrables.');
    }
    openClose(): void {
        const isDecision = this.dossier?.status === 'DECISION_RENDUE';
        this.openTransition('close', 'Clôturer le dossier',
            isDecision
                ? 'Clôture définitive après transmission aux autorités. Indiquez le motif.'
                : 'Le dossier sera clôturé et classé sans suite. Indiquez le motif.'
        );
    }

    executeTransition(): void {
        if (!this.dossier) return;
        this.transitioning = true;
        const request = { version: this.dossier.version, reason: this.transitionReason };
        const map: Record<string, () => any> = {
            'register':             () => this.dossierService.registerReception(this.dossier!.id, request),
            'start-study':          () => this.dossierService.startOpportunityStudy(this.dossier!.id, request),
            'complement-received':  () => this.dossierService.complementReceived(this.dossier!.id, request),
            'submit-ctadp':         () => this.dossierService.submitToCtadp(this.dossier!.id, request),
            'declare-admissible':   () => this.dossierService.declareAdmissible(this.dossier!.id, request),
            'declare-inadmissible': () => this.dossierService.declareInadmissible(this.dossier!.id, request),
            'close':                () => this.dossierService.close(this.dossier!.id, request)
        };
        const obs$ = map[this.currentTransitionType]?.();
        if (!obs$) { this.transitioning = false; return; }
        obs$.subscribe({
            next: (updated: DossierResponse) => {
                this.dossier = updated;
                this.buildWorkflowSteps(updated);
                this.transitioning        = false;
                this.showTransitionDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary:  'Statut mis à jour',
                    detail:   this.getStatusLabel(updated.status)
                });
            },
            error: (err: any) => this.handleTransitionError(err)
        });
    }

  
    async exportPdf(): Promise<void> {
        if (!this.dossier) return;
        this.exportingPdf = true;

        try {
            const { default: jsPDF }     = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W   = doc.internal.pageSize.getWidth();
            const d   = this.dossier;

            const VERT   = [22,  163,  74] as [number,number,number];
            const VERT_L = [240, 253, 244] as [number,number,number];
            const GRIS   = [100, 116, 139] as [number,number,number];
            const GRIS_L = [248, 250, 252] as [number,number,number];
            const ROUGE  = [220,  38,  38] as [number,number,number];
            const BLEU   = [29,   78, 216] as [number,number,number];
            const VIOLET = [109,  40, 217] as [number,number,number];

            let y = 0;

            const sectionTitle = (num: string, title: string, color = VERT) => {
                if (y > 242) { doc.addPage(); y = 14; }
                doc.setFillColor(...VERT_L);
                doc.rect(14, y, W - 28, 7, 'F');
                doc.setFontSize(9); doc.setFont('helvetica', 'bold');
                doc.setTextColor(...color);
                doc.text(`${num}. ${title}`, 16, y + 5);
                doc.setTextColor(0, 0, 0);
                y += 10;
            };

           
            doc.setFillColor(...VERT);
            doc.rect(0, 0, W, 30, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(15); doc.setFont('helvetica', 'bold');
            doc.text('ASCE-LC — INTÉGRITÉ+', 14, 11);

            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text('Dossier détaillé — Document officiel confidentiel', 14, 18);

            doc.setFontSize(18); doc.setFont('helvetica', 'bold');
            doc.text(d.number || 'SANS NUMÉRO', W - 14, 12, { align: 'right' });
            doc.setFontSize(7);
            doc.text(
                'Généré le ' + new Date().toLocaleDateString('fr-FR')
                + ' à ' + new Date().toLocaleTimeString('fr-FR'),
                W - 14, 18, { align: 'right' }
            );
            doc.setTextColor(0, 0, 0);
            y = 37;

            sectionTitle('1', 'INFORMATIONS GÉNÉRALES');

            autoTable(doc, {
                startY: y,
                body: [
                    ['Numéro dossier',   d.number || '—',
                     'Statut',           this.getStatusLabel(d.status)],
                    ['Type',             this.getTypeLabel(d.type || ''),
                     'Canal de réception', this.getModeLabel(d.submissionMode || '')],
                    ['Date de création', d.createdAt
                        ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '—',
                     'Date de réception', d.receptionDate
                        ? new Date(d.receptionDate).toLocaleDateString('fr-FR') : '—'],
                    ['Code de suivi citoyen', d.accessCode || '—',
                     'Version du dossier',   'v' + (d.version || 0)],
                    ['Priorité',          this.getPriorityButtonLabel(d.priority),
                     'Confidentiel',      d.isConfidential ? '🔒 OUI' : 'NON'],
                    ...(d.estimatedLoss ? [[
                        'Montant estimé (FCFA)',
                        Number(d.estimatedLoss).toLocaleString('fr-FR') + ' FCFA',
                        '', ''
                    ]] : []),
                    ...(d.eligibilityDecisionDate ? [[
                        'Date de décision d\'éligibilité',
                        new Date(d.eligibilityDecisionDate).toLocaleDateString('fr-FR'),
                        '', ''
                    ]] : []),
                    ...(d.closingDate ? [[
                        'Date de clôture',
                        new Date(d.closingDate).toLocaleDateString('fr-FR'),
                        '', ''
                    ]] : [])
                ],
                theme: 'grid',
                bodyStyles: { fontSize: 8.5 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50, fillColor: GRIS_L },
                    1: { cellWidth: 42 },
                    2: { fontStyle: 'bold', cellWidth: 50, fillColor: GRIS_L },
                    3: { cellWidth: 40 }
                },
                margin: { left: 14, right: 14 }
            });
            y = (doc as any).lastAutoTable.finalY + 6;

            sectionTitle('2', 'OBJET ET DESCRIPTION DES FAITS');

            autoTable(doc, {
                startY: y,
                body: [
                    ['Objet du signalement', d.object || '—'],
                    ...(d.description      ? [['Description détaillée', d.description]]      : []),
                    ...(d.incidentLocation ? [['Lieu des faits',         d.incidentLocation]] : []),
                    ...(d.incidentPeriod   ? [['Période approximative',  d.incidentPeriod]]   : [])
                ],
                theme: 'grid',
                bodyStyles: { fontSize: 8.5, minCellHeight: 9 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 50, fillColor: GRIS_L },
                    1: { cellWidth: 132 }
                },
                margin: { left: 14, right: 14 }
            });
            y = (doc as any).lastAutoTable.finalY + 6;

            if (d.declarant) {
                sectionTitle('3', 'DÉCLARANT');
                const dec = d.declarant;
                autoTable(doc, {
                    startY: y,
                    body: [
                        ['Identité / Affichage', dec.displayName || 'ANONYME',
                         'Type de déclarant',   dec.anonymous ? 'ANONYME' : 'CITOYEN'],
                        ...(dec.phoneNumber ? [[
                            'Téléphone', dec.phoneNumber, '', '']] : []),
                        ...(dec.email ? [['Email', dec.email, '', '']] : []),
                        ...(dec.commune ? [[
                            'Commune', dec.commune,
                            'Province', dec.province || '—']] : []),
                        ['Protection lanceur d\'alerte',
                            dec.protectionRequested
                                ? '✓ DEMANDÉE — Loi N°010-2004/AN'
                                : 'Non demandée',
                            '', '']
                    ],
                    theme: 'grid',
                    bodyStyles: { fontSize: 8.5 },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 50, fillColor: GRIS_L },
                        1: { cellWidth: 42 },
                        2: { fontStyle: 'bold', cellWidth: 50, fillColor: GRIS_L },
                        3: { cellWidth: 40 }
                    },
                    margin: { left: 14, right: 14 }
                });
                y = (doc as any).lastAutoTable.finalY + 6;
            }

       
            doc.addPage(); y = 14;

            sectionTitle('4', `PARTIES VISÉES (${this.parties.length})`, ROUGE);

            if (this.parties.length === 0) {
                doc.setFontSize(8); doc.setTextColor(...GRIS);
                doc.text('Aucune partie visée enregistrée.', 16, y + 3);
                doc.setTextColor(0, 0, 0);
                y += 8;
            } else {
                autoTable(doc, {
                    startY: y,
                    head: [['Prénom & Nom', 'Type de partie', 'Rôle allégué',
                             'Poste / Institution', 'Téléphone']],
                    body: this.parties.map(p => [
                        ((p.firstName || '') + ' ' + (p.name || '')).trim(),
                        this.getPartyTypeLabel(p.partyType),
                        p.allegedRole ? this.getAllegedRoleLabel(p.allegedRole) : '—',
                        [p.position, p.institution].filter(Boolean).join(' / ') || '—',
                        p.phoneNumber || '—'
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: ROUGE, fontSize: 8, textColor: [255,255,255] },
                    bodyStyles: { fontSize: 8 },
                    columnStyles: {
                        0: { cellWidth: 38 }, 1: { cellWidth: 30 },
                        2: { cellWidth: 28 }, 3: { cellWidth: 60 }, 4: { cellWidth: 26 }
                    },
                    margin: { left: 14, right: 14 }
                });
                y = (doc as any).lastAutoTable.finalY + 8;
            }

            sectionTitle('5', `TÉMOINS (${this.witnesses.length})`, BLEU);

            if (this.witnesses.length === 0) {
                doc.setFontSize(8); doc.setTextColor(...GRIS);
                doc.text('Aucun témoin enregistré.', 16, y + 3);
                doc.setTextColor(0, 0, 0);
                y += 8;
            } else {
                autoTable(doc, {
                    startY: y,
                    head: [['Prénom & Nom', 'Profession', 'Téléphone',
                             'Nature du témoignage', 'Ano.']],
                    body: this.witnesses.map(w => [
                        w.anonymous ? 'ANONYME'
                            : ((w.firstName || '') + ' ' + (w.lastName || '')).trim(),
                        w.profession || '—',
                        w.phoneNumber || '—',
                        (w.testimonyNature || '—').substring(0, 80)
                            + ((w.testimonyNature || '').length > 80 ? '…' : ''),
                        w.anonymous ? 'OUI' : 'NON'
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: BLEU, fontSize: 8, textColor: [255,255,255] },
                    bodyStyles: { fontSize: 8 },
                    columnStyles: {
                        0: { cellWidth: 34 }, 1: { cellWidth: 28 },
                        2: { cellWidth: 24 }, 3: { cellWidth: 84 }, 4: { cellWidth: 12 }
                    },
                    margin: { left: 14, right: 14 }
                });
                y = (doc as any).lastAutoTable.finalY + 6;
            }

          
            doc.addPage(); y = 14;

            sectionTitle('6', `OBSERVATIONS (${this.observations.length})`, VIOLET);

            if (this.observations.length === 0) {
                doc.setFontSize(8); doc.setTextColor(...GRIS);
                doc.text('Aucune observation enregistrée.', 16, y + 3);
                doc.setTextColor(0, 0, 0);
                y += 8;
            } else {
                autoTable(doc, {
                    startY: y,
                    head: [['Date', 'Type', 'Auteur', 'Contenu', 'Conf.']],
                    body: this.observations.map(obs => [
                        obs.createdAt
                            ? new Date(obs.createdAt).toLocaleDateString('fr-FR') : '—',
                        this.getObsTypeLabel(obs.type),
                        obs.authorFullName || '—',
                        (obs.content || '').substring(0, 110)
                            + ((obs.content || '').length > 110 ? '…' : ''),
                        obs.confidential ? '🔒' : '—'
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: VIOLET, fontSize: 8, textColor: [255,255,255] },
                    bodyStyles: { fontSize: 7.5, minCellHeight: 8 },
                    columnStyles: {
                        0: { cellWidth: 18 }, 1: { cellWidth: 30 },
                        2: { cellWidth: 30 }, 3: { cellWidth: 96 }, 4: { cellWidth: 8 }
                    },
                    didParseCell: (data: any) => {
                        if (data.section === 'body') {
                            const o = this.observations[data.row.index];
                            if (o?.confidential) {
                                data.cell.styles.fillColor = [255, 237, 213];
                                data.cell.styles.textColor = [154, 52, 18];
                            }
                        }
                    },
                    margin: { left: 14, right: 14 }
                });
                y = (doc as any).lastAutoTable.finalY + 6;

                const nbConfi = this.observations.filter(o => o.confidential).length;
                if (nbConfi > 0) {
                    doc.setFontSize(7); doc.setTextColor(180, 80, 20);
                    doc.text(
                        `⚠  ${nbConfi} observation(s) confidentielle(s) (fond orange) — `
                        + 'accès restreint CGE/CGEA/Admin DDIC',
                        14, y
                    );
                    doc.setTextColor(0, 0, 0);
                    y += 5;
                }
            }

            if (y > 200) { doc.addPage(); y = 14; }
            sectionTitle('7', `PIÈCES JOINTES (${this.attachments.length})`);

            if (this.attachments.length === 0) {
                doc.setFontSize(8); doc.setTextColor(...GRIS);
                doc.text('Aucune pièce jointe.', 16, y + 3);
                doc.setTextColor(0, 0, 0);
                y += 8;
            } else {
                autoTable(doc, {
                    startY: y,
                    head: [['Nom du fichier', 'Type MIME', 'Taille', 'Date d\'ajout', 'Audio']],
                    body: this.attachments.map(att => [
                        att.originalName,
                        att.mimeType,
                        this.formatSize(att.fileSizeBytes),
                        '—',
                        att.isAudio ? 'OUI' : '—'
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: GRIS, fontSize: 8, textColor: [255,255,255] },
                    bodyStyles: { fontSize: 8 },
                    columnStyles: {
                        0: { cellWidth: 68 }, 1: { cellWidth: 50 },
                        2: { cellWidth: 20 }, 3: { cellWidth: 30 }, 4: { cellWidth: 14 }
                    },
                    margin: { left: 14, right: 14 }
                });
                y = (doc as any).lastAutoTable.finalY + 6;
            }

            
            doc.addPage(); y = 14;

            sectionTitle('8', 'WORKFLOW — HISTORIQUE DES ÉTAPES DE TRAITEMENT');

            autoTable(doc, {
                startY: y,
                head: [['N°', 'Étape', 'Statut', 'Date', 'État du traitement']],
                body: this.workflowSteps.map((step, i) => [
                    String(i + 1),
                    step.label,
                    step.status,
                    step.date ? new Date(step.date).toLocaleDateString('fr-FR') : '—',
                    step.active
                        ? '▶  EN COURS ACTUELLEMENT'
                        : step.completed
                        ? '✓  Terminé'
                        : '○  À venir'
                ]),
                theme: 'grid',
                headStyles: { fillColor: VERT, fontSize: 8.5, textColor: [255,255,255] },
                bodyStyles: { fontSize: 8.5, minCellHeight: 9 },
                columnStyles: {
                    0: { cellWidth: 8,  halign: 'center' },
                    1: { cellWidth: 58 },
                    2: { cellWidth: 38 },
                    3: { cellWidth: 22 },
                    4: { cellWidth: 56 }
                },
                didParseCell: (data: any) => {
                    if (data.section === 'body') {
                        const step = this.workflowSteps[data.row.index];
                        if (step?.active) {
                            data.cell.styles.fillColor = [220, 252, 231];
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.textColor = [22, 101, 52];
                        } else if (step?.completed) {
                            data.cell.styles.fillColor = [248, 250, 252];
                            data.cell.styles.textColor = GRIS;
                        } else {
                            data.cell.styles.textColor = [190, 190, 190];
                        }
                    }
                },
                margin: { left: 14, right: 14 }
            });
            y = (doc as any).lastAutoTable.finalY + 8;

            if (d.priority && d.priority !== 'NORMAL') {
                const isC = d.priority === 'CRITIQUE';
                const bgColor  = (isC ? [254, 226, 226] : [255, 247, 237]) as [number,number,number];
                const txtColor = (isC ? ROUGE           : [180, 80, 0])    as [number,number,number];
                doc.setFillColor(...bgColor);
                doc.rect(14, y, W - 28, 20, 'F');
                doc.setFontSize(10); doc.setFont('helvetica', 'bold');
                doc.setTextColor(...txtColor);
                doc.text(
                    `PRIORITÉ ${this.getPriorityButtonLabel(d.priority).toUpperCase()} `
                    + (isC ? '— TRAITEMENT IMMÉDIAT REQUIS' : '— À TRAITER RAPIDEMENT'),
                    16, y + 7
                );
                if (d.priorityReason) {
                    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                    doc.text('Motif : ' + d.priorityReason, 16, y + 14);
                }
                if (d.priorityDeadline) {
                    doc.setFontSize(8);
                    doc.text(
                        'Échéance : '
                        + new Date(d.priorityDeadline).toLocaleDateString('fr-FR'),
                        W - 14, y + 7, { align: 'right' }
                    );
                }
                doc.setTextColor(0, 0, 0);
            }

            
            const total = (doc as any).internal.getNumberOfPages();
            for (let pg = 1; pg <= total; pg++) {
                doc.setPage(pg);
                const pH = doc.internal.pageSize.getHeight();
                doc.setDrawColor(...VERT);
                doc.setLineWidth(0.4);
                doc.line(14, pH - 13, W - 14, pH - 13);
                doc.setFontSize(7); doc.setTextColor(...GRIS);
                doc.text(
                    'ASCE-LC — Autorité Supérieure de Contrôle d\'État et de Lutte contre la Corruption— '
                    + 'Confidentiel — Toute divulgation non autorisée est interdite',
                    14, pH - 7
                );
                doc.text(`Page ${pg} / ${total}`, W - 14, pH - 7, { align: 'right' });
                doc.setTextColor(0, 0, 0);
            }

            const filename = `dossier_${d.number || d.id.substring(0,8)}_`
                + new Date().toISOString().split('T')[0] + '.pdf';
            doc.save(filename);

            this.messageService.add({
                severity: 'success', summary: 'PDF exporté',
                detail: filename + ' — ' + total + ' page(s)'
            });

        } catch (err) {
            if (!environment.production) console.error(err);
            this.messageService.add({
                severity: 'error', summary: 'Erreur export PDF',
                detail: 'Vérifiez que jspdf et jspdf-autotable sont installés.'
            });
        } finally {
            this.exportingPdf = false;
        }
    }

    openToggleConfidential(): void {
        this.confidentialReason     = '';
        this.showConfidentialDialog = true;
    }

    executeToggleConfidential(): void {
        if (!this.dossier) return;
        this.savingConfidential = true;
        const newValue = !this.dossier.isConfidential;
        this.dossierService.setConfidential(this.dossier.id, newValue, {
            version: this.dossier.version, reason: this.confidentialReason
        }).subscribe({
            next: updated => {
                this.dossier = updated;
                this.buildWorkflowSteps(updated);
                this.savingConfidential     = false;
                this.showConfidentialDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: newValue ? 'Dossier marqué confidentiel' : 'Confidentialité retirée',
                    detail: newValue
                        ? 'Seuls CGE, CGEA et ADMIN_DDIC peuvent voir ce dossier'
                        : 'Le dossier est maintenant accessible à tous les agents'
                });
            },
            error: err => {
                this.savingConfidential = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Action impossible'
                });
            }
        });
    }

    hasRole(roles: string[]): boolean { return this.keycloakService.hasAnyRole(roles); }
    formatSize(bytes: number): string { return this.attachmentService.formatSize(bytes); }

    getInitials(name: string): string {
        return (name || '').trim().split(' ').filter(Boolean)
            .map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    getAllegedRoleLabel(role: string): string {
        const l: Record<string, string> = {
            MAIN_PERPETRATOR: 'Auteur principal', ACCOMPLICE: 'Complice',
            BENEFICIARY: 'Bénéficiaire', INSTIGATOR: 'Instigateur'
        };
        return l[role] || role;
    }

    getPartyTypeLabel(type: string): string {
        const l: Record<string, string> = {
            PRIVATE_PERSON: 'Personne physique', COMPANY: 'Entreprise',
            PUBLIC_AGENT: 'Agent public', PUBLIC_AUTHORITY: 'Autorité publique'
        };
        return l[type] || type;
    }

    getObsTypeLabel(type: string): string {
        const l: Record<string, string> = {
            INTERNAL_NOTE: 'Note interne', ADMISSIBILITY_ANALYSIS: 'Analyse recevabilité',
            CTADP_OPINION: 'Avis CTADP', COMPLEMENT_REQUEST: 'Demande complément',
            CGE_DECISION: 'Décision CGE', FIELD_FINDING: 'Constat terrain',
            TRANSFER_NOTE: 'Note transfert'
        };
        return l[type] || type;
    }

    getStatusLabel(status: string): string {
        const l: Record<string, string> = {
            SOUMIS: 'Soumis', RECU: 'Reçu',
            EN_ETUDE_OPPORTUNITE: 'En étude', EN_ATTENTE_COMPLEMENT: 'Attente complément',
            EN_REVUE_CTADP: 'CTADP', RECEVABLE: 'Recevable', IRRECEVABLE: 'Irrecevable',
            TRANSFERE: 'Transféré', EN_INVESTIGATION: 'Investigation',
            RAPPORT_PRODUIT: 'Rapport', DECISION_RENDUE: 'Décision',
            CLOS: 'Clôturé', CLASSE: 'Classé'
        };
        return l[status] || status;
    }

    getStatusSeverity(status: string): TagSeverity {
        const m: Record<string, TagSeverity> = {
            SOUMIS: 'info', RECU: 'info',
            EN_ETUDE_OPPORTUNITE: 'warn', EN_ATTENTE_COMPLEMENT: 'warn',
            EN_REVUE_CTADP: 'warn', RECEVABLE: 'success',
            IRRECEVABLE: 'danger', TRANSFERE: 'secondary',
            EN_INVESTIGATION: 'warn', RAPPORT_PRODUIT: 'info',
            DECISION_RENDUE: 'success', CLOS: 'success', CLASSE: 'secondary'
        };
        return m[status] ?? 'info';
    }

    getTypeLabel(type: string): string {
        const l: Record<string, string> = {
            COMPLAINT: 'Plainte', DENUNCIATION: 'Dénonciation',
            AUTO_REFERRAL: 'Auto-saisine', ANONYMOUS: 'Anonyme'
        };
        return l[type] || type;
    }

    getModeLabel(mode: string): string {
        const l: Record<string, string> = {
            IN_PERSON: 'Guichet BRPD', WEB_FORM: 'Formulaire Web',
            EMAIL: 'Email', SMS: 'SMS', PHONE: 'Téléphone',
            GREEN_NUMBER: 'Numéro Vert', SOCIAL_MEDIA: 'Réseaux Sociaux',
            AUDIO_COUNTER: 'Comptoir Audio', PAPER_FORM: 'Formulaire Papier',
            POSTAL_MAIL: 'Courrier Postal', PRESS_MEDIA: 'Presse',
            AUDIT_REPORT: 'Rapport Audit'
        };
        return l[mode] || mode;
    }

    private emptyPartyForm(): TargetedPartyRequest {
        return {
            partyType: '', firstName: '', name: '', position: '',
            institution: '', organization: '', address: '',
            phoneNumber: '', email: '', relationWithDeclarant: '', allegedRole: ''
        };
    }

    private emptyWitnessForm(): WitnessRequest {
        return {
            firstName: '', lastName: '', profession: '', phoneNumber: '',
            email: '', address: '', testimonyNature: '',
            relationWithParties: '', anonymous: false, consentToContact: false
        };
    }
}