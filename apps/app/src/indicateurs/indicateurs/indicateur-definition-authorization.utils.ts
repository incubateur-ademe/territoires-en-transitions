import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@tet/domain/users';
import { IndicateurDefinition } from './use-get-indicateur';

export function canUpdateIndicateurDefinition(
  permissions: PermissionOperation[],
  indicateurDefinition: Pick<IndicateurDefinition, 'pilotes'>,
  userId: string
): boolean {
  if (hasPermission(permissions, 'indicateurs.indicateurs.update')) {
    return true;
  }
  return (
    hasPermission(
      permissions,
      'indicateurs.indicateurs.update_piloted_by_me'
    ) && indicateurDefinition.pilotes?.some((p) => p.userId === userId)
  );
}
