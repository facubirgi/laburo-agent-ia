// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CartsModule } from './carts/carts.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hacer ConfigModule accesible en toda la app
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // Solo para dev/challenge, no producción
      ssl: {
        rejectUnauthorized: false, // Necesario para Supabase
      },
    }),
    ProductsModule,
    CartsModule,
    AiAgentModule,
    WhatsAppModule, // Nuevo módulo de WhatsApp
  ],
})
export class AppModule {}