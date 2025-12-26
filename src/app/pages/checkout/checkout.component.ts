import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../cart.service';
import { SettingsService } from '../../settings.service';
import { DeliveryCompany } from '../../types';

interface Wilaya {
  name: string;
  cost: number;
}

interface ConfirmedOrder {
  customer: any;
  items: any[];
  subtotal: number;
  shipping: number;
  deliveryFee: number;
  total: number;
  deliveryCompany: string;
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private settingsService = inject(SettingsService);

  cart = this.cartService.cart;
  settings = this.settingsService.settings;
  deliveryCompanies = this.settings().deliveryCompanies;
  
  wilayas: Wilaya[] = [
    { name: 'أدرار', cost: 600 }, { name: 'الشلف', cost: 400 }, { name: 'الأغواط', cost: 500 },
    { name: 'أم البواقي', cost: 450 }, { name: 'باتنة', cost: 450 }, { name: 'بجاية', cost: 350 },
    { name: 'بسكرة', cost: 550 }, { name: 'بشار', cost: 700 }, { name: 'البليدة', cost: 300 },
    { name: 'البويرة', cost: 350 }, { name: 'تمنراست', cost: 800 }, { name: 'تبسة', cost: 500 },
    { name: 'تلمسان', cost: 500 }, { name: 'تيارت', cost: 450 }, { name: 'تيزي وزو', cost: 350 },
    { name: 'الجزائر', cost: 250 }, { name: 'الجلفة', cost: 450 }, { name: 'جيجل', cost: 400 },
    { name: 'سطيف', cost: 400 }, { name: 'سعيدة', cost: 500 }, { name: 'سكيكدة', cost: 450 },
    { name: 'سيدي بلعباس', cost: 500 }, { name: 'عنابة', cost: 450 }, { name: 'قالمة', cost: 450 },
    { name: 'قسنطينة', cost: 400 }, { name: 'المدية', cost: 350 }, { name: 'مستغانم', cost: 450 },
    { name: 'المسيلة', cost: 400 }, { name: 'معسكر', cost: 450 }, { name: 'ورقلة', cost: 600 },
    { name: 'وهران', cost: 400 }, { name: 'البيض', cost: 550 }, { name: 'إليزي', cost: 850 },
    { name: 'برج بوعريريج', cost: 400 }, { name: 'بومرداس', cost: 300 }, { name: 'الطارف', cost: 500 },
    { name: 'تندوف', cost: 850 }, { name: 'تيسمسيلت', cost: 400 }, { name: 'الوادي', cost: 600 },
    { name: 'خنشلة', cost: 500 }, { name: 'سوق أهراس', cost: 500 }, { name: 'تيبازة', cost: 300 },
    { name: 'ميلة', cost: 400 }, { name: 'عين الدفلى', cost: 350 }, { name: 'النعامة', cost: 600 },
    { name: 'عين تيموشنت', cost: 500 }, { name: 'غرداية', cost: 550 }, { name: 'غليزان', cost: 400 }
  ];

  checkoutStep = signal<'info' | 'payment' | 'confirmation'>('info');
  selectedPaymentMethod = signal<string>('cod');
  confirmedOrder = signal<ConfirmedOrder | null>(null);
  rememberMe = signal(true);
  
  customerForm = new FormBuilder().group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern('^0[5-7][0-9]{8}$')]],
    wilaya: ['', Validators.required],
    city: ['', Validators.required],
    email: ['', Validators.email],
    deliveryCompany: ['', Validators.required]
  });

  subtotal = this.cartService.subtotal;
  shippingCost = signal(0);
  deliveryFee = signal(0);
  total = computed(() => this.subtotal() + this.shippingCost() + this.deliveryFee());

  // Print options
  showPrintOptions = signal(false);
  showBluetoothHelp = signal(false);

  constructor() {
    this.customerForm.get('wilaya')?.valueChanges.subscribe(wilayaName => {
      const selectedWilaya = this.wilayas.find(w => w.name === wilayaName);
      this.shippingCost.set(selectedWilaya ? selectedWilaya.cost : 0);
    });

    this.customerForm.get('deliveryCompany')?.valueChanges.subscribe(companyId => {
        const id = parseInt(companyId || '0', 10);
        const selectedCompany = this.deliveryCompanies.find(c => c.id === id);
        this.deliveryFee.set(selectedCompany ? selectedCompany.fee : 0);
    });
  }

  ngOnInit() {
    this.loadSavedDetails();
  }

  private loadSavedDetails() {
    const remember = localStorage.getItem('platinumStoreRememberMe');
    // Default to true if not set, otherwise respect the saved setting
    this.rememberMe.set(remember !== 'false');

    if (this.rememberMe()) {
      const savedDetails = localStorage.getItem('platinumStoreCheckoutDetails');
      if (savedDetails) {
        try {
          this.customerForm.patchValue(JSON.parse(savedDetails));
        } catch (e) {
          console.error("Failed to parse saved details:", e);
          localStorage.removeItem('platinumStoreCheckoutDetails');
        }
      }
    }
  }

  goToPayment() {
    if (this.customerForm.valid) {
      if (this.rememberMe()) {
        localStorage.setItem('platinumStoreCheckoutDetails', JSON.stringify(this.customerForm.value));
        localStorage.setItem('platinumStoreRememberMe', 'true');
      } else {
        localStorage.removeItem('platinumStoreCheckoutDetails');
        localStorage.removeItem('platinumStoreRememberMe');
      }
      this.checkoutStep.set('payment');
    } else {
      this.customerForm.markAllAsTouched();
    }
  }

  confirmOrder() {
    const deliveryCompanyId = parseInt(this.customerForm.get('deliveryCompany')?.value || '0', 10);
    const company = this.deliveryCompanies.find(c => c.id === deliveryCompanyId);

    const order: ConfirmedOrder = {
        customer: this.customerForm.value,
        items: this.cart(),
        subtotal: this.subtotal(),
        shipping: this.shippingCost(),
        deliveryFee: this.deliveryFee(),
        total: this.total(),
        deliveryCompany: company ? company.name : 'N/A'
    };
    this.confirmedOrder.set(order);
    this.checkoutStep.set('confirmation');
  }

  private formatOrderAsText(order: ConfirmedOrder): string {
    const currency = 'د.ج';
    let text = `
طلب جديد من متجر: ${this.settings().storeName}
================================
** معلومات الزبون **
الاسم: ${order.customer.name}
الهاتف: ${order.customer.phone}
الولاية: ${order.customer.wilaya}, ${order.customer.city}
البريد الإلكتروني: ${order.customer.email || 'لم يحدد'}
شركة التوصيل: ${order.deliveryCompany}
================================
** المنتجات المطلوبة **
`;
    order.items.forEach(item => {
        text += `- ${item.name} (x${item.quantity}) - السعر: ${item.price.toLocaleString()} ${currency}\n`;
    });

    text += `
================================
** ملخص الدفع **
المجموع الفرعي: ${order.subtotal.toLocaleString()} ${currency}
شحن للولاية: ${order.shipping.toLocaleString()} ${currency}
رسوم شركة التوصيل: ${order.deliveryFee.toLocaleString()} ${currency}
--------------------------------
الإجمالي للدفع: ${order.total.toLocaleString()} ${currency}
================================
    `;
    return text.trim();
  }

  sendNotification() {
    const order = this.confirmedOrder();
    if (!order) return;

    const notificationSettings = this.settings().notifications;
    const message = this.formatOrderAsText(order);
    const encodedMessage = encodeURIComponent(message);
    const destination = notificationSettings.destination;

    switch(notificationSettings.method) {
        case 'whatsapp':
            window.open(`https://wa.me/${destination}?text=${encodedMessage}`, '_blank');
            break;
        case 'email':
            const subject = `طلب جديد من متجر: ${this.settings().storeName}`;
            window.location.href = `mailto:${destination}?subject=${encodeURIComponent(subject)}&body=${encodedMessage}`;
            break;
        case 'messenger':
            window.open(`https://m.me/${destination}`, '_blank');
            alert('سيتم فتح الماسنجر. يرجى لصق تفاصيل الطلب يدوياً.');
            break;
        case 'telegram':
            window.open(`https://t.me/${destination}`, '_blank');
            alert('سيتم فتح التليغرام. يرجى لصق تفاصيل الطلب يدوياً.');
            break;
        case 'webhook':
            alert(`سيتم إرسال البيانات التالية إلى Webhook:\n\n${message}`);
            break;
        default:
            alert('لم يتم تكوين طريقة الإشعار في لوحة التحكم.');
    }
  }

  downloadOrder() {
    const order = this.confirmedOrder();
    if (!order) return;
    const text = this.formatOrderAsText(order);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.customer.phone}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  printOrder() {
    window.print();
  }

  togglePrintOptions(event: MouseEvent) {
    event.stopPropagation();
    this.showPrintOptions.update(v => !v);
  }

  printViaWifi() {
    this.printOrder();
    this.showPrintOptions.set(false);
  }

  openBluetoothHelp() {
    this.showBluetoothHelp.set(true);
    this.showPrintOptions.set(false);
  }

  closeBluetoothHelp() {
    this.showBluetoothHelp.set(false);
  }
}