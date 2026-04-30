import { HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

const SESSION_ID_KEY = 'lt_session_id';

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  sessionId: string;
  userId: number;
}

export interface OAuthStatus {
  google: boolean;
  github: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal<boolean>(false);
  private sessionId = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly authenticated = this.isAuthenticated.asReadonly();

  private api = inject(ApiService);
  private router = inject(Router);

  async initialize(): Promise<void> {
    const stored = localStorage.getItem(SESSION_ID_KEY) ?? sessionStorage.getItem(SESSION_ID_KEY);
    if (!stored) return;
    try {
      const user = await this.fetchCurrentUser(stored);
      if (user) {
        this.sessionId.set(stored);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } else {
        this.clearStoredSession();
      }
    } catch {
      this.clearStoredSession();
    }
  }

  async login(usernameOrEmail: string, password: string, rememberMe: boolean): Promise<void> {
    const res = await firstValueFrom(this.api.post<AuthResponse>('/auth/login', { usernameOrEmail, password }));
    await this.handleAuthResponse(res, rememberMe);
  }

  async register(username: string, password: string, email: string, rememberMe: boolean): Promise<void> {
    const res = await firstValueFrom(this.api.post<AuthResponse>('/auth/register', { username, password, email }));
    await this.handleAuthResponse(res, rememberMe);
  }

  async logout(): Promise<void> {
    const sid = this.sessionId();
    if (sid) {
      try { await firstValueFrom(this.api.post('/auth/logout', null, new HttpHeaders({ 'session-id': sid }))); } catch {}
    }
    this.clearAuthState();
    void this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null { return this.currentUser(); }
  isLoggedIn(): boolean { return this.isAuthenticated(); }

  private async fetchCurrentUser(sessionId: string): Promise<User | null> {
    return firstValueFrom(this.api.get<User | null>('/auth/me', new HttpHeaders({ 'session-id': sessionId })))
      .catch(err => (err instanceof Error && err.message.includes('401')) ? null : Promise.reject(err));
  }

  private async handleAuthResponse(response: AuthResponse, rememberMe: boolean): Promise<void> {
    this.sessionId.set(response.sessionId);
    this.isAuthenticated.set(true);
    this.storeSession(response.sessionId, rememberMe);
    const user = await this.fetchCurrentUser(response.sessionId);
    if (user) this.currentUser.set(user);
  }

  private storeSession(sessionId: string, rememberMe: boolean): void {
    if (rememberMe) localStorage.setItem(SESSION_ID_KEY, sessionId);
    else sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  private clearStoredSession(): void {
    localStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
  }

  private clearAuthState(): void {
    this.sessionId.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.clearStoredSession();
  }

  async handleOAuthCallback(sessionId: string, userId: number, rememberMe = false): Promise<void> {
    await this.handleAuthResponse({ sessionId, userId }, rememberMe);
  }

  async getOAuthStatus(): Promise<OAuthStatus> {
    return firstValueFrom(this.api.get<OAuthStatus>('/oauth/status'));
  }

  loginWithGoogle(): void { window.location.href = '/api/oauth/google'; }
  loginWithGitHub(): void { window.location.href = '/api/oauth/github'; }
}
