import 'app/DesignSystem/core.css';

import {ReferentielEconomieCirculaire} from 'app/pages/collectivite/Referentiels/_ReferentielEconomieCirculaire';
import {ReferentielClimatAirEnergie} from 'app/pages/collectivite/Referentiels/_ReferentielClimatAirEnergie';

import {useParams} from 'react-router-dom';

import {Spacer} from 'ui/shared';
import {actions} from 'generated/data/referentiels';
import {CurrentEpciGaugeProgressStat} from 'ui/referentiels';
import {ReferentielParamOption, referentielParam} from 'app/paths';

const viewTitles: Record<ReferentielParamOption, string> = {
  cae: 'Climat Air Énergie',
  eci: 'Économie Circulaire',
};

const eciReferentiel = actions.find(action => action.id === 'eci')!;

const caeReferentiel = actions.find(action => action.id === 'cae')!;
// For ECI, main action is at level #1, here, we flatten the actions twice.

const ConditionnalActionsReferentiels = ({
  view,
}: {
  view: ReferentielParamOption;
}) => {
  if (view === 'cae') {
    const caeAxes = caeReferentiel ? caeReferentiel.actions : [];
    return <ReferentielClimatAirEnergie caeAxes={caeAxes} />;
  } else {
    const eciAxes = eciReferentiel ? eciReferentiel.actions : [];
    return <ReferentielEconomieCirculaire eciAxes={eciAxes} />;
  }
};

const ReferentielTitle = (props: {view: ReferentielParamOption}) => {
  const referentiel = props.view === 'eci' ? eciReferentiel : caeReferentiel;
  return (
    <header className="flex flex-row items-center mb-6 space-x-10">
      <h2 className="fr-h2">{viewTitles[props.view]}</h2>
      <div>
        {/* <ProgressStatStatic
          action={referentiel}
          position="left"
          showPoints={true}
        /> */}
        <CurrentEpciGaugeProgressStat action={referentiel} size="sm" />
      </div>
    </header>
  );
};

export const ActionsReferentiels = () => {
  const {referentielId} = useParams<{
    [referentielParam]?: ReferentielParamOption;
  }>();
  const current = referentielId ?? 'eci';

  return (
    <main className="fr-container mt-9 mb-16">
      <Spacer />
      <ReferentielTitle view={current} />
      <ConditionnalActionsReferentiels view={current} />
    </main>
  );
};

export default ActionsReferentiels;
