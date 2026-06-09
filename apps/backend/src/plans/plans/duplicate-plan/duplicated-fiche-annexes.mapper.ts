import type {
  AnnexeInsert,
  AnnexeRow,
} from '@tet/backend/plans/fiches/add-annexe/add-annexe.repository';

export function mapSourceFicheAnnexes(
  annexes: AnnexeRow[],
  {
    newFicheId,
    collectiviteId,
    modifiedBy,
  }: { newFicheId: number; collectiviteId: number; modifiedBy: string }
): AnnexeInsert[] {
  return annexes.map((annexe) => ({
    collectiviteId,
    ficheId: newFicheId,
    fichierId: annexe.fichierId,
    url: annexe.url,
    titre: annexe.titre,
    commentaire: annexe.commentaire,
    modifiedBy,
  }));
}
