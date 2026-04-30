import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { reverseAuthGuard } from '@core/guards/reverse-auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [reverseAuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent),
    canActivate: [reverseAuthGuard]
  },
  {
    path: 'oauth/callback',
    loadComponent: () => import('./features/auth/pages/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];
