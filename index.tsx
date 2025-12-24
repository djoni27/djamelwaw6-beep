import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';

import { AppComponent } from './src/app/app.component';
import { APP_ROUTES } from './src/app/app.routes';
import { LanguageService } from './src/app/language.service';

export function initializeAppFactory(languageService: LanguageService): () => Promise<any> {
  return () => languageService.initialize();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [LanguageService],
      multi: true
    }
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.