import type { ExampleDomain } from '@prisma/client';

export type PublicDomainDto = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export function toPublicDomainDto(domain: ExampleDomain): PublicDomainDto {
  return {
    id: domain.id,
    title: domain.title,
    description: domain.description,
    status: domain.status,
    createdAt: domain.createdAt.toISOString(),
  };
}

