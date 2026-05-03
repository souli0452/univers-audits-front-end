import { Routes } from '@angular/router';

export default [
    {
        path: '',
        redirectTo: 'agents',
        pathMatch: 'full'
    },
    {
        path: 'agents',
        loadComponent: () =>
            import('./agents/agents-list')
            .then(m => m.AgentsList)
    },
    {
        path: 'agents/nouveau',
        loadComponent: () =>
            import('./agent-form/agent-form')
            .then(m => m.AgentForm)
    },
    {
        path: 'agents/:id',
        loadComponent: () =>
            import('./agent-form/agent-form')
            .then(m => m.AgentForm)
    }
] as Routes;