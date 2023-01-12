import {useCollectiviteId} from 'core-logic/hooks/params';
import FicheActionCard from './FicheAction/FicheActionCard';
import {useFichesNonClasseesListe} from './FicheAction/data/useFichesNonClasseesListe';
import {makeCollectiviteFicheNonClasseeUrl} from 'app/paths';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import {useCreateFicheAction} from './FicheAction/data/useUpsertFicheAction';

const FichesNonClassees = () => {
  const collectivite_id = useCollectiviteId();

  const data = useFichesNonClasseesListe(collectivite_id!);

  const {mutate: createFicheAction} = useCreateFicheAction();

  if (!collectivite_id || !data) return null;

  return (
    <div className="p-10 grow">
      {data.fiches.length === 0 ? (
        <div className="flex flex-col items-center mt-8">
          <PictoLeaf className="w-24 fill-gray-400" />
          <div className="my-6 text-gray-500">Aucune fiche non classée</div>
          <button className="fr-btn" onClick={() => createFicheAction()}>
            Créer une fiche action
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {data.fiches.map(f => (
            <FicheActionCard
              key={f.id}
              ficheAction={f}
              link={makeCollectiviteFicheNonClasseeUrl({
                collectiviteId: f.collectivite_id!,
                ficheUid: f.id!.toString(),
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FichesNonClassees;
