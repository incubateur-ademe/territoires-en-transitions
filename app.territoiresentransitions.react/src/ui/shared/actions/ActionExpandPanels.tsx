import {addTargetToContentAnchors} from 'utils/content';
import {
  CrossExpandPanelBase,
  CrossExpandPanelWithNode,
} from 'ui/shared/CrossExpandPanelWithHtmlContent';
import {useActionExemples} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionPreuvePanel} from './ActionPreuvePanel';
import {useToggle} from '../useToggle';
import {ChangeEvent} from 'react';
import DOMPurify from 'dompurify';
import {useActionPreuvesCount} from '../preuves/Bibliotheque/usePreuves';

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
  const preuvesCount = useActionPreuvesCount(action);

  return (
    <div
      className="ActionExpandPanelAdemeContent"
      data-test={`PreuvesPanel-${action.identifiant}`}
    >
      <div className="border-gray-300">
        <CrossExpandPanelWithNode
          title={`Documents${
            preuvesCount !== undefined ? ` (${preuvesCount})` : ''
          }`}
        >
          <ActionPreuvePanel action={action} showWarning />
        </CrossExpandPanelWithNode>
      </div>
    </div>
  );
};
