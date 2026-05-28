import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

import { appRoutes } from './app.routes';
import { KeycloakService } from './app/core/auth/keycloak.service';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

function initKeycloak(kc: KeycloakService) {
    return () => kc.init();
}

export const appConfig: ApplicationConfig = {
    providers: [
        MessageService,
        ConfirmationService,

        provideRouter(
            appRoutes,
            withHashLocation(),
            withInMemoryScrolling({
                anchorScrolling: 'enabled',
                scrollPositionRestoration: 'enabled'
            })
        ),

        provideHttpClient(
            withFetch(),
            withInterceptors([authInterceptor])
        ),

        provideAnimationsAsync(),

        providePrimeNG({
            theme: {
                preset: Aura,
                options: { darkModeSelector: '.app-dark' }
            }
        }),

        {
            provide: APP_INITIALIZER,
            useFactory: initKeycloak,
            deps: [KeycloakService],
            multi: true
        }
    ]
};