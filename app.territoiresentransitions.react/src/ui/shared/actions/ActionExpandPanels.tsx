import {addTargetToContentAnchors} from 'utils/content';
import {CrossExpandPanelWithHtmlContent} from 'ui/shared/CrossExpandPanelWithHtmlContent';
import {ActionReferentiel} from 'types/action_referentiel';

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

export const ActionPreuvesExpandPanel = ({
  action,
}: {
  action: ActionReferentiel;
}) => (
  <ActionExpandPanelAdemeContent
    content={'TODO !! Import preuves 🙊'}
    title="Preuves"
  />
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
