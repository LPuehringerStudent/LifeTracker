import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  private router = inject(Router);
  private authService = inject(AuthService);

  registerForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false)
  });

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    if (this.registerForm.invalid) {
      this.errorMessage.set('Please fill in all fields correctly');
      return;
    }
    const { username, email, password, confirmPassword, rememberMe } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }
    this.isLoading.set(true);
    try {
      await this.authService.register(username!, password!, email!, rememberMe ?? false);
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePassword(): void { this.showPassword.update(v => !v); }
}
