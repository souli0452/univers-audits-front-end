import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [RouterLink],
    template: `<div class="layout-footer">
        <a routerLink="/app">ASCE-LC</a>
    </div>`
})
export class AppFooter {}
