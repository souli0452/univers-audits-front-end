import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-portail-accueil',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, CardModule],
    template: `
<div class="min-h-screen bg-white">

    <!-- Barre de navigation portail -->
    <nav class="bg-green-700 text-white px-6 py-4 shadow-lg">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <i class="pi pi-shield text-green-700 text-lg"></i>
                </div>
                <div>
                    <div class="font-bold text-lg leading-tight">ASCE-LC</div>
                    <div class="text-green-200 text-xs">
                        Autorité Supérieure de Contrôle d'État
                    </div>
                </div>
            </div>
            <div class="flex gap-3">
                <p-button
                    label="Suivre mon dossier"
                    icon="pi pi-search"
                    severity="contrast"
                    outlined
                    size="small"
                    routerLink="/portail/suivi" />
                <p-button
                    label="Déposer une plainte"
                    icon="pi pi-plus"
                    size="small"
                    styleClass="bg-white text-green-700 border-white"
                    routerLink="/portail/deposer" />
            </div>
        </div>
    </nav>

    <!-- Hero section -->
    <div class="bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white py-20 px-6">
        <div class="max-w-4xl mx-auto text-center">
            <div class="inline-flex items-center gap-2 bg-green-600 bg-opacity-50 rounded-full px-4 py-2 mb-6 text-sm">
                <i class="pi pi-verified"></i>
                <span>Service officiel du gouvernement du Burkina Faso</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Signalez la corruption,
                <br>
                <span class="text-yellow-300">protégez votre pays</span>
            </h1>
            <p class="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                Déposez votre plainte ou dénonciation en ligne de manière
                sécurisée et confidentielle. Votre identité est protégée
                par la loi.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <p-button
                    label="Déposer une plainte"
                    icon="pi pi-file-plus"
                    size="large"
                    styleClass="bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-300 font-bold px-8"
                    routerLink="/portail/deposer" />
                <p-button
                    label="Suivre mon dossier"
                    icon="pi pi-search"
                    size="large"
                    severity="contrast"
                    outlined
                    routerLink="/portail/suivi" />
            </div>
        </div>
    </div>

    <!-- Statistiques -->
    <div class="bg-gray-900 text-white py-10 px-6">
        <div class="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
                <div class="text-3xl font-bold text-yellow-400">100%</div>
                <div class="text-gray-400 text-sm mt-1">Confidentiel</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-yellow-400">7j</div>
                <div class="text-gray-400 text-sm mt-1">Délai de traitement</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-yellow-400">24/7</div>
                <div class="text-gray-400 text-sm mt-1">Disponible en ligne</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-yellow-400">Loi</div>
                <div class="text-gray-400 text-sm mt-1">Protection garantie</div>
            </div>
        </div>
    </div>

    <!-- Comment ça marche -->
    <div class="py-16 px-6 bg-gray-50">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-gray-900 mb-3">
                Comment ça marche ?
            </h2>
            <p class="text-center text-gray-500 mb-12">
                4 étapes simples pour déposer votre plainte
            </p>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div *ngFor="let step of howItWorks; let i = index"
                     class="text-center">
                    <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md"
                         [class]="step.bgClass">
                        <i [class]="step.icon + ' text-2xl ' + step.iconClass"></i>
                    </div>
                    <div class="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
                        {{ i + 1 }}
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">{{ step.title }}</h3>
                    <p class="text-gray-500 text-sm">{{ step.description }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Types de signalement -->
    <div class="py-16 px-6">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-gray-900 mb-3">
                Que pouvez-vous signaler ?
            </h2>
            <p class="text-center text-gray-500 mb-12">
                L'ASCE-LC traite tous les cas de corruption et de mauvaise gouvernance
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div *ngFor="let type of reportTypes"
                     class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                         [class]="type.bgClass">
                        <i [class]="type.icon + ' text-xl ' + type.iconClass"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">{{ type.title }}</h3>
                    <p class="text-gray-500 text-sm">{{ type.description }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Vos droits -->
    <div class="py-16 px-6 bg-green-50">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Vos droits sont protégés
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl p-6 shadow-sm text-center">
                    <i class="pi pi-eye-slash text-4xl text-green-600 mb-4 block"></i>
                    <h3 class="font-semibold mb-2">Anonymat garanti</h3>
                    <p class="text-gray-500 text-sm">
                        Vous pouvez déposer votre dossier
                        de façon totalement anonyme.
                    </p>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-sm text-center">
                    <i class="pi pi-shield text-4xl text-green-600 mb-4 block"></i>
                    <h3 class="font-semibold mb-2">Protection légale</h3>
                    <p class="text-gray-500 text-sm">
                        Loi N°010-2004/AN protège les
                        lanceurs d'alerte au Burkina Faso.
                    </p>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-sm text-center">
                    <i class="pi pi-lock text-4xl text-green-600 mb-4 block"></i>
                    <h3 class="font-semibold mb-2">Confidentialité totale</h3>
                    <p class="text-gray-500 text-sm">
                        Vos données sont cryptées et
                        accessibles uniquement aux agents autorisés.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- CTA final -->
    <div class="bg-green-700 text-white py-16 px-6 text-center">
        <h2 class="text-3xl font-bold mb-4">
            Prêt à signaler ?
        </h2>
        <p class="text-green-100 mb-8 max-w-xl mx-auto">
            Votre signalement contribue à construire
            un Burkina Faso plus juste et plus transparent.
        </p>
        <p-button
            label="Déposer ma plainte maintenant"
            icon="pi pi-file-plus"
            size="large"
            styleClass="bg-yellow-400 text-gray-900 border-yellow-400 font-bold px-10"
            routerLink="/portail/deposer" />
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-10 px-6">
        <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
                <div class="text-white font-bold mb-3">ASCE-LC</div>
                <p class="text-sm">
                    Autorité Supérieure de Contrôle d'État
                    et de Lutte contre la Corruption
                </p>
                <p class="text-sm mt-2">Burkina Faso</p>
            </div>
            <div>
                <div class="text-white font-bold mb-3">Contact</div>
                <p class="text-sm">03 BP 7204 Ouagadougou 03</p>
                <p class="text-sm mt-1">Numéro vert : 80 00 11 57</p>
                <p class="text-sm mt-1">contact&#64;asce-lc.bf</p>
            </div>
            <div>
                <div class="text-white font-bold mb-3">Liens utiles</div>
                <div class="flex flex-col gap-1 text-sm">
                    <a routerLink="/portail/deposer"
                       class="hover:text-white cursor-pointer">
                        Déposer une plainte
                    </a>
                    <a routerLink="/portail/suivi"
                       class="hover:text-white cursor-pointer">
                        Suivre mon dossier
                    </a>
                </div>
            </div>
        </div>
        <div class="max-w-4xl mx-auto border-t border-gray-800 mt-8 pt-6 text-center text-sm">
            © 2026 ASCE-LC — Tous droits réservés
        </div>
    </footer>

</div>
    `
})
export class PortailAccueil {

    howItWorks = [
        {
            title: 'Remplissez le formulaire',
            description: 'Décrivez les faits en détail avec les preuves disponibles.',
            icon: 'pi pi-file-edit',
            bgClass: 'bg-blue-100',
            iconClass: 'text-blue-600'
        },
        {
            title: 'Soumettez en ligne',
            description: 'Envoyez votre dossier de façon sécurisée depuis chez vous.',
            icon: 'pi pi-send',
            bgClass: 'bg-green-100',
            iconClass: 'text-green-600'
        },
        {
            title: 'Recevez votre code',
            description: 'Un code unique vous permet de suivre l\'avancement de votre dossier.',
            icon: 'pi pi-key',
            bgClass: 'bg-yellow-100',
            iconClass: 'text-yellow-600'
        },
        {
            title: 'Suivez votre dossier',
            description: 'Consultez le statut de votre dossier à tout moment.',
            icon: 'pi pi-chart-line',
            bgClass: 'bg-purple-100',
            iconClass: 'text-purple-600'
        }
    ];

    reportTypes = [
        {
            title: 'Corruption et détournement',
            description: 'Détournement de fonds publics, pots-de-vin, concussion, malversations dans les marchés publics.',
            icon: 'pi pi-dollar',
            bgClass: 'bg-red-100',
            iconClass: 'text-red-600'
        },
        {
            title: 'Fraude et faux',
            description: 'Faux et usage de faux, fraude documentaire, usurpation de fonctions, escroquerie.',
            icon: 'pi pi-ban',
            bgClass: 'bg-orange-100',
            iconClass: 'text-orange-600'
        },
        {
            title: 'Mauvaise gouvernance',
            description: 'Abus de pouvoir, favoritisme, népotisme, gaspillage des ressources publiques.',
            icon: 'pi pi-exclamation-triangle',
            bgClass: 'bg-yellow-100',
            iconClass: 'text-yellow-600'
        },
        {
            title: 'Conflit d\'intérêts',
            description: 'Situations où l\'intérêt personnel influence les décisions d\'un agent public.',
            icon: 'pi pi-users',
            bgClass: 'bg-blue-100',
            iconClass: 'text-blue-600'
        },
        {
            title: 'Enrichissement illicite',
            description: 'Accroissement injustifié du patrimoine d\'un agent public sans source légitime.',
            icon: 'pi pi-chart-bar',
            bgClass: 'bg-purple-100',
            iconClass: 'text-purple-600'
        },
        {
            title: 'Autres infractions',
            description: 'Tout autre fait contraire à la probité, à l\'intégrité et à la bonne gouvernance.',
            icon: 'pi pi-folder',
            bgClass: 'bg-green-100',
            iconClass: 'text-green-600'
        }
    ];
}