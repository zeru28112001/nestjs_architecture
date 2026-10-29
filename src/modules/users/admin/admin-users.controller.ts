import {
  Body,
  Controller,
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
import { ListUsersQueryDto } from '../dto/list-users-query.dto.js';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto.js';
import { AdminUsersService } from './admin-users.service.js';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  list(@Query() query: ListUsersQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID (Admin only)' })
  getOne(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate user (Admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
