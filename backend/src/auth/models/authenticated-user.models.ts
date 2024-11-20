import { User } from '@supabase/supabase-js';

export enum UserRole {
  AUTHENTICATED = 'authenticated',
  SERVICE_ROLE = 'service_role',
  ANON = 'anon', // Anonymous
}

export interface AuthenticatedUser extends User {
  role: UserRole;
}
