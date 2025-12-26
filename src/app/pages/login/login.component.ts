import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, NgOptimizedImage],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  
  error = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  login() {
    this.error.set(false);
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;

    // In a real app, this would be a service call.
    // For this applet, we use a simple hardcoded password.
    if (this.loginForm.get('password')?.value === '1234') {
      sessionStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/store']);
    } else {
      this.error.set(true);
    }
  }
}