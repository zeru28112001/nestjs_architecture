# Production-Grade NestJS Architecture Blueprint (`nestjs_architecture`)

[![NestJS](https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A standardized, production-ready NestJS starter template and golden architectural reference blueprint inspired by real-world enterprise architectures (`myshop_demo_api`).

Designed to eliminate guesswork and boilerplate friction when scaffolding any new NestJS backend.

---

## 🎯 How to Use This Repository for New Projects

### Best Approach: Use as a GitHub Template
1. Mark this repository as a **Template Repository** in GitHub Settings (`Settings` -> Check `Template repository`).
2. When starting any new NestJS project:
   - Click the green **"Use this template"** button on GitHub -> **"Create a new repository"**.
   - Clone your new repository and start coding immediately without carrying old commit history!

### Alternative: Git Clone
```bash
git clone https://github.com/zeru28112001/nestjs_architecture.git my-new-project
cd my-new-project
rm -rf .git
git init
```

---

## 🏗️ Directory Architecture

```text
src/
├── app.module.ts                   # Root application module
├── main.ts                         # Bootstrap entry point (Swagger, CORS, validation)
│
├── common/                         # Cross-cutting framework primitives
│   ├── decorators/                 # @CurrentUser(), @Roles(), @Public()
│   ├── dto/                        # Reusable PaginationQueryDto
│   ├── filters/                    # Global AllExceptionsFilter
│   ├── guards/                     # JwtAuthGuard, RolesGuard (RBAC)
│   ├── http/                       # ApiResponse uniform envelope & Client IP helper
│   ├── interceptors/               # LoggingInterceptor, TransformInterceptor
│   ├── pipes/                      # Custom pipes (ParseNumber, ParseBoolean, ParseDate, etc.)
│   └── types/                      # AuthenticatedUser interface
│
├── config/                         # Environment schema & validation (Zod)
│   └── env.schema.ts
│
├── shared/                         # Infrastructure & database providers
│   ├── pagination/                 # buildPaginationMeta & getPagination helpers
│   └── prisma/                     # Global PrismaModule & PrismaService
│
└── modules/                        # Feature domain modules
    │
    ├── auth/                       # JWT Authentication, registration, and Passport strategy
    │
    ├── example-item/               # Pattern A: Single-Actor Feature Module
    │   ├── example-item.module.ts
    │   ├── example-item.controller.ts
    │   ├── example-item.service.ts
    │   ├── example-item.repository.ts
    │   └── dto/
    │
    └── example-domain/             # Pattern B: Multi-Role Domain Module (Golden Standard)
        ├── example-domain.module.ts
        ├── example-domain.repository.ts   # Central Prisma transactions & queries
        ├── example-domain.service.ts      # Shared core query/lookup logic
        ├── example-domain.constants.ts
        ├── domain/                        # Domain entities & records
        ├── dto/                           # Cross-role query DTOs
        ├── admin/                         # Admin Console (@Roles('ADMIN'))
        │   ├── admin-domain.controller.ts
        │   ├── admin-domain.service.ts
        │   └── dto/
        ├── user/                          # Storefront / Customer (@CurrentUser())
        │   ├── user-domain.controller.ts
        │   ├── user-domain.service.ts
        │   ├── mapper/                    # Response masking & DTO transformation
        │   └── dto/
        └── shop/                          # Vendor / Merchant Boundary (if applicable)
            ├── shop-domain.controller.ts
            ├── shop-domain.service.ts
            └── dto/
```

---

## ⚡ The 4 Core Architectural Principles

### 1. Strict Controller → Service → Repository Pattern
- **Controller**: HTTP boundary only. Validates inputs, handles routes, extracts `@CurrentUser()`.
- **Service**: Domain validations, business rules, transactional orchestration, emits events.
- **Repository**: Data access layer only. Performs Prisma queries (`findMany`, `count`, `$transaction`), pagination math (`skip`, `take`), and database row mapping. Services never directly inject Prisma when a repository exists.

### 2. Role-First Boundary Separation
Multi-actor modules divide controllers and business services into `admin/`, `user/`, and `shop/` subdirectories.
- Admin routes are protected with `@Roles('ADMIN')` and `@UseGuards(JwtAuthGuard, RolesGuard)`.
- Customer routes are protected with `@UseGuards(JwtAuthGuard)` and operate on `@CurrentUser()`.
- Both share the central `[feature].repository.ts` at the root of the module.

### 3. Uniform Response Envelope (`ApiResponse`)
All controllers return responses wrapped in standard `ApiResponse` shapes:

#### Single Item:
```json
{
  "success": true,
  "message": "Resource retrieved successfully.",
  "data": { "id": "uuid", "title": "Example" }
}
```

#### Paginated List:
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

### 4. Custom Pipes Suite
Includes standard validation and parsing pipes for robust Query/Param conversion:
- `ParseNumberPipe`: Converts query strings to integers with optional default.
- `ParseBooleanPipe`: Parses `'true' | 'false' | '1' | '0'`.
- `ParseDatePipe`: Parses ISO strings into valid JavaScript `Date` instances.
- `ParseNumberArrayPipe` & `ParseStringArrayPipe`: Parses comma-separated values (`?ids=1,2,3`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET in .env
```

### 3. Initialize Database (Prisma)
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the Application
```bash
# Development (hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 5. Access Documentation
- **Swagger UI**: `http://localhost:3000/docs`
- **Architecture Reference Document**: See [`reference_nest.md`](./reference_nest.md)

---

## 🧪 Testing

```bash
# Run unit & service tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 📜 Full Documentation

Read the in-depth specification guide in [`reference_nest.md`](./reference_nest.md) for full implementation details, pipe signatures, exception mapping, and code templates.

