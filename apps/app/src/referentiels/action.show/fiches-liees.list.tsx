import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { FicheCard } from '@/app/plans/fiches/components/card/fiche.card';
import { FicheCardSkeleton } from '@/app/plans/fiches/components/card/fiche.skeleton';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { CollectiviteCurrent } from '@tet/api/collectivites';

type FichesLieesListeProps = {
  fiches: FicheListItem[];
  onUnlink?: (ficheId: number) => void;
  collectivite: CollectiviteCurrent;
  currentUserId: string;
  isLoading?: boolean;
};

export const FichesLieesListe = ({
  fiches,
  onUnlink,
  collectivite,
  currentUserId,
  isLoading,
}: FichesLieesListeProps) => {
  if (!isLoading && fiches.length === 0) return null;

  return (
    <div>
      {isLoading
        ? [1, 2, 3].map((i) => <FicheCardSkeleton key={i} />)
        : fiches.map((fiche) => (
            <FicheCard
              key={fiche.id}
              ficheAction={fiche}
              link={makeCollectiviteActionUrl({
                collectiviteId: collectivite.collectiviteId,
                ficheUid: fiche.id.toString(),
              })}
              onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
              currentCollectivite={collectivite}
              currentUserId={currentUserId}
            />
          ))}
    </div>
  );
};
