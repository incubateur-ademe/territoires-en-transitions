import FicheActionCardSkeleton from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCardSkeleton';
import { getFichePageUrlForCollectivite } from '@/app/plans/fiches/get-fiche/get-fiche-page-url.util';
import { FicheResume } from '@/domain/plans';
import { CollectiviteAccess } from '@/domain/users';
import classNames from 'classnames';
import FicheActionCard from '../Carte/FicheActionCard';

type FichesLieesListeProps = {
  fiches: FicheResume[];
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
                link={getFichePageUrlForCollectivite({
                  collectiviteId: collectivite.collectiviteId,
                  fiche,
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
