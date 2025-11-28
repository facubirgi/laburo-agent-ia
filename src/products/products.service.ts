import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/products.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(query?: string) {
    // Límite de productos para no exceder el límite de caracteres de WhatsApp
    const MAX_RESULTS = 15;

    if (query) {
      // Normalizar query: remover tildes y convertir a minúsculas
      const normalizedQuery = this.normalizeString(query);

      // Buscar usando SQL con LOWER y expresiones regulares para ignorar tildes
      // Esto busca en: name, description, color, category, type, size
      const results = await this.productRepository
        .createQueryBuilder('product')
        .where(
          `(
            LOWER(TRANSLATE(product.name, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(:query) OR
            LOWER(TRANSLATE(product.description, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(:query) OR
            LOWER(TRANSLATE(product.color, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(:query) OR
            LOWER(TRANSLATE(product.category, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(:query) OR
            LOWER(TRANSLATE(product.type, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(:query) OR
            LOWER(TRANSLATE(product.size, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU')) LIKE LOWER(:query)
          )`,
          { query: `%${normalizedQuery}%` },
        )
        .take(MAX_RESULTS)
        .getMany();

      return results;
    }

    // Sin query, retornar muestra limitada de productos disponibles
    return this.productRepository.find({
      where: { available: true },
      take: MAX_RESULTS,
    });
  }

  /**
   * Normaliza un string removiendo tildes y convirtiéndolo a minúsculas
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    return product;
  }
}