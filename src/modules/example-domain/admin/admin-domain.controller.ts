import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ListDomainQueryDto } from '../dto/list-domain-query.dto.js';
import { AdminDomainService } from './admin-domain.service.js';
import { AdminUpdateStatusDto } from './dto/admin-action.dto.js';

@ApiTags('admin-domains')
@ApiBearerAuth()
@Controller('admin/domains')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDomainController {
  constructor(private readonly service: AdminDomainService) {}

  @Get()
  @ApiOperation({ summary: 'List all domains for administrator' })
  list(@Query() query: ListDomainQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get domain detail by ID' })
  getOne(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update domain status (e.g. approve/suspend)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete domain' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

