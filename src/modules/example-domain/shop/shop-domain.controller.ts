import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.js';
import { ListDomainQueryDto } from '../dto/list-domain-query.dto.js';
import { ShopDomainService } from './shop-domain.service.js';

@ApiTags('shop-domains')
@ApiBearerAuth()
@Controller('shop/domains')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SHOP', 'ADMIN')
export class ShopDomainController {
  constructor(private readonly service: ShopDomainService) {}

  @Get()
  @ApiOperation({ summary: 'List shop vendor domains' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDomainQueryDto,
  ) {
    return this.service.listShopDomains(user.id, query);
  }
}

