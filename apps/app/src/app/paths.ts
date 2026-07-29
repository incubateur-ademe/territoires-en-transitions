import {
  personnalisationPageSearchParamsSerializer,
  type PersonnalisationPageSearchParams,
} from '@/app/collectivites/personnalisations/filters/personnalisation-search-params-mapper';
import {
  referentielFiltersSerializer,
  type ReferentielTableFilters,
} from '@/app/referentiels/referentiel.table/use-get-referentiel-table-filters-state';

import {
  isServiceDeconcentre,
  type CollectiviteType,
} from '@tet/domain/collectivites';
import type { ReferentielId } from '@tet/domain/referentiels';
import { FicheSectionId } from '../plans/fiches/show-fiche/content/type';
import type { UserRolesAndPermissions } from '@tet/domain/users';
import { makeUserTdbUrl } from '../tableaux-de-bord/make-user-tdb-url';

export const homePath = '/';

export const signInPath = `/login`;
export const signUpPath = `/signup`;
export const resetPwdPath = `/recover`;
export const rejoindreCollectivitePath = '/rejoindre-une-collectivite';

/** Lien relatif vers « rejoindre une collectivité » (navigation intra-app). */
export const makeRejoindreCollectiviteUrl = (redirectTo = homePath) => {
  const params = new URLSearchParams({ redirect_to: redirectTo });
  return `${rejoindreCollectivitePath}?${params}`;
};

export const invitationPath = '/invitation';

// Pont de session OIDC (verifyOtp) et parcours de bienvenue ProConnect (cas 3) :
// accessibles sans session Supabase établie — le premier POSE la session, le
// second peut la précéder (aucune correspondance automatique).
export const authVerifyPath = '/auth/verify';
export const authProconnectPath = '/auth/proconnect';

export const profilPath = '/profil';

export const recherchesPath = '/recherches';
export const recherchesParam = 'recherchesId';
export type RecherchesViewParam = 'collectivites' | 'referentiels' | 'plans';
export const recherchesLandingPath = `${recherchesPath}/:${recherchesParam}`;
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
export const ajouterCollectiviteUrl = `/ajouter-collectivite`;
export const importerPlanUrl = `/plans/import`;
export const bannerInfoUrl = `/banniere`;

const collectiviteParam = 'collectiviteId';
export const indicateurViewParam = 'vue';
export const indicateurIdParam = 'indicateurId';

const actionParam = 'actionId';

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
  | 'collectivite' // favoris de la collectivité
  | 'tous';

export const referentielTabs = ['progression', 'evolutions'] as const;
export type ReferentielTab = (typeof referentielTabs)[number];

export const collectiviteBasePath = '/collectivite';
export const collectivitePath = `${collectiviteBasePath}/:${collectiviteParam}`;

export const collectiviteIndicateursBasePath = `${collectivitePath}/indicateurs`;
export const collectiviteIndicateurPath = `${collectiviteIndicateursBasePath}/:${indicateurViewParam}/:${indicateurIdParam}?`;
export const collectiviteIndicateursListPath = `${collectiviteIndicateursBasePath}/liste`;
export const collectiviteTrajectoirePath = `${collectivitePath}/trajectoire`;
export const collectiviteModifierPath = `${collectivitePath}/modifier`;
export const collectiviteAffichageReferentielsPath = `${collectivitePath}/affichage-referentiels`;

const referentielIdParam = 'referentielId';
const referentielVueParam = 'referentielVue';

const referentielRootPath = `${collectivitePath}/referentiel`;
const referentielPath = `${referentielRootPath}/:${referentielIdParam}/:${referentielVueParam}`;
const referentielActionPath = `${referentielRootPath}/:${referentielIdParam}/action/:${actionParam}`;
const referentielAuditLabellisationPath = `${referentielRootPath}/:${referentielIdParam}/audit-labellisation`;

export const collectiviteUsersPath = `${collectivitePath}/users`;

const maCollectiviteVueParam = 'paramsVue';
export const maCollectivitePath = `${collectivitePath}/ma-collectivite/:${maCollectiviteVueParam}`;
const demarcheIdParam = 'demarcheId';
export const collectiviteDemarchePcaetPath = `${collectivitePath}/demarche-pcaet`;
export const collectiviteDemarchePcaetNouveauPath = `${collectiviteDemarchePcaetPath}/nouveau`;
export const collectiviteDemarchePcaetRootPath = `${collectiviteDemarchePcaetPath}/:${demarcheIdParam}`;
export const collectiviteDemarchePcaetDiagnosticPath = `${collectiviteDemarchePcaetPath}/:${demarcheIdParam}/indicateurs`;
export const collectiviteDemarchePcaetPlanActionsPath = `${collectiviteDemarchePcaetPath}/:${demarcheIdParam}/plan`;
export const collectiviteDemarchePcaetDocumentsPath = `${collectiviteDemarchePcaetPath}/:${demarcheIdParam}/documents`;
export const collectiviteDemarchePcaetVueDrealPath = `${collectiviteDemarchePcaetPath}/vue-dreal`;
const collectiviteActionsPath = `${collectivitePath}/actions`;
const ficheParam = 'ficheUid';
const planParam = 'planUid';
export const collectivitePlansActionsBasePath = `${collectivitePath}/plans`;
export const collectivitePlansActionsNouveauPath = `${collectivitePlansActionsBasePath}/nouveau`;
export const collectivitePlansActionsCreerPath = `${collectivitePlansActionsBasePath}/creer`;
export const collectivitePlansActionsImporterPath = `${collectivitePlansActionsBasePath}/importer`;
export const collectivitePlansActionsImporterIaPath = `${collectivitePlansActionsBasePath}/importer-ia`;
export const collectivitePlansActionsListPath = `${collectivitePlansActionsBasePath}`;
export const collectivitePlanActionPath = `${collectivitePlansActionsListPath}/:${planParam}`;
export const collectiviteToutesLesFichesPath = `${collectiviteActionsPath}`;
export const collectiviteActionPath = `${collectiviteActionsPath}/:${ficheParam}/:content`;

// TDB = tableau de bord PA
const tdbPlansEtActionsPath = `${collectivitePlansActionsBasePath}/tableau-de-bord`;

// TDB synthétique et suivi personnel
const tdbCollectivitePath = `${collectivitePath}/tableau-de-bord`;
export const tdbPathShortcut = `${collectiviteBasePath}/tableau-de-bord`;

const demandesAvisPath = `${collectivitePath}/demandes-avis`;

export const makeDemandesAvisUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  demandesAvisPath.replace(`:${collectiviteParam}`, collectiviteId.toString());

export const demandeAvisParam = 'demandeAvisId';
const demandeAvisDossierPath = `${demandesAvisPath}/:${demandeAvisParam}`;

export const makeDemandeAvisDossierUrl = ({
  collectiviteId,
  demandeAvisId,
}: {
  collectiviteId: number;
  demandeAvisId: number;
}) =>
  demandeAvisDossierPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${demandeAvisParam}`, demandeAvisId.toString());

export type TDBViewId = 'synthetique' | 'personnel';

export const makeCollectiviteRootUrl = ({
  user,
  collectiviteId,
  collectiviteType,
}: {
  user: UserRolesAndPermissions;
  collectiviteId: number;
  collectiviteType: CollectiviteType;
}) =>
  isServiceDeconcentre(collectiviteType)
    ? makeDemandesAvisUrl({ collectiviteId })
    : makeUserTdbUrl({ user, collectiviteId });

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

export const makeReferentielUrl = ({
  collectiviteId,
  referentielId,
  referentielTab = 'progression',
  axeId,
  filters,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
  referentielTab?: ReferentielTab;
  axeId?: string;
  filters?: ReferentielTableFilters;
}) => {
  let pathName = referentielPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielIdParam}`, referentielId)
    .replace(`:${referentielVueParam}`, referentielTab);

  const searchParams = new URLSearchParams();

  if (axeId?.length) {
    searchParams.set('axe', axeId);
  }

  if (filters) {
    const filterParams = referentielFiltersSerializer(filters);
    const filterSearchParams = new URLSearchParams(filterParams);
    filterSearchParams.forEach((value, key) => {
      searchParams.set(key, value);
    });
  }

  const queryString = searchParams.toString();
  if (queryString) {
    pathName += `?${queryString}`;
  }

  return pathName;
};

export const makeReferentielActionUrl = ({
  collectiviteId,
  actionId,
  referentielId,
  searchParams,
}: {
  collectiviteId: number;
  actionId: string;
  referentielId: ReferentielId;
  searchParams?: URLSearchParams;
}) => {
  return referentielActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielIdParam}`, referentielId)
    .replace(`:${actionParam}`, actionId)
    .concat(searchParams?.size ? `?${searchParams.toString()}` : '');
};

export const makeReferentielTacheUrl = ({
  collectiviteId,
  actionId,
  referentielId,
}: {
  collectiviteId: number;
  actionId: string;
  referentielId: ReferentielId;
  searchParams?: URLSearchParams;
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
  const hash =
    levels.length !== limitedLevels.split('.').length ? `#${actionId}` : '';
  return pathname + hash;
};

export const makeReferentielAuditLabellisationUrl = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}) =>
  referentielAuditLabellisationPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${referentielIdParam}`, referentielId);

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

export const makeCollectivitePlansActionsImporterIaUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectivitePlansActionsImporterIaPath.replace(
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
  searchParams,
}: {
  collectiviteId: number;
  searchParams?: string;
}) =>
  collectiviteToutesLesFichesPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
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
}) => {
  const params = new URLSearchParams();
  if (openAxes?.length)
    params.set(OPEN_AXES_KEY_SEARCH_PARAMETER, openAxes.join(','));
  if (options?.length)
    params.set(PLAN_DISPLAY_OPTIONS_PARAMETER, options.join(','));
  const queryString = params.toString();

  return collectivitePlanActionPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${planParam}`, planActionUid)
    .concat(queryString ? `?${queryString}` : '');
};

export const makeCollectiviteUsersUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteUsersPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeMaCollectiviteUrl = ({
  collectiviteId,
  view = 'presentation',
  searchParams,
}: {
  collectiviteId: number;
  view?: 'presentation' | 'personnalisation';
  searchParams?: Record<string, string>;
}) => {
  let queryString = '';
  if (searchParams) {
    queryString = new URLSearchParams(searchParams).toString();
  }
  return `${maCollectivitePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${maCollectiviteVueParam}`, view)}${
    queryString ? `?${queryString}` : ''
  }`;
};

export const makeMaCollectivitePersonnalisationUrl = ({
  collectiviteId,
  searchParams,
}: {
  collectiviteId: number;
  searchParams?: PersonnalisationPageSearchParams;
}) => {
  const baseUrl = maCollectivitePath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${maCollectiviteVueParam}`, 'personnalisation');

  if (!searchParams) {
    return baseUrl;
  }

  return `${baseUrl}${personnalisationPageSearchParamsSerializer(
    searchParams
  )}`;
};

export const makeCollectiviteDemarchePcaetUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteDemarchePcaetPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteDemarchePcaetNouveauUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteDemarchePcaetNouveauPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteDemarchePcaetRootUrl = ({
  collectiviteId,
  demarcheId,
}: {
  collectiviteId: number;
  demarcheId: number;
}) =>
  collectiviteDemarchePcaetRootPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${demarcheIdParam}`, demarcheId.toString());

export const makeCollectiviteDemarchePcaetDiagnosticUrl = ({
  collectiviteId,
  demarcheId,
}: {
  collectiviteId: number;
  demarcheId: number;
}) =>
  collectiviteDemarchePcaetDiagnosticPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${demarcheIdParam}`, demarcheId.toString());

export const makeCollectiviteDemarchePcaetPlanActionsUrl = ({
  collectiviteId,
  demarcheId,
}: {
  collectiviteId: number;
  demarcheId: number;
}) =>
  collectiviteDemarchePcaetPlanActionsPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${demarcheIdParam}`, demarcheId.toString());

export const makeCollectiviteDemarchePcaetDocumentsUrl = ({
  collectiviteId,
  demarcheId,
}: {
  collectiviteId: number;
  demarcheId: number;
}) =>
  collectiviteDemarchePcaetDocumentsPath
    .replace(`:${collectiviteParam}`, collectiviteId.toString())
    .replace(`:${demarcheIdParam}`, demarcheId.toString());

export const makeCollectiviteModifierUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteModifierPath.replace(
    `:${collectiviteParam}`,
    collectiviteId.toString()
  );

export const makeCollectiviteAffichageReferentielsUrl = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) =>
  collectiviteAffichageReferentielsPath.replace(
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
