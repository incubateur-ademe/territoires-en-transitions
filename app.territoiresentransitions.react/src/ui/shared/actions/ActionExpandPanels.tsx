import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {CrossExpandPanelWithHtmlContent} from 'ui/shared';
import {addTargetToContentAnchors} from 'utils/content';

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

export const ActionDescriptionExpandPanel = ({
  action,
}: {
  action: ActionReferentiel;
}) => (
  <ActionExpandPanelAdemeContent
    content={action.description}
    title="Description"
  />
);

export const ActionContexteExpandPanel = ({
  action,
}: {
  action: ActionReferentiel;
}) => (
  <ActionExpandPanelAdemeContent
    content={action.contexte}
    title="Contexte et réglementation"
  />
);

export const ActionExemplesExpandPanel = ({
  action,
}: {
  action: ActionReferentiel;
}) => (
  <ActionExpandPanelAdemeContent content={action.exemples} title="Exemples" />
);

export const ActionRessourcesExpandPanel = ({
  action,
}: {
  action: ActionReferentiel;
}) => (
  <ActionExpandPanelAdemeContent
    content={action.ressources}
    title="Ressources"
  />
);

export const ActionPreuveExpandPanel = ({
  action,
}: {
  action: ActionReferentiel;
}) => <ActionExpandPanelAdemeContent content={action.preuve} title="Preuve" />;
