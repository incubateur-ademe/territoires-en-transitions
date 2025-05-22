import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionInfoData } from '@/app/referentiels/actions/action-information/use-action-information';
import Markdown from '@/app/ui/Markdown';
import { Fragment } from 'react';

type SubActionDescriptionProps = {
  subAction: ActionDefinitionSummary;
};

/**
 * Description et exemples d'une sous-action
 */

const SubActionDescription = ({
  subAction,
}: SubActionDescriptionProps): JSX.Element => {
  const { data: exemples } = useActionInfoData('exemples', subAction);

  return (
    <div className="flex flex-col gap-4">
      {subAction.description && (
        <Markdown content={subAction.description} />
      )}
      {exemples && (
        <Fragment>
          <p className="font-bold mb-2">Exemples</p>
          <Markdown className="htmlContent" content={exemples} />
        </Fragment>
      )}
    </div>
  );
};

export default SubActionDescription;
