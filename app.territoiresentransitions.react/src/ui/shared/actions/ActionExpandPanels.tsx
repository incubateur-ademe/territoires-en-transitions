import {addTargetToContentAnchors} from 'utils/content';
import {CrossExpandPanelWithHtmlContent} from 'ui/shared/CrossExpandPanelWithHtmlContent';
import {
  useActionContexte,
  useActionExemples,
  useActionPreuve,
  useActionResources,
} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

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
  const preuve = useActionPreuve(action.id);
  return <ActionExpandPanelAdemeContent content={preuve} title="Preuves" />;
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
