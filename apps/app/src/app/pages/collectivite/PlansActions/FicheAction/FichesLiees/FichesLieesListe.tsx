import FicheActionCardSkeleton from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCardSkeleton';
import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { CollectiviteAccess } from '@tet/domain/users';
import classNames from 'classnames';
import FicheActionCard from '../Carte/FicheActionCard';

type FichesLieesListeProps = {
  fiches: FicheListItem[];
  className?: string;
  onUnlink?: (ficheId: number) => void;
  collectivite: CollectiviteAccess;
  currentUserId: string;
  isLoading?: boolean;
};

const FichesLieesListe = ({
  fiches,
  className,
  onUnlink,
  collectivite,
  currentUserId,
  isLoading,
}: FichesLieesListeProps) => {
  if (!isLoading && fiches.length === 0) return null;

  return (
    // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
    <div>
      <div
        className={classNames(
          'grid lg:grid-cols-2 xl:grid-cols-3 gap-3',
          className
        )}
      >
        {isLoading
          ? [1, 2, 3].map((i) => <FicheActionCardSkeleton key={i} />)
          : fiches.map((fiche) => (
              <FicheActionCard
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
    </div>
  );
};

export default FichesLieesListe;
