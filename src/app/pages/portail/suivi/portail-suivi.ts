import { Component } from '@angular/core';
import { SuiviCitoyen } from '../../public/suivi-citoyen/suivi-citoyen';

@Component({
    selector: 'app-portail-suivi',
    standalone: true,
    imports: [SuiviCitoyen],
    template: `<app-suivi-citoyen />`
})
export class PortailSuivi {}