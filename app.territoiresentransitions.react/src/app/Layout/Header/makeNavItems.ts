import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteIndicateursUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlansActionsBaseUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
  makeCollectiviteUsersUrl,
} from 'app/paths';
import {TNavDropdown, TNavItem, TNavItemsList} from './types';
import {Referentiel} from 'types/litterals';
import {referentielToName} from 'app/labels';

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
    menuReferentiel({collectiviteId, referentielId: 'cae', acces_restreint}),
    menuReferentiel({collectiviteId, referentielId: 'eci', acces_restreint}),
    {
      acces_restreint,
      title: 'Pilotage',
      items: [
        {
          label: "Plans d'action",
          to: makeCollectivitePlansActionsBaseUrl({
            collectiviteId,
          }),
        },
        {
          label:
            'Indicateurs contrat de relance et de transition écologique (CRTE)',
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
          label: 'Personnalisation des référentiels',
          to: makeCollectivitePersoRefUrl({
            collectiviteId,
          }),
        },
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

// items d'un sous-menu référentiel
const menuReferentiel = ({
  collectiviteId,
  referentielId,
  acces_restreint,
}: {
  collectiviteId: number;
  referentielId: Referentiel;
  acces_restreint?: boolean;
}) => ({
  title: referentielToName[referentielId],
  // chemin de base pour garder le menu actif quand un change d'onglet dans la vue Référentiel
  urlPrefix: makeCollectiviteReferentielUrl({
    collectiviteId,
    referentielId,
    referentielVue: '',
  }),
  items: [
    {
      label: 'Référentiel',
      to: makeCollectiviteReferentielUrl({
        collectiviteId,
        referentielId,
      }),
    },
    {
      acces_restreint,
      label: 'Indicateurs',
      to: makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: referentielId,
      }),
    },
    {
      label: 'Labellisation',
      to: makeCollectiviteLabellisationUrl({
        collectiviteId,
        referentielId,
      }),
    },
  ],
});

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
