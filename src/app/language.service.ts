import { Injectable, signal } from '@angular/core';

export type Language = 'ar' | 'en' | 'fr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  // Supported languages
  supportedLanguages: Language[] = ['ar', 'en', 'fr'];
  
  // Default language is Arabic
  language = signal<Language>('ar');
  translations = signal<Record<string, any>>({});

  constructor() {
    // Attempt to load saved language from localStorage
    if (typeof localStorage !== 'undefined') {
        const savedLang = localStorage.getItem('platinumStoreLang');
        if (savedLang && this.supportedLanguages.includes(savedLang as Language)) {
          this.language.set(savedLang as Language);
        }
    }
  }

  /**
   * Initializes the service by loading the current language file.
   * This is called once at application startup.
   */
  initialize(): Promise<void> {
    return this.loadLanguage(this.language());
  }

  /**
   * Sets the application language and loads the corresponding translation file.
   * @param lang The language to set.
   */
  setLanguage(lang: Language): Promise<void> {
    this.language.set(lang);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('platinumStoreLang', lang);
    }
    return this.loadLanguage(lang);
  }

  /**
   * Dynamically loads a translation file using the Fetch API.
   * @param lang The language file to load.
   */
  private async loadLanguage(lang: Language): Promise<void> {
    try {
      // Use fetch to load the JSON file. This is more reliable than dynamic
      // import for data assets, as it avoids module resolution and MIME type issues.
      // The path is relative to the index.html file.
      const response = await fetch(`src/assets/i18n/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch translation file: ${response.status} ${response.statusText}`);
      }
      const translations = await response.json();
      this.translations.set(translations);
    } catch (error) {
      console.error(`CRITICAL: Failed to load language JSON for "${lang}". Translations will not work.`, error);
      // Fallback to an empty object if loading fails
      this.translations.set({});
    }
  }

  /**
   * Translates a key into the corresponding string.
   * Supports nested keys using dot notation (e.g., "login.storeName").
   * @param key The translation key.
   * @param params Optional parameters for placeholder replacement.
   * @returns The translated string or the key itself if not found.
   */
  translate(key: string, params: Record<string, string> = {}): string {
    const keys = key.split('.');
    let result: any = this.translations();
    
    // Traverse the nested object to find the translation string.
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        result = undefined; // Key path not found
        break;
      }
    }

    // Use the found string or fall back to the original key.
    let translation = (typeof result === 'string') ? result : key;

    // Replace any placeholders (e.g., {{name}}) with provided params.
    for (const paramKey in params) {
        translation = translation.replace(`{{${paramKey}}}`, params[paramKey]);
    }
    return translation;
  }
}