import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';

type Props = {
  subAction: ActionListItem;
};

export const Subaction = ({ subAction }: Props) => {
  return <div>{subAction.nom}</div>;
};
