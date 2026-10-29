import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '../../common/http/api-response.js';
import { buildPaginationMeta } from '../../shared/pagination/pagination.utils.js';
import { CreateExampleItemDto, UpdateExampleItemDto } from './dto/example-item.dto.js';
import { ExampleItemRepository } from './example-item.repository.js';

@Injectable()
export class ExampleItemService {
  constructor(private readonly repository: ExampleItemRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; isActive?: boolean }) {
    const { items, total, page, limit } = await this.repository.findAll(params);
    const meta = buildPaginationMeta(total, page, limit, items.length);
    return ApiResponse.withPagination(items, meta, 'Items retrieved successfully.');
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item || item.deletedAt) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return ApiResponse.success(item, 'Item retrieved successfully.');
  }

  async create(dto: CreateExampleItemDto, userId: string) {
    const created = await this.repository.create({
      title: dto.title,
      description: dto.description,
      createdBy: { connect: { id: userId } },
    });
    return ApiResponse.created(created, 'Item created successfully.');
  }

  async update(id: string, dto: UpdateExampleItemDto) {
    await this.findOne(id);
    const updated = await this.repository.update(id, dto);
    return ApiResponse.updated(updated, 'Item updated successfully.');
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repository.softDelete(id);
    return ApiResponse.deleted('Item deleted successfully.');
  }
}

