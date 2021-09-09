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

const actionsToOptions = (
  actions: ActionReferentiel[],
  onSelect: (actionId: string) => void
): React.ReactNode[] => {
  return actions.map((action: ActionReferentiel): React.ReactNode => {
    if (
      actionIdDepth(action.id) < referentielMesureDepth(action.id) &&
      actionsToOptions(action.actions, onSelect)
    )
      return (
        <NestedMenuItem
          parentMenuOpen={true}
          label={<div className="truncate max-w-sm">{displayName(action)}</div>}
        >
          {actionIdDepth(action.id) === referentielMesureDepth(action.id) && (
            <MenuItem>
              <div
                className="truncate max-w-sm"
                onClick={() => onSelect(action.id)}
              >
                {displayName(action)}
              </div>
            </MenuItem>
          )}
        </NestedMenuItem>
      );
  });
};

export const OrientationQuickNav = (props: {action: ActionReferentiel}) => {
  const parents = searchParents(props.action.id, referentielActions);
  const epciId = useEpciId()!;

  return (
    <nav className="flex flex-row">
      <Link to={`/collectivite/${epciId}/referentiels`}>Référentiels</Link>
      <span className="mx-2"> / </span>
      {parents.map(parent => {
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
    setAnchorEl(null);
  };

  const onSelect = (selectedId: string) => {
    handleClose();
    setOpened(false);
    const path =
      `/collectivite/${epciId}/action/` +
      `${referentielId(selectedId)}/` +
      selectedId;
    history.push(path);
  };

  return (
    <>
      <span
        className="truncate max-w-lg"
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={e => {
          setAnchorEl(e.currentTarget);
          setOpened(!opened);
        }}
      >
        {displayName(props.action)}
      </span>
      <Menu id={menuId} open={opened} onClose={handleClose} anchorEl={anchorEl}>
        {opened && actionsToOptions(siblings!, onSelect)}
      </Menu>
    </>
  );
};
