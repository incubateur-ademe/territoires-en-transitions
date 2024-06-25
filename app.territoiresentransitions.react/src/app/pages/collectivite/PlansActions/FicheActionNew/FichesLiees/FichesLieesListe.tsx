import {useCollectiviteId} from 'core-logic/hooks/params';
import {FicheResume} from '../../FicheAction/data/types';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import FicheActionCard from '../../FicheAction/Carte/FicheActionCard';

type FichesLieesListeProps = {
  fiches: FicheResume[];
};

const FichesLieesListe = ({fiches}: FichesLieesListeProps) => {
  const collectiviteId = useCollectiviteId()!;

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
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
        />
      ))}
    </div>
  );
};

export default FichesLieesListe;
