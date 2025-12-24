import { Injectable, signal, computed } from '@angular/core';
import { Product, CartItem } from './types';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cart = signal<CartItem[]>([]);

  cartCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));
  
  subtotal = computed(() => this.cart().reduce((acc, item) => acc + item.price * item.quantity, 0));

  addToCart(product: Product) {
    this.cart.update(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        // Increment quantity if item already exists
        return currentCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item with quantity 1
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
  }

  removeFromCart(productId: number) {
    this.cart.update(currentCart => currentCart.filter(item => item.id !== productId));
  }
}