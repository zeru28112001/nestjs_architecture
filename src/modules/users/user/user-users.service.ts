import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '../../../common/http/api-response.js';
import type { UpdateUserProfileDto } from '../dto/update-user-profile.dto.js';
import { UserRepository } from '../user.repository.js';

@Injectable()
export class UserUsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return ApiResponse.success(user, 'User profile retrieved.');
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    const updated = await this.userRepository.updateProfile(userId, dto);
    return ApiResponse.success(updated, 'User profile updated successfully.');
  }
}
