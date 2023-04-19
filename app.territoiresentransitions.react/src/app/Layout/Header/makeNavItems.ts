import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteLabellisationRootUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlansActionsBaseUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
  makeCollectiviteUsersUrl,
} from 'app/paths';
import {TNavDropdown, TNavItem, TNavItemsList} from './types';

/** Génère les liens de navigation pour une collectivité donnée */
export const makeNavItems = (
  collectivite: CurrentCollectivite
): TNavItemsList => {
  return filtreItemsEnAccesRestreint(makeNavItemsBase(collectivite));
};

const makeNavItemsBase = (collectivite: CurrentCollectivite): TNavItemsList => {
  const collectiviteId = collectivite.collectivite_id;
  const acces_restreint = collectivite.acces_restreint && collectivite.readonly;

  // items communs qque soient les droits de l'utilisateur courant
  const common = [
    {
      label: 'Tableau de bord',
      to: makeCollectiviteTableauBordUrl({collectiviteId}),
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
        },
        {
          label: 'Labellisation Climat-Air-Énergie',
          to: makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
        },
        {
          label: 'Référentiel Économie Circulaire',
          to: makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
        },
        {
          label: 'Labellisation Économie Circulaire',
          to: makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
        },
      ],
    },
    {
      acces_restreint,
      label: "Plans d'action",
      to: makeCollectivitePlansActionsBaseUrl({
        collectiviteId,
      }),
    },
    {
      acces_restreint,
      title: 'Indicateurs',
      items: [
        {
          label: 'Indicateurs Climat-Air-Énergie',
          to: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'cae',
          }),
        },
        {
          label: 'Indicateurs Économie Circulaire',
          to: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'eci',
          }),
        },
        {
          label: 'Indicateurs Contrat de Relance Transition Écologique',
          to: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'crte',
          }),
        },
        {
          label: 'Indicateurs personnalisés',
          to: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'perso',
          }),
        },
      ],
    },
  ];

  // droit "visiteur" uniquement => renvoi que les items communs
  if (collectivite.niveau_acces === null) {
    return common;
  }

  // sinon renvoi les items communs et les items paramètres
  return [
    ...common,
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
