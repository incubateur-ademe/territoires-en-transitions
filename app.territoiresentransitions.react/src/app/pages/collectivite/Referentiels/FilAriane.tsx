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
 * The nav bar at the to of an orientation page, made of several
 * OrientationSwitcher
 */
export const OrientationFilAriane = (props: {action: ActionReferentiel}) => {
  return (
    <nav className="flex flex-row bg-yellow-200">
      {props.action.id.startsWith('cae')
        ? 'Climat Air Energie '
        : 'Economie circulaire '}
      / {props.action.nom}
    </nav>
  );
};
