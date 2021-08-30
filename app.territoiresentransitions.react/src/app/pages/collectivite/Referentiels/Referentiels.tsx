import 'app/DesignSystem/core.css';
import {SelectInput} from 'ui';

import React from 'react';
import {ReferentielEconomieCirculaire} from 'app/pages/collectivite/Referentiels/_ReferentielEconomieCirculaire';
import {ReferentielClimatAirEnergie} from 'app/pages/collectivite/Referentiels/_ReferentielClimatAirEnergie';
import {actions} from 'generated/data/referentiels';
import {Options} from 'types';
import {ReferentielCombinedByThematique} from 'app/pages/collectivite/Referentiels/_ReferentielsCombinedByThematique';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import * as R from 'ramda';

type View = 'cae' | 'eci' | 'both';

const flattenActions = (actions: ActionReferentiel[]): ActionReferentiel[] =>
  R.reduce(
    (acc, action) => [...acc, ...action.actions],
    [] as ActionReferentiel[],
    actions
  );

const ConditionnalActionsReferentiels = ({view}: {view: View}) => {
  const eciReferentiel = actions.find(
    action => action.id === 'economie_circulaire'
  );
  const eciAxes = eciReferentiel ? eciReferentiel.actions : [];
  // For ECI, main action is at level #1, here, we flatten the actions once.
  const eciFlattenMainActions = flattenActions(eciAxes);

  const caeReferentiel = actions.find(action => action.id === 'citergie');
  const caeAxes = caeReferentiel ? caeReferentiel.actions : [];
  // For ECI, main action is at level #1, here, we flatten the actions twice.
  const caeFlattenMainActions = flattenActions(flattenActions(caeAxes));

  if (view === 'cae') return <ReferentielClimatAirEnergie caeAxes={caeAxes} />;
  else if (view === 'both')
    return (
      <ReferentielCombinedByThematique
        eciActions={eciFlattenMainActions}
        caeActions={caeFlattenMainActions}
      />
    );
  else return <ReferentielEconomieCirculaire eciAxes={eciAxes} />;
};

export const ActionsReferentiels = () => {
  const viewOptions: Options<View> = [
    {value: 'cae', label: 'Climat Air Énergie'},
    {value: 'eci', label: 'Économie Circulaire'},
    {value: 'both', label: 'Vue combinée'},
  ];

  const [view, setView] = React.useState<View>('eci');

  return (
    <main className="fr-container mt-9 mb-16">
      <div>
        <h1 className="fr-h1 mb-0">Référentiels</h1>
      </div>
      <div className="w-1/3">
        <SelectInput<View>
          options={viewOptions}
          label=""
          onChange={setView}
          defaultValue="eci"
        />
      </div>
      <div className="pb-5" />
      <ConditionnalActionsReferentiels view={view} />
    </main>
  );
};

export default ActionsReferentiels;
