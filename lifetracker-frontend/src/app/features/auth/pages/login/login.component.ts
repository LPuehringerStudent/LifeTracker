import { Component, signal, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm = new FormGroup({
    usernameOrEmail: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false)
  });

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      this.errorMessage.set(decodeURIComponent(error));
    }
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);

    const { usernameOrEmail, password, rememberMe } = this.loginForm.value;

    try {
      await this.authService.login(usernameOrEmail!, password!, rememberMe ?? false);
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }
}
