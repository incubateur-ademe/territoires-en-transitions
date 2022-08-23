export const authBasePath = '/auth';
export const signInPath = `${authBasePath}/signin`;
export const signUpPath = `${authBasePath}/signup`;
export const resetPwdToken = 'token';
export const resetPwdPath = `${authBasePath}/recover/:${resetPwdToken}`;
export const recoverToken = 'token';
export const recoverLandingPath = `${authBasePath}/recover_landing/:${recoverToken}`;

export const invitationPath = '/invitation';
export const invitationIdParam = 'invitationId';
export const invitationLandingPath = `${invitationPath}/:${invitationIdParam}`;

export const allCollectivitesPath = '/toutes_collectivites';

// Utilisé après le login ou lorsqu'on clique sur le logo en étant connecté.
export const homePath = allCollectivitesPath;

const collectiviteParam = 'collectiviteId';
export const indicateurViewParam = 'vue';
export const referentielParam = 'referentielId';
export const referentielVueParam = 'referentielVue';
const actionParam = 'actionId';
const actionVueParam = 'actionVue';
const ficheParam = 'ficheUid';
export const planActionParam = 'planActionUid';
export const planActionDefaultId = 'plan_collectivite';
export const thematiqueParam = 'thematiqueId';

export type ReferentielParamOption = 'cae' | 'eci';
export type IndicateurViewParamOption = 'cae' | 'eci' | 'crte' | 'perso';
export type ReferentielVueParamOption =
  | 'progression'
  | 'priorisation'
  | 'detail';
export type ActionVueParamOption = 'suivi' | 'indicateurs' | 'historique';

export const collectivitePath = `/collectivite/:${collectiviteParam}`;
export const collectiviteIndicateurPath = `${collectivitePath}/indicateurs/:${indicateurViewParam}`;
export const collectiviteReferentielPath = `${collectivitePath}/referentiels/:${referentielParam}/:${referentielVueParam}`;
export const collectiviteTableauBordPath = `${collectivitePath}/tableau_bord`;
export const collectiviteActionPath = `${collectivitePath}/action/:${referentielParam}/:${actionParam}/:${actionVueParam}?`;
export const collectiviteLabellisationPath = `${collectivitePath}/labellisation/:${referentielParam}`;
export const collectivitePlanActionPath = `${collectivitePath}/plan_action/:${planActionParam}`;
export const collectiviteNouvelleFichePath = `${collectivitePath}/nouvelle_fiche`;
export const collectiviteFichePath = `${collectivitePath}/fiche/:${ficheParam}`;
export const collectiviteUsersPath = `${collectivitePath}/users`;
export const collectiviteAllCollectivitesPath = `${collectivitePath}/toutes_collectivites`;
export const collectivitePersoRefPath = `${collectivitePath}/personnalisation`;
export const collectivitePersoRefThematiquePath = `${collectivitePersoRefPath}/:${thematiqueParam}`;
export const collectiviteJournalPath = `${collectivitePath}/historique`;

export const makeCollectiviteIndicateursUrl = ({
  collectiviteId,
  indicateurView,
}: {
  collectiviteId: number;
  indicateurView: IndicateurViewParamOption;
}) =>
  collectiviteIndicateurPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${indicateurViewParam}`, indicateurView);

export const makeCollectiviteRootUrl = (collectiviteId: number) =>
  collectivitePath.replace(':collectiviteId', collectiviteId.toString());

export const makeCollectiviteReferentielUrl = ({
  collectiviteId,
  referentielId,
  referentielVue,
}: {
  collectiviteId: number;
  referentielId: ReferentielParamOption;
  referentielVue?: ReferentielVueParamOption;
}) =>
  collectiviteReferentielPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId)
    .replace(`:${referentielVueParam}`, referentielVue || 'progression');

export const makeCollectiviteActionUrl = ({
  collectiviteId,
  actionId,
  referentielId,
  actionVue,
}: {
  collectiviteId: number;
  actionId: string;
  referentielId: ReferentielParamOption;
  actionVue?: ActionVueParamOption;
}) =>
  collectiviteActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId)
    .replace(`:${actionParam}`, actionId)
    .replace(`:${actionVueParam}`, actionVue || '');

export const makeCollectiviteTacheUrl = ({
  collectiviteId,
  actionId,
  referentielId,
}: {
  collectiviteId: number;
  actionId: string;
  referentielId: ReferentielParamOption;
}) => {
  const levels = actionId?.split('.') || [];
  const limitedLevels = levels
    .slice(0, referentielId === 'cae' ? 3 : 2)
    .join('.');

  const pathname = makeCollectiviteActionUrl({
    collectiviteId,
    referentielId,
    actionId: limitedLevels,
  });
  const hash = levels.length !== limitedLevels.length ? `#${actionId}` : '';
  return pathname + hash;
};

export const makeCollectiviteLabellisationUrl = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielParamOption;
}) =>
  collectiviteLabellisationPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId);

export const makeCollectivitePlanActionUrl = ({
  collectiviteId,
  planActionUid,
}: {
  collectiviteId: number;
  planActionUid: string;
}) =>
  collectivitePlanActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${planActionParam}`, planActionUid);

export const makeCollectiviteDefaultPlanActionUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: planActionDefaultId,
  });

export const makeCollectiviteFicheUrl = ({
  collectiviteId,
  ficheUid,
}: {
  collectiviteId: number;
  ficheUid: string;
}) =>
  collectiviteFichePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${ficheParam}`, ficheUid);

export const makeCollectiviteTableauBordUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteTableauBordPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteNouvelleFicheUrl = (props: {
  collectiviteId: number;
  planActionUid: string;
}) =>
  `${collectiviteNouvelleFichePath.replace(
    `:${collectiviteParam}`,
    props.collectiviteId.toString()
  )}?plan_uid=${props.planActionUid}`;

export const makeCollectiviteUsersUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteUsersPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePersoRefUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectivitePersoRefPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePersoRefThematiqueUrl = ({
  collectiviteId,
  thematiqueId,
}: {
  collectiviteId: number;
  thematiqueId: string;
}) =>
  collectivitePersoRefThematiquePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${thematiqueParam}`, thematiqueId);

export const makeCollectiviteJournalUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteJournalPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeInvitationLandingPath = (invitationId: string) =>
  window.location.origin +
  invitationLandingPath.replace(`:${invitationIdParam}`, invitationId);
