import {
  AuthenticatedUser,
  buildRequesterUser,
} from '@tet/backend/users/models/auth.models';
import { PermissionOperation } from '@tet/domain/users';

/**
 * Opérations vérifiées par les outils du serveur MCP, toutes en lecture
 * (`demarches.pcaet.mutate` est la règle de l'app pour lire la démarche en
 * cours, `collectivites.mutate` celle de `find_user` pour un utilisateur sans
 * collectivité). Un nouvel outil qui en vérifie une autre sera refusé dans
 * Crisp tant qu'elle n'est pas ajoutée ici.
 */
const SUPPORT_ELEVATION_OPERATIONS: PermissionOperation[] = [
  'utils.mcp.read',
  'collectivites.read',
  'collectivites.read_confidentiel',
  'collectivites.membres.read',
  'collectivites.mutate',
  'plans.read',
  'plans.read_confidentiel',
  'referentiels.read',
  'referentiels.read_confidentiel',
  'demarches.pcaet.mutate',
];

/**
 * Compte support lu comme en mode super admin, limité aux opérations des
 * outils MCP : c'est ce que l'assistant voit quand on l'appelle depuis Crisp.
 */
export const buildCrispSupportUser = (userId: string): AuthenticatedUser => {
  const user = buildRequesterUser(userId);
  return {
    ...user,
    supportElevation: 'crisp',
    jwtPayload: {
      ...user.jwtPayload,
      client_id: 'assistant-crisp',
      permissions: SUPPORT_ELEVATION_OPERATIONS,
    },
  };
};
