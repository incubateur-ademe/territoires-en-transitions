import {IndicateurPersonnaliseList} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseList';
import {ConditionnalIndicateurReferentielList} from './ConditionnalIndicateurReferentielList';

import {Chip} from '@material-ui/core';
import {useEpciId} from 'core-logic/hooks';
import {Spacer} from 'ui/shared';
import {useParams} from 'react-router-dom';

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
const ConditionnalIndicateurList = (props: {view: View}) => {
  if (props.view === 'perso') return <IndicateurPersonnaliseList />;
  return <ConditionnalIndicateurReferentielList referentiel={props.view} />;
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

  return (
    <>
      <div className="flex flex-row items-center">
        <IndicateursNavChip epciId={epciId} to="perso" current={current} />
        <IndicateursNavChip epciId={epciId} to="eci" current={current} />
        <IndicateursNavChip epciId={epciId} to="cae" current={current} />
      </div>
      <Spacer />
      <h2 className="fr-h2">{viewTitles[current]}</h2>
      <ConditionnalIndicateurList view={current} />
    </>
  );
};

export default Indicateurs;
