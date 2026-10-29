# NestJS Architecture & Implementation Blueprint (`reference_nest.md`)

This document defines the standardized NestJS architecture, request/response pipeline, authentication format, custom pipes, and pagination conventions inspired by `myshop_demo_api`. Use this reference as the golden standard when starting or structuring any NestJS backend project.

---

## Table of Contents

1. [Architectural Overview & Folder Structure](#1-architectural-overview--folder-structure)
2. [Standard Response Envelope (`ApiResponse`)](#2-standard-response-envelope-apiresponse)
3. [Standard Pagination Pattern](#3-standard-pagination-pattern)
4. [Custom Pipes Collection](#4-custom-pipes-collection)
5. [Authentication & Authorization (JWT + RBAC)](#5-authentication--authorization-jwt--rbac)
6. [Global Interceptors & Exception Filter](#6-global-interceptors--exception-filter)
7. [Application Bootstrap (`main.ts`)](#7-application-bootstrap-maints)
8. [End-to-End Feature Module Template](#8-end-to-end-feature-module-template)

---

## 1. Architectural Overview & Folder Structure

Every NestJS backend follows the **Controller → Service → Repository** pattern with strict separation of concerns:

- **Controller (`*.controller.ts`)**: HTTP boundary only. Handles route mapping, Swagger tags, input pipes/validation, extracting `@CurrentUser()`, and calling the service.
- **Service (`*.service.ts`)**: Business logic, transactional orchestration, domain validations, auditing, and formatting the response via `ApiResponse.*`.
- **Repository (`*.repository.ts`)**: Data access layer. Direct Prisma queries (`findMany`, `count`, `$transaction`, `create`, `update`, `delete`), pagination math (`skip`, `take`), and mapping rows to records.
- **DTOs (`dto/*.dto.ts`)**: Class-validator definitions for request bodies and query parameters.

### Recommended Directory Layout

#### 1. Single-Actor Feature Module (e.g. `guarantees`, `tags`, `categories`)

Used when operations are straightforward or shared between roles without distinct multi-actor business flows:

```
src/modules/[feature-name]/
├── [feature].module.ts
├── [feature].controller.ts
├── [feature].service.ts
├── [feature].repository.ts
└── dto/
    ├── create-[feature].dto.ts
    └── update-[feature].dto.ts
```

#### 2. Multi-Role Domain Module (Standard Golden Template)

Used for all multi-actor domains (e.g. `catalog`, `payments`, `categories`, `orders`, `users`). 

In this pattern, **Role is the top-level boundary** (`admin/`, `user/`, `shop/`). Shared persistence (`*.repository.ts`), shared core/query logic (`*.service.ts`), constants, and domain types always live directly at the root of the module:

```
src/modules/[feature-name]/
├── [feature].module.ts              # Root module bundling all controllers & providers
├── [feature].repository.ts          # Central Prisma data access layer (transactions & queries)
├── [feature].service.ts             # Shared core query, lookup & pagination logic
├── [feature].constants.ts           # Shared domain constants & validation rules
├── domain/                          # Domain interfaces & database row records
│   └── [feature].records.ts
├── dto/                             # Shared cross-cutting DTOs (e.g. pagination query)
│   └── list-[feature]-query.dto.ts
│
├── admin/                           # Admin Portal Boundary (Strict @Roles('ADMIN'))
│   ├── admin-[feature].controller.ts
│   ├── admin-[feature].service.ts
│   └── dto/                         # Admin-specific request DTOs
│
├── user/                            # Storefront / Customer Boundary (User JWT auth)
│   ├── user-[feature].controller.ts
│   ├── user-[feature].service.ts
│   ├── mapper/                      # Response transformers (masks sensitive supplier/internal data)
│   │   ├── [feature]-response.mapper.ts
│   │   └── [feature]-response.mapper.spec.ts
│   └── dto/                         # User-specific request DTOs
│
└── shop/                            # Merchant / Vendor Boundary (if multi-vendor system)
    ├── shop-[feature].controller.ts
    ├── shop-[feature].service.ts
    └── dto/
```

> **Note on Complex Features with Multiple Subtypes (e.g. `orders` having `digital` & `smm`)**:
> If a domain has distinct product types or fulfillment engines (like `digital` licenses vs external `smm` APIs), they are nested **inside** their respective role directory (e.g., `admin/digital/`, `admin/smm/`, `user/digital/`, `user/smm/`), preserving Role as the primary boundary.

### Why Role-First Separation is Required:
1. **Isolated RBAC & Security Boundaries**: Admin controllers and services remain completely separated from customer endpoints. Admin routes use `@Roles('ADMIN')` and `@UseGuards(JwtAuthGuard, RolesGuard)`, while customer routes only require user JWT tokens.
2. **Dedicated Logic & DTOs**: Admin actions (approvals, wholesale sync, manual fulfillments) have different validation rules and auditing requirements from customer actions (purchases, browsing).
3. **No Redundant Single-File Folders**: Shared operations (listing, pagination, record lookup) live directly in `[feature].service.ts` at the root of the module rather than in a loose `services/` directory.
4. **Dedicated Data & Response Shapes**: Customer responses must redact sensitive keys or supplier costs (handled cleanly in `user/mapper/`), while admin endpoints include user identity and full audit traces.
5. **Unified Persistence**: Despite separated controllers and services, all roles share a single source of truth in `[feature].repository.ts`.



---

## 2. Standard Response Envelope (`ApiResponse`)

All endpoints return a uniform JSON envelope or throw standard HTTP exceptions wrapped by `ApiResponse`.

### Response Structure

#### Single Item / Operation
```json
{
  "success": true,
  "message": "Resource retrieved successfully.",
  "data": { ... }
}
```

#### Paginated List
```json
{
  "success": true,
  "message": "Data retrieved successfully.",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 20,
    "to": 20,
    "total": 98
  }
}
```

#### Error Response
```json
{
  "statusCode": 422,
  "message": ["name must be longer than 3 characters"],
  "error": "Unprocessable Entity",
  "path": "/api/products",
  "timestamp": "2026-10-28T17:00:00.000Z"
}
```

### `ApiResponse` Implementation (`src/common/http/api-response.ts`)

```typescript
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { PaginationMeta } from '../../shared/pagination/pagination.utils.js';

export class ApiResponse {
  static success<T>(data: T | null = null, message = 'Success') {
    return { success: true, message, data };
  }

  static withPagination<T>(
    items: T[],
    meta: PaginationMeta,
    message = 'Data retrieved successfully.',
  ) {
    return { success: true, message, data: items, meta };
  }

  static created<T>(data: T | null = null, message = 'Resource created successfully.') {
    return { success: true, message, data };
  }

  static updated<T>(data: T | null = null, message = 'Resource updated successfully.') {
    return { success: true, message, data };
  }

  static deleted(message = 'Resource deleted successfully.') {
    return { success: true, message, data: null };
  }

  static fail(message: string, errors?: unknown) {
    return errors !== undefined ? { success: false, message, errors } : { success: false, message };
  }

  static badRequest(message = 'Bad request'): never {
    throw new HttpException(ApiResponse.fail(message), HttpStatus.BAD_REQUEST);
  }

  static unauthorized(message = 'Unauthorized'): never {
    throw new UnauthorizedException(ApiResponse.fail(message));
  }

  static forbidden(message = 'Forbidden'): never {
    throw new ForbiddenException(ApiResponse.fail(message));
  }

  static notFound(message = 'Resource not found'): never {
    throw new NotFoundException(ApiResponse.fail(message));
  }

  static validationError(message = 'Validation failed', errors?: unknown): never {
    throw new UnprocessableEntityException(ApiResponse.fail(message, errors));
  }
}
```

---

## 3. Standard Pagination Pattern

### Pagination Utility (`src/shared/pagination/pagination.utils.ts`)

```typescript
export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export function getPagination(page: number = 1, limit: number = 20) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  const skip = (p - 1) * l;
  const take = l;

  return {
    skip,
    take,
    page: p,
    limit: l,
    wrap: <T>(items: T[], totalElements: number) => ({
      content: items,
      totalElements,
      totalPages: Math.ceil(totalElements / l),
      page: p,
      limit: l,
    }),
  };
}

export function buildPaginationMeta(
  total: number,
  currentPage: number,
  perPage: number,
  dataLength: number,
): PaginationMeta {
  const lastPage = total === 0 ? 1 : Math.ceil(total / perPage);
  const hasRows = dataLength > 0;
  const from = hasRows ? (currentPage - 1) * perPage + 1 : null;
  const to = hasRows ? from! + dataLength - 1 : null;

  return {
    current_page: currentPage,
    from,
    last_page: lastPage,
    per_page: perPage,
    to,
    total,
  };
}
```

### Controller Usage

```typescript
@Get()
@ApiOperation({ summary: 'List items (paginated, searchable, filtered)' })
async findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  @Query('search') search?: string,
  @Query('isActive', new ParseBooleanPipe('isActive')) isActive?: boolean,
) {
  return this.service.findAll({ page, limit, search, isActive });
}
```

### Service Usage

```typescript
async findAll(params: { page: number; limit: number; search?: string; isActive?: boolean }) {
  const { items, total, page, limit } = await this.repository.findAll(params);
  const meta = buildPaginationMeta(total, page, limit, items.length);
  return ApiResponse.withPagination(items, meta, 'Items retrieved successfully.');
}
```

### Repository Usage

```typescript
async findAll(params: { page: number; limit: number; search?: string; isActive?: boolean }) {
  const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

  const where: Prisma.ItemWhereInput = {
    deletedAt: null,
    ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
    ...(params.search?.trim()
      ? { name: { contains: params.search.trim(), mode: 'insensitive' } }
      : {}),
  };

  const [items, total] = await Promise.all([
    this.prisma.item.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    this.prisma.item.count({ where }),
  ]);

  return { items, total, page: p, limit: l };
}
```

---

## 4. Custom Pipes Collection

All pipes reside in `src/common/pipes/` and provide explicit, user-friendly error messages with the field name.

### 1. `ParseNumberPipe` (`src/common/pipes/parse-number.pipe.ts`)
Validates that an optional or required parameter converts cleanly to a number.
```typescript
@Query('shopId', new ParseNumberPipe('shopId')) shopId?: number
```

### 2. `ParseBooleanPipe` (`src/common/pipes/parse-boolean.pipe.ts`)
Converts `'true'`, `'false'`, `'1'`, `'0'`, `true`, `false`, `1`, `0` to boolean.
```typescript
@Query('isActive', new ParseBooleanPipe('isActive')) isActive?: boolean
```

### 3. `ParseStringPipe` (`src/common/pipes/parse-string.pipe.ts`)
Validates against an optional array of allowed strings (enum-like).
```typescript
@Query('status', new ParseStringPipe('status', ['PENDING', 'COMPLETED'])) status?: string
```

### 4. `ParseDatePipe` (`src/common/pipes/parse-date.pipe.ts`)
Validates and parses ISO date strings.
```typescript
@Query('startDate', new ParseDatePipe('startDate')) startDate?: Date
```

### 5. `ParseNumberArrayPipe` (`src/common/pipes/parse-number-array.pipe.ts`)
Parses `[1, 2, 3]` from JSON or query parameters.

### 6. `ParseStringArrayPipe` (`src/common/pipes/parse-string-array.pipe.ts`)
Parses comma-delimited strings (`"a,b,c"`) or JSON arrays (`'["a","b"]'`).

### 7. `ParseOptionalFloatPipe` (`src/common/pipes/parse-optional-float.pipe.ts`)
Parses floating point numbers without failing when the optional field is omitted.

---

## 5. Authentication & Authorization (JWT + RBAC)

### 1. Current User Decorator (`src/common/decorators/current-user.decorator.ts`)
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 2. Roles Decorator (`src/common/decorators/roles.decorator.ts`)
```typescript
import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### 3. JWT Auth Guard (`src/common/guards/jwt-auth.guard.ts`)
```typescript
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-access') {
  override handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
  ): TUser {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid access token');
      }
      throw err || new UnauthorizedException('Missing or invalid access token');
    }
    return user;
  }
}
```

### 4. Roles Guard (`src/common/guards/roles.guard.ts`)
```typescript
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
```

---

## 6. Global Interceptors & Exception Filter

### 1. `LoggingInterceptor` (`src/common/interceptors/logging.interceptor.ts`)
Logs HTTP method, path, response status code, and latency in milliseconds.

### 2. `TransformInterceptor` (`src/common/interceptors/transform.interceptor.ts`)
Ensures all raw returns (`return data`) automatically become `{ success: true, message: 'Success', data: ... }` if not already an `ApiResponse`.

### 3. `AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`)
Normalizes all unhandled exceptions and Nest `HttpException`s into a consistent format:
`{ statusCode, message, error, path, timestamp }`.

---

## 7. Application Bootstrap (`main.ts`)

```typescript
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { setupSwagger } from './bootstrap/swagger.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser(configService.get('SESSION_SECRET')));
  app.enableCors({ origin: true, credentials: true });

  // 1. Global Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 2. Global Validation Pipe with UNPROCESSABLE_ENTITY (422)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  // 3. Global Unified Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 4. Swagger Documentation
  setupSwagger(app);

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on port ${port}`);
}

bootstrap();
```

---

## 8. End-to-End Feature Module Template

Copy and paste this clean template whenever adding a new feature module to a project.

### Module (`items.module.ts`)
```typescript
import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import { ItemsRepository } from './items.repository.js';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, ItemsRepository],
  exports: [ItemsService],
})
export class ItemsModule {}
```

### Controller (`items.controller.ts`)
```typescript
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ParseBooleanPipe } from '../../common/pipes/parse-boolean.pipe.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { ItemsService } from './items.service.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List items (paginated, searchable)' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive', new ParseBooleanPipe('isActive')) isActive?: boolean,
  ) {
    return this.itemsService.findAll({ page, limit, search, isActive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create item (Admin only)' })
  async create(
    @Body() dto: CreateItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.itemsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update item' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete item' })
  async remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
```

### Service (`items.service.ts`)
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '../../common/http/api-response.js';
import { buildPaginationMeta } from '../../shared/pagination/pagination.utils.js';
import { ItemsRepository } from './items.repository.js';
import type { CreateItemDto } from './dto/create-item.dto.js';
import type { UpdateItemDto } from './dto/update-item.dto.js';

@Injectable()
export class ItemsService {
  constructor(private readonly repository: ItemsRepository) {}

  async findAll(params: { page: number; limit: number; search?: string; isActive?: boolean }) {
    const { items, total, page, limit } = await this.repository.findAll(params);
    const meta = buildPaginationMeta(total, page, limit, items.length);
    return ApiResponse.withPagination(items, meta, 'Items retrieved successfully.');
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return ApiResponse.success(item, 'Item retrieved successfully.');
  }

  async create(dto: CreateItemDto, userId: string) {
    const created = await this.repository.create({ ...dto, createdById: userId });
    return ApiResponse.created(created, 'Item created successfully.');
  }

  async update(id: string, dto: UpdateItemDto) {
    await this.findOne(id);
    const updated = await this.repository.update(id, dto);
    return ApiResponse.updated(updated, 'Item updated successfully.');
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repository.delete(id);
    return ApiResponse.deleted('Item deleted successfully.');
  }
}
```

### Repository (`items.repository.ts`)
```typescript
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { getPagination } from '../../shared/pagination/pagination.utils.js';

@Injectable()
export class ItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

    const where: Prisma.ItemWhereInput = {
      deletedAt: null,
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.search?.trim()
        ? {
            OR: [
              { name: { contains: params.search.trim(), mode: 'insensitive' } },
              { description: { contains: params.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.item.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async findById(id: string) {
    return this.prisma.item.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.item.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.item.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.item.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
```

---

### 8.2 Multi-Role Module Definition Template (`[feature].module.ts`)

Golden blueprint for registering multi-role controllers and services:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module.js';

// Module Root Shared Persistence & Shared Query/Domain Service
import { FeatureRepository } from './[feature].repository.js';
import { FeatureService } from './[feature].service.js';

// Admin Layer
import { AdminFeatureController } from './admin/admin-[feature].controller.js';
import { AdminFeatureService } from './admin/admin-[feature].service.js';

// User / Customer Layer
import { UserFeatureController } from './user/user-[feature].controller.js';
import { UserFeatureService } from './user/user-[feature].service.js';

// Optional: Shop / Merchant Layer (if multi-vendor)
// import { ShopFeatureController } from './shop/shop-[feature].controller.js';
// import { ShopFeatureService } from './shop/shop-[feature].service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    // Storefront public/customer HTTP routes
    UserFeatureController,

    // Admin console HTTP routes
    AdminFeatureController,

    // Optional vendor routes
    // ShopFeatureController,
  ],
  providers: [
    // Central data access layer
    FeatureRepository,

    // Shared core/query service
    FeatureService,

    // Role-specific business services
    AdminFeatureService,
    UserFeatureService,
    // ShopFeatureService,
  ],
  exports: [FeatureRepository, FeatureService],
})
export class FeatureModule {}
```

> **Rule for Subtypes (e.g. `orders` with `digital` & `smm`)**:
> If the feature contains distinct fulfillment engines or subtypes, declare their controllers and services inside `controllers` and `providers` under `admin/[subtype]/` and `user/[subtype]/` without altering the root module boundaries.

---

*Generated as project architectural reference standard.*

