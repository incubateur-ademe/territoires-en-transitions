import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';

/** Construit un `AuthenticatedUser` à partir des champs user DB (sans JWT réel). */
export function getAuthUserFromUserCredentials(user: {
  id: string;
  email: string | null;
  telephone?: string | null;
}): AuthenticatedUser {
  return {
    id: user.id,
    role: AuthRole.AUTHENTICATED,
    isAnonymous: false,
    jwtPayload: {
      role: AuthRole.AUTHENTICATED,
      email: user.email ?? undefined,
      is_anonymous: false,
      phone: user.telephone ?? undefined,
      app_metadata: {
        provider: 'email',
      },
    },
  };
}
