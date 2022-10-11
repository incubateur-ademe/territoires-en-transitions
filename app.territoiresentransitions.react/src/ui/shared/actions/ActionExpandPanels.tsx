import {addTargetToContentAnchors} from 'utils/content';
import {
  CrossExpandPanelBase,
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
import {useToggle} from '../useToggle';
import {ChangeEvent} from 'react';
import DOMPurify from 'dompurify';

const ActionExpandPanelAdemeContent = (props: {
  content?: string;
  title: string;
  opened: boolean;
  onToggle: (event: ChangeEvent<HTMLDetailsElement>) => void;
}) => {
  if (!props.content) return <></>;

  const {content, title, opened, onToggle} = props;

  return (
    <div className="ActionExpandPanelAdemeContent">
      <div className="border-gray-300">
        <CrossExpandPanelBase title={title} opened={opened} onToggle={onToggle}>
          <div
            className="content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(addTargetToContentAnchors(content)),
            }}
          />
        </CrossExpandPanelBase>
      </div>
    </div>
  );
};

export const ActionContexteExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const [opened, handleToggle] = useToggle(false);
  const contexte = useActionContexte(action.id, opened);

  return (
    <ActionExpandPanelAdemeContent
      content={contexte}
      title="Contexte et réglementation"
      opened={opened}
      onToggle={handleToggle}
    />
  );
};

export const ActionExemplesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const [opened, handleToggle] = useToggle(false);
  const exemples = useActionExemples(action.id, opened);

  return (
    <ActionExpandPanelAdemeContent
      content={exemples}
      title="Exemples"
      opened={opened}
      onToggle={handleToggle}
    />
  );
};

export const ActionPreuvesExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  return (
    <div
      className="ActionExpandPanelAdemeContent"
      data-test={`PreuvesPanel-${action.identifiant}`}
    >
      <div className="border-gray-300">
        <CrossExpandPanelWithNode title="Preuves">
          <ActionPreuvePanel action={action} showWarning />
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
  const [opened, handleToggle] = useToggle(false);
  const ressources = useActionResources(action.id, opened);

  return (
    <ActionExpandPanelAdemeContent
      content={ressources}
      title="Ressources"
      opened={opened}
      onToggle={handleToggle}
    />
  );
};

export const ActionReductionPotentielExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const [opened, handleToggle] = useToggle(false);
  const reductionPotentiel = useActionReductionPotentiel(action.id, opened);

  return (
    <ActionExpandPanelAdemeContent
      content={reductionPotentiel}
      title="Réduction de potentiel"
      opened={opened}
      onToggle={handleToggle}
    />
  );
};

export const ActionPerimetreEvaluationExpandPanel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const [opened, handleToggle] = useToggle(false);
  const perimetreEvaluation = useActionPerimetreEvaluation(action.id, opened);

  return (
    <ActionExpandPanelAdemeContent
      content={perimetreEvaluation}
      title="Renvois-limite"
      opened={opened}
      onToggle={handleToggle}
    />
  );
};
