import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin/admin-users.controller.js';
import { AdminUsersService } from './admin/admin-users.service.js';
import { UserUsersController } from './user/user-users.controller.js';
import { UserUsersService } from './user/user-users.service.js';
import { UserRepository } from './user.repository.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [AdminUsersController, UserUsersController],
  providers: [
    UserRepository,
    UsersService,
    AdminUsersService,
    UserUsersService,
  ],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
