import { Injectable, signal } from '@angular/core';
import { AppSettings, DeliveryCompany } from './types';

interface ToastState {
  message: string;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  toastState = signal<ToastState>({ message: '', visible: false });
  private timerId: any = null;

  showToast(message: string) {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.toastState.set({ message, visible: true });
    this.timerId = setTimeout(() => {
      this.toastState.update(state => ({ ...state, visible: false }));
      this.timerId = null;
    }, 4000);
  }

  settings = signal<AppSettings>({
    storeName: "المتجر البلاتيني",
    heroTitle: "جودة بلاتينية وأناقة عصرية",
    logo: "https://via.placeholder.com/150?text=Logo",
    heroColor: "#ffffff",
    heroFont: "'Tajawal', sans-serif",
    heroSize: "4rem",
    bgImage: "https://picsum.photos/1920/1080?grayscale&blur=3",
    bgColor: "#0f172a",
    heroAnimation: "slide",
    logoAnimation: "none",
    deliveryCompanies: [
      { id: 1, name: 'ياليدين إكسبريس', fee: 200 },
      { id: 2, name: 'أخرى', fee: 250 },
    ],
    notifications: {
      method: 'none',
      destination: ''
    },
    // New default values
    cardBgColor: '#ffffff',
    cardTextColor: '#1e293b',
    cardBorderRadius: '1.5rem',
    cardShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    bgOverlayColor: '#000000',
    bgOverlayOpacity: 0.3,
    cardAnimation: 'fade'
  });

  updateSettings(newSettings: Partial<AppSettings>) {
    this.settings.update(currentSettings => ({
      ...currentSettings,
      ...newSettings
    }));
  }

  addDeliveryCompany(company: Omit<DeliveryCompany, 'id'>) {
    this.settings.update(settings => ({
      ...settings,
      deliveryCompanies: [
        ...settings.deliveryCompanies,
        { ...company, id: Date.now() }
      ]
    }));
  }

  updateDeliveryCompany(updatedCompany: DeliveryCompany) {
    this.settings.update(settings => ({
      ...settings,
      deliveryCompanies: settings.deliveryCompanies.map(c => 
        c.id === updatedCompany.id ? updatedCompany : c
      )
    }));
  }

  deleteDeliveryCompany(companyId: number) {
    this.settings.update(settings => ({
      ...settings,
      deliveryCompanies: settings.deliveryCompanies.filter(c => c.id !== companyId)
    }));
  }
}