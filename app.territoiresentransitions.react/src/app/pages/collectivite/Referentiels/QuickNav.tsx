import React, {useState} from 'react';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useHistory} from 'react-router-dom';
import {useEpciId} from 'core-logic/hooks';
import {
  actionIdDepth,
  displayName,
  referentielId,
  referentielMesureDepth,
  searchActionSiblingsOfId,
  searchParents,
} from 'utils/actions';
import {actions as referentielActions} from 'generated/data/referentiels';
import {Link} from 'react-router-dom';
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
          parentMenuOpen={true}
          label={<div className="truncate max-w-sm">{displayName(action)}</div>}
        >
          {actionsToMenuItems(action.actions, onSelect)}
        </NestedMenuItem>
      );
    else if (actionIdDepth(action.id) === referentielMesureDepth(action.id))
      return (
        <MenuItem>
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
  const epciId = useEpciId()!;

  return (
    <nav className="flex flex-row">
      <Link to={`/collectivite/${epciId}/referentiels`}>Référentiels</Link>
      <span className="mx-2"> / </span>
      {parents.map(parent => {
        // we build a menu for every parent
        return (
          <>
            <OrientationSwitcher action={parent} />
            <span className="mx-2"> / </span>
          </>
        );
      })}
      <OrientationSwitcher action={props.action} />
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
  const epciId = useEpciId()!;

  const handleClose = () => {
    setOpened(false);
  };

  const onSelect = (selectedId: string) => {
    setOpened(false);
    const path = // makes formater work
      `/collectivite/${epciId}/action/` +
      `${referentielId(selectedId)}/` +
      selectedId;
    history.push(path);
  };

  return (
    <>
      <div
        className="truncate max-w-lg"
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
