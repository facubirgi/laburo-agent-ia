import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Product } from './products/entities/products.entity';
import { Cart } from './carts/entities/cart.entity';
import { CartItem } from './carts/entities/cart-item.entity';
import { DataSource } from 'typeorm';
import * as XLSX from 'xlsx';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const productRepo = dataSource.getRepository(Product);

  console.log('🌱 Iniciando carga de productos desde Excel...');

  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile('products.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📂 Encontrados ${data.length} productos en el Excel`);

    // Limpiar tablas en orden correcto (respetando foreign keys)
    const cartItemRepo = dataSource.getRepository(CartItem);
    const cartRepo = dataSource.getRepository(Cart);

    const cartItemsCount = await cartItemRepo.count();
    const cartsCount = await cartRepo.count();
    const productsCount = await productRepo.count();

    if (cartItemsCount > 0 || cartsCount > 0 || productsCount > 0) {
      console.log('🗑️  Limpiando tablas...');

      // Primero: cart_items (tiene FK a products)
      if (cartItemsCount > 0) {
        await cartItemRepo.createQueryBuilder().delete().execute();
        console.log(`   ✓ cart_items: ${cartItemsCount} registros eliminados`);
      }

      // Segundo: carts
      if (cartsCount > 0) {
        await cartRepo.createQueryBuilder().delete().execute();
        console.log(`   ✓ carts: ${cartsCount} registros eliminados`);
      }

      // Tercero: products
      if (productsCount > 0) {
        await productRepo.createQueryBuilder().delete().execute();
        console.log(`   ✓ products: ${productsCount} registros eliminados`);
      }
    } else {
      console.log('ℹ️  Tablas ya están vacías');
    }

    let insertados = 0;
    let errores = 0;

    for (const row of data as any[]) {
      try {
        const product = new Product();

        // Nombre compuesto: "Pantalón Verde (XXL)"
        product.name = `${row['TIPO_PRENDA']} ${row['COLOR']} (${row['TALLA']})`;

        // Descripción
        product.description = row['DESCRIPCIÓN'] || '';

        // Los 3 precios
        product.price50u = parseFloat(row['PRECIO_50_U']) || 0;
        product.price100u = parseFloat(row['PRECIO_100_U']) || 0;
        product.price200u = parseFloat(row['PRECIO_200_U']) || 0;

        // Stock
        product.stock = parseInt(row['CANTIDAD_DISPONIBLE']) || 0;

        // Disponibilidad (convertir "Sí"/"No" a boolean)
        product.available = row['DISPONIBLE'] === 'Sí' || row['DISPONIBLE'] === 'Si';

        // Campos adicionales para búsquedas
        product.category = row['CATEGORÍA'] || '';
        product.color = row['COLOR'] || '';
        product.size = row['TALLA'] || '';
        product.type = row['TIPO_PRENDA'] || '';

        await productRepo.save(product);
        insertados++;

        // Progress indicator cada 10 productos
        if (insertados % 10 === 0) {
          console.log(`  ⏳ Procesados ${insertados}/${data.length} productos...`);
        }
      } catch (error) {
        console.error(`❌ Error al procesar fila:`, row, error.message);
        errores++;
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`  ✅ Productos insertados: ${insertados}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📦 Total en BD: ${await productRepo.count()}`);
    console.log('\n🎉 ¡Carga completada con éxito!');

  } catch (error) {
    console.error('❌ Error fatal durante la carga:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
