import {addTargetToContentAnchors} from 'utils/content';
import {CrossExpandPanelWithHtmlContent} from 'ui/shared/CrossExpandPanelWithHtmlContent';
import {ActionDefinitionSummary} from 'core-logic/api/procedures/referentielProcedures';
import {
  useActionContexte,
  useActionExemples,
  useActionResources,
} from 'core-logic/hooks/referentiel';

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
