import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {
  getIndicateurGroup,
  selectIndicateur,
} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {FicheAction} from '../../FicheAction/data/types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';

type IndicateursListeProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  indicateurs: Indicateur[];
  updateFiche: (fiche: FicheAction) => void;
};

const IndicateursListe = ({
  isReadonly,
  fiche,
  indicateurs,
  updateFiche,
}: IndicateursListeProps) => {
  const collectiviteId = useCollectiviteId()!;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
      {indicateurs.map(indicateur => (
        <IndicateurCard
          key={`${indicateur.id}-${indicateur.titre}`}
          readonly={isReadonly}
          definition={indicateur}
          autoRefresh
          card={{external: true}}
          href={makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: getIndicateurGroup(indicateur.identifiant),
            indicateurId: indicateur.id,
            identifiantReferentiel: indicateur.identifiant,
          })}
          selectState={{
            selected: true,
            setSelected: indicateur => {
              const newIndicateurs = selectIndicateur({
                indicateur,
                selected: true,
                selectedIndicateurs: indicateurs,
              });
              updateFiche({...fiche, indicateurs: newIndicateurs});
            },
          }}
        />
      ))}
    </div>
  );
};

export default IndicateursListe;
