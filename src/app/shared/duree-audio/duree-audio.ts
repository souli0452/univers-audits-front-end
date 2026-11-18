import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Lecteur audio fiable pour un enregistrement fait dans le navigateur (MediaRecorder).
 *
 * Ces fichiers n'indiquent parfois pas leur durée : le navigateur la donne alors comme infinie, et le lecteur reste
 * à « 0:00 / 0:00 » (bouton grisé, barre inutilisable) tant qu'on ne l'a pas parcouru. La directive demande le
 * chargement complet du fichier et, si la durée est infinie, va une fois jusqu'à la fin (ce qui la fait calculer
 * par le navigateur) puis revient au début, sans aucune action de l'utilisateur.
 */
@Directive({
    selector: 'audio[appDureeAudio]',
    standalone: true,
    host: {
        preload: 'auto',
        '(loadedmetadata)': 'corriger()',
        '(durationchange)': 'corriger()'
    }
})
export class DureeAudio {

    private readonly audio = inject<ElementRef<HTMLAudioElement>>(ElementRef).nativeElement;
    private enCours = false;

    corriger(): void {
        if (this.enCours || this.audio.duration !== Infinity) {
            return;
        }
        this.enCours = true;
        const revenirAuDebut = () => {
            this.audio.removeEventListener('timeupdate', revenirAuDebut);
            this.audio.currentTime = 0;
            this.enCours = false;
        };
        this.audio.addEventListener('timeupdate', revenirAuDebut);
        this.audio.currentTime = 1e101;
    }
}
