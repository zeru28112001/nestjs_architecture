import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findActiveById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  async getById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }
}
