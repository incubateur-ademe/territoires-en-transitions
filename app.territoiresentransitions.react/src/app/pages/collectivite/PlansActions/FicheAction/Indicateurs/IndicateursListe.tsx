import {Button} from '@tet/ui';

import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {
  getIndicateurGroup,
  selectIndicateur,
} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import {makeCollectiviteIndicateursUrl} from 'app/paths';
import {FicheAction} from '../data/types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurListItem} from 'app/pages/collectivite/Indicateurs/types';

type IndicateursListeProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  indicateurs: TIndicateurListItem[];
  updateFiche: (fiche: FicheAction) => void;
};

const IndicateursListe = ({
  isReadonly,
  fiche,
  indicateurs,
  updateFiche,
}: IndicateursListeProps) => {
  const collectiviteId = useCollectiviteId()!;

  const handleUpdateFiche = (indicateur: TIndicateurListItem) => {
    const newIndicateurs = selectIndicateur({
      indicateur,
      selected: true,
      selectedIndicateurs: indicateurs,
    });
    updateFiche({...fiche, indicateurs: newIndicateurs});
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
      {indicateurs.map(indicateur => (
        <IndicateurCard
          key={`${indicateur.id}-${indicateur.titre}`}
          readonly={isReadonly}
          definition={indicateur}
          autoRefresh
          isEditable
          card={{external: true}}
          href={makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: getIndicateurGroup(indicateur.identifiant),
            indicateurId: indicateur.id,
            identifiantReferentiel: indicateur.identifiant,
          })}
          selectState={{
            selected: true,
            setSelected: indicateur => handleUpdateFiche(indicateur),
          }}
          otherMenuActions={indicateur => [
            <Button
              onClick={() => handleUpdateFiche(indicateur)}
              icon="link-unlink"
              title="Dissocier l'indicateur"
              size="xs"
              variant="grey"
            />,
          ]}
        />
      ))}
    </div>
  );
};

export default IndicateursListe;
