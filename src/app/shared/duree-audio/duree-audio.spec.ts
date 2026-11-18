import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DureeAudio } from './duree-audio';

/**
 * Enregistre de vraies secondes de son exactement comme le formulaire de dépôt : getUserMedia, MediaRecorder par
 * défaut, start() sans découpage, blob audio/webm. Chrome fournit un faux micro quand on le lance avec
 * --use-fake-device-for-media-stream (lanceur ChromeHeadlessMedia) ; sans lui, ce test est ignoré.
 */
async function enregistrer(secondes: number): Promise<Blob | null> {
    let flux: MediaStream;
    try {
        flux = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
        return null;
    }
    const enregistreur = new MediaRecorder(flux);
    const morceaux: BlobPart[] = [];
    enregistreur.ondataavailable = e => { if (e.data.size > 0) { morceaux.push(e.data); } };
    const fini = new Promise<void>(ok => enregistreur.onstop = () => ok());
    enregistreur.start();
    await new Promise(r => setTimeout(r, secondes * 1000));
    enregistreur.stop();
    await fini;
    flux.getTracks().forEach(t => t.stop());
    return new Blob(morceaux, { type: 'audio/webm' });
}

async function attendre(condition: () => boolean, ms: number): Promise<boolean> {
    const debut = Date.now();
    while (Date.now() - debut < ms) {
        if (condition()) { return true; }
        await new Promise(r => setTimeout(r, 50));
    }
    return condition();
}

@Component({ standalone: true, imports: [DureeAudio], template: `<audio appDureeAudio [src]="url" controls></audio>` })
class Hote { url = ''; }

describe('DureeAudio', () => {
    let fixture: ComponentFixture<Hote>;
    let audio: HTMLAudioElement;

    function creer(url = ''): void {
        TestBed.configureTestingModule({ imports: [Hote] });
        fixture = TestBed.createComponent(Hote);
        fixture.componentInstance.url = url;
        fixture.detectChanges();
        audio = fixture.nativeElement.querySelector('audio');
    }

    it('demande le chargement complet du fichier dès l\'affichage du lecteur', () => {
        creer();

        expect(audio.getAttribute('preload')).toBe('auto');
    });

    describe('enregistrement dont la durée est inconnue (le navigateur la donne comme infinie)', () => {
        let positions: number[];

        beforeEach(() => {
            creer();
            positions = [];
            // Un enregistrement du micro peut annoncer une durée infinie tant qu'on ne l'a pas parcouru jusqu'au bout.
            let duree = Infinity;
            Object.defineProperty(audio, 'duration', { get: () => duree, configurable: true });
            Object.defineProperty(audio, 'currentTime', {
                get: () => positions.length ? positions[positions.length - 1] : 0,
                set: (v: number) => { positions.push(v); if (v > 1e6) { duree = 12.4; } },
                configurable: true
            });
        });

        it('va jusqu\'à la fin pour que le navigateur calcule la durée, sans clic de l\'utilisateur', () => {
            audio.dispatchEvent(new Event('loadedmetadata'));

            expect(positions.length).toBe(1);
            expect(positions[0]).toBeGreaterThan(1e6);
        });

        it('revient au début dès que la durée est connue, et ne le fait qu\'une fois', () => {
            audio.dispatchEvent(new Event('loadedmetadata'));
            audio.dispatchEvent(new Event('timeupdate'));
            audio.dispatchEvent(new Event('timeupdate'));

            expect(positions).toEqual([positions[0], 0]);
            expect(audio.duration).toBe(12.4);
        });

        it('ne recommence pas à chaque événement de durée une fois la bonne durée trouvée', () => {
            audio.dispatchEvent(new Event('loadedmetadata'));
            audio.dispatchEvent(new Event('timeupdate'));
            audio.dispatchEvent(new Event('durationchange'));
            audio.dispatchEvent(new Event('loadedmetadata'));

            expect(positions.length).toBe(2);       // un aller, un retour : rien de plus
        });
    });

    it('ne touche pas à un enregistrement dont la durée est déjà connue', () => {
        creer();
        const positions: number[] = [];
        Object.defineProperty(audio, 'duration', { get: () => 8, configurable: true });
        Object.defineProperty(audio, 'currentTime', { get: () => 0, set: (v: number) => positions.push(v), configurable: true });

        audio.dispatchEvent(new Event('loadedmetadata'));

        expect(positions).toEqual([]);
    });

    describe('avec un vrai enregistrement du navigateur', () => {
        const DELAI = 20000;     // un vrai enregistrement dure quelques secondes

        it('affiche la durée réelle tout seul et revient au début', async () => {
            const enregistrement = await enregistrer(1.5);
            if (!enregistrement) {
                pending('pas de micro de test : lancer avec --browsers=ChromeHeadlessMedia (npm run test:ci)');
                return;
            }
            creer(URL.createObjectURL(enregistrement));

            const ok = await attendre(() => Number.isFinite(audio.duration) && audio.duration > 0.5, 8000);
            await new Promise(r => setTimeout(r, 300));

            expect(ok).withContext(`durée lue : ${audio.duration}`).toBeTrue();
            expect(audio.duration).toBeLessThan(5);
            expect(audio.currentTime).toBe(0);
        }, DELAI);
    });
});
