import {IndicateurPersonnaliseList} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseList';
import {ConditionnalIndicateurReferentielList} from './ConditionnalIndicateurReferentielList';

import {Chip, Switch} from '@material-ui/core';
import {useEpciId} from 'core-logic/hooks';
import {Spacer} from 'ui/shared';
import {useParams} from 'react-router-dom';
import {useState} from 'react';

type View = 'cae' | 'eci' | 'perso';

const viewTitles: Record<View, string> = {
  perso: 'Mes indicateurs',
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
};

const IndicateursNavChip = (props: {
  epciId: string;
  to: View;
  current: View;
}) => {
  return (
    <div className="mr-2">
      <Chip
        label={viewTitles[props.to]}
        component="a"
        href={`/collectivite/${props.epciId}/indicateurs/${props.to}`}
        color={props.to === props.current ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
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
  const epciId = useEpciId()!;

  const [showOnlyIndicateurWithData, setShowOnlyIndicateurWithData] =
    useState(false);

  return (
    <>
      <div className="flex  justify-between">
        <div className="flex flex-row items-center">
          <IndicateursNavChip epciId={epciId} to="perso" current={current} />
          <IndicateursNavChip epciId={epciId} to="eci" current={current} />
          <IndicateursNavChip epciId={epciId} to="cae" current={current} />
        </div>
        <div className="mr-2 font-light -mt-16">
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
