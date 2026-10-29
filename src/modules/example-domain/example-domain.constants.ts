export const DOMAIN_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;

export type DomainStatus = typeof DOMAIN_STATUS[keyof typeof DOMAIN_STATUS];

