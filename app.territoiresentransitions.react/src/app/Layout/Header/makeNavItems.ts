import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import {
  ajouterCollectiviteUrl,
  makeCollectiviteAccueilUrl,
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteModifierUrl,
  makeCollectivitePanierUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlansActionsLandingUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeCollectiviteTrajectoirelUrl,
  makeCollectiviteUsersUrl,
  makeReferentielActionUrl,
  makeReferentielLabellisationRootUrl,
  makeReferentielLabellisationUrl,
  makeReferentielRootUrl,
  makeReferentielUrl,
  makeTableauBordUrl,
} from '@/app/app/paths';
import { TNavDropdown, TNavItem, TNavItemsList } from './types';

/** Génère les liens de navigation pour une collectivité donnée */
export const makeNavItems = (
  collectivite: CollectiviteNiveauAcces,
  user: UserDetails | null,
  panierId: string | undefined,
  isDemoMode: boolean
): TNavItemsList => {
  return filtreItems(
    makeNavItemsBase(collectivite, user, panierId, isDemoMode)
  );
};

const isVisiteur = ({
  user,
  collectivite,
}: {
  user: UserDetails | null;
  collectivite: CollectiviteNiveauAcces;
}) =>
  collectivite.niveauAcces === null &&
  !user?.isSupport &&
  !collectivite.isRoleAuditeur;

const makeNavItemsBase = (
  collectivite: CollectiviteNiveauAcces,
  user: UserDetails | null,
  panierId: string | undefined,
  isDemoMode: boolean
): TNavItemsList => { 
  const collectiviteId = collectivite.collectiviteId;
  const notSupport = !user?.isSupport || isDemoMode;
  const confidentiel =
    collectivite.accesRestreint &&
    collectivite.niveauAcces === null &&
    notSupport;
  const hideFromVisitor = isVisiteur({ user, collectivite });

  // items communs qque soient les droits de l'utilisateur courant
  return [
    {
      label: 'Accueil',
      to: makeCollectiviteAccueilUrl({ collectiviteId }),
      dataTest: 'nav-home',
    },
    {
      confidentiel,
      title: 'État des lieux',
      dataTest: 'nav-edl',
      // Chemin de base pour garder le menu actif quand un change d'onglet
      urlPrefix: [
        makeReferentielUrl({
          collectiviteId,
          referentielId: 'cae',
        }),
        makeReferentielUrl({
          collectiviteId,
          referentielId: 'eci',
        }),
        makeReferentielLabellisationRootUrl({
          collectiviteId,
          referentielId: 'cae',
        }),
        makeReferentielLabellisationRootUrl({
          collectiviteId,
          referentielId: 'eci',
        }),
        makeReferentielActionUrl({
          collectiviteId,
          referentielId: 'cae',
          actionId: '',
        }),
        makeReferentielActionUrl({
          collectiviteId,
          referentielId: 'eci',
          actionId: '',
        }),
      ],
      items: [
        {
          label: "Synthèse de l'état des lieux",
          to: makeReferentielRootUrl({ collectiviteId }),
          dataTest: 'edl-synthese',
        },
        {
          label: 'Personnalisation des référentiels',
          to: makeCollectivitePersoRefUrl({
            collectiviteId,
          }),
          dataTest: 'edl-personnalisation',
        },
        {
          label: 'Référentiel Climat-Air-Énergie',
          dataTest: 'edl-cae',
          to: makeReferentielUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          urlPrefix: [
            makeReferentielUrl({
              collectiviteId,
              referentielId: 'cae',
            }),
            makeReferentielActionUrl({
              collectiviteId,
              referentielId: 'cae',
              actionId: '',
            }),
          ],
        },
        {
          label: 'Labellisation Climat-Air-Énergie',
          dataTest: 'labellisation-cae',
          to: makeReferentielLabellisationUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          urlPrefix: ['/labellisation/cae'],
        },
        {
          label: 'Référentiel Économie Circulaire',
          dataTest: 'edl-eci',
          to: makeReferentielUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
          urlPrefix: [
            makeReferentielUrl({
              collectiviteId,
              referentielId: 'eci',
            }),
            makeReferentielActionUrl({
              collectiviteId,
              referentielId: 'eci',
              actionId: '',
            }),
          ],
        },
        {
          label: 'Labellisation Économie Circulaire',
          dataTest: 'labellisation-eci',
          to: makeReferentielLabellisationUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
          urlPrefix: ['/labellisation/eci'],
        },
      ],
    },
    {
      confidentiel,
      title: 'Plans & Actions',
      urlPrefix: [`${collectivite.collectiviteId}/plans/`],
      dataTest: 'nav-pa',
      items: [
        {
          label: 'Tableau de bord Collectivité',
          dataTest: 'pa-tdb-collectivite',
          to: makeTableauBordUrl({
            collectiviteId,
            view: 'collectivite',
          }),
          urlPrefix: ['/tableau-de-bord/collectivite'],
        },
        {
          hideFromVisitor,
          label: 'Mon suivi personnel',
          dataTest: 'pa-tdb-perso',
          to: makeTableauBordUrl({
            collectiviteId,
            view: 'personnel',
          }),
          urlPrefix: ['/tableau-de-bord/personnel'],
        },
        {
          label: "Tous les plans d'action",
          dataTest: 'pa-tous',
          to: makeCollectivitePlansActionsLandingUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Toutes les fiches action',
          dataTest: 'pa-fa-toutes',
          to: makeCollectiviteToutesLesFichesUrl({
            collectiviteId,
          }),
        },
        {
          hideFromVisitor,
          label: 'Actions à Impact',
          dataTest: 'pa-ai',
          to: makeCollectivitePanierUrl({
            collectiviteId,
            panierId,
          }),
          openInNewTab: true,
        },
      ],
    },
    {
      confidentiel,
      title: 'Indicateurs',
      dataTest: 'nav-ind',
      urlPrefix: [`${collectivite.collectiviteId}/indicateurs/`],
      items: [
        {
          label: "Listes d'indicateurs",
          dataTest: 'ind-tous',
          to: makeCollectiviteIndicateursListUrl({
            collectiviteId,
          }),
          urlPrefix: [
            makeCollectiviteIndicateursListUrl({
              collectiviteId,
            }),
          ],
        },
        {
          dataTest: 'ind-traj-snbc',
          label: 'Trajectoire SNBC territorialisée',
          to: makeCollectiviteTrajectoirelUrl({ collectiviteId }),
        },
      ],
    },
  ];
};

// filtre les items (et sous-items) marqués comme étant confidentiel (la
// collectivité a le flag acces_restreint (= confidentielle) et l'utilisateur courant n'est pas
// membre la collectivité)
const filtreItems = (items: TNavItemsList): TNavItemsList =>
  items
    ?.filter((item) => !item.confidentiel)
    .filter((item) => !item.hideFromVisitor)
    .map((item) => {
      return Object.prototype.hasOwnProperty.call(item, 'items')
        ? {
            ...item,
            items: filtreItems((item as TNavDropdown).items) as TNavItem[],
          }
        : item;
    });

/** Génère les liens de navigation secondaires pour une collectivité donnée */
export const makeSecondaryNavItems = (
  collectivite: CollectiviteNiveauAcces,
  user: UserDetails | null,
  isDemoMode: boolean
): TNavItemsList => {
  const collectiviteId = collectivite.collectiviteId;
  const notSupport = !user?.isSupport || isDemoMode;
  const confidentiel =
    collectivite.accesRestreint &&
    collectivite.niveauAcces === null &&
    notSupport;

  return filtreItems([
    {
      confidentiel,
      title: 'Paramètres',
      dataTest: 'nav-params',
      items: [
        {
          label: 'Gestion des utilisateurs',
          dataTest: 'params-membres',
          to: makeCollectiviteUsersUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Bibliothèque de documents',
          dataTest: 'params-docs',
          to: makeCollectiviteBibliothequeUrl({
            collectiviteId,
          }),
        },
        {
          label: "Journal d'activité",
          dataTest: 'params-logs',
          to: makeCollectiviteJournalUrl({
            collectiviteId,
          }),
        },
      ],
    },
  ]);
};

export const makeSupportNavItems = (
  collectivite: CollectiviteNiveauAcces,
  user: UserDetails | null,
  isDemoMode: boolean
): TNavItemsList => {
    const collectiviteId = collectivite.collectiviteId;
  const support = user?.isSupport && !isDemoMode;

  return support
    ? [
        {
          title: 'Support',
          items: [
            {
              label: 'Ajouter une collectivité',
              to: ajouterCollectiviteUrl,
            },
            {
              label: 'Modifier la collectivité',
              to: makeCollectiviteModifierUrl({
                collectiviteId,
              }),
            },
          ],
        },
      ]
    : [];
};
