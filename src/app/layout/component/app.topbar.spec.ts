import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { NotificationService } from '../../core/services/notification.service';

describe('AppTopbar', () => {
    let fixture: ComponentFixture<AppTopbar>;
    let el: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppTopbar],
            providers: [
                provideRouter([]),
                provideNoopAnimations(),
                {
                    provide: NotificationService,
                    useValue: {
                        unreadCount: () => 0,
                        loadUnread: () => {},
                        getMyNotifications: () => of({ content: [] }),
                        markAsRead: () => of(void 0)
                    }
                }
            ]
        });
        fixture = TestBed.createComponent(AppTopbar);
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    });

    it('affiche le logo ASCE-LC dans la barre du haut', () => {
        const logo = el.querySelector('.layout-topbar-logo img') as HTMLImageElement;

        expect(logo.getAttribute('src')).toBe('assets/logo-asce.png');
        expect(logo.getAttribute('alt')).toBe('ASCE-LC');
    });

    it('n’utilise plus le logo « Intégrité+ »', () => {
        const images = Array.from(el.querySelectorAll('img')).map(i => i.getAttribute('src') ?? '');

        expect(images.some(src => src.includes('logo-integrite'))).toBeFalse();
    });

    it('garde le texte « INTÉGRITÉ+ » à côté du logo', () => {
        expect((el.querySelector('.layout-topbar-logo span')?.textContent ?? '').trim()).toBe('INTÉGRITÉ+');
    });
});
