import { Module } from '@nestjs/common';
import { ExampleItemController } from './example-item.controller.js';
import { ExampleItemRepository } from './example-item.repository.js';
import { ExampleItemService } from './example-item.service.js';

@Module({
  controllers: [ExampleItemController],
  providers: [ExampleItemRepository, ExampleItemService],
  exports: [ExampleItemRepository, ExampleItemService],
})
export class ExampleItemModule {}

