import {
  makeCollectiviteAccueilUrl,
  makeCollectiviteActionUrl,
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteTrajectoirelUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteLabellisationRootUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlansActionsSyntheseUrl,
  makeCollectivitePlansActionsLandingUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteUsersUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeCollectiviteTousLesIndicateursUrl,
  makeCollectiviteIndicateursCollectiviteUrl,
  makeTableauBordUrl,
  makeCollectiviteSyntheseReferentielUrl,
} from 'app/paths';
import { UserData } from 'core-logic/api/auth/AuthProvider';
import { CurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { TNavDropdown, TNavItem, TNavItemsList } from './types';

/** Génère les liens de navigation pour une collectivité donnée */
export const makeNavItems = (
  collectivite: CurrentCollectivite,
  user: UserData | null
): TNavItemsList => {
  return filtreItems(makeNavItemsBase(collectivite, user));
};

const isVisiteur = ({
  user,
  collectivite,
}: {
  user: UserData | null;
  collectivite: CurrentCollectivite;
}) =>
  collectivite.niveau_acces === null &&
  !user?.isSupport &&
  !collectivite.est_auditeur;

const makeNavItemsBase = (
  collectivite: CurrentCollectivite,
  user: UserData | null
): TNavItemsList => {
  const collectiviteId = collectivite.collectivite_id;
  const confidentiel =
    collectivite.acces_restreint && collectivite.niveau_acces === null;
  const hideToVisitor = isVisiteur({ user, collectivite });

  // items communs qque soient les droits de l'utilisateur courant
  return [
    {
      label: 'Accueil',
      to: makeCollectiviteAccueilUrl({ collectiviteId }),
    },
    {
      confidentiel,
      title: 'État des lieux',
      // Chemin de base pour garder le menu actif quand un change d'onglet
      urlPrefix: [
        makeCollectiviteReferentielUrl({
          collectiviteId,
          referentielId: 'cae',
          referentielVue: '',
        }),
        makeCollectiviteReferentielUrl({
          collectiviteId,
          referentielId: 'eci',
          referentielVue: '',
        }),
        makeCollectiviteLabellisationRootUrl({
          collectiviteId,
          referentielId: 'cae',
        }),
        makeCollectiviteLabellisationRootUrl({
          collectiviteId,
          referentielId: 'eci',
        }),
        makeCollectiviteActionUrl({
          collectiviteId,
          referentielId: 'cae',
          actionId: '',
        }),
        makeCollectiviteActionUrl({
          collectiviteId,
          referentielId: 'eci',
          actionId: '',
        }),
      ],
      items: [
        {
          label: "Synthèse de l'état des lieux",
          to: makeCollectiviteSyntheseReferentielUrl({ collectiviteId }),
        },
        {
          label: 'Personnalisation des référentiels',
          to: makeCollectivitePersoRefUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Référentiel Climat-Air-Énergie',
          to: makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          urlPrefix: [
            makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId: 'cae',
              referentielVue: '',
            }),
            makeCollectiviteActionUrl({
              collectiviteId,
              referentielId: 'cae',
              actionId: '',
            }),
          ],
        },
        {
          label: 'Labellisation Climat-Air-Énergie',
          to: makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          urlPrefix: ['/labellisation/cae'],
        },
        {
          label: 'Référentiel Économie Circulaire',
          to: makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
          urlPrefix: [
            makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId: 'eci',
              referentielVue: '',
            }),
            makeCollectiviteActionUrl({
              collectiviteId,
              referentielId: 'eci',
              actionId: '',
            }),
          ],
        },
        {
          label: 'Labellisation Économie Circulaire',
          to: makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
          urlPrefix: ['/labellisation/eci'],
        },
      ],
    },
    {
      confidentiel,
      title: "Plans d'action",
      urlPrefix: [`${collectivite.collectivite_id}/plans/`],
      items: [
        {
          label: 'Tableau de bord Collectivité',
          to: makeTableauBordUrl({
            collectiviteId,
            view: 'collectivite',
          }),
          urlPrefix: ['/tableau-de-bord/collectivite'],
        },
        {
          label: 'Mon suivi personnel',
          to: makeTableauBordUrl({
            collectiviteId,
            view: 'personnel',
          }),
          urlPrefix: ['/tableau-de-bord/personnel'],
          hideToVisitor,
        },
        {
          label: "Tous les plans d'action",
          to: makeCollectivitePlansActionsLandingUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Toutes les fiches action',
          to: makeCollectiviteToutesLesFichesUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Répartition des fiches action',
          to: makeCollectivitePlansActionsSyntheseUrl({
            collectiviteId,
          }),
        },
      ],
    },
    {
      confidentiel,
      title: 'Indicateurs',
      urlPrefix: [`${collectivite.collectivite_id}/indicateurs/`],
      items: [
        {
          label: 'Tous les indicateurs',
          to: makeCollectiviteTousLesIndicateursUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Indicateurs de la collectivité',
          to: makeCollectiviteIndicateursCollectiviteUrl({
            collectiviteId,
          }),
        },
        {
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
    .filter((item) => !item.hideToVisitor)
    .map((item) => {
      return item.hasOwnProperty('items')
        ? {
            ...item,
            items: filtreItems((item as TNavDropdown).items) as TNavItem[],
          }
        : item;
    });

/** Génère les liens de navigation secondaires pour une collectivité donnée */
export const makeSecondaryNavItems = (
  collectivite: CurrentCollectivite,
  user: UserData | null
): TNavItemsList => {
  return filtreItems(makeSecondaryNavItemsBase(collectivite, user));
};

const makeSecondaryNavItemsBase = (
  collectivite: CurrentCollectivite,
  user: UserData | null
): TNavItemsList => {
  const collectiviteId = collectivite.collectivite_id;

  // On n'affiche pas le menu des paramètres si droit "visiteur"
  if (isVisiteur({ user, collectivite })) {
    return [];
  }

  return [
    {
      title: 'Paramètres',
      items: [
        {
          label: 'Gestion des membres',
          to: makeCollectiviteUsersUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Bibliothèque de documents',
          to: makeCollectiviteBibliothequeUrl({
            collectiviteId,
          }),
        },
        {
          label: "Journal d'activité",
          to: makeCollectiviteJournalUrl({
            collectiviteId,
          }),
        },
      ],
    },
  ];
};
