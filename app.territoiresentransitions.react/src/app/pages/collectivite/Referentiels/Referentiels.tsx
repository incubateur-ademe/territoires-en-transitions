import {useParams} from 'react-router-dom';
import {ReferentielParamOption, referentielParam} from 'app/paths';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionProgressBar} from 'ui/referentiels/ActionProgressBar';
import {useReferentielDownToAction} from 'core-logic/hooks/referentiel';
import {ExpandableAction} from 'ui/shared/actions/ExpandableAction';
import {ActionDefinitionSummary} from 'core-logic/api/procedures/referentielProcedures';

const ReferentielHead = (props: {referentiel: ActionDefinitionSummary}) => {
  return (
    <>
      <header className="flex flex-row mb-6 items-center justify-between">
        <h2 className="fr-h2">{props.referentiel.nom}</h2>
        <ActionProgressBar
          actionId={props.referentiel.id}
          scoreBloc={scoreBloc}
        />
      </header>
    </>
  );
};

export const ActionsReferentiels = () => {
  const {referentielId} = useParams<{
    [referentielParam]?: ReferentielParamOption;
  }>();
  const current = referentielId ?? 'eci';

  const actions = useReferentielDownToAction(current);
  const axes = actions.filter(a => a.type === 'axe');
  const referentiel = actions.find(a => a.type === 'referentiel')!;

  if (!referentiel) return <></>;

  return (
    <main className="fr-container mt-9 mb-16">
      <ReferentielHead referentiel={referentiel} />
      <section>
        {axes.map(axe => (
          <ExpandableAction action={axe} key={axe.id} />
        ))}
      </section>
    </main>
  );
};

export default ActionsReferentiels;
