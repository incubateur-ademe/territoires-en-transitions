import {IndicateurPersonnaliseList} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseList';
import {ConditionnalIndicateurReferentielList} from './ConditionnalIndicateurReferentielList';

import {Switch} from '@material-ui/core';
import {useParams} from 'react-router-dom';
import {useState} from 'react';
import {referentielToName} from 'app/labels';
import {indicateurViewParam, IndicateurViewParamOption} from 'app/paths';

const viewTitles: Record<IndicateurViewParamOption, string> = {
  perso: 'Indicateurs personnalisés',
  cae: referentielToName.cae,
  eci: referentielToName.eci,
  crte: referentielToName.crte,
};

/**
 * Display the list of indicateurs for a given view
 */
const ConditionnalIndicateurList = (props: {
  view: IndicateurViewParamOption;
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
  const {vue} = useParams<{
    [indicateurViewParam]?: IndicateurViewParamOption;
  }>();
  const current = vue ?? 'eci';

  const [showOnlyIndicateurWithData, setShowOnlyIndicateurWithData] =
    useState(false);

  return (
    <>
      <div className="flex justify-end">
        <div className="mr-2 font-light">
          <div className="flex justify-end mt-24">
            <div className="flex items-center">
              Afficher uniquement les indicateurs renseignés
              <Switch
                color="primary"
                checked={showOnlyIndicateurWithData}
                inputProps={{'aria-label': 'controlled'}}
                onChange={() => {
                  setShowOnlyIndicateurWithData(!showOnlyIndicateurWithData);
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <h2 className="fr-h2">{viewTitles[current]}</h2>
      <ConditionnalIndicateurList
        view={current}
        showOnlyIndicateurWithData={showOnlyIndicateurWithData}
      />
    </>
  );
};

export default Indicateurs;
