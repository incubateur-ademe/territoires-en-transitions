import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheResume} from '../data/types';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import FicheActionCard from '../Carte/FicheActionCard';
import classNames from 'classnames';

type FichesLieesListeProps = {
  fiches: FicheResume[];
  className?: string;
  onUnlink?: (ficheId: number) => void;
};

const FichesLieesListe = ({
  fiches,
  className,
  onUnlink,
}: FichesLieesListeProps) => {
  const collectiviteId = useCollectiviteId()!;

  if (fiches.length === 0) return null;

  return (
    // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
    <div>
      <div
        className={classNames(
          'grid lg:grid-cols-2 xl:grid-cols-3 gap-3',
          className
        )}
      >
        {fiches.map(fiche => (
          <FicheActionCard
            key={fiche.id}
            openInNewTab
            ficheAction={fiche}
            link={
              fiche.plans && fiche.plans[0] && fiche.plans[0].id
                ? makeCollectivitePlanActionFicheUrl({
                    collectiviteId,
                    ficheUid: fiche.id!.toString(),
                    planActionUid: fiche.plans[0].id!.toString(),
                  })
                : makeCollectiviteFicheNonClasseeUrl({
                    collectiviteId,
                    ficheUid: fiche.id!.toString(),
                  })
            }
            onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default FichesLieesListe;
