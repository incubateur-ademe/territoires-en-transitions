import type { ReferentielId } from '@tet/domain/referentiels';
import { FicheActionViewType } from '../plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import { FicheSectionId } from '../plans/fiches/show-fiche/content/type';

export const signInPath = `/login`;
export const signUpPath = `/signup`;
export const resetPwdPath = `/recover`;

export const invitationPath = '/invitation';
export const invitationIdParam = 'invitationId';
export const invitationMailParam = 'email';
export const invitationLandingPath = `${invitationPath}/:${invitationIdParam}/:${invitationMailParam}`;

export const profilPath = '/profil';
export const mesCollectivitesPath = `${profilPath}/mes-collectivites`;

export const recherchesPath = '/recherches';
export const recherchesParam = 'recherchesId';
export type RecherchesViewParam = 'collectivites' | 'referentiels' | 'plans';
export const recherchesLandingPath = `${recherchesPath}/:${recherchesParam}`;
export const recherchesCollectivitesUrl = `${recherchesPath}/collectivites`;
export const getRechercheViewUrl = (args: {
  collectiviteId?: number;
  view: RecherchesViewParam;
}) => {
  const { collectiviteId, view } = args;
  if (collectiviteId === undefined) {
    return recherchesLandingPath.replace(`:${recherchesParam}`, view);
  }
  return `${collectivitePath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  )}${recherchesLandingPath.replace(`:${recherchesParam}`, view)}`;
};
export const finaliserMonInscriptionUrl = `/finaliser-mon-inscription`;
export const recherchesReferentielsUrl = `${recherchesPath}/referentiels`;
export const recherchesPlansUrl = `${recherchesPath}/plans`;
export const ajouterCollectiviteUrl = `/ajouter-collectivite`;
export const importerPlanUrl = `/plans/import`;
export const ancienRecherchesPath = '/toutes_collectivites';

// Utilisé après le login ou lorsqu'on clique sur le logo en étant connecté.
export const homePath = recherchesCollectivitesUrl;

const collectiviteParam = 'collectiviteId';
export const indicateurViewParam = 'vue';
export const indicateurIdParam = 'indicateurId';

const actionParam = 'actionId';
const labellisationVueParam = 'labellisationVue';
export const thematiqueParam = 'thematiqueId';

export type IndicateurViewParamOption =
  | 'cae'
  | 'eci'
  | 'te'
  | 'te-test'
  | 'crte'
  | 'perso'
  | 'cles'
  | 'selection';

export type IndicateursListParamOption =
  | 'cles'
  | 'perso'
  | 'collectivite' // favoris de la collectivité
  | 'mes-indicateurs'
  | 'tous';

export const referentielTabs = [
  'progression',
  'priorisation',
  'detail',
  'evolutions',
] as const;
export type ReferentielTab = (typeof referentielTabs)[number];

export type ActionTabParamOption =
  | ''
  | 'audit'
  | 'documents'
  | 'indicateurs'
  | 'fiches'
  | 'historique'
  | 'informations'
  | 'commentaires';

type LabellisationTab = 'suivi' | 'cycles' | 'criteres';

export const collectiviteBasePath = '/collectivite';
export const collectivitePath = `${collectiviteBasePath}/:${collectiviteParam}`;

export const collectiviteIndicateursBasePath = `${collectivitePath}/indicateurs`;
export const collectiviteIndicateurPath = `${collectiviteIndicateursBasePath}/:${indicateurViewParam}/:${indicateurIdParam}?`;
export const collectiviteIndicateursListPath = `${collectiviteIndicateursBasePath}/liste`;
export const collectiviteTrajectoirePath = `${collectivitePath}/trajectoire`;
export const collectiviteAccueilPath = `${collectivitePath}/accueil`;
export const collectiviteModifierPath = `${collectivitePath}/modifier`;

const referentielIdParam = 'referentielId';
const referentielVueParam = 'referentielVue';

const referentielRootPath = `${collectivitePath}/referentiel`;
const referentielPath = `${referentielRootPath}/:${referentielIdParam}/:${referentielVueParam}`;
const referentielActionPath = `${referentielRootPath}/:${referentielIdParam}/action/:${actionParam}`;
const referentielLabellisationRootPath = `${referentielRootPath}/:${referentielIdParam}/labellisation`;
const referentielLabellisationPath = `${referentielLabellisationRootPath}/:${labellisationVueParam}?`;
const referentielPersonnalisationPath = `${referentielRootPath}/personnalisation`;
const referentielPersonnalisationThematiquePath = `${referentielPersonnalisationPath}/:${thematiqueParam}`;

export const collectiviteUsersPath = `${collectivitePath}/users`;
export const collectiviteUsersTagsPath = `${collectiviteUsersPath}/tags`;

export const collectiviteBibliothequePath = `${collectivitePath}/bibliotheque`;
export const collectiviteJournalPath = `${collectivitePath}/historique`;
const collectiviteActionsPath = `${collectivitePath}/actions`;
const ficheParam = 'ficheUid';
const planParam = 'planUid';
export const collectivitePlansActionsBasePath = `${collectivitePath}/plans`;
export const collectivitePlansActionsNouveauPath = `${collectivitePlansActionsBasePath}/nouveau`;
export const collectivitePlansActionsCreerPath = `${collectivitePlansActionsBasePath}/creer`;
export const collectivitePlansActionsImporterPath = `${collectivitePlansActionsBasePath}/importer`;
export const collectivitePlansActionsListPath = `${collectivitePlansActionsBasePath}`;
export const collectivitePlanActionPath = `${collectivitePlansActionsListPath}/:${planParam}`;
export const collectiviteToutesLesFichesPath = `${collectiviteActionsPath}`;
export const collectiviteActionPath = `${collectiviteActionsPath}/:${ficheParam}/:content`;

// TDB = tableau de bord PA
const tdbPlansEtActionsPath = `${collectivitePlansActionsBasePath}/tableau-de-bord`;

// TDB synthétique et suivi personnel
const tdbCollectivitePath = `${collectivitePath}/tableau-de-bord`;
export const tdbPathShortcut = `${collectiviteBasePath}/tableau-de-bord`;

export type TDBViewId = 'synthetique' | 'personnel';

export const makeTdbPlansEtActionsUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  tdbPlansEtActionsPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeTdbCollectiviteUrl = ({
  collectiviteId,
  view,
  module,
}: {
  collectiviteId: number;
  view?: TDBViewId;
  module?: string;
}) => {
  let path = tdbCollectivitePath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );
  if (view) path += `/${view}`;
  if (module) path += `/${module}`;
  return path;
};

export const makeCollectiviteTousLesIndicateursUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  makeCollectiviteIndicateursListUrl({
    collectiviteId,
    listId: 'tous',
  });

export const makeCollectiviteIndicateursCollectiviteUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  makeCollectiviteIndicateursListUrl({
    collectiviteId,
    listId: 'collectivite',
  });

export const makeCollectiviteIndicateursListUrl = ({
  collectiviteId,
  listId,
}: {
  collectiviteId: number;
  listId?: IndicateursListParamOption;
}) =>
  collectiviteIndicateursListPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .concat(listId ? `/${listId}` : '');

export const makeCollectiviteIndicateursUrl = ({
  collectiviteId,
  indicateurView,
  indicateurId,
  identifiantReferentiel,
}: {
  collectiviteId: number;
  indicateurView?: IndicateurViewParamOption;
  indicateurId?: number;
  identifiantReferentiel?: string | null;
}) =>
  collectiviteIndicateurPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${indicateurViewParam}`, indicateurView || '')
    .replace(
      `:${indicateurIdParam}`,
      identifiantReferentiel
        ? identifiantReferentiel.toString()
        : indicateurId?.toString() || ''
    );

export const makeCollectiviteTrajectoirelUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteTrajectoirePath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteRootUrl = (collectiviteId: number) =>
  collectivitePath.replace(':collectiviteId', collectiviteId.toString());

export const makeReferentielUrl = ({
  collectiviteId,
  referentielId,
  referentielTab = 'progression',
  axeId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
  referentielTab?: ReferentielTab;
  axeId?: string;
}) => {
  let pathName = referentielPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielIdParam}`, referentielId)
    .replace(`:${referentielVueParam}`, referentielTab);

  if (!!axeId && axeId.length) {
    pathName += `?axe=${axeId}`;
  }

  return pathName;
};

export const makeReferentielActionUrl = ({
  collectiviteId,
  actionId,
  referentielId,
  actionVue,
}: {
  collectiviteId: number;
  actionId: string;
  referentielId: ReferentielId;
  actionVue?: ActionTabParamOption;
}) =>
  referentielActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielIdParam}`, referentielId)
    .replace(`:${actionParam}`, actionId)
    .concat(actionVue ? `/${actionVue}` : '');

export const makeReferentielTacheUrl = ({
  collectiviteId,
  actionId,
  referentielId,
}: {
  collectiviteId: number;
  actionId: string;
  referentielId: ReferentielId;
}) => {
  const levels = actionId?.split('.') || [];
  const limitedLevels = levels
    .slice(0, referentielId === 'cae' ? 3 : 2)
    .join('.');

  const pathname = makeReferentielActionUrl({
    collectiviteId,
    referentielId,
    actionId: limitedLevels,
  });
  const hash = levels.length !== limitedLevels.length ? `#${actionId}` : '';
  return pathname + hash;
};

export const makeReferentielLabellisationRootUrl = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}) =>
  referentielLabellisationRootPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielIdParam}`, referentielId);

export const makeReferentielLabellisationUrl = ({
  collectiviteId,
  referentielId,
  labellisationTab,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
  labellisationTab?: LabellisationTab;
}) =>
  referentielLabellisationPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielIdParam}`, referentielId)
    .replace(`:${labellisationVueParam}`, labellisationTab || 'suivi');

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

export const makeCollectivitePlansActionsListUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectivitePlansActionsListPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteToutesLesFichesUrl = ({
  collectiviteId,
  ficheViewType,
  searchParams,
}: {
  collectiviteId: number;
  ficheViewType?: FicheActionViewType;
  searchParams?: string;
}) =>
  collectiviteToutesLesFichesPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .concat(ficheViewType && ficheViewType !== 'all' ? `/${ficheViewType}` : '')
    .concat(searchParams ? `?${searchParams}` : '');

export const makeCollectiviteActionUrl = ({
  collectiviteId,
  ficheUid,
  content,
  planId,
}: {
  collectiviteId: number;
  ficheUid: string;
  content?: FicheSectionId;
  planId?: number;
}) =>
  collectiviteActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${ficheParam}`, ficheUid)
    .replace(':content', content ?? 'details')
    .concat(planId ? `?planId=${planId}` : '');

export const OPEN_AXES_KEY_SEARCH_PARAMETER = 'openAxes';
export const PLAN_DISPLAY_OPTIONS_PARAMETER = 'options';
export const makeCollectivitePlanActionUrl = ({
  collectiviteId,
  planActionUid,
  openAxes,
  options,
}: {
  collectiviteId: number;
  planActionUid: string;
  openAxes?: number[];
  options?: string[];
}) =>
  collectivitePlanActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${planParam}`, planActionUid)
    .concat(
      [
        openAxes?.length
          ? `?${OPEN_AXES_KEY_SEARCH_PARAMETER}=${openAxes?.join(',')}`
          : '',
        options?.length
          ? `${PLAN_DISPLAY_OPTIONS_PARAMETER}=${options?.join(',')}`
          : '',
      ]
        .filter((s) => !!s)
        .join('&')
    );

export const makeReferentielRootUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  referentielRootPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

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

export const makeCollectiviteUsersTagsUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteUsersTagsPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePersoRefUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  referentielPersonnalisationPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

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
}: {
  collectiviteId: number;
  thematiqueId: string;
}) =>
  referentielPersonnalisationThematiquePath
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

export const makeCollectiviteModifierUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteModifierPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectivitePanierUrl = ({
  collectiviteId,
  panierId,
}: {
  collectiviteId?: number | null;
  panierId?: string;
}) => {
  const PANIER_URL = process.env.NEXT_PUBLIC_PANIER_URL;
  return panierId
    ? `${PANIER_URL}/panier/${panierId}`
    : collectiviteId
    ? `${PANIER_URL}/landing/collectivite/${collectiviteId}`
    : `${PANIER_URL}/landing`;
};

export const makeInvitationLandingPath = (
  invitationId: string,
  email: string
) =>
  invitationLandingPath
    .replace(`:${invitationIdParam}`, invitationId)
    .replace(`:${invitationMailParam}`, email);
