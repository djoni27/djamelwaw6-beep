import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';

import { AppComponent } from './src/app/app.component';
import { APP_ROUTES } from './src/app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient()
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.