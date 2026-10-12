import { maskFicheRestreinte } from '@tet/backend/plans/fiches/list-fiches/fiches-restreintes.rules';
import { FicheWithRelations } from '@tet/domain/plans';

export const maskFichesNotReadableBy = ({
  fiches,
  collectiviteIdsWithRestreinteAccess,
}: {
  readonly fiches: readonly FicheWithRelations[];
  readonly collectiviteIdsWithRestreinteAccess: ReadonlySet<number>;
}): FicheWithRelations[] =>
  fiches.map((fiche) => {
    const isMasked =
      fiche.restreint &&
      !collectiviteIdsWithRestreinteAccess.has(fiche.collectiviteId);
    return isMasked ? maskFicheRestreinte(fiche) : fiche;
  });
