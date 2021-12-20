export const authBasePath = '/auth';

export const signInPath = `${authBasePath}/signin`;
export const signUpPath = `${authBasePath}/signup`;
export const identityPath = `${authBasePath}/identity`;

export const allCollectivitesPath = '/toutes_collectivites';
export const myCollectivitesPath = '/mes_collectivites';

export const makeCollectiviteTabPath = (props: {
  id: number;
  tab: 'referentiels' | 'indicateurs' | 'tableau_bord' | 'plans_actions';
}) => `/collectivite/${props.id}/${props.tab}`;

export const makeCollectiviteReferentielsPath = ({
  id,
  referentiel,
}: {
  id: number;
  referentiel: 'eci' | 'cae';
}) => `${makeCollectiviteTabPath({id, tab: 'referentiels'})}/${referentiel}`;

export const makeCollectiviteActionsPath = (props: {
  id: number;
  referentiel: 'eci' | 'cae';
  actionId: string;
}) =>
  // `${makeCollectiviteTabPath({
  //   siren: props.id,
  //   tab: 'referentiels',
  // })}/action/${props.referentiel}/${props.actionId}`;
  `/collectivite/${props.id}/action/${props.referentiel}/${props.actionId}`;

export const makeCollectiviteIndicateursPath = ({
  id,
  view,
}: {
  id: number;
  view: 'eci' | 'cae' | 'crte' | 'perso';
}) => `${makeCollectiviteTabPath({id, tab: 'indicateurs'})}/${view}`;

export const makeCollectiviteDefaultPlanActionPath = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  makeCollectivitePlanActionPath({
    collectiviteId,
    planActionUid: 'plan_collectivite',
  });

export const makeCollectivitePlanActionPath = (props: {
  collectiviteId: number;
  planActionUid: string;
}) =>
  `/collectivite/${props.collectiviteId}/plan_action/${props.planActionUid}`;
