import {ActionReferentiel} from 'types/action_referentiel';

/**
 * @deprecated since new UI, use ActionReferentielDisplayTitle
 */
export const ActionReferentielTitle = ({
  action,
  className,
}: {
  action: ActionReferentiel;
  className?: string;
}) => (
  <span className={className ? className : 'text-lg h-8'}>
    {action.identifiant} - {action.nom}
  </span>
);
