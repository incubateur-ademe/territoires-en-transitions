import 'app/DesignSystem/core.css';

import {ReferentielEconomieCirculaire} from 'app/pages/collectivite/Referentiels/_ReferentielEconomieCirculaire';
import {ReferentielClimatAirEnergie} from 'app/pages/collectivite/Referentiels/_ReferentielClimatAirEnergie';
import {ReferentielCombinedByThematique} from 'app/pages/collectivite/Referentiels/_ReferentielsCombinedByThematique';

import {useParams} from 'react-router-dom';
import {Chip} from '@material-ui/core';
import {useEpciId} from 'core-logic/hooks';
import {Spacer} from 'ui/shared';
import * as R from 'ramda';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {actions} from 'generated/data/referentiels';
import {CurrentEpciGaugeProgressStat} from 'ui/referentiels';
import {CurrentEpciCompletionStar} from 'ui/referentiels/CurrentEpciCompletionStar';

type View = 'cae' | 'eci' | 'both';
const viewTitles: Record<View, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
  both: 'Vue combinée',
};

const flattenActions = (actions: ActionReferentiel[]): ActionReferentiel[] =>
  R.reduce(
    (acc, action) => [...acc, ...action.actions],
    [] as ActionReferentiel[],
    actions
  );

const eciReferentiel = actions.find(
  action => action.id === 'economie_circulaire'
)!;

const caeReferentiel = actions.find(action => action.id === 'citergie')!;
// For ECI, main action is at level #1, here, we flatten the actions twice.

const ConditionnalActionsReferentiels = ({view}: {view: View}) => {
  if (view === 'cae') {
    const caeAxes = caeReferentiel ? caeReferentiel.actions : [];
    return <ReferentielClimatAirEnergie caeAxes={caeAxes} />;
  } else if (view === 'both') {
    const caeAxes = caeReferentiel ? caeReferentiel.actions : [];
    const eciAxes = eciReferentiel ? eciReferentiel.actions : [];
    const caeFlattenMainActions = flattenActions(flattenActions(caeAxes));
    // For ECI, main action is at level #1, here, we flatten the actions once.
    const eciFlattenMainActions = flattenActions(eciAxes);
    return (
      <ReferentielCombinedByThematique
        eciActions={eciFlattenMainActions}
        caeActions={caeFlattenMainActions}
      />
    );
  } else {
    const eciAxes = eciReferentiel ? eciReferentiel.actions : [];
    return <ReferentielEconomieCirculaire eciAxes={eciAxes} />;
  }
};

const ReferentielNavChip = (props: {
  epciId: string;
  to: View;
  current: View;
}) => {
  return (
    <div className="mr-2">
      <Chip
        label={viewTitles[props.to]}
        component="a"
        href={`/collectivite/${props.epciId}/referentiel/${props.to}`}
        color={props.to === props.current ? 'primary' : 'default'}
        clickable
      />
    </div>
  );
};

const ReferentielTitle = (props: {view: View}) => {
  const referentiel = props.view === 'eci' ? eciReferentiel : caeReferentiel;
  return (
    <header className="flex flex-row items-center mb-6 space-x-10">
      <h2 className="fr-h2">{viewTitles[props.view]}</h2>
      <div className={`${props.view === 'both' ? 'hidden' : ''}`}>
        {/* <ProgressStatStatic
          action={referentiel}
          position="left"
          showPoints={true}
        /> */}
        <CurrentEpciGaugeProgressStat action={referentiel} size="sm" />
        <CurrentEpciCompletionStar action={referentiel} />
      </div>
    </header>
  );
};

export const ActionsReferentiels = () => {
  const {referentiel} = useParams<{
    referentiel?: View;
  }>();
  const current = referentiel ?? 'eci';
  const epciId = useEpciId()!;

  return (
    <main className="fr-container mt-9 mb-16">
      <h1 className="fr-h1 mb-3">Référentiels</h1>
      <div className="flex flex-row items-center">
        <ReferentielNavChip epciId={epciId} to="eci" current={current} />
        <ReferentielNavChip epciId={epciId} to="cae" current={current} />
        <ReferentielNavChip epciId={epciId} to="both" current={current} />
      </div>

      <Spacer />
      <ReferentielTitle view={current} />
      <ConditionnalActionsReferentiels view={current} />
    </main>
  );
};

export default ActionsReferentiels;
