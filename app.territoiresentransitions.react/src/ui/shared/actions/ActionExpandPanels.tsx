import {addTargetToContentAnchors} from 'utils/content';
import {
  CrossExpandPanelWithHtmlContent,
  CrossExpandPanelWithNode,
} from 'ui/shared/CrossExpandPanelWithHtmlContent';
import {
  useActionContexte,
  useActionExemples,
  useActionPerimetreEvaluation,
  useActionReductionPotentiel,
  useActionResources,
} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionPreuvePanel} from './ActionPreuvePanel';

const ActionExpandPanelAdemeContent = (props: {
  content?: string;
  title: string;
}) => {
  if (!props.content) return <></>;
  return (
    <div className="ActionExpandPanelAdemeContent">
      <div className="border-gray-300">
        <CrossExpandPanelWithHtmlContent
          title={props.title}
          content={addTargetToContentAnchors(props.content)}
        />
      </div>
    </div>
  );
};

export const ActionContexteExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const contexte = useActionContexte(action.id);

  return (
    <ActionExpandPanelAdemeContent
      content={contexte}
      title="Contexte et réglementation"
    />
  );
};

export const ActionExemplesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const exemples = useActionExemples(action.id);
  return <ActionExpandPanelAdemeContent content={exemples} title="Exemples" />;
};

export const ActionPreuvesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  return (
    <div className="ActionExpandPanelAdemeContent">
      <div className="border-gray-300">
        <CrossExpandPanelWithNode title="Preuves">
          <ActionPreuvePanel action={action} />
        </CrossExpandPanelWithNode>
      </div>
    </div>
  );
};

export const ActionRessourcesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const ressources = useActionResources(action.id);

  return (
    <ActionExpandPanelAdemeContent content={ressources} title="Ressources" />
  );
};

export const ActionReductionPotentielExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const reductionPotentiel = useActionReductionPotentiel(action.id);

  return (
    <ActionExpandPanelAdemeContent
      content={reductionPotentiel}
      title="Réduction de potentiel"
    />
  );
};

export const ActionPerimetreEvaluationExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const perimetreEvaluation = useActionPerimetreEvaluation(action.id);

  return (
    <ActionExpandPanelAdemeContent
      content={perimetreEvaluation}
      title="Renvois-limite"
    />
  );
};
