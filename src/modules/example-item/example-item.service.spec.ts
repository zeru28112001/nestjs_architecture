import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ExampleItemRepository } from './example-item.repository.js';
import { ExampleItemService } from './example-item.service.js';

describe('ExampleItemService', () => {
  let service: ExampleItemService;
  let repository: ExampleItemRepository;

  beforeEach(() => {
    repository = {
      findAll: vi.fn().mockResolvedValue({
        items: [{ id: '1', title: 'Test Item' }],
        total: 1,
        page: 1,
        limit: 20,
      }),
      findById: vi.fn().mockResolvedValue({ id: '1', title: 'Test Item', deletedAt: null }),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    } as unknown as ExampleItemRepository;

    service = new ExampleItemService(repository);
  });

  it('retrieves paginated items with ApiResponse envelope', async () => {
    const res = await service.findAll({ page: 1, limit: 20 });
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.meta?.total).toBe(1);
  });

  it('retrieves single item with ApiResponse envelope', async () => {
    const res = await service.findOne('1');
    expect(res.success).toBe(true);
    expect((res.data as any).title).toBe('Test Item');
  });
});
