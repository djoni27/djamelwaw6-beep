import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../types';
import { CartService } from '../../cart.service';
import { SettingsService } from '../../settings.service';
import { ProductService } from '../../product.service';
import { TranslatePipe } from '../../translate.pipe';
import { LanguageService } from '../../language.service';

@Component({
  selector: 'app-store',
  imports: [CommonModule, RouterModule, TranslatePipe, NgOptimizedImage],
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreComponent {
    private router: Router = inject(Router);
    cartService = inject(CartService);
    settingsService = inject(SettingsService);
    productService = inject(ProductService);
    private languageService = inject(LanguageService);

    // Get products & settings from services
    products = this.productService.products;
    settings = this.settingsService.settings;

    categories = computed(() => [...new Set(this.products().map(p => p.category))]);
    activeFilter = signal('all');
    filteredProducts = computed(() => {
        if (this.activeFilter() === 'all') {
            return this.products();
        }
        return this.products().filter(p => p.category === this.activeFilter());
    });
    
    showCart = signal(false);
    selectedProduct = signal<Product | null>(null);
    hoveredProductImage = signal<{[key: number]: string}>({});
    
    showShareOptions = signal(false);
    isLinkCopied = signal(false);
    
    // Use cart signals from the service
    cart = this.cartService.cart;
    cartCount = this.cartService.cartCount;
    cartTotal = this.cartService.subtotal;

    canShareNatively = typeof navigator !== 'undefined' && !!navigator.share;

    constructor() {
        // Redirect to login if not authenticated
        if (sessionStorage.getItem('isLoggedIn') !== 'true') {
            this.router.navigate(['/login']);
        }
    }

    setFilter(category: string) {
        this.activeFilter.set(category);
    }

    addToCart(product: Product, event: MouseEvent) {
      event.stopPropagation();
      this.cartService.addToCart(product);
    }

    openProductModal(product: Product) {
        this.selectedProduct.set(product);
    }

    closeProductModal() {
        this.selectedProduct.set(null);
        this.closeShare();
    }
    
    changeProductImageOnHover(productId: number, image: string) {
        this.hoveredProductImage.update(images => ({...images, [productId]: image}));
    }

    resetProductImage(productId: number, originalImage: string) {
        this.hoveredProductImage.update(images => ({...images, [productId]: originalImage}));
    }

    goToCheckout() {
        if (this.cart().length > 0) {
            this.showCart.set(false);
            this.router.navigate(['/checkout']);
        }
    }

    // --- Advanced Share Logic ---
    toggleShare(event: MouseEvent) {
        event.stopPropagation();
        this.showShareOptions.update(v => !v);
        if (this.showShareOptions()) {
            this.isLinkCopied.set(false); // Reset copied status when opening
        }
    }

    closeShare() {
        this.showShareOptions.set(false);
    }

    shareTo(platform: 'facebook' | 'telegram', product: Product) {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(this.languageService.translate('store.shareText', { productName: product.name }));
        let shareUrl = '';

        if (platform === 'facebook') {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        } else if (platform === 'telegram') {
            shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank');
        }
        this.closeShare();
    }

    copyLink() {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.isLinkCopied.set(true);
                setTimeout(() => {
                    this.isLinkCopied.set(false);
                    this.closeShare();
                }, 1500);
            }).catch(err => console.error('Failed to copy: ', err));
        } else {
            console.error('Clipboard API not available.');
            alert(this.languageService.translate('store.copyLinkUnsupported'));
        }
    }

    nativeShare(product: Product) {
        const shareData = {
            title: product.name,
            text: this.languageService.translate('store.shareTextWithDesc', { productName: product.name, productDescription: product.description }),
            url: window.location.href
        };

        if (this.canShareNatively) {
            navigator.share(shareData)
              .then(() => this.closeShare())
              .catch((error) => console.log('Error sharing:', error));
        }
    }
}
