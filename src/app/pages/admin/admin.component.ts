import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SettingsService } from '../../settings.service';
import { ProductService } from '../../product.service';
import { DeliveryCompany, Product, ProductVariant } from '../../types';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup, AbstractControl } from '@angular/forms';
import { GeminiService } from '../../gemini.service';
import { TranslatePipe } from '../../translate.pipe';
import { LanguageService } from '../../language.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
  private router: Router = inject(Router);
  private settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private fb: FormBuilder = inject(FormBuilder);
  private geminiService = inject(GeminiService);
  private cdr = inject(ChangeDetectorRef);
  private languageService = inject(LanguageService);

  isGeminiConfigured = this.geminiService.isConfigured;
  geminiConfigurationError = this.geminiService.configurationError;

  settings = this.settingsService.settings;
  products = this.productService.products;
  activeTab = signal('settings');
  isSidebarOpen = signal(false);
  
  categories = computed(() => [...new Set(this.products().map(p => p.category))]);

  // Upload success indicator state
  uploadSuccessState = signal<Record<string, boolean>>({});

  // Delivery Management
  isEditingDelivery = signal(false);
  editingDeliveryId = signal<number | null>(null);
  deliveryForm = this.fb.group({
    name: ['', Validators.required],
    fee: [0, [Validators.required, Validators.min(0)]],
  });

  // Settings Management
  settingsForm = this.fb.group({
    storeName: ['', Validators.required],
    heroTitle: ['', Validators.required],
    logo: [''],
    heroColor: ['#ffffff'],
    heroFont: [''],
    heroSize: [''],
    bgImage: [''],
    bgColor: ['#0f172a'],
    heroAnimation: ['slide'],
    logoAnimation: ['none'],
    cardBgColor: ['#ffffff'],
    cardTextColor: ['#1e293b'],
    cardBorderRadius: ['1.5rem'],
    cardShadow: [''],
    bgOverlayColor: ['#000000'],
    bgOverlayOpacity: [0.3, [Validators.min(0), Validators.max(1)]],
    cardAnimation: ['fade']
  });

  // Notification Management
  notificationsForm = this.fb.group({
      method: ['none', Validators.required],
      destination: ['', Validators.required]
  });

  // Product Management
  isEditingProduct = signal(false);
  editingProductId = signal<number | null>(null);
  productForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', Validators.required],
    image: ['', Validators.required],
    description: [''],
    variants: this.fb.array([])
  });

  newVariantForm = this.fb.group({
    color: ['#000000', Validators.required],
    image: [''],
    sizes: ['']
  });
  
  generatingImageForVariantIndex = signal<number | null>(null);
  editingVariantImageIndex = signal<number | null>(null);

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  // Camera Management
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('photoCanvas') photoCanvas!: ElementRef<HTMLCanvasElement>;
  isCameraOpen = signal(false);
  activeImageControl = signal<AbstractControl | null>(null);


  constructor() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    const currentSettings = this.settingsService.settings();
    this.settingsForm.patchValue(currentSettings);
    this.notificationsForm.patchValue(currentSettings.notifications);

    // UX Improvement: Reset destination when notification method changes
    this.notificationsForm.get('method')?.valueChanges.subscribe(() => {
        this.notificationsForm.get('destination')?.reset('');
    });

    // Live update for logo
    this.settingsForm.get('logo')?.valueChanges.subscribe(value => {
      if (this.settingsForm.get('logo')?.dirty) {
        this.settingsService.updateSettings({ logo: value || '' });
      }
    });

    // FIX: Live update for background image
    this.settingsForm.get('bgImage')?.valueChanges.subscribe(value => {
      if (this.settingsForm.get('bgImage')?.dirty) {
        this.settingsService.updateSettings({ bgImage: value || '' });
      }
    });
    
    // UX Improvement: When choosing a color, clear the background image
    this.settingsForm.get('bgColor')?.valueChanges.subscribe(value => {
      if (this.settingsForm.get('bgColor')?.dirty) {
        // Update the form value for the image without triggering its own change listener
        this.settingsForm.get('bgImage')?.setValue('', { emitEvent: false });
        // Update the settings service with the new color and empty image
        this.settingsService.updateSettings({ bgColor: value || '#0f172a', bgImage: '' });
      }
    });
  }
  
  getActiveTabName(): string {
    const t = this.languageService.translate.bind(this.languageService);
    switch(this.activeTab()) {
        case 'settings': return t('admin.header.settings');
        case 'products': return t('admin.header.products');
        case 'categories': return t('admin.header.categories');
        case 'delivery': return t('admin.header.delivery');
        case 'notifications': return t('admin.header.notifications');
        default: return t('admin.header.dashboard');
    }
  }

  // --- Image Upload & Camera ---
  private resizeAndEncodeImage(file: File, maxSize: number = 800): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (!event.target?.result) {
          return reject(new Error('FileReader did not return a result.'));
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
    
          if (width > height) {
            if (width > maxSize) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }
          }
    
          canvas.width = width;
          canvas.height = height;
    
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Failed to get canvas context'));
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for resizing from data URL.'));
        };
    
        img.src = event.target.result as string;
      };

      reader.onerror = () => {
        reject(new Error('FileReader failed to read file.'));
      };

      reader.readAsDataURL(file);
    });
  }

  handleFileInputChange(input: HTMLInputElement, control: AbstractControl, uploadKey: string) {
    const files = input.files;

    if (!files || files.length === 0) {
      if (input) input.value = '';
      return;
    }
    
    const file = files[0];
    
    if (input) {
      input.value = '';
    }

    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    this.resizeAndEncodeImage(file)
      .then(dataUrl => {
        control.setValue(dataUrl);
        control.markAsDirty();
        this.cdr.markForCheck();
        
        this.uploadSuccessState.update(state => ({ ...state, [uploadKey]: true }));
        setTimeout(() => {
            this.uploadSuccessState.update(state => ({ ...state, [uploadKey]: false }));
            this.cdr.markForCheck();
        }, 2000);
      })
      .catch(error => {
        console.error('Error processing image:', error);
        alert(this.languageService.translate('admin.products.imageProcessingError'));
      });
  }

  async openCamera(control: AbstractControl) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      alert(this.languageService.translate('admin.camera.notAvailable'));
      console.error('Camera API (navigator.mediaDevices) not available.');
      return;
    }

    this.activeImageControl.set(control);
    this.isCameraOpen.set(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setTimeout(() => {
             if (this.videoPlayer) {
                this.videoPlayer.nativeElement.srcObject = stream;
             }
        }, 50);
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert(this.languageService.translate('admin.camera.error'));
        this.isCameraOpen.set(false);
    }
  }

  closeCamera() {
      if (this.videoPlayer && this.videoPlayer.nativeElement.srcObject) {
        const stream = this.videoPlayer.nativeElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      this.isCameraOpen.set(false);
      this.activeImageControl.set(null);
  }

  captureImage() {
    const control = this.activeImageControl();
    if (control && this.videoPlayer && this.photoCanvas) {
        const video = this.videoPlayer.nativeElement;
        const canvas = this.photoCanvas.nativeElement;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        control.setValue(dataUrl);
        this.closeCamera();
    }
  }


  // --- Settings Methods ---
  saveSettings() {
    if (this.settingsForm.valid) {
      this.settingsService.updateSettings(this.settingsForm.value as any);
      this.settingsService.showToast('admin.settings.toastSaved');
    }
  }
  
  saveNotifications() {
      if (this.notificationsForm.valid) {
          this.settingsService.updateSettings({ notifications: this.notificationsForm.value as any });
          this.settingsService.showToast('admin.notifications.toastSaved');
      }
  }

  // --- Category Methods ---
  renameCategory(oldName: string) {
    const promptMessage = this.languageService.translate('admin.categories.renamePrompt', { oldName });
    const newName = prompt(promptMessage, oldName);
    if (newName && newName !== oldName) {
      this.productService.updateCategory(oldName, newName);
    }
  }

  deleteCategory(categoryName: string) {
    const confirmMessage = this.languageService.translate('admin.categories.deleteConfirm', { categoryName });
    if (confirm(confirmMessage)) {
      this.productService.deleteCategory(categoryName);
    }
  }

  // --- Delivery Methods ---
  saveDeliveryCompany() {
    if (this.deliveryForm.invalid) return;

    if (this.isEditingDelivery() && this.editingDeliveryId() !== null) {
      this.settingsService.updateDeliveryCompany({
        id: this.editingDeliveryId()!,
        ...this.deliveryForm.value
      } as DeliveryCompany);
    } else {
      this.settingsService.addDeliveryCompany(this.deliveryForm.value as Omit<DeliveryCompany, 'id'>);
    }
    this.settingsService.showToast('admin.delivery.toastSaved');
    this.cancelDeliveryEdit();
  }

  editCompany(company: DeliveryCompany) {
    this.isEditingDelivery.set(true);
    this.editingDeliveryId.set(company.id);
    this.deliveryForm.setValue({ name: company.name, fee: company.fee });
  }

  deleteCompany(id: number) {
    this.settingsService.deleteDeliveryCompany(id);
  }

  cancelDeliveryEdit() {
    this.isEditingDelivery.set(false);
    this.editingDeliveryId.set(null);
    this.deliveryForm.reset({ name: '', fee: 0 });
  }

  // --- Product & Variant Methods ---
  createVariantGroup(variant: ProductVariant): FormGroup {
    return this.fb.group({
      color: [variant.color, Validators.required],
      image: [variant.image],
      sizes: [variant.sizes.join(', ')]
    });
  }

  addVariant() {
    if (this.newVariantForm.invalid) return;
    const formValue = this.newVariantForm.getRawValue();
    const shouldGenerateImage = !formValue.image && formValue.color;
    
    const variantGroup = this.fb.group({
        color: [formValue.color, Validators.required],
        image: [formValue.image],
        sizes: [formValue.sizes]
    });
    this.variants.push(variantGroup);
    
    if (shouldGenerateImage) {
        const newVariantIndex = this.variants.controls.length - 1;
        const newVariantGroup = this.variants.at(newVariantIndex);
        this.generateVariantImage(newVariantGroup, newVariantIndex);
    }
    
    this.newVariantForm.reset({ color: '#000000', image: '', sizes: '' });
  }

  async generateVariantImage(variantGroup: AbstractControl, index: number) {
      const imageControl = variantGroup.get('image');
      const colorControl = variantGroup.get('color');
      const productName = this.productForm.get('name')?.value;

      if (!imageControl || !colorControl || !productName) {
          alert(this.languageService.translate('admin.products.variantPromptError'));
          return;
      }
      
      this.generatingImageForVariantIndex.set(index);
      try {
          const prompt = `صورة فوتوغرافية احترافية لمنتج تجارة إلكترونية: ${productName}، اللون: ${colorControl.value}. تتوسط الصورة خلفية بيضاء نظيفة وبسيطة.`;
          const base64ImageBytes = await this.geminiService.generateImage(prompt);
          const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
          imageControl.setValue(imageUrl);
      } catch (error: unknown) {
          console.error('Failed to generate variant image:', error);
          
          const genericMessage = this.languageService.translate('admin.products.variantGenerationError');
          let specificMessage = '';

          if (error instanceof Error) {
            specificMessage = error.message;
          } else if (error && typeof error === 'object' && 'message' in error && typeof (error as {message: unknown}).message === 'string') {
            specificMessage = (error as {message: string}).message;
          } else if (typeof error === 'string' && error.length > 0) {
            specificMessage = error;
          } else if (error) {
              try {
                const errorBody = JSON.stringify(error);
                if (errorBody !== '{}') {
                  specificMessage = errorBody;
                }
              } catch (e) {
                // Ignore stringify errors, fallback to generic message
              }
          }

          let alertMessage = genericMessage;
          if (specificMessage) {
              alertMessage += `\n\n${specificMessage}`;
          }
          
          alert(alertMessage);
      } finally {
          this.generatingImageForVariantIndex.set(null);
      }
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  saveProduct() {
    if (this.productForm.invalid) return;
    const formValue = this.productForm.getRawValue();
    const productToSave = {
        ...formValue,
        variants: formValue.variants.map((v: any) => ({
            ...v,
            sizes: v.sizes.split(',').map((s: string) => s.trim()).filter((s: string) => s)
        }))
    };

    if (this.isEditingProduct() && this.editingProductId() !== null) {
      this.productService.updateProduct({ ...productToSave, id: this.editingProductId()! } as Product);
    } else {
      const { id, ...newProduct } = productToSave;
      this.productService.addProduct(newProduct as Omit<Product, 'id'>);
    }
    this.settingsService.showToast('admin.products.toastSaved');
    this.cancelProductEdit();
  }

  editProduct(product: Product) {
    this.isEditingProduct.set(true);
    this.editingProductId.set(product.id);
    this.productForm.patchValue(product);
    this.variants.clear();
    product.variants.forEach(v => {
      this.variants.push(this.createVariantGroup(v));
    });
  }

  deleteProduct(id: number) {
    this.productService.deleteProduct(id);
  }

  cancelProductEdit() {
    this.isEditingProduct.set(false);
    this.editingProductId.set(null);
    this.productForm.reset({ name: '', price: 0, category: '', image: '', description: '' });
    this.variants.clear();
    this.newVariantForm.reset({ color: '#000000', image: '', sizes: '' });
  }
}