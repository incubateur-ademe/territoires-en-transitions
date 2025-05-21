import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import FicheActionCard from './FicheAction/Carte/FicheActionCard';
import { useFichesNonClasseesListe } from './FicheAction/data/useFichesNonClasseesListe';

const FichesNonClassees = () => {
  const collectivite_id = useCollectiviteId();

  const { data } = useFichesNonClasseesListe();

  if (!collectivite_id || !data) return null;

  return (
    <div data-test="FichesNonClassees" className="p-10 grow">
      {data.length !== 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {data.map((f) => (
            <FicheActionCard
              key={f.id}
              ficheAction={f}
              link={makeCollectiviteFicheNonClasseeUrl({
                collectiviteId: f.collectiviteId,
                ficheUid: f.id.toString(),
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
