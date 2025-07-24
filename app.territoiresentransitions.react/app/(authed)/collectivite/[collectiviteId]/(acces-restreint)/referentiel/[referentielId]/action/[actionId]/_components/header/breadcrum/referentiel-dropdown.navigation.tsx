import classNames from 'classnames';
import Link from 'next/link';

import { makeReferentielActionUrl } from '@/app/app/paths';
import {
  ActionDefinitionSummary,
  ActionTypeEnum,
  getReferentielIdFromActionId,
} from '@/domain/referentiels';
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
} from '@/ui';

type Props = {
  referentiel: ActionDefinitionSummary[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isActionActive: (id: string) => boolean;
  collectiviteId: number;
};

export const ReferentielDropdownNavigation = ({
  referentiel,
  isOpen,
  setIsOpen,
  isActionActive,
  collectiviteId,
}: Props) => (
  <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
    <DropdownMenuTrigger />
    <DropdownMenuContent className="max-w-md" align="start">
      <DropdownMenuGroup>
        {buildTree(referentiel).map((item) => (
          <DropdownTree
            key={item.id}
            item={item}
            isActionActive={isActionActive}
            collectiviteId={collectiviteId}
          />
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

type NavItem = {
  id: string;
  identifiant: string;
  nom: string;
  type: ActionDefinitionSummary['type'];
  children?: NavItem[];
};

type DropdownTreeProps = {
  item: NavItem;
  collectiviteId: number;
  isActionActive: (id: string) => boolean;
};

const DropdownTree = ({
  item,
  collectiviteId,
  isActionActive,
}: DropdownTreeProps): React.ReactNode => {
  if (item.type === ActionTypeEnum.ACTION) {
    return (
      <DropdownMenuItem
        key={item.id}
        className="max-w-xs md:max-w-sm xl:max-w-md py-2"
      >
        <Link
          href={makeReferentielActionUrl({
            collectiviteId,
            referentielId: getReferentielIdFromActionId(item.id),
            actionId: item.id,
          })}
          className={classNames('bg-none hover:text-primary hover:underline', {
            'text-primary': isActionActive(item.id),
          })}
        >
          {item.identifiant} - {item.nom}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuSub key={item.id} defaultOpen={isActionActive(item.id)}>
      <DropdownMenuSubTrigger className="max-w-xs md:max-w-sm xl:max-w-md py-2">
        {item.identifiant} - {item.nom}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {item.children?.map((child) => (
            <DropdownTree
              key={child.id}
              item={child}
              collectiviteId={collectiviteId}
              isActionActive={isActionActive}
            />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

function buildTree(list: ActionDefinitionSummary[]) {
  const map = Object.fromEntries(list.map((n) => [n.id, n]));
  const node = (n: ActionDefinitionSummary): NavItem => ({
    id: n.id,
    identifiant: n.identifiant,
    nom: n.nom,
    type: n.type,
    children: (n.children || [])
      .map((cid) => map[cid])
      .filter(Boolean)
      .map(node)
      .sort((a, b) => a.identifiant.localeCompare(b.identifiant)),
  });
  // Racines : depth === 1 ("cae_1", "cae_2" ...)
  return list.filter((n) => n.depth === 1).map(node);
}
