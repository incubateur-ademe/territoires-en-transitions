import {useCollectiviteId} from 'core-logic/hooks/params';
import FicheActionCard from './FicheAction/Carte/FicheActionCard';
import {useFichesNonClasseesListe} from './FicheAction/data/useFichesNonClasseesListe';
import {makeCollectiviteFicheNonClasseeUrl} from 'app/paths';

const FichesNonClassees = () => {
  const collectivite_id = useCollectiviteId();

  const {data} = useFichesNonClasseesListe(collectivite_id!);

  if (!collectivite_id || !data) return null;

  return (
    <div data-test="FichesNonClassees" className="p-10 grow">
      {data.length !== 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {data.map(f => (
            <FicheActionCard
              key={f.id}
              ficheAction={f}
              link={makeCollectiviteFicheNonClasseeUrl({
                collectiviteId: f.collectivite_id!,
                ficheUid: f.id!.toString(),
              })}
              isEditable
              editKeysToInvalidate={[['axe_fiches', null]]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FichesNonClassees;
