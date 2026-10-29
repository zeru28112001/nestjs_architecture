import { Injectable } from '@nestjs/common';
import type { Prisma, ExampleItem } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { getPagination } from '../../shared/pagination/pagination.utils.js';

@Injectable()
export class ExampleItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

    const where: Prisma.ExampleItemWhereInput = {
      deletedAt: null,
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.search?.trim()
        ? {
            OR: [
              { title: { contains: params.search.trim(), mode: 'insensitive' } },
              { description: { contains: params.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.exampleItem.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.exampleItem.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async findById(id: string): Promise<ExampleItem | null> {
    return this.prisma.exampleItem.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.ExampleItemCreateInput): Promise<ExampleItem> {
    return this.prisma.exampleItem.create({ data });
  }

  async update(id: string, data: Prisma.ExampleItemUpdateInput): Promise<ExampleItem> {
    return this.prisma.exampleItem.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<ExampleItem> {
    return this.prisma.exampleItem.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}

