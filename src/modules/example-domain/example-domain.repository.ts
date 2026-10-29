import { Injectable } from '@nestjs/common';
import type { Prisma, ExampleDomain } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { getPagination } from '../../shared/pagination/pagination.utils.js';

@Injectable()
export class ExampleDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPaginated(params: {
    page: number;
    limit: number;
    ownerId?: string;
    status?: string;
    search?: string;
  }) {
    const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

    const where: Prisma.ExampleDomainWhereInput = {
      deletedAt: null,
      ...(params.ownerId ? { ownerId: params.ownerId } : {}),
      ...(params.status ? { status: params.status } : {}),
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
      this.prisma.exampleDomain.findMany({
        where,
        skip,
        take,
        include: { owner: { select: { id: true, email: true, name: true, role: true } } },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.exampleDomain.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async findById(id: string): Promise<ExampleDomain | null> {
    return this.prisma.exampleDomain.findUnique({
      where: { id },
      include: { owner: true },
    });
  }

  async create(data: Prisma.ExampleDomainCreateInput): Promise<ExampleDomain> {
    return this.prisma.exampleDomain.create({ data });
  }

  async update(id: string, data: Prisma.ExampleDomainUpdateInput): Promise<ExampleDomain> {
    return this.prisma.exampleDomain.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<ExampleDomain> {
    return this.prisma.exampleDomain.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }
}

