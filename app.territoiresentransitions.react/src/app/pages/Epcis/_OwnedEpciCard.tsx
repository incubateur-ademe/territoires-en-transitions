import type {EpciStorable} from 'storables/EpciStorable';
import {caeAxes, eciAxes} from 'utils/referentiels';
import {useEpciAxisActionReferentielScores} from 'core-logic/hooks';

import {DetailedEpciCardPropsLink} from './_DetailedEpciCardPropsLink';
import {DetailedPlanActions} from './_DetailedPlanActions';
import {DetailedReferentiel} from './_DetailedReferentiel';

const DetailedEpciCard = ({epci}: {epci: EpciStorable}) => {
  const caeScores = useEpciAxisActionReferentielScores({
    epciId: epci.id,
    referentiel: 'cae',
  });
  const eciScores = useEpciAxisActionReferentielScores({
    epciId: epci.id,
    referentiel: 'eci',
  });

  return (
    <div className="flex flex-col items-center justify- p-8 bg-beige">
      <div className="flex flex-row items-center w-full justify-between">
        <div></div>
        <div>
          <h3 className="fr-h3 p-2">{epci.nom}</h3>
        </div>
        <div>
          <DetailedEpciCardPropsLink
            label="Voir les indicateurs"
            linkTo={`/collectivite/${epci.id}/indicateurs`}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-12">
        <div>
          <DetailedPlanActions epci={epci} />
        </div>
        <div>
          <DetailedReferentiel
            epciId={epci.id}
            scores={eciScores}
            axes={eciAxes}
            title="Économie Circulaire"
          />
        </div>
        <div>
          <DetailedReferentiel
            epciId={epci.id}
            scores={caeScores}
            axes={caeAxes}
            title="Climat Air Énergie"
          />
        </div>
      </div>
    </div>
  );
};

export const OwnedEpciCard = ({epci}: {epci: EpciStorable}) => {
  return (
    <div className="py-2">
      <DetailedEpciCard epci={epci} />
    </div>
  );
};
