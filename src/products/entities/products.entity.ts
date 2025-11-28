import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // Tres niveles de precio según cantidad
  @Column('decimal', { precision: 10, scale: 2, name: 'price_50u' })
  price50u: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'price_100u' })
  price100u: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'price_200u' })
  price200u: number;

  // Stock disponible
  @Column('int')
  stock: number;

  // Campo "DISPONIBLE" del Excel (Sí/No)
  @Column({ default: true })
  available: boolean;

  // Campos adicionales del Excel para búsquedas
  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  type: string;
}