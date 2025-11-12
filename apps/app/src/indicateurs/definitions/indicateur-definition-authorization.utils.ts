import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@/domain/users';
import { IndicateurDefinition } from './use-get-indicateur-definition';

export function canUpdateIndicateurDefinition(
  permissions: PermissionOperation[],
  indicateurDefinition: Pick<IndicateurDefinition, 'pilotes'>,
  userId: string
): boolean {
  if (hasPermission(permissions, 'indicateurs.definitions.update')) {
    return true;
  }
  return (
    hasPermission(
      permissions,
      'indicateurs.definitions.update_piloted_by_me'
    ) && indicateurDefinition.pilotes?.some((p) => p.userId === userId)
  );
}
