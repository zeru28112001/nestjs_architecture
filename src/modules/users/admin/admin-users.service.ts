import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '../../../common/http/api-response.js';
import type { ListUsersQueryDto } from '../dto/list-users-query.dto.js';
import type { UpdateUserStatusDto } from '../dto/update-user-status.dto.js';
import { UserRepository } from '../user.repository.js';

@Injectable()
export class AdminUsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.userRepository.listPaginated({
      page,
      limit,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
    });

    return ApiResponse.successWithMeta(
      result.items,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
      'Users listed successfully.',
    );
  }

  async getById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return ApiResponse.success(user, 'User retrieved successfully.');
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    const updated = await this.userRepository.updateStatus(id, dto.isActive);
    return ApiResponse.success(
      updated,
      `User ${dto.isActive ? 'activated' : 'deactivated'} successfully.`,
    );
  }
}
