import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service.js';
import { UserRepository } from './user.repository.js';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UserRepository;

  beforeEach(() => {
    repository = {
      findById: vi.fn(),
    } as unknown as UserRepository;
    service = new UsersService(repository);
  });

  it('should return user when findActiveById finds active user', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await service.findActiveById('user-1');
    expect(result).toBeDefined();
    expect(result?.id).toBe('user-1');
  });

  it('should return null when user is inactive', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await service.findActiveById('user-1');
    expect(result).toBeNull();
  });

  it('should throw NotFoundException when user not found in getById', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(null);

    await expect(service.getById('non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
