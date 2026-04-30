import { Component, signal, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, type User } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  user = signal<User | null>(null);
  greeting = signal('Welcome');

  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.user.set(this.authService.getCurrentUser());
    const hour = new Date().getHours();
    this.greeting.set(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
