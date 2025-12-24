import { Injectable, signal } from '@angular/core';
import { Product } from './types';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  products = signal<Product[]>([
    { id: 1, name: "حذاء رياضي عصري", price: 12000, category: "أحذية", image: "https://picsum.photos/seed/shoe/400/400", description: "مصمم للراحة والأداء العالي.", variants: [
        { color: '#000000', image: 'https://picsum.photos/seed/shoeblack/400/400', sizes: ['40', '41', '42'] },
        { color: '#ffffff', image: 'https://picsum.photos/seed/shoewhite/400/400', sizes: ['41', '42', '43'] },
        { color: '#ff0000', image: 'https://picsum.photos/seed/shoered/400/400', sizes: ['40', '42'] }
    ]},
    { id: 2, name: "ساعة بلاتينية فاخرة", price: 15000, category: "ساعات", image: "https://picsum.photos/seed/watch/400/400", description: "دقة وأناقة في تصميم واحد.", variants: [] },
    { id: 3, name: "كاميرا احترافية", price: 85000, category: "إلكترونيات", image: "https://picsum.photos/seed/camera/400/400", description: "التقط كل التفاصيل بدقة عالية.", variants: [] },
    { id: 4, name: "نظارات شمسية", price: 7500, category: "اكسسوارات", image: "https://picsum.photos/seed/glasses/400/400", description: "حماية وأناقة لعينيك.", variants: [] }
  ]);

  addProduct(product: Omit<Product, 'id'>) {
    this.products.update(products => [
      ...products,
      { ...product, id: Date.now() }
    ]);
  }

  updateProduct(updatedProduct: Product) {
    this.products.update(products => products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
  }

  deleteProduct(productId: number) {
    this.products.update(products => products.filter(p => p.id !== productId));
  }

  updateCategory(oldName: string, newName: string) {
    this.products.update(products => 
      products.map(p => 
        p.category === oldName ? { ...p, category: newName } : p
      )
    );
  }

  deleteCategory(categoryName: string) {
    this.products.update(products => 
      products.filter(p => p.category !== categoryName)
    );
  }
}