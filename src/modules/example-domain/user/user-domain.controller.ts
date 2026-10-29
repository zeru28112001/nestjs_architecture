import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.js';
import { ListDomainQueryDto } from '../dto/list-domain-query.dto.js';
import { CreateDomainDto } from './dto/create-domain.dto.js';
import { UserDomainService } from './user-domain.service.js';

@ApiTags('domains')
@ApiBearerAuth()
@Controller('domains')
@UseGuards(JwtAuthGuard)
export class UserDomainController {
  constructor(private readonly service: UserDomainService) {}

  @Get('me')
  @ApiOperation({ summary: 'List customer domains' })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDomainQueryDto,
  ) {
    return this.service.listMine(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get domain detail by ID' })
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new domain' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDomainDto,
  ) {
    return this.service.create(user.id, dto);
  }
}

