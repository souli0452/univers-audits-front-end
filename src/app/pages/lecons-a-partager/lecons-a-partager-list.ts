import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LeconsAPartagerService, LeconAPartagerResponse } from '../../core/services/fiche-retex.service';

@Component({
    selector: 'app-lecons-a-partager-list',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, ProgressSpinnerModule, ToastModule],
    providers: [MessageService],
    template: `
<p-toast />

<div class="flex flex-col gap-6">

    <div>
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">Leçons à partager</h1>
        <p class="text-surface-400 text-sm mt-1">
            {{ totalElements }} leçon(s) tirée(s) des fiches de retour d'expérience (RETEX) des investigations closes
        </p>
    </div>

    <div *ngIf="loading" class="flex justify-center py-12">
        <p-progressSpinner strokeWidth="4" />
    </div>

    <div *ngIf="!loading && !lecons.length" class="flex flex-col items-center justify-center py-16
        bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700">
        <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <i class="pi pi-lightbulb text-2xl text-surface-300"></i>
        </div>
        <p class="font-medium text-surface-500">Aucune leçon publiée pour l'instant</p>
    </div>

    <div *ngIf="!loading && lecons.length" class="flex flex-col gap-4">
        <div *ngFor="let l of lecons"
            class="bg-white dark:bg-surface-800 rounded-2xl p-5 border border-surface-100 dark:border-surface-700">
            <div class="flex items-start justify-between gap-3 mb-2">
                <h3 class="font-bold text-surface-900 dark:text-surface-0">{{ l.titre }}</h3>
                <p-button icon="pi pi-external-link" label="Voir l'investigation" text size="small"
                    [routerLink]="['/app/investigations', l.investigationId]"/>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-line leading-relaxed">{{ l.resume }}</p>
            <div class="text-xs text-surface-400 mt-3">
                Publiée par {{ l.publieeParNom }} — {{ l.createdAt | date:'dd/MM/yyyy' }}
            </div>
        </div>
    </div>

    <div *ngIf="!loading && totalPages > 1" class="flex items-center justify-center gap-2">
        <p-button icon="pi pi-chevron-left" text size="small" [disabled]="page === 0" (onClick)="goToPage(page - 1)"/>
        <span class="text-sm text-surface-500">Page {{ page + 1 }} / {{ totalPages }}</span>
        <p-button icon="pi pi-chevron-right" text size="small" [disabled]="page >= totalPages - 1" (onClick)="goToPage(page + 1)"/>
    </div>

</div>
    `
})
export class LeconsAPartagerList implements OnInit {

    private leconsService = inject(LeconsAPartagerService);
    private messageService = inject(MessageService);

    lecons: LeconAPartagerResponse[] = [];
    loading = true;
    page = 0;
    totalPages = 0;
    totalElements = 0;

    ngOnInit(): void { this.load(); }

    private load(): void {
        this.loading = true;
        this.leconsService.lister(this.page, 20).subscribe({
            next: p => {
                this.lecons = p.content;
                this.totalPages = p.totalPages;
                this.totalElements = p.totalElements;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les leçons à partager'
                });
            }
        });
    }

    goToPage(p: number): void {
        this.page = p;
        this.load();
    }
}
