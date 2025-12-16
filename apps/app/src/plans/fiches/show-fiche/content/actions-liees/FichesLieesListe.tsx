import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { FicheWithRelations } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import classNames from 'classnames';
import { FicheActionCard } from './Carte/FicheActionCard';
import { FicheActionCardSkeleton } from './Carte/FicheActionCardSkeleton';

type FichesLieesListeProps = {
  fiches: FicheWithRelations[];
  className?: string;
  onUnlink?: (ficheId: number) => void;
  collectivite: CollectiviteAccess;
  currentUserId: string;
  isLoading?: boolean;
};

export const FichesLieesListe = ({
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
