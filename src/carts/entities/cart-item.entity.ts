import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/products.entity';


@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cart_id' })
  cartId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column('int')
  qty: number;

  // Relaciones
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => Product, { eager: true }) // Eager true para traer datos del producto al consultar el carrito
  @JoinColumn({ name: 'product_id' })
  product: Product;
}