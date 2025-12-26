import { ChangeDetectionStrategy, Component, effect, inject, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DOCUMENT, CommonModule } from '@angular/common';
import { SettingsService } from './settings.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="absolute inset-0 z-0 transition-opacity duration-500" 
         [style.background-color]="settings().bgOverlayColor"
         [style.opacity]="settings().bgOverlayOpacity"></div>
    <div class="relative z-10">
      <router-outlet></router-outlet>
    </div>

    <!-- Toast Notification -->
    @if (toastState().visible) {
      <div 
        class="fixed top-5 left-5 z-[200] flex items-center gap-4 bg-white rounded-2xl shadow-2xl p-4 border border-slate-200 animate-slide-in-down">
        <img [src]="settings().logo" class="h-12 w-12 object-contain bg-slate-100 rounded-lg p-1 animate-pulse-once">
        <div>
            <p class="font-bold text-slate-800">{{ toastState().message }}</p>
            <p class="text-sm text-slate-500">تم تحديث بيانات متجرك بنجاح.</p>
        </div>
      </div>
    }
  `,
  imports: [RouterOutlet, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private settingsService = inject(SettingsService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  settings = this.settingsService.settings;
  toastState = this.settingsService.toastState;

  constructor() {
    effect(() => {
      // This effect handles visual updates from settings.
      const settings = this.settingsService.settings();
      this.renderer.setStyle(this.document.body, 'background-image', settings.bgImage ? `url(${settings.bgImage})` : 'none');
      this.renderer.setStyle(this.document.body, 'background-color', settings.bgImage ? 'transparent' : settings.bgColor);
      this.renderer.setStyle(this.document.body, 'background-size', 'cover');
      this.renderer.setStyle(this.document.body, 'background-attachment', 'fixed');
      this.renderer.setStyle(this.document.body, 'background-position', 'center');
    });
  }
}