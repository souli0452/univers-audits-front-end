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
            import('./agents/agents-list').then(m => m.AgentsList)
    },
    {
        path: 'agents/nouveau',
        loadComponent: () =>
            import('./agent-form/agent-form').then(m => m.AgentForm)
    },
    {
        path: 'agents/:id',
        loadComponent: () =>
            import('./agent-form/agent-form').then(m => m.AgentForm)
    },
    
    {
        path: 'roles',
        loadComponent: () =>
            import('./roles/roles-management').then(m => m.RolesManagement)
    },
    {
     path: 'audit',
     loadComponent: () =>
       import('./audit/audit-dashboard').then(m => m.AuditDashboard)
   },
   {
      path: 'parametres-portail',
      loadComponent: () =>
       import('./portal-settings/portal-settings')
         .then(m => m.PortalSettings)
    }
    
] as Routes;