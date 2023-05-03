import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionExemples} from 'core-logic/hooks/referentiel';
import {Fragment} from 'react';
import {addTargetToContentAnchors} from 'utils/content';

type SubActionDescriptionProps = {
  subAction: ActionDefinitionSummary;
};

/**
 * Description et exemples d'une sous-action
 */

const SubActionDescription = ({
  subAction,
}: SubActionDescriptionProps): JSX.Element => {
  const exemples = useActionExemples(subAction.id, true);

  return (
    <div className="flex flex-col gap-4">
      {subAction.description && (
        <div
          className="htmlContent"
          dangerouslySetInnerHTML={{
            __html: addTargetToContentAnchors(subAction.description),
          }}
        />
      )}
      {exemples && (
        <Fragment>
          <p className="font-bold mb-2">Exemples</p>
          <div
            className="htmlContent"
            dangerouslySetInnerHTML={{
              __html: addTargetToContentAnchors(exemples),
            }}
          />
        </Fragment>
      )}
    </div>
  );
};

export default SubActionDescription;
