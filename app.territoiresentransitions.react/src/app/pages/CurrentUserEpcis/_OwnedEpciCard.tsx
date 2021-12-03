import type {EpciStorable} from 'storables/EpciStorable';
import {caeAxes, eciAxes} from 'utils/referentiels';
import {useEpciAxisReferentielScores} from 'core-logic/hooks';

import {DetailedPlanActions} from './_DetailedPlanActions';
import {DetailedReferentiel} from './_DetailedReferentiel';
import {DetailedEpciCardPropsLink} from 'app/pages/AllActiveEpcis/_DetailedEpciCardPropsLink';

const DetailedEpciCard = ({epci}: {epci: EpciStorable}) => {
  const caeScores = useEpciAxisReferentielScores({
    epciId: epci.id,
    referentiel: 'cae',
  });
  const eciScores = useEpciAxisReferentielScores({
    epciId: epci.id,
    referentiel: 'eci',
  });

  return (
    <div className="flex flex-col p-8 pt-2 bg-beige">
      <div className="flex flex-row items-center w-full justify-center">
        <h3 className="fr-h3 mb-5">{epci.nom}</h3>
      </div>
      <div className="flex justify-end items-end mb-6 -mt-11">
        <DetailedEpciCardPropsLink
          label="Voir les indicateurs"
          linkTo={`/collectivite/${epci.id}/indicateurs`}
        />
      </div>
      <div className="grid grid-cols-3 gap-6 col-end-auto">
        <div className="bg-white p-3">
          <DetailedPlanActions epciId={epci.id} />
        </div>
        <div className="bg-white p-3">
          <DetailedReferentiel
            epciId={epci.id}
            scores={caeScores}
            axes={caeAxes}
            title="Climat Air Énergie"
            referentiel="cae"
          />
        </div>
        <div className="bg-white p-3">
          <DetailedReferentiel
            epciId={epci.id}
            scores={eciScores}
            axes={eciAxes}
            title="Économie Circulaire"
            referentiel="eci"
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
