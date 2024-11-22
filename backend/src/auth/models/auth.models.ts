import { User as SupabaseUser } from '@supabase/supabase-js';
import { UUID } from 'crypto';
import { JwtPayload } from 'jsonwebtoken';

export enum AuthRole {
  AUTHENTICATED = 'authenticated',
  SERVICE_ROLE = 'service_role',
  ANON = 'anon', // Anonymous
}

export type User = Pick<SupabaseUser, 'id' | 'role' | 'is_anonymous'>;

export interface AnonymousUser extends User {
  role: AuthRole.ANON;
  is_anonymous: true;
}

export interface AuthenticatedUser extends User {
  role: AuthRole.AUTHENTICATED;
  is_anonymous: false;
}

export function isAnonymousUser(user: User | null): user is AnonymousUser {
  return user?.role === AuthRole.ANON && user.is_anonymous === true;
}

export function isAuthenticatedUser(
  user: User | null
): user is AuthenticatedUser {
  return user?.role === AuthRole.AUTHENTICATED && user.is_anonymous === false;
}

export interface AuthJwtPayload extends JwtPayload {
  role: AuthRole;
}

export interface AnonymousJwtPayload extends AuthJwtPayload {
  role: AuthRole.ANON;
}

export function isAnonymousJwt(
  jwt: AuthJwtPayload
): jwt is AnonymousJwtPayload {
  return jwt.role === AuthRole.ANON;
}

export function jwtToAuthenticatedUser(jwt: AuthJwtPayload): AuthenticatedUser {
  if (jwt.role !== AuthRole.AUTHENTICATED) {
    throw new Error(`JWT role is invalid: ${jwt.role}`);
  }

  if (jwt.sub === undefined) {
    throw new Error('JWT sub claim is missing');
  }

  return {
    id: jwt.sub,
    role: AuthRole.AUTHENTICATED,
    is_anonymous: false,
  };
}
