import { PermissionOperation } from '@tet/domain/users';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';

export function canUpdateIndicateur(
  hasCollectivitePermission: (permission: PermissionOperation) => boolean,
  indicateur: Pick<IndicateurDetaille, 'pilotes'>,
  userId: string
): boolean {
  if (hasCollectivitePermission('indicateurs.indicateurs.update')) {
    return true;
  }
  return (
    hasCollectivitePermission('indicateurs.indicateurs.update_piloted_by_me') &&
    indicateur.pilotes?.some((p) => p.userId === userId)
  );
}

export function canUpdateIndicateurValeur(
  hasCollectivitePermission: (permission: PermissionOperation) => boolean,
  indicateur: Pick<IndicateurDetaille, 'pilotes'>,
  userId: string
): boolean {
  if (hasCollectivitePermission('indicateurs.valeurs.mutate')) {
    return true;
  }
  return (
    hasCollectivitePermission('indicateurs.valeurs.mutate_piloted_by_me') &&
    indicateur.pilotes?.some((p) => p.userId === userId)
  );
}
