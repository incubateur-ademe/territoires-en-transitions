import NestedMenuItem from '@/app/referentiels/action.show/NestedMenuItem';
import { makeCollectiviteReferentielUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  actionPath,
  displayName,
  findActionSiblingsOfId,
  findChildren,
  searchAncestors,
} from '@/app/referentiels/actions.utils';
import { ActionTitleRead } from '@/app/referentiels/ActionTitleReadEndpoint';
import { useActionTitleList } from '@/app/referentiels/referentiel-hooks';
import { Menu, MenuItem } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

/**
 * Returns a list of menu items
 *
 * @param siblings The actions to display as siblings
 * @param actions The action list to search the children in.
 * @param onSelect The on click callback.
 */
const actionsToMenuItems = (
  siblings: ActionTitleRead[],
  actions: ActionTitleRead[],
  onSelect: (actionId: string) => void
): React.ReactNode[] => {
  return siblings.map((action: ActionTitleRead): React.ReactNode => {
    if (action.type === 'action') {
      return (
        <MenuItem key={action.id}>
          <div
            className="truncate max-w-sm"
            onClick={() => onSelect(action.id)}
          >
            {displayName(action)}
          </div>
        </MenuItem>
      );
    } else {
      return (
        <NestedMenuItem
          key={action.id}
          parentMenuOpen={true}
          label={<div className="truncate max-w-sm">{displayName(action)}</div>}
        >
          {actionsToMenuItems(findChildren(action, actions), actions, onSelect)}
        </NestedMenuItem>
      );
    }
  });
};

/**
 * The nav bar at the top of an orientation page, made of several
 * OrientationSwitcher
 */
export const ActionBreadcrumb = (props: {
  action: ActionDefinitionSummary;
}) => {
  const { action } = props;
  const collectiviteId = useCollectiviteId()!;
  const titles = useActionTitleList(action.referentiel);

  if (titles.length === 0) return null;

  const parents = searchAncestors(action, titles);
  const parent = parents[parents.length - 1];
  const grandParents = parents.slice(1, parents.length - 1);
  return (
    <nav className="flex flex-row text-sm text-grey425 items-start">
      <div className="flex flex-row flex-nowrap">
        <Link
          href={makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: action.referentiel,
          })}
        >
          {displayName(parents[0])}
        </Link>
        <span className="mx-2">&gt;</span>
      </div>
      {grandParents.map((parent) => {
        // we build a menu for every parent
        return (
          <div className="flex flex-row flex-nowrap" key={parent.id}>
            <OrientationSwitcher action={parent} titles={titles} />
            <span className="mx-2">&gt;</span>
          </div>
        );
      })}
      <OrientationSwitcher action={parent} titles={titles} />
    </nav>
  );
};

/**
 * Builds a link that opens a menu showing the action siblings as items.
 */
const OrientationSwitcher = (props: {
  action: ActionTitleRead;
  titles: ActionTitleRead[];
}) => {
  const [opened, setOpened] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const router = useRouter();
  const collectiviteId = useCollectiviteId()!;

  const menuId = `${props.action.id}-menu`;
  const siblings = findActionSiblingsOfId(props.action, props.titles);

  const handleClose = () => {
    setOpened(false);
  };

  const onSelect = (selectedId: string) => {
    setOpened(false);
    router.push(actionPath(collectiviteId, selectedId));
  };

  return (
    <>
      <div
        className="truncate max-w-lg cursor-pointer"
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
          setOpened(!opened);
        }}
      >
        {displayName(props.action)}
      </div>
      <Menu
        id={menuId}
        open={opened}
        onClose={handleClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {actionsToMenuItems(siblings!, props.titles, onSelect)}
      </Menu>
    </>
  );
};
