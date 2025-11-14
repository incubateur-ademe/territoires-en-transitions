import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import Markdown from '@/app/ui/Markdown';
import classNames from 'classnames';
import { ComponentPropsWithoutRef } from 'react';
import { useActionInfoData } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/information/use-action-information';

interface SubActionDescriptionProps extends ComponentPropsWithoutRef<'div'> {
  subAction: ActionDefinitionSummary;
}

/**
 * Description et exemples d'une sous-action
 */

const SubActionDescription = ({
  subAction,
  className,
  ...props
}: SubActionDescriptionProps) => {
  const { data: exemples } = useActionInfoData('exemples', subAction);

  return (
    <div
      className={classNames('flex flex-col gap-4 text-primary-10', className)}
      {...props}
    >
      {subAction.description && <Markdown content={subAction.description} />}
      {exemples && (
        <>
          <p className="font-bold mb-2">Exemples</p>
          <Markdown className="htmlContent" content={exemples} />
        </>
      )}
    </div>
  );
};

export default SubActionDescription;
