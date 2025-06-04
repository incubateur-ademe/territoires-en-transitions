import { User } from '@supabase/supabase-js';
import { JwtPayload } from 'jsonwebtoken';

export enum AuthRole {
  AUTHENTICATED = 'authenticated',
  SERVICE_ROLE = 'service_role',
  ANON = 'anon', // Anonymous
}

export interface AuthUser<Role extends AuthRole = AuthRole> {
  id: Role extends AuthRole.AUTHENTICATED ? string : null;
  role: Role;
  isAnonymous: Role extends AuthRole.AUTHENTICATED ? false : true;
  jwtPayload: AuthJwtPayload<Role>;
}

export type AnonymousUser = AuthUser<AuthRole.ANON>;
export type AuthenticatedUser = AuthUser<AuthRole.AUTHENTICATED>;
export type ServiceRoleUser = AuthUser<AuthRole.SERVICE_ROLE>;
export type AuthenticatedOrServiceRoleUser = AuthUser<
  AuthRole.AUTHENTICATED | AuthRole.SERVICE_ROLE
>;

export function isAnonymousUser(user: AuthUser | null): user is AnonymousUser {
  return user?.role === AuthRole.ANON && user.isAnonymous === true;
}

export function isServiceRoleUser(
  user: AuthUser | null
): user is ServiceRoleUser {
  return user?.role === AuthRole.SERVICE_ROLE && user.isAnonymous === true;
}

export function isAuthenticatedUser(
  user: AuthUser | null
): user is AuthenticatedUser {
  return user?.role === AuthRole.AUTHENTICATED && user?.isAnonymous === false;
}

export interface AuthJwtPayload<Role extends AuthRole = AuthRole>
  extends JwtPayload,
    Pick<User, 'email' | 'is_anonymous' | 'phone'>,
    Partial<Pick<User, 'app_metadata'>> {
  role: Role;
  /**
   * Used to identify the api key that generated the JWT token.
   */
  client_id?: string;

  permissions?: string[];
}

export function jwtToUser(jwtPayload: AuthJwtPayload): AuthUser {
  if (jwtPayload.role === AuthRole.AUTHENTICATED) {
    if (jwtPayload.sub === undefined) {
      throw new Error(
        `JWT sub claim is missing: ${JSON.stringify(jwtPayload)}`
      );
    }

    return {
      id: jwtPayload.sub,
      role: AuthRole.AUTHENTICATED,
      isAnonymous: false,
      jwtPayload,
    };
  }

  if (jwtPayload.role === AuthRole.ANON) {
    return {
      id: null,
      role: AuthRole.ANON,
      isAnonymous: true,
      jwtPayload,
    };
  }

  if (jwtPayload.role === AuthRole.SERVICE_ROLE) {
    return {
      id: null,
      role: AuthRole.SERVICE_ROLE,
      isAnonymous: true,
      jwtPayload,
    };
  }

  throw new Error(`JWT role is invalid: ${JSON.stringify(jwtPayload)}`);
}
