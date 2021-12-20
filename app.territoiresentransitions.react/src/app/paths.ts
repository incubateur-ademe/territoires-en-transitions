export const authBasePath = '/auth';
export const signInPath = `${authBasePath}/signin`;
export const signUpPath = `${authBasePath}/signup`;
export const identityPath = `${authBasePath}/identity`;

export const allCollectivitesPath = '/toutes_collectivites';
export const myCollectivitesPath = '/mes_collectivites';

const collectiviteParam = 'collectiviteId';
export const indicateurViewParam = 'vue';
export const referentielParam = 'referentielId';
const actionParam = 'actionId';
const planActionParam = 'planActionUid';
const ficheParam = 'ficheUid';

export type ReferentielParamOption = 'cae' | 'eci';
export type IndicateurViewParamOption = 'cae' | 'eci' | 'crte' | 'perso';

export const collectivitePath = `/collectivite/:${collectiviteParam}`;
export const collectiviteIndicateurPath = `${collectivitePath}/indicateurs/:${indicateurViewParam}`;
export const collectiviteReferentielPath = `${collectivitePath}/referentiels/:${referentielParam}`;
export const collectiviteTableauBordPath = `${collectivitePath}/tableau_bord`;
export const collectiviteActionPath = `${collectivitePath}/action/:${referentielParam}/:${referentielParam}/:${actionParam}`;
export const collectivitePlanActionPath = `${collectivitePath}/plan_action/:${planActionParam}`;
export const collectiviteNouvelleFichePath = `${collectivitePath}/nouvelle_fiche`;
export const collectiviteFichePath = `${collectivitePath}/fiche/:${ficheParam}`;

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
}: {
  collectiviteId: number;
  referentielId: ReferentielParamOption;
}) =>
  collectiviteReferentielPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId);

export const makeCollectiviteActionUrl = ({
  collectiviteId,
  actionId,
  referentielId,
}: {
  collectiviteId: number;
  actionId: string;
  referentielId: ReferentielParamOption;
}) =>
  collectiviteActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId)
    .replace(`:${actionParam}`, actionId);

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
    planActionUid: 'plan_collectivite',
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

export const makeTableauBordUrl = ({
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
