import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../translate.pipe';
import { Language, LanguageService } from '../../language.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  languageService = inject(LanguageService);
  
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

  changeLanguage(event: Event) {
    const selectedLang = (event.target as HTMLSelectElement).value as Language;
    this.languageService.setLanguage(selectedLang);
  }
}