import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../../common/http/api-response.js';
import type { ListDomainQueryDto } from '../dto/list-domain-query.dto.js';
import { ExampleDomainRepository } from '../example-domain.repository.js';
import { ExampleDomainService } from '../example-domain.service.js';
import type { AdminUpdateStatusDto } from './dto/admin-action.dto.js';

@Injectable()
export class AdminDomainService {
  constructor(
    private readonly sharedService: ExampleDomainService,
    private readonly repository: ExampleDomainRepository,
  ) {}

  async list(query: ListDomainQueryDto) {
    return this.sharedService.listPaginated(query);
  }

  async getById(id: string) {
    return this.sharedService.getById(id);
  }

  async updateStatus(id: string, dto: AdminUpdateStatusDto) {
    await this.sharedService.getById(id);
    const updated = await this.repository.update(id, { status: dto.status });
    return ApiResponse.updated(updated, 'Domain status updated successfully.');
  }

  async remove(id: string) {
    await this.sharedService.getById(id);
    await this.repository.softDelete(id);
    return ApiResponse.deleted('Domain deleted successfully.');
  }
}

