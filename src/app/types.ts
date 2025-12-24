export interface ProductVariant {
  color: string;
  image: string;
  sizes: string[];
}

export interface Product {
  id: number;
  name:string;
  price: number;
  category: string;
  image: string;
  description: string;
  variants: ProductVariant[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface DeliveryCompany {
  id: number;
  name: string;
  fee: number;
}

export interface NotificationSettings {
  method: 'whatsapp' | 'email' | 'telegram' | 'messenger' | 'webhook' | 'none';
  destination: string;
}

export interface AppSettings {
  storeName: string;
  heroTitle: string;
  logo: string;
  heroColor: string;
  heroFont: string;
  heroSize: string;
  bgImage: string;
  bgColor: string;
  deliveryCompanies: DeliveryCompany[];
  heroAnimation: string;
  logoAnimation: string;
  notifications: NotificationSettings;
  // New card and background settings
  cardBgColor: string;
  cardTextColor: string;
  cardBorderRadius: string;
  cardShadow: string;
  bgOverlayColor: string;
  bgOverlayOpacity: number;
  cardAnimation: string;
}