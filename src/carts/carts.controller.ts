import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  /**
   * POST /carts
   * Crea un carrito con items
   * Body: { items: [{ product_id: 1, qty: 2 }] }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: { items: Array<{ product_id: number; qty: number }> }) {
    return this.cartsService.create(body.items);
  }

  /**
   * GET /carts/:id
   * Obtiene un carrito por ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cartsService.findOne(id);
  }

  /**
   * PATCH /carts/:id
   * Actualiza items del carrito
   * Body: { items: [{ product_id: 1, qty: 3 }] }
   * Para eliminar un item, enviar qty: 0
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { items: Array<{ product_id: number; qty: number }> },
  ) {
    return this.cartsService.update(id, body.items);
  }
}
