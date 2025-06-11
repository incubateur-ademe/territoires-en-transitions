import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import Markdown from '@/app/ui/Markdown';
import { useActionInfoData } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/information/use-action-information';
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
      {subAction.description && <Markdown content={subAction.description} />}
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
