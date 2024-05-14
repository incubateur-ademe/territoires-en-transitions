import {UserData} from 'core-logic/api/auth/AuthProvider';
import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {
  makeCollectiviteAccueilUrl,
  makeCollectiviteActionUrl,
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteLabellisationRootUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlansActionsSyntheseUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteUsersUrl,
  makeTableauBordLandingUrl,
} from 'app/paths';
import {TNavDropdown, TNavItem, TNavItemsList} from './types';

/** Génère les liens de navigation pour une collectivité donnée */
export const makeNavItems = (
  collectivite: CurrentCollectivite,
  user: UserData | null
): TNavItemsList => {
  return filtreItemsEnAccesRestreint(makeNavItemsBase(collectivite, user));
};

const makeNavItemsBase = (
  collectivite: CurrentCollectivite,
  user: UserData | null
): TNavItemsList => {
  const collectiviteId = collectivite.collectivite_id;
  const acces_restreint =
    collectivite.acces_restreint && collectivite.niveau_acces === null;

  // items communs qque soient les droits de l'utilisateur courant
  const common = [
    {
      label: 'Accueil',
      to: makeCollectiviteAccueilUrl({collectiviteId}),
    },
    {
      acces_restreint,
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
      acces_restreint,
      label: "Plans d'action",
      to: makeCollectivitePlansActionsSyntheseUrl({
        collectiviteId,
      }),
      urlPrefix: ['/plans/'],
    },
    {
      acces_restreint,
      label: 'Indicateurs',
      to: makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: 'cles',
      }),
      urlPrefix: [makeCollectiviteIndicateursUrl({collectiviteId})],
    },
  ];

  // droit "visiteur" uniquement => renvoi que les items communs
  if (
    collectivite.niveau_acces === null &&
    !user?.isSupport &&
    !collectivite.est_auditeur
  ) {
    return common;
  }

  // sinon renvoi les items communs et les items paramètres
  return [
    ...common,
    {
      label: 'Tableau de bord',
      to: makeTableauBordLandingUrl({
        collectiviteId,
      }),
      urlPrefix: ['/tableau-de-bord/'],
    },
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

// filtre les items (et sous-items) marqués comme étant en accès restreint (la
// collectivité a le flag acces_restreint et l'utilisateur courant n'est pas
// membre la collectivité)
const filtreItemsEnAccesRestreint = (items: TNavItemsList): TNavItemsList =>
  items
    ?.filter(item => !item.acces_restreint)
    .map(item => {
      return item.hasOwnProperty('items')
        ? {
            ...item,
            items: filtreItemsEnAccesRestreint(
              (item as TNavDropdown).items
            ) as TNavItem[],
          }
        : item;
    });
