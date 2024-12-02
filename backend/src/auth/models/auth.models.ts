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
  jwtToken: AuthJwtPayload<Role>;
}

export type AnonymousUser = AuthUser<AuthRole.ANON>;
export type AuthenticatedUser = AuthUser<AuthRole.AUTHENTICATED>;
export type ServiceRoleUser = AuthUser<AuthRole.SERVICE_ROLE>;

export function isAnonymousUser(user: AuthUser | null): user is AnonymousUser {
  return user?.role === AuthRole.ANON && user.isAnonymous === true;
}

export function isServiceRoleUser(
  user: AuthUser | null
): user is AnonymousUser {
  return user?.role === AuthRole.SERVICE_ROLE && user.isAnonymous === true;
}

export function isAuthenticatedUser(
  user: AuthUser | null
): user is AuthenticatedUser {
  return user?.role === AuthRole.AUTHENTICATED && user?.isAnonymous === false;
}

export interface AuthJwtPayload<Role extends AuthRole = AuthRole>
  extends JwtPayload {
  role: Role;
}

export function jwtToUser(jwt: AuthJwtPayload): AuthUser {
  if (jwt.role === AuthRole.AUTHENTICATED) {
    if (jwt.sub === undefined) {
      throw new Error(`JWT sub claim is missing: ${JSON.stringify(jwt)}`);
    }

    return {
      id: jwt.sub,
      role: AuthRole.AUTHENTICATED,
      isAnonymous: false,
      jwtToken: jwt,
    };
  }

  if (jwt.role === AuthRole.ANON) {
    return {
      id: null,
      role: AuthRole.ANON,
      isAnonymous: true,
      jwtToken: jwt,
    };
  }

  if (jwt.role === AuthRole.SERVICE_ROLE) {
    return {
      id: null,
      role: AuthRole.SERVICE_ROLE,
      isAnonymous: true,
      jwtToken: jwt,
    };
  }

  throw new Error(`JWT role is invalid: ${JSON.stringify(jwt)}`);
}
