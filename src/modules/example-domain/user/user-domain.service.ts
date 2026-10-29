import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../../common/http/api-response.js';
import type { ListDomainQueryDto } from '../dto/list-domain-query.dto.js';
import { ExampleDomainRepository } from '../example-domain.repository.js';
import { ExampleDomainService } from '../example-domain.service.js';
import type { CreateDomainDto } from './dto/create-domain.dto.js';
import { toPublicDomainDto } from './mapper/domain-response.mapper.js';

@Injectable()
export class UserDomainService {
  constructor(
    private readonly sharedService: ExampleDomainService,
    private readonly repository: ExampleDomainRepository,
  ) {}

  async listMine(userId: string, query: ListDomainQueryDto) {
    return this.sharedService.listPaginated(query, userId);
  }

  async getOne(id: string) {
    const domain = await this.sharedService.getById(id);
    return ApiResponse.success(toPublicDomainDto(domain.data as any), 'Domain retrieved successfully.');
  }

  async create(userId: string, dto: CreateDomainDto) {
    const created = await this.repository.create({
      title: dto.title,
      description: dto.description,
      owner: { connect: { id: userId } },
    });
    return ApiResponse.created(toPublicDomainDto(created), 'Domain created successfully.');
  }
}

