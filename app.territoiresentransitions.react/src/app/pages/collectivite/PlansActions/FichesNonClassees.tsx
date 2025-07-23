import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import FicheActionCard from './FicheAction/Carte/FicheActionCard';
import { useFichesNonClasseesListe } from './FicheAction/data/useFichesNonClasseesListe';

const FichesNonClassees = ({
  collectivite,
}: {
  collectivite: CurrentCollectivite;
}) => {
  const { data } = useFichesNonClasseesListe();

  if (!data) return null;

  return (
    <div data-test="FichesNonClassees" className="p-10 grow">
      {data.length !== 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {data.map((f) => (
            <FicheActionCard
              currentCollectivite={collectivite}
              key={f.id}
              ficheAction={f}
              link={makeCollectiviteFicheNonClasseeUrl({
                collectiviteId: collectivite.collectiviteId,
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
