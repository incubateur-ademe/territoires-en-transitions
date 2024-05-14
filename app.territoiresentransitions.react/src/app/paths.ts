import {Referentiel} from 'types/litterals';
import {getAuthPaths} from '@tet/api';

const authPaths = getAuthPaths(
  document.location.hostname,
  document.location.href
);
export const signInPath = authPaths.login;
export const signUpPath = authPaths.signUp;
export const resetPwdPath = authPaths.resetPwd;

export const invitationPath = '/invitation';
export const invitationIdParam = 'invitationId';
export const invitationLandingPath = `${invitationPath}/:${invitationIdParam}`;

export const profilPath = '/profil';
export const monComptePath = `${profilPath}/mon-compte`;
export const mesCollectivitesPath = `${profilPath}/mes-collectivites`;

export const recherchesPath = '/recherches';
export const recherchesParam = 'recherchesId';
export type RecherchesViewParam = 'collectivites' | 'plans';
export const recherchesLandingPath = `${recherchesPath}/:${recherchesParam}`;
export const recherchesCollectivitesUrl = `${recherchesPath}/collectivites`;
export const recherchesPlansUrl = `${recherchesPath}/plans`;

export const ancienRecherchesPath = '/toutes_collectivites';

// Utilisé après le login ou lorsqu'on clique sur le logo en étant connecté.
export const homePath = recherchesCollectivitesUrl;

const collectiviteParam = 'collectiviteId';
export const indicateurViewParam = 'vue';
export const indicateurIdParam = 'indicateurId';
export const referentielParam = 'referentielId';
export const referentielVueParam = 'referentielVue';
const actionParam = 'actionId';
const actionVueParam = 'actionVue';
const labellisationVueParam = 'labellisationVue';
export const thematiqueParam = 'thematiqueId';

export type ReferentielParamOption = 'cae' | 'eci';
export type IndicateurViewParamOption =
  | 'cae'
  | 'eci'
  | 'crte'
  | 'perso'
  | 'cles'
  | 'selection';
export type ReferentielVueParamOption =
  | 'progression'
  | 'priorisation'
  | 'detail';
export type ActionVueParamOption =
  | 'suivi'
  | 'preuves'
  | 'indicateurs'
  | 'fiches'
  | 'historique';
export type LabellisationVueParamOption = 'suivi' | 'cycles' | 'criteres';

export const collectivitePath = `/collectivite/:${collectiviteParam}`;
export const collectiviteIndicateurPath = `${collectivitePath}/indicateurs/:${indicateurViewParam}/:${indicateurIdParam}?`;
export const collectiviteReferentielPath = `${collectivitePath}/referentiels/:${referentielParam}/:${referentielVueParam}`;
export const collectiviteAccueilPath = `${collectivitePath}/accueil`;
export const collectiviteActionPath = `${collectivitePath}/action/:${referentielParam}/:${actionParam}/:${actionVueParam}?`;
export const collectiviteLabellisationRootPath = `${collectivitePath}/labellisation/:${referentielParam}`;
export const collectiviteLabellisationPath = `${collectiviteLabellisationRootPath}/:${labellisationVueParam}?`;
export const collectiviteUsersPath = `${collectivitePath}/users`;
export const collectivitePersoRefPath = `${collectivitePath}/personnalisation`;
export const collectiviteBibliothequePath = `${collectivitePath}/bibliotheque`;
export const collectivitePersoRefThematiquePath = `${collectivitePersoRefPath}/:${thematiqueParam}`;
export const collectiviteJournalPath = `${collectivitePath}/historique`;

const ficheParam = 'ficheUid';
const planParam = 'planUid';
const axeParam = 'axeUid';
const syntheseParam = 'syntheseVue';
export const collectivitePlansActionsBasePath = `${collectivitePath}/plans`;
export const collectivitePlansActionsNouveauPath = `${collectivitePlansActionsBasePath}/nouveau`;
export const collectivitePlansActionsCreerPath = `${collectivitePlansActionsBasePath}/creer`;
export const collectivitePlansActionsImporterPath = `${collectivitePlansActionsBasePath}/importer`;
export const collectivitePlansActionsSynthesePath = `${collectivitePlansActionsBasePath}/synthese`;
export const collectivitePlansActionsSyntheseVuePath = `${collectivitePlansActionsSynthesePath}/:${syntheseParam}`;
export const collectivitePlanActionPath = `${collectivitePlansActionsBasePath}/plan/:${planParam}`;
export const collectivitePlanActionFichePath = `${collectivitePlanActionPath}/fiche/:${ficheParam}`;
export const collectivitePlanActionAxePath = `${collectivitePlanActionPath}/:${axeParam}`;
export const collectivitePlanActionAxeFichePath = `${collectivitePlanActionAxePath}/fiche/:${ficheParam}`;
export const collectiviteFichesNonClasseesPath = `${collectivitePlansActionsBasePath}/fiches`;
export const collectiviteFicheNonClasseePath = `${collectiviteFichesNonClasseesPath}/:${ficheParam}`;

// TDB = tableau de bord
export const collectiviteTDBBasePath = `${collectivitePath}/tableau-de-bord`;
export const TDBViewId = 'tdbView';
export const collectiviteTDBPath = `${collectiviteTDBBasePath}/:${TDBViewId}`;
export type TDBViewParam = 'collectivite' | 'personnel';
export const collectiviteTDBCollectivitePath = `${collectiviteTDBBasePath}/collectivite`;
export const collectiviteTDBPersonnelPath = `${collectiviteTDBBasePath}/personnel`;
export const TDBModuleId = 'tdbModule';
export const collectiviteTDBModulePath = `${collectiviteTDBPath}/:${TDBModuleId}`;

export const makeTableauBordLandingUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  return collectiviteTDBBasePath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );
};

export const makeTableauBordUrl = ({
  collectiviteId,
  view,
}: {
  collectiviteId: number;
  view: TDBViewParam;
}) => {
  return collectiviteTDBPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${TDBViewId}`, view);
};

export const makeTableauBordModuleUrl = ({
  collectiviteId,
  view,
  module,
}: {
  collectiviteId: number;
  view: TDBViewParam;
  module: string;
}) => {
  return collectiviteTDBModulePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${TDBViewId}`, view)
    .replace(`:${TDBModuleId}`, module);
};

export const makeCollectiviteIndicateursUrl = ({
  collectiviteId,
  indicateurView,
  indicateurId,
}: {
  collectiviteId: number;
  indicateurView?: IndicateurViewParamOption;
  indicateurId?: number | string;
}) =>
  collectiviteIndicateurPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${indicateurViewParam}`, indicateurView || '')
    .replace(`:${indicateurIdParam}`, indicateurId?.toString() || '');

export const makeCollectiviteRootUrl = (collectiviteId: number) =>
  collectivitePath.replace(':collectiviteId', collectiviteId.toString());

export const makeCollectiviteReferentielUrl = ({
  collectiviteId,
  referentielId,
  referentielVue,
  axeId,
}: {
  collectiviteId: number;
  referentielId: ReferentielParamOption;
  referentielVue?: ReferentielVueParamOption | '';
  axeId?: string;
}) => {
  let pathName = collectiviteReferentielPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielParam}`, referentielId)
    .replace(
      `:${referentielVueParam}`,
      referentielVue === undefined ? 'progression' : referentielVue
    );

  if (!!axeId && axeId.length) pathName += `?axe=${axeId}`;
  return pathName;
};

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

export const makeCollectivitePlansActionsNouveauUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectivitePlansActionsNouveauPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePlansActionsCreerUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectivitePlansActionsCreerPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePlansActionsImporterUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectivitePlansActionsImporterPath.replace(
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

export const makeCollectivitePlansActionsSyntheseVueUrl = ({
  collectiviteId,
  vue,
}: {
  collectiviteId: number;
  vue: string;
}) =>
  collectivitePlansActionsSyntheseVuePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${syntheseParam}`, vue);

export const makeCollectiviteFichesNonClasseesUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteFichesNonClasseesPath.replace(
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

export const makeCollectiviteAccueilUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteAccueilPath.replace(
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
