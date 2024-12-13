import { ActionDefinitionSummary } from '@/app/core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useReferentielId } from '@/app/core-logic/hooks/params';
import { useReferentielDownToAction } from '@/app/core-logic/hooks/referentiel';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Referentiel } from 'types/litterals';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import { ExpandableAction } from 'ui/shared/actions/ExpandableAction';
import { useExportScore } from './useExportScore';

const ReferentielHead = (props: { referentiel: ActionDefinitionSummary }) => {
  return (
    <>
      <header className="flex flex-row mb-6 items-center justify-between">
        <h2 className="fr-h2">{props.referentiel.nom}</h2>
        <ActionProgressBar action={props.referentiel} />
      </header>
    </>
  );
};

export const ActionsReferentiels = () => {
  const referentielId = useReferentielId();
  const current = referentielId ?? 'eci';

  const actions = useReferentielDownToAction(current as Referentiel);
  const axes = actions.filter((a) => a.type === 'axe');
  const referentiel = actions.find((a) => a.type === 'referentiel')!;

  const collectivite = useCurrentCollectivite();
  const { mutate: exportScore, isLoading } = useExportScore(
    referentielId,
    collectivite
  );

  if (!referentiel) return <></>;

  return (
    <main data-test="ActionsReferentiels" className="fr-container mt-9">
      <ReferentielHead referentiel={referentiel} />
      <section>
        {axes.map((axe) => (
          <ExpandableAction action={axe} key={axe.id} />
        ))}
      </section>
      <button
        data-test="export-scores"
        className="fr-btn fr-btn--icon-left fr-fi-download-line fr-mt-6w"
        disabled={isLoading}
        onClick={() => {
          exportScore();
        }}
      >
        Exporter
      </button>
    </main>
  );
};

export default ActionsReferentiels;
