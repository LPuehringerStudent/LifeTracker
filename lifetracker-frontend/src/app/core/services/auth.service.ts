import { HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

const SESSION_ID_KEY = 'lt_session_id';
const REMEMBER_ME_KEY = 'lt_remember_me';

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  sessionId: string;
  userId: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal<boolean>(false);
  private sessionId = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly authenticated = this.isAuthenticated.asReadonly();
  readonly currentSessionId = this.sessionId.asReadonly();

  private api = inject(ApiService);
  private router = inject(Router);

  async initialize(): Promise<void> {
    const storedSessionId = this.getStoredSessionId();
    if (!storedSessionId) {
      return;
    }

    try {
      const user = await this.fetchCurrentUser(storedSessionId);
      if (user) {
        this.sessionId.set(storedSessionId);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } else {
        this.clearStoredSession();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.clearStoredSession();
    }
  }

  async login(usernameOrEmail: string, password: string, rememberMe: boolean): Promise<void> {
    const credentials: LoginRequest = {
      usernameOrEmail: usernameOrEmail.trim(),
      password
    };

    const response = await firstValueFrom(this.api.post<AuthResponse>('/auth/login', credentials));
    await this.handleAuthResponse(response, rememberMe);
  }

  async register(username: string, password: string, email: string, rememberMe: boolean): Promise<void> {
    const data: RegisterRequest = {
      username: username.trim(),
      password,
      email: email.trim()
    };

    const response = await firstValueFrom(this.api.post<AuthResponse>('/auth/register', data));
    await this.handleAuthResponse(response, rememberMe);
  }

  async logout(): Promise<void> {
    const currentSessionId = this.sessionId();
    if (currentSessionId) {
      try {
        await firstValueFrom(this.api.post<void>('/auth/logout', null, new HttpHeaders({ 'session-id': currentSessionId })));
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }

    this.clearAuthState();
    void this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getSessionId(): string | null {
    return this.sessionId();
  }

  private async fetchCurrentUser(sessionId: string): Promise<User | null> {
    return firstValueFrom(
      this.api.get<User | null>('/auth/me', new HttpHeaders({ 'session-id': sessionId }))
    ).catch(err => {
      if (err instanceof Error && err.message.includes('401')) {
        return null;
      }
      throw err;
    });
  }

  private async handleAuthResponse(response: AuthResponse, rememberMe: boolean): Promise<void> {
    this.sessionId.set(response.sessionId);
    this.isAuthenticated.set(true);
    this.storeSession(response.sessionId, rememberMe);

    const user = await this.fetchCurrentUser(response.sessionId);
    if (user) {
      this.currentUser.set(user);
    }
  }

  private storeSession(sessionId: string, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  }

  private getStoredSessionId(): string | null {
    return localStorage.getItem(SESSION_ID_KEY) ?? sessionStorage.getItem(SESSION_ID_KEY);
  }

  private clearStoredSession(): void {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
  }

  private clearAuthState(): void {
    this.sessionId.set(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.clearStoredSession();
  }
}
