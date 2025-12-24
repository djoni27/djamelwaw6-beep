import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

@Pipe({
  name: 'translate',
  pure: false // Impure pipe to re-evaluate when language changes
})
export class TranslatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(key: string, params: Record<string, string> = {}): string {
    return this.languageService.translate(key, params);
  }
}