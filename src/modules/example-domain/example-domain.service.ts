import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '../../common/http/api-response.js';
import { buildPaginationMeta } from '../../shared/pagination/pagination.utils.js';
import type { ListDomainQueryDto } from './dto/list-domain-query.dto.js';
import { ExampleDomainRepository } from './example-domain.repository.js';

@Injectable()
export class ExampleDomainService {
  constructor(private readonly repository: ExampleDomainRepository) {}

  async listPaginated(query: ListDomainQueryDto, ownerId?: string) {
    const { items, total, page, limit } = await this.repository.listPaginated({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
      search: query.search,
      ownerId,
    });

    const meta = buildPaginationMeta(total, page, limit, items.length);
    return ApiResponse.withPagination(items, meta, 'Domains retrieved successfully.');
  }

  async getById(id: string) {
    const domain = await this.repository.findById(id);
    if (!domain || domain.deletedAt) {
      throw new NotFoundException(`Domain with ID ${id} not found`);
    }
    return ApiResponse.success(domain, 'Domain retrieved successfully.');
  }
}

