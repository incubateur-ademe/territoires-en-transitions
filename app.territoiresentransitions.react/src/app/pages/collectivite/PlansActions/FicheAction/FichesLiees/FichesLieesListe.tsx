import { CollectiviteNiveauAccess } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import { FicheResume } from '@/domain/plans/fiches';
import classNames from 'classnames';
import FicheActionCard from '../Carte/FicheActionCard';
import { CollectiviteNiveauAccess } from '@/api/collectivites/fetch-collectivite-niveau-acces';

type FichesLieesListeProps = {
  fiches: FicheResume[];
  className?: string;
  onUnlink?: (ficheId: number) => void;
  collectivite: CollectiviteNiveauAccess;
};

const FichesLieesListe = ({
  fiches,
  className,
  onUnlink,
  collectivite,
}: FichesLieesListeProps) => {
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
        {fiches.map((fiche) => (
          <FicheActionCard
            key={fiche.id}
            openInNewTab
            ficheAction={fiche}
            link={
              fiche.plans && fiche.plans[0] && fiche.plans[0].id
                ? makeCollectivitePlanActionFicheUrl({
                    collectiviteId: collectivite.id,
                    ficheUid: fiche.id.toString(),
                    planActionUid: fiche.plans[0].id.toString(),
                  })
                : makeCollectiviteFicheNonClasseeUrl({
                    collectiviteId: collectivite.id,
                    ficheUid: fiche.id.toString(),
                  })
            }
            onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
            currentCollectivite={collectivite}
          />
        ))}
      </div>
    </div>
  );
};

export default FichesLieesListe;
