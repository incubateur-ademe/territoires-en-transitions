import {Referentiel} from 'types/litterals';

export const authBasePath = '/auth';
export const signInPath = `${authBasePath}/signin`;
export const signUpPath = `${authBasePath}/signup`;
export const resetPwdPath = `${authBasePath}/recover`;
export const recoverToken = 'token';
export const recoverLandingPath = `${authBasePath}/recover_landing/:${recoverToken}`;

export const invitationPath = '/invitation';
export const invitationIdParam = 'invitationId';
export const invitationLandingPath = `${invitationPath}/:${invitationIdParam}`;

export const profilPath = '/profil';
export const monComptePath = `${profilPath}/mon-compte`;
export const mesCollectivitesPath = `${profilPath}/mes-collectivites`;
export const rejoindreUneCollectivitePath = `${profilPath}/rejoindre-une-collectivite`;

export const allCollectivitesPath = '/toutes_collectivites';

// Utilisé après le login ou lorsqu'on clique sur le logo en étant connecté.
export const homePath = allCollectivitesPath;

const collectiviteParam = 'collectiviteId';
export const indicateurViewParam = 'vue';
export const referentielParam = 'referentielId';
export const referentielVueParam = 'referentielVue';
const actionParam = 'actionId';
const actionVueParam = 'actionVue';
const labellisationVueParam = 'labellisationVue';
export const thematiqueParam = 'thematiqueId';

export type ReferentielParamOption = 'cae' | 'eci';
export type IndicateurViewParamOption = 'cae' | 'eci' | 'crte' | 'perso';
export type ReferentielVueParamOption =
  | 'progression'
  | 'priorisation'
  | 'detail';
export type ActionVueParamOption =
  | 'suivi'
  | 'preuves'
  | 'indicateurs'
  | 'historique';
export type LabellisationVueParamOption = 'suivi' | 'cycles' | 'criteres';

export const collectivitePath = `/collectivite/:${collectiviteParam}`;
export const collectiviteIndicateurPath = `${collectivitePath}/indicateurs/:${indicateurViewParam}`;
export const collectiviteReferentielPath = `${collectivitePath}/referentiels/:${referentielParam}/:${referentielVueParam}`;
export const collectiviteTableauBordPath = `${collectivitePath}/tableau_bord`;
export const collectiviteActionPath = `${collectivitePath}/action/:${referentielParam}/:${actionParam}/:${actionVueParam}?`;
export const collectiviteLabellisationRootPath = `${collectivitePath}/labellisation/:${referentielParam}`;
export const collectiviteLabellisationPath = `${collectiviteLabellisationRootPath}/:${labellisationVueParam}?`;
export const collectiviteUsersPath = `${collectivitePath}/users`;
export const collectiviteAllCollectivitesPath = `${collectivitePath}/toutes_collectivites`;
export const collectivitePersoRefPath = `${collectivitePath}/personnalisation`;
export const collectiviteBibliothequePath = `${collectivitePath}/bibliotheque`;
export const collectivitePersoRefThematiquePath = `${collectivitePersoRefPath}/:${thematiqueParam}`;
export const collectiviteJournalPath = `${collectivitePath}/historique`;

const ficheParam = 'ficheUid';
const planParam = 'planUid';
const axeParam = 'axeUid';
export const CollectivitePlansActionsBasePath = `${collectivitePath}/plans`;
export const collectivitePlansActionsSynthesePath = `${CollectivitePlansActionsBasePath}/synthese`;
export const collectivitePlanActionPath = `${CollectivitePlansActionsBasePath}/plan/:${planParam}`;
export const collectivitePlanActionFichePath = `${collectivitePlanActionPath}/fiche/:${ficheParam}`;
export const collectivitePlanActionAxePath = `${collectivitePlanActionPath}/:${axeParam}`;
export const collectivitePlanActionAxeFichePath = `${collectivitePlanActionAxePath}/fiche/:${ficheParam}`;
export const CollectiviteFichesNonClasseesPath = `${CollectivitePlansActionsBasePath}/fiches`;
export const collectiviteFicheNonClasseePath = `${CollectiviteFichesNonClasseesPath}/:${ficheParam}`;

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
  referentielVue?: ReferentielVueParamOption | '';
}) =>
  collectiviteReferentielPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId)
    .replace(
      `:${referentielVueParam}`,
      referentielVue === undefined ? 'progression' : referentielVue
    );

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

export const makeCollectiviteLabellisationRootUrl = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielParamOption;
}) =>
  collectiviteLabellisationRootPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId);

export const makeCollectiviteLabellisationUrl = ({
  collectiviteId,
  referentielId,
  labellisationVue,
}: {
  collectiviteId: number;
  referentielId: ReferentielParamOption;
  labellisationVue?: LabellisationVueParamOption;
}) =>
  collectiviteLabellisationPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId)
    .replace(`:${labellisationVueParam}`, labellisationVue || 'suivi');

export const makeCollectivitePlansActionsBaseUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  CollectivitePlansActionsBasePath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePlansActionsSyntheseUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectivitePlansActionsSynthesePath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteFichesNonClasseesUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  CollectiviteFichesNonClasseesPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteFicheNonClasseeUrl = ({
  collectiviteId,
  ficheUid,
}: {
  collectiviteId: number;
  ficheUid: string;
}) =>
  collectiviteFicheNonClasseePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${ficheParam}`, ficheUid);

export const makeCollectivitePlanActionFicheUrl = ({
  collectiviteId,
  ficheUid,
  planActionUid,
}: {
  collectiviteId: number;
  ficheUid: string;
  planActionUid: string;
}) =>
  collectivitePlanActionFichePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${planParam}`, planActionUid)
    .replace(`:${ficheParam}`, ficheUid);

export const makeCollectivitePlanActionUrl = ({
  collectiviteId,
  planActionUid,
}: {
  collectiviteId: number;
  planActionUid: string;
}) =>
  collectivitePlanActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${planParam}`, planActionUid);

export const makeCollectivitePlanActionAxeFicheUrl = ({
  collectiviteId,
  ficheUid,
  planActionUid,
  axeUid,
}: {
  collectiviteId: number;
  ficheUid: string;
  planActionUid: string;
  axeUid: string;
}) =>
  collectivitePlanActionAxeFichePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${planParam}`, planActionUid)
    .replace(`:${axeParam}`, axeUid)
    .replace(`:${ficheParam}`, ficheUid);

export const makeCollectivitePlanActionAxeUrl = ({
  collectiviteId,
  planActionUid,
  axeUid,
}: {
  collectiviteId: number;
  planActionUid: string;
  axeUid: string;
}) =>
  collectivitePlanActionAxePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${planParam}`, planActionUid)
    .replace(`:${axeParam}`, axeUid);

export const makeCollectiviteTableauBordUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteTableauBordPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

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
  referentiels,
}: {
  collectiviteId: number;
  referentiels?: Referentiel[];
}) =>
  collectivitePersoRefPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  ) + (referentiels ? '?r=' + referentiels.join(',') : '');

export const makeCollectiviteBibliothequeUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteBibliothequePath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePersoRefThematiqueUrl = ({
  collectiviteId,
  thematiqueId,
  referentiels,
}: {
  collectiviteId: number;
  thematiqueId: string;
  referentiels?: Referentiel[];
}) =>
  collectivitePersoRefThematiquePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${thematiqueParam}`, thematiqueId) +
  (referentiels ? '?r=' + referentiels.join(',') : '');

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
