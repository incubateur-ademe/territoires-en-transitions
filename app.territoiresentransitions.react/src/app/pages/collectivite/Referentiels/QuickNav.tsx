import React, {useState} from 'react';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useHistory} from 'react-router-dom';
import {useCollectiviteId} from 'core-logic/hooks';
import {
  actionIdDepth,
  actionPath,
  displayName,
  referentielMesureDepth,
  searchActionSiblingsOfId,
  searchParents,
} from 'utils/actions';
import {actions as referentielActions} from 'generated/data/referentiels';
import {Menu, MenuItem} from '@material-ui/core';
import NestedMenuItem from 'app/pages/collectivite/Referentiels/NestedMenuItem';

/**
 * Converts a list of actions to a list of menu items.
 *
 * When actions are above mesure level we show nested items until we are at
 * the mesure level where we show a clickable item that calls onSelect.
 *
 * @param actions Actions must be less or equal to mesure depth
 * @param onSelect A callback that takes a mesure id.
 */
const actionsToMenuItems = (
  actions: ActionReferentiel[],
  onSelect: (actionId: string) => void
): React.ReactNode[] => {
  return actions.map((action: ActionReferentiel): React.ReactNode => {
    if (actionIdDepth(action.id) < referentielMesureDepth(action.id))
      return (
        <NestedMenuItem
          key={action.id}
          parentMenuOpen={true}
          label={
            <div
              className="truncate max-w-sm"
              onClick={() => onSelect(action.id)}
            >
              {displayName(action)}
            </div>
          }
        >
          {actionsToMenuItems(action.actions, onSelect)}
        </NestedMenuItem>
      );
    else if (actionIdDepth(action.id) === referentielMesureDepth(action.id))
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
    throw `Error building quick nav item: "${action.id}" is below mesure depth`;
  });
};

/**
 * The nav bar at the to of an orientation page, made of several
 * OrientationSwitcher
 */
export const OrientationQuickNav = (props: {action: ActionReferentiel}) => {
  const parents = searchParents(props.action.id, referentielActions);
  const parent = parents[parents.length - 1];
  const grandParents = parents.slice(0, parents.length - 1);
  return (
    <nav className="flex flex-row">
      {grandParents.map(parent => {
        // we build a menu for every parent
        return (
          <div className="flex flex-row flex-nowrap" key={parent.id}>
            <OrientationSwitcher action={parent} />
            <span className="mx-2">/</span>
          </div>
        );
      })}
      <OrientationSwitcher action={parent} />
    </nav>
  );
};

/**
 * Builds a link that opens a menu showing the action siblings as items.
 */
export const OrientationSwitcher = (props: {action: ActionReferentiel}) => {
  const [opened, setOpened] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const menuId = `${props.action.id}-menu`;
  const siblings = searchActionSiblingsOfId(
    props.action.id,
    referentielActions
  );
  const history = useHistory();
  const collectiviteId = useCollectiviteId()!;

  const handleClose = () => {
    setOpened(false);
  };

  const onSelect = (selectedId: string) => {
    setOpened(false);
    history.push(actionPath(collectiviteId, selectedId));
  };

  return (
    <>
      <div
        className="truncate max-w-lg cursor-pointer"
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={e => {
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
        getContentAnchorEl={null}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
      >
        {actionsToMenuItems(siblings!, onSelect)}
      </Menu>
    </>
  );
};
