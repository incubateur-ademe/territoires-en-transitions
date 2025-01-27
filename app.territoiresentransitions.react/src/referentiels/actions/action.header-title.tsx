import classNames from 'classnames';
import { ActionDefinitionSummary } from '../ActionDefinitionSummaryReadEndpoint';

export const ActionHeaderTitle = ({
  action,
  isOpen,
}: {
  action: ActionDefinitionSummary;
  isOpen: boolean;
}) => {
  return (
    <div className="flex flex-row align-middle items-center font-bold gap-2 mr-2">
      <div>
        <div
          className={classNames(
            'duration-300 text-2xl',
            {
              'rotate-90': isOpen,
              'rotate-0': !isOpen,
            },
            action.type === 'sous-axe' ? 'text-grey-6' : ''
          )}
          aria-hidden={true}
        >
          <span className="fr-fi-arrow-right-s-line" aria-hidden={true} />
        </div>
      </div>
      <div>
        <span className={action.type === 'sous-axe' ? 'text-grey-6' : ''}>
          {action.type === 'axe'
            ? `${action.identifiant} -`
            : action.identifiant}
        </span>
        &nbsp;
        <span
          className={`fr-text--lg ${
            action.type === 'sous-axe' ? 'text-grey-6' : ''
          }`}
        >
          {action.nom}
        </span>
      </div>
    </div>
  );
};
