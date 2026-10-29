import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ParseBooleanPipe } from '../../common/pipes/parse-boolean.pipe.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { CreateExampleItemDto, UpdateExampleItemDto } from './dto/example-item.dto.js';
import { ExampleItemService } from './example-item.service.js';

@ApiTags('example-items')
@ApiBearerAuth()
@Controller('example-items')
@UseGuards(JwtAuthGuard)
export class ExampleItemController {
  constructor(private readonly service: ExampleItemService) {}

  @Get()
  @ApiOperation({ summary: 'List items (paginated, searchable, filterable)' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive', new ParseBooleanPipe('isActive')) isActive?: boolean,
  ) {
    return this.service.findAll({ page, limit, search, isActive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new item' })
  create(
    @Body() dto: CreateExampleItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update item by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateExampleItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete item by ID' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

