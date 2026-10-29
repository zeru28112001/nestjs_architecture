import { Injectable } from '@nestjs/common';
import type { ListDomainQueryDto } from '../dto/list-domain-query.dto.js';
import { ExampleDomainService } from '../example-domain.service.js';

@Injectable()
export class ShopDomainService {
  constructor(private readonly sharedService: ExampleDomainService) {}

  async listShopDomains(shopOwnerId: string, query: ListDomainQueryDto) {
    return this.sharedService.listPaginated(query, shopOwnerId);
  }
}

