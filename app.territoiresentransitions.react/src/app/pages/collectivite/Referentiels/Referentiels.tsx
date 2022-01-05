import 'app/DesignSystem/core.css';
import {ReferentielEconomieCirculaire} from 'app/pages/collectivite/Referentiels/_ReferentielEconomieCirculaire';
import {ReferentielClimatAirEnergie} from 'app/pages/collectivite/Referentiels/_ReferentielClimatAirEnergie';
import {useParams} from 'react-router-dom';
import {Spacer} from 'ui/shared';
import {actions} from 'generated/data/referentiels';
import {ReferentielParamOption, referentielParam} from 'app/paths';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionProgressBar} from 'ui/referentiels';
import {OrientationFilAriane} from 'app/pages/collectivite/Referentiels/FilAriane';

const eciReferentiel = actions.find(action => action.id === 'eci')!;
const caeReferentiel = actions.find(action => action.id === 'cae')!;

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

const ReferentielHead = (props: {view: ReferentielParamOption}) => {
  const referentiel = props.view === 'eci' ? eciReferentiel : caeReferentiel;
  return (
    <>
      <nav>
        <span className="bg-yellow-200">
          {referentiel.referentielDisplayName}
        </span>
      </nav>
      <header className="flex flex-row mb-6 items-center justify-between">
        <h2 className="fr-h2">{referentiel.referentielDisplayName}</h2>
        <ActionProgressBar action={referentiel} scoreBloc={scoreBloc} />
      </header>
    </>
  );
};

export const ActionsReferentiels = () => {
  const {referentielId} = useParams<{
    [referentielParam]?: ReferentielParamOption;
  }>();
  const current = referentielId ?? 'eci';

  return (
    <main className="fr-container mt-9 mb-16">
      <ReferentielHead view={current} />
      <ConditionnalActionsReferentiels view={current} />
    </main>
  );
};

export default ActionsReferentiels;
