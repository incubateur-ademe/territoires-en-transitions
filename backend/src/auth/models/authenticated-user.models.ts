import { User as SupabaseUser } from '@supabase/supabase-js';

export enum UserRole {
  AUTHENTICATED = 'authenticated',
  SERVICE_ROLE = 'service_role',
  ANON = 'anon', // Anonymous
}

export type User = SupabaseUser;

export interface AnonymousUser extends User {
  role: UserRole.ANON;
  is_anonymous: true;
}

export interface AuthenticatedUser extends User {
  role: UserRole.AUTHENTICATED;
  is_anonymous: false;
}

export function isAnonymousUser(user: User | null): user is AnonymousUser {
  return user?.role === UserRole.ANON && user.is_anonymous === true;
}

export function isAuthenticatedUser(
  user: User | null
): user is AuthenticatedUser {
  return user?.role === UserRole.AUTHENTICATED && user.is_anonymous === false;
}
