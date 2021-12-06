import {indicateurs} from 'generated/data/indicateurs_referentiels';
import {actions} from 'generated/data/referentiels';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import * as R from 'ramda';

const flattenActions = (actions: ActionReferentiel[]): ActionReferentiel[] =>
  R.reduce(
    (acc, action) => [...acc, ...action.actions],
    [] as ActionReferentiel[],
    actions
  );

export const eciReferentiel = actions.find(action => action.id === 'eci');

export const eciAxes = eciReferentiel ? eciReferentiel.actions : [];
// For ECI, main action is at level #1, here, we flatten the actions once.
export const eciFlattenMainActions = flattenActions(eciAxes);

const caeReferentiel = actions.find(action => action.id === 'cae');
export const caeAxes = caeReferentiel ? caeReferentiel.actions : [];
// For ECI, main action is at level #1, here, we flatten the actions twice.
export const caeFlattenMainActions = flattenActions(flattenActions(caeAxes));

export const inferValueIndicateurUid = (indicateurUid: string) => {
  const indicateur = indicateurs.find(
    indicateur => indicateur.uid === indicateurUid
  );
  return indicateur?.valeur || indicateurUid;
};
