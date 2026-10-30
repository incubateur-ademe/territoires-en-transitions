import { hasPermission, UserRolesAndPermissions } from '@tet/domain/users';

/**
 * Support ou super admin : la même permission que celle exigée par le serveur
 * MCP, pour ne rien montrer qui serait refusé ensuite.
 */
export const canUseAssistant = (user: UserRolesAndPermissions | null) =>
  hasPermission(user, 'utils.mcp.read');
