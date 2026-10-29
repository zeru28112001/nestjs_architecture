export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: 'ADMIN' | 'USER' | 'SHOP';
  username?: string | null;
}

