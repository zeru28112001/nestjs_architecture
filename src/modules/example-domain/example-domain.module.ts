import { Module } from '@nestjs/common';
import { AdminDomainController } from './admin/admin-domain.controller.js';
import { AdminDomainService } from './admin/admin-domain.service.js';
import { ExampleDomainRepository } from './example-domain.repository.js';
import { ExampleDomainService } from './example-domain.service.js';
import { ShopDomainController } from './shop/shop-domain.controller.js';
import { ShopDomainService } from './shop/shop-domain.service.js';
import { UserDomainController } from './user/user-domain.controller.js';
import { UserDomainService } from './user/user-domain.service.js';

@Module({
  controllers: [
    UserDomainController,
    AdminDomainController,
    ShopDomainController,
  ],
  providers: [
    ExampleDomainRepository,
    ExampleDomainService,
    AdminDomainService,
    UserDomainService,
    ShopDomainService,
  ],
  exports: [ExampleDomainRepository, ExampleDomainService],
})
export class ExampleDomainModule {}

