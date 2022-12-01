import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {Database} from 'types/database.types';

export type TActionPhaseBadgeProps = {
  action: ActionDefinitionSummary;
  className?: string;
};

const phaseToLabel: Record<
  Database['public']['Enums']['action_categorie'],
  string
> = {
  bases: "S'engager",
  'mise en œuvre': 'Concrétiser',
  effets: 'Consolider',
};

/**
 * Affiche un badge représentant la phase à laquelle une sous-action est rattachée.
 */
export const ActionPhaseBadge = (props: TActionPhaseBadgeProps) => {
  const {action, className} = props;
  return (
    <p
      className={classNames(
        'fr-badge fr-text-mention--grey fr-text--xs !bg-white border-[1px]',
        className
      )}
    >
      {phaseToLabel[action.phase]}
    </p>
  );
};
