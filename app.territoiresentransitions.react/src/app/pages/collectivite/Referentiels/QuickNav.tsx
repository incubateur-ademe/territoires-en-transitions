import Cascader, {
  CascaderOptionType,
  CascaderValueType,
} from 'antd/es/cascader';
import 'antd/es/cascader/style/css';
import React from 'react';
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

const actionsToOptions = (
  actions: ActionReferentiel[]
): CascaderOptionType[] => {
  return actions.map((action: ActionReferentiel): CascaderOptionType => {
    return {
      value: action.id,
      label: <span>{displayName(action)}</span>,
      disabled: false,
      children:
        actionIdDepth(action.id) < referentielMesureDepth(action.id)
          ? actionsToOptions(action.actions)
          : undefined,
    };
  });
};

export const OrientationQuickNav = (props: {action: ActionReferentiel}) => {
  const parents: ActionReferentiel[] = searchParents(
    props.action.id,
    referentielActions
  );
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
  const siblings = searchActionSiblingsOfId(
    props.action.id,
    referentielActions
  )!;

  const options = actionsToOptions(siblings);
  const history = useHistory();
  const epciId = useEpciId()!;

  const onChange = (value: CascaderValueType) => {
    const selectedId = '' + value[value.length - 1];
    history.push(
      `/collectivite/${epciId}/action/${referentielId(
        selectedId
      )}/${selectedId}`
    );
  };

  return (
    <Cascader options={options} onChange={onChange}>
      <span className="block truncate max-w-sm">
        {displayName(props.action)}
      </span>
    </Cascader>
  );
};
