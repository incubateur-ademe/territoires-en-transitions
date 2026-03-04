import classNames from 'classnames';
import Link from 'next/link';

import { makeReferentielActionUrl } from '@/app/app/paths';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import {
  ActionsGroupedById,
  ActionTypeEnum,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@tet/ui';

type Props = {
  actions: ActionsGroupedById;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  actionId: string;
  collectiviteId: number;
};

export const ReferentielDropdownNavigation = ({
  actions,
  isOpen,
  setIsOpen,
  actionId,
  collectiviteId,
}: Props) => (
  <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
    <DropdownMenuTrigger />
    <DropdownMenuContent className="max-w-md" align="start">
      <DropdownMenuGroup>
        {Object.values(actions)
          .filter((item) => item.depth === 1)
          .map((item) => (
            <DropdownTree
              key={item.actionId}
              actions={actions}
              action={item}
              openedActionId={actionId}
              collectiviteId={collectiviteId}
            />
          ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

type DropdownTreeProps = {
  actions: ActionsGroupedById;
  action: ActionListItem;
  openedActionId: string;
  collectiviteId: number;
};

const DropdownTree = ({
  actions,
  action,
  openedActionId,
  collectiviteId,
}: DropdownTreeProps): React.ReactNode => {
  return action.actionType === ActionTypeEnum.ACTION ? (
    <DropdownMenuItem
      key={action.actionId}
      className="max-w-xs md:max-w-sm xl:max-w-md py-2"
    >
      <Link
        href={makeReferentielActionUrl({
          collectiviteId,
          referentielId: getReferentielIdFromActionId(action.actionId),
          actionId: action.actionId,
        })}
        className={classNames('bg-none hover:text-primary hover:underline', {
          'text-primary': action.actionId === openedActionId,
        })}
      >
        {action.identifiant} - {action.nom}
      </Link>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuSub key={action.actionId}>
      <DropdownMenuSubTrigger className="max-w-xs md:max-w-sm xl:max-w-md py-2">
        {action.identifiant} - {action.nom}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {action.childrenIds.map((childId) => (
            <DropdownTree
              key={childId}
              actions={actions}
              action={actions[childId]}
              openedActionId={openedActionId}
              collectiviteId={collectiviteId}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
