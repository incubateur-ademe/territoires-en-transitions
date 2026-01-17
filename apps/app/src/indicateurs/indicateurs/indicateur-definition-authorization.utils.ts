import { PermissionOperation } from '@tet/domain/users';
import { IndicateurDefinition } from './use-get-indicateur';

export function canUpdateIndicateurDefinition(
  hasCollectivitePermission: (permission: PermissionOperation) => boolean,
  indicateurDefinition: Pick<IndicateurDefinition, 'pilotes'>,
  userId: string
): boolean {
  if (hasCollectivitePermission('indicateurs.indicateurs.update')) {
    return true;
  }
  return (
    hasCollectivitePermission(
      'indicateurs.indicateurs.update_piloted_by_me'
    ) && indicateurDefinition.pilotes?.some((p) => p.userId === userId)
  );
}
