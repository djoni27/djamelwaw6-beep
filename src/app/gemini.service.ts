import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  public isConfigured = signal(false);
  public configurationError = signal<string | null>(null);

  constructor() {
    try {
      // This approach safely checks for the API key without crashing in a browser.
      const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

      if (!apiKey) {
        const errorMessage = 'Gemini API key is not configured. Image generation will be disabled.';
        this.configurationError.set(errorMessage);
        console.warn(errorMessage);
        return;
      }

      this.ai = new GoogleGenAI({ apiKey });
      this.isConfigured.set(true);

    } catch (error) {
      const errorMessage = 'Failed to initialize Gemini Service.';
      this.configurationError.set(errorMessage);
      console.error(errorMessage, error);
    }
  }

  /**
   * Generates an image based on a text prompt.
   * @param prompt The text prompt for image generation.
   * @returns A Promise that resolves to a base64 encoded image string.
   */
  async generateImage(prompt: string): Promise<string> {
    if (!this.isConfigured() || !this.ai) {
      throw new Error(this.configurationError() || 'Gemini service is not configured.');
    }

    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
      } else {
        throw new Error('Image generation failed, no images returned.');
      }
    } catch (error) {
      console.error('Error generating image with Gemini API:', error);
      // Normalize the error to ensure a clean, user-friendly message is propagated.
      let message = 'An unknown error occurred during image generation.';

      if (error instanceof Error) {
        message = error.message;
      } else if (error && typeof error === 'object') {
        // Use a type guard for safety
        if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
          message = (error as { message: string }).message;
        } else {
          // If no clear message, stringify the error for more context
          try {
            const errorBody = JSON.stringify(error);
            if (errorBody !== '{}') { // Avoid showing empty object
              message = errorBody;
            }
          } catch (e) {
            // Fallback if stringify fails
            message = 'An unexpected error occurred. Check the console for details.';
          }
        }
      } else if (typeof error === 'string' && error.trim().length > 0) {
        message = error;
      }
      
      throw new Error(message);
    }
  }
}