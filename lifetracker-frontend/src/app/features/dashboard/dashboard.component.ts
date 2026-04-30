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
    const currentUser = this.authService.getCurrentUser();
    this.user.set(currentUser);
    this.setGreeting();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting.set('Good morning');
    } else if (hour < 18) {
      this.greeting.set('Good afternoon');
    } else {
      this.greeting.set('Good evening');
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
