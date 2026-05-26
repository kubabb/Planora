// User model

export interface User {
  id: string;
  name: string;
  email?: string;
  profile: 'local' | 'supabase';
  createdAt: Date;
}

export type CreateUserInput = Omit<User, 'id' | 'createdAt'>;
