import {IndicateurPersonnaliseList} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseList';
import {ConditionnalIndicateurReferentielList} from './ConditionnalIndicateurReferentielList';

import {Switch} from '@material-ui/core';
import {Spacer} from 'ui/shared';
import {useParams} from 'react-router-dom';
import {useState} from 'react';
import {referentielToName} from 'app/labels';

type View = 'cae' | 'eci' | 'crte' | 'perso';

const viewTitles: Record<View, string> = {
  perso: 'Indicateurs personnalisés',
  cae: referentielToName.cae,
  eci: referentielToName.eci,
  crte: referentielToName.crte,
};

/**
 * Display the list of indicateurs for a given view
 */
const ConditionnalIndicateurList = (props: {
  view: View;
  showOnlyIndicateurWithData: boolean;
}) => {
  if (props.view === 'perso')
    return (
      <IndicateurPersonnaliseList
        showOnlyIndicateurWithData={props.showOnlyIndicateurWithData}
      />
    );
  return (
    <ConditionnalIndicateurReferentielList
      referentiel={props.view}
      showOnlyIndicateurWithData={props.showOnlyIndicateurWithData}
    />
  );
};

/**
 * IndicateursList show both indicateurs personnalisés and indicateurs référentiel.
 */
const Indicateurs = () => {
  const {view} = useParams<{
    view?: View;
  }>();
  const current = view ?? 'eci';

  const [showOnlyIndicateurWithData, setShowOnlyIndicateurWithData] =
    useState(false);

  return (
    <>
      <div className="flex  justify-between">
        <div className="mr-2 font-light">
          <div className="flex justify-end ">
            <div className="flex items-center">
              {showOnlyIndicateurWithData
                ? 'Afficher tous les indicateurs'
                : 'Afficher uniquement les indicateurs renseignés'}
              <Switch
                color="primary"
                value={showOnlyIndicateurWithData}
                inputProps={{'aria-label': 'Switch A'}}
                onClick={event =>
                  setShowOnlyIndicateurWithData(!showOnlyIndicateurWithData)
                }
              />
            </div>
          </div>
        </div>
      </div>
      <Spacer />
      <h2 className="fr-h2">{viewTitles[current]}</h2>
      <ConditionnalIndicateurList
        view={current}
        showOnlyIndicateurWithData={showOnlyIndicateurWithData}
      />
    </>
  );
};

export default Indicateurs;
