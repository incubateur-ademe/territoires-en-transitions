export const authBasePath = '/auth';

export const signInPath = `${authBasePath}/signin`;
export const signUpPath = `${authBasePath}/signup`;
export const identityPath = `${authBasePath}/identity`;

export const allEpcisPath = '/toutes_epcis';
export const myEpcisPath = '/mes_epcis';

export const makeEpciTabPath = (props: {
  siren: string;
  tab: 'referentiels' | 'indicateurs' | 'tableau_bord' | 'plans_actions';
}) => `/epci/${props.siren}/${props.tab}`;

export const makeEpciReferentielsPath = ({
  siren,
  referentiel,
}: {
  siren: string;
  referentiel: 'eci' | 'cae';
}) => `${makeEpciTabPath({siren, tab: 'referentiels'})}/${referentiel}`;

export const makeEpciActionsPath = (props: {
  siren: string;
  referentiel: 'eci' | 'cae';
  actionId: string;
}) =>
  // `${makeEpciTabPath({
  //   siren: props.siren,
  //   tab: 'referentiels',
  // })}/action/${props.referentiel}/${props.actionId}`;
  `/epci/${props.siren}/action/${props.referentiel}/${props.actionId}`;

export const makeEpciIndicateursPath = ({
  siren,
  view,
}: {
  siren: string;
  view: 'eci' | 'cae' | 'crte' | 'perso';
}) => `${makeEpciTabPath({siren, tab: 'indicateurs'})}/${view}`;
