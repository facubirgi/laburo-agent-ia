import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/products.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  /**
   * Crea un nuevo carrito con items
   * POST /carts
   */
  async create(items: Array<{ product_id: number; qty: number }>) {
    // Validar que haya items
    if (!items || items.length === 0) {
      throw new BadRequestException('El carrito debe tener al menos un item');
    }

    // Crear el carrito
    const cart = this.cartsRepository.create();
    const savedCart = await this.cartsRepository.save(cart);

    // Agregar items al carrito
    for (const item of items) {
      await this.addItemToCart(savedCart.id, item.product_id, item.qty);
    }

    // Retornar el carrito completo con items
    return this.findOne(savedCart.id);
  }

  /**
   * Actualiza un carrito existente (agregar, modificar, eliminar items)
   * PATCH /carts/:id
   */
  async update(
    cartId: number,
    items: Array<{ product_id: number; qty: number }>,
  ) {
    // Verificar que el carrito existe
    const cart = await this.cartsRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Carrito con ID ${cartId} no encontrado`);
    }

    // Procesar cada item
    for (const item of items) {
      if (item.qty === 0) {
        // Eliminar item del carrito
        await this.removeItemFromCart(cartId, item.product_id);
      } else {
        // Actualizar o agregar item
        await this.updateOrAddItem(cartId, item.product_id, item.qty);
      }
    }

    // Retornar el carrito actualizado
    return this.findOne(cartId);
  }

  /**
   * Obtiene un carrito por ID con todos sus items
   */
  async findOne(cartId: number) {
    const cart = await this.cartsRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Carrito con ID ${cartId} no encontrado`);
    }

    // Calcular total del carrito con precios dinámicos
    const total = cart.items.reduce((sum, item) => {
      const price = this.calculatePrice(item.product, item.qty);
      return sum + price * item.qty;
    }, 0);

    return {
      ...cart,
      total,
      items: cart.items.map(item => ({
        ...item,
        unitPrice: this.calculatePrice(item.product, item.qty),
      })),
    };
  }

  /**
   * Agrega un item al carrito (helper privado)
   */
  private async addItemToCart(
    cartId: number,
    productId: number,
    qty: number,
  ) {
    // Validar que el producto existe
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Validar que el producto esté disponible
    if (!product.available) {
      throw new BadRequestException(
        `El producto ${product.name} no está disponible actualmente`,
      );
    }

    // Validar stock disponible
    if (product.stock < qty) {
      throw new BadRequestException(
        `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
      );
    }

    // Crear el item
    const cartItem = this.cartItemsRepository.create({
      cartId,
      productId,
      qty,
    });

    await this.cartItemsRepository.save(cartItem);
  }

  /**
   * Actualiza o agrega un item al carrito
   */
  private async updateOrAddItem(
    cartId: number,
    productId: number,
    qty: number,
  ) {
    // Buscar si el item ya existe en el carrito
    const existingItem = await this.cartItemsRepository.findOne({
      where: { cartId, productId },
    });

    if (existingItem) {
      // Actualizar cantidad
      const product = await this.productsRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
      }

      if (product.stock < qty) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
        );
      }

      existingItem.qty = qty;
      await this.cartItemsRepository.save(existingItem);
    } else {
      // Agregar nuevo item
      await this.addItemToCart(cartId, productId, qty);
    }
  }

  /**
   * Elimina un item del carrito
   */
  private async removeItemFromCart(cartId: number, productId: number) {
    const item = await this.cartItemsRepository.findOne({
      where: { cartId, productId },
    });

    if (item) {
      await this.cartItemsRepository.remove(item);
    }
  }

  /**
   * Calcula el precio unitario según la cantidad
   * 50-99 unidades: price50u
   * 100-199 unidades: price100u
   * 200+ unidades: price200u
   */
  private calculatePrice(product: Product, qty: number): number {
    if (qty >= 200) {
      return product.price200u;
    } else if (qty >= 100) {
      return product.price100u;
    } else {
      return product.price50u;
    }
  }
}
