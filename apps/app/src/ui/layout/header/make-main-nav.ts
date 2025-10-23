import { CurrentCollectivite } from '@/api/collectivites';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import {
  ajouterCollectiviteUrl,
  getRechercheViewUrl,
  makeCollectiviteAccueilUrl,
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteModifierUrl,
  makeCollectivitePanierUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeCollectiviteTrajectoirelUrl,
  makeCollectiviteUsersUrl,
  makeReferentielActionUrl,
  makeReferentielLabellisationUrl,
  makeReferentielRootUrl,
  makeReferentielUrl,
  makeTdbCollectiviteUrl,
  makeTdbPlansEtActionsUrl,
  ReferentielTab,
} from '@/app/app/paths';
import { HeaderProps, NavItem } from '@/ui';
import { makeCollectiviteNavItem } from './make-collectivite-nav-item';
import { filterItems } from './utils';

export const makeMainNav = ({
  user,
  currentCollectivite,
  collectivites,
  isDemoMode,
  panierId,
}: {
  user: UserDetails;
  currentCollectivite: CurrentCollectivite;
  collectivites: CurrentCollectivite[];
  isDemoMode: boolean;
  panierId?: string;
}): HeaderProps['mainNav'] => {
  const collectiviteId = currentCollectivite.collectiviteId;

  const isSupport = user.isSupport && !isDemoMode;

  const isVisitor = currentCollectivite.niveauAcces === null && !isSupport;

  const hideWhenConfidential = isVisitor && currentCollectivite?.accesRestreint;

  const hideFromVisitor = isVisitor && !currentCollectivite.isRoleAuditeur;

  const startItems: NavItem[] = filterItems([
    {
      hide: hideFromVisitor,
      icon: 'home-4-line',
      href: makeCollectiviteAccueilUrl({ collectiviteId }),
      dataTest: 'nav-home',
    },
    {
      hide: hideWhenConfidential,
      children: 'Tableaux de bord',
      dataTest: 'nav-tdb',
      links: [
        {
          children: 'Tableau de bord synthétique',
          dataTest: 'tdb-collectivite',
          href: makeTdbCollectiviteUrl({
            collectiviteId,
            view: 'synthetique',
          }),
        },
        {
          hide: hideFromVisitor,
          children: 'Mon suivi personnel',
          dataTest: 'tdb-perso',
          href: makeTdbCollectiviteUrl({
            collectiviteId,
            view: 'personnel',
          }),
        },
      ],
    },
    {
      hide: hideWhenConfidential,
      children: 'État des lieux',
      dataTest: 'nav-edl',
      links: [
        {
          children: 'Tableau de bord État des Lieux',
          href: makeReferentielRootUrl({ collectiviteId }),
          dataTest: 'edl-synthese',
        },
        {
          children: 'Personnalisation des référentiels',
          href: makeCollectivitePersoRefUrl({
            collectiviteId,
          }),
          dataTest: 'edl-personnalisation',
        },
        {
          children: 'Référentiel Climat-Air-Énergie',
          dataTest: 'edl-cae',
          href: makeReferentielUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          urlPrefix: [
            ...['progression', 'priorisation', 'detail', 'evolutions'].map(
              (referentielTab) =>
                makeReferentielUrl({
                  collectiviteId,
                  referentielId: 'cae',
                  referentielTab: referentielTab as ReferentielTab,
                })
            ),
            makeReferentielActionUrl({
              collectiviteId,
              referentielId: 'cae',
              actionId: '',
            }),
          ],
        },
        {
          children: 'Labellisation Climat-Air-Énergie',
          dataTest: 'labellisation-cae',
          href: makeReferentielLabellisationUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          urlPrefix: ['cae/labellisation'],
        },
        {
          children: 'Référentiel Économie Circulaire',
          dataTest: 'edl-eci',
          href: makeReferentielUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
          urlPrefix: [
            ...['progression', 'priorisation', 'detail', 'evolutions'].map(
              (referentielTab) =>
                makeReferentielUrl({
                  collectiviteId,
                  referentielId: 'eci',
                  referentielTab: referentielTab as ReferentielTab,
                })
            ),
            makeReferentielActionUrl({
              collectiviteId,
              referentielId: 'eci',
              actionId: '',
            }),
          ],
        },
        {
          children: 'Labellisation Économie Circulaire',
          dataTest: 'labellisation-eci',
          href: makeReferentielLabellisationUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
          urlPrefix: ['eci/labellisation'],
        },
      ],
    },
    {
      hide: hideWhenConfidential,
      children: 'Plans & Actions',
      dataTest: 'nav-pa',
      links: [
        {
          children: 'Tableau de bord Plans & Actions',
          dataTest: 'pa-tdb',
          href: makeTdbPlansEtActionsUrl({
            collectiviteId,
          }),
        },
        {
          children: "Tous les plans d'action",
          dataTest: 'pa-tous',
          href: makeCollectivitePlansActionsListUrl({
            collectiviteId,
          }),
        },
        {
          children: 'Toutes les fiches action',
          dataTest: 'pa-fa-toutes',
          href: makeCollectiviteToutesLesFichesUrl({
            collectiviteId,
          }),
        },
        {
          hide: hideFromVisitor,
          children: 'Actions à Impact',
          dataTest: 'pa-ai',
          href: makeCollectivitePanierUrl({
            collectiviteId,
            panierId,
          }),
          external: true,
        },
      ],
    },
    {
      hide: hideWhenConfidential,
      children: 'Indicateurs',
      dataTest: 'nav-ind',
      links: [
        {
          children: "Listes d'indicateurs",
          dataTest: 'ind-tous',
          href: makeCollectiviteIndicateursListUrl({
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
          children: 'Trajectoire SNBC et objectifs',
          href: makeCollectiviteTrajectoirelUrl({ collectiviteId }),
        },
      ],
    },
    {
      children: 'Collectivités',
      dataTest: 'nav-collectivites',
      href: getRechercheViewUrl({
        collectiviteId,
        view: 'collectivites',
      }),
    },
    {
      hide: !isSupport,
      children: 'Support',
      links: [
        {
          children: 'Ajouter une collectivité',
          href: ajouterCollectiviteUrl,
        },
        {
          children: 'Modifier la collectivité',
          href: makeCollectiviteModifierUrl({
            collectiviteId,
          }),
        },
      ],
    },
  ]);

  const endItems: NavItem[] = filterItems([
    {
      hide: hideWhenConfidential,
      children: 'Paramètres',
      dataTest: 'nav-params',
      links: [
        {
          children: 'Gestion des utilisateurs',
          dataTest: 'params-membres',
          href: makeCollectiviteUsersUrl({
            collectiviteId,
          }),
        },
        {
          children: 'Bibliothèque de documents',
          dataTest: 'params-docs',
          href: makeCollectiviteBibliothequeUrl({
            collectiviteId,
          }),
        },
        {
          children: "Journal d'activité",
          dataTest: 'params-logs',
          href: makeCollectiviteJournalUrl({
            collectiviteId,
          }),
        },
      ],
    },
    makeCollectiviteNavItem(collectivites, currentCollectivite),
  ]);

  return { startItems, endItems };
};
