import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  template: `
    <div class="oauth-callback-container">
      <div class="loading-card">
        <div class="spinner"></div>
        <h2>Completing Login...</h2>
        <p>{{ statusMessage() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .oauth-callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }
    .loading-card {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 1.5rem;
      padding: 3rem;
      text-align: center;
      color: #f8fafc;
      animation: slideUp 0.4s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(148, 163, 184, 0.2);
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 0.5rem; font-size: 1.5rem; font-weight: 600; }
    p { margin: 0; color: #94a3b8; font-size: 0.9rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OAuthCallbackComponent implements OnInit {
  statusMessage = signal('Processing authentication...');

  private router = inject(Router);
  private authService = inject(AuthService);

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    const userId = params.get('userId');
    const error = params.get('error');

    if (error) {
      this.statusMessage.set('Authentication failed. Redirecting...');
      setTimeout(() => this.router.navigate(['/login'], { queryParams: { error } }), 1500);
      return;
    }

    if (!sessionId || !userId) {
      this.statusMessage.set('Invalid callback. Redirecting...');
      setTimeout(() => this.router.navigate(['/login'], { queryParams: { error: 'Invalid OAuth callback' } }), 1500);
      return;
    }

    try {
      await this.authService.handleOAuthCallback(sessionId, parseInt(userId, 10));
      this.statusMessage.set('Login successful! Redirecting...');
      setTimeout(() => this.router.navigate(['/dashboard']), 500);
    } catch {
      this.statusMessage.set('Login failed. Redirecting...');
      setTimeout(() => this.router.navigate(['/login'], { queryParams: { error: 'Failed to complete login' } }), 1500);
    }
  }
}
