import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';

import { appRoutes } from './app.routes';
import { KeycloakService } from './app/core/auth/keycloak.service';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';

function initKeycloak(kc: KeycloakService) {
    return () => kc.init();
}

/**
 * Palette officielle ASCE-LC (vert #009640 / rouge #E30613) appliquée aux
 * tokens "primary", "green" et "red" de PrimeNG, pour que les composants
 * (boutons, tags, etc.) restent dans la charte plutôt que le vert émeraude
 * / rouge par défaut du thème Aura.
 */
const AsceLcPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50:  '#E6F5EC', 100: '#C2E8D1', 200: '#99D9B3', 300: '#66C78E',
            400: '#33B56A', 500: '#009640', 600: '#007A34', 700: '#006029',
            800: '#004A20', 900: '#003617', 950: '#001F0D'
        }
    },
    primitive: {
        green: {
            50:  '#E6F5EC', 100: '#C2E8D1', 200: '#99D9B3', 300: '#66C78E',
            400: '#33B56A', 500: '#009640', 600: '#007A34', 700: '#006029',
            800: '#004A20', 900: '#003617', 950: '#001F0D'
        },
        red: {
            50:  '#FDEBEC', 100: '#FBD1D4', 200: '#F5A3A9', 300: '#EF757E',
            400: '#E93A47', 500: '#E30613', 600: '#C00511', 700: '#9C040E',
            800: '#78030A', 900: '#540207', 950: '#300103'
        }
    }
});

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
            withInterceptors([authInterceptor, errorInterceptor])
        ),

        provideAnimationsAsync(),

        providePrimeNG({
            theme: {
                preset: AsceLcPreset,
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