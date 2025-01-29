import {
  makeCollectiviteAccueilUrl,
  makeCollectiviteActionUrl,
  makeCollectiviteBibliothequeUrl,
  makeCollectiviteIndicateursCollectiviteUrl,
  makeCollectiviteJournalUrl,
  makeCollectiviteLabellisationRootUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePanierUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlansActionsLandingUrl,
  makeCollectivitePlansActionsSyntheseUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteSyntheseReferentielUrl,
  makeCollectiviteTousLesIndicateursUrl,
  makeCollectiviteToutesLesFichesUrl,
  makeCollectiviteTrajectoirelUrl,
  makeCollectiviteUsersUrl,
  makeTableauBordUrl,
} from '@/app/app/paths';
import { UserData } from '@/app/core-logic/api/auth/AuthProvider';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { TNavDropdown, TNavItem, TNavItemsList } from './types';

/** Génère les liens de navigation pour une collectivité donnée */
export const makeNavItems = (
  collectivite: CurrentCollectivite,
  user: UserData | null,
  panierId: string | undefined,
  hasPlansAction?: boolean
): TNavItemsList => {
  return filtreItems(
    makeNavItemsBase(collectivite, user, panierId, hasPlansAction)
  );
};

const isVisiteur = ({
  user,
  collectivite,
}: {
  user: UserData | null;
  collectivite: CurrentCollectivite;
}) =>
  collectivite.niveauAcces === null &&
  !user?.isSupport &&
  !collectivite.isRoleAuditeur;

const makeNavItemsBase = (
  collectivite: CurrentCollectivite,
  user: UserData | null,
  panierId: string | undefined,
  hasPlansAction?: boolean
): TNavItemsList => {
  const collectiviteId = collectivite.collectiviteId;
  const confidentiel =
    collectivite.accesRestreint && collectivite.niveauAcces === null;
  const hideToVisitor = isVisiteur({ user, collectivite });

  // items communs qque soient les droits de l'utilisateur courant
  return [
    {
      label: 'Accueil',
      to: makeCollectiviteAccueilUrl({ collectiviteId }),
      dataTest: 'nav-home',
    },
    {
      confidentiel,
      label: 'Actions à Impact',
      to: makeCollectivitePanierUrl({
        collectiviteId,
        panierId,
      }),
    },
    {
      confidentiel,
      title: 'État des lieux',
      dataTest: 'nav-edl',
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
          dataTest: 'labellisation-cae',
          to: makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          urlPrefix: ['/labellisation/cae'],
        },
        {
          label: 'Référentiel Économie Circulaire',
          dataTest: 'edl-eci',
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
          dataTest: 'labellisation-eci',
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
          label: 'Mon suivi personnel',
          dataTest: 'pa-tdb-perso',
          to: makeTableauBordUrl({
            collectiviteId,
            view: 'personnel',
          }),
          urlPrefix: ['/tableau-de-bord/personnel'],
          hideToVisitor,
        },
        {
          label: "Tous les plans d'action",
          dataTest: 'pa-tous',
          to: makeCollectivitePlansActionsLandingUrl({
            collectiviteId,
          }),
          onClick: () => {
            console.log(hasPlansAction);
            if (!hasPlansAction) {
              $crisp.push(['do', 'chat:open']);
              $crisp.push([
                'do',
                'message:show',
                [
                  'text',
                  'On est là pour vous aider à mettre en ligne vos plans d’action. Si vous hésitez entre les options de mise en ligne ou que vous avez des questions, contactez-nous !',
                ],
              ]);
              $crisp.push([
                'do',
                'message:show',
                [
                  'text',
                  "Vous trouverez aussi des infos utiles dans notre [Centre d'aide](https://aide.territoiresentransitions.fr/fr/article/comment-mettre-en-ligne-votre-plan-daction-1skcwdw/)",
                ],
              ]);
              $crisp.push(['do', 'message:show', ['text', 'À bientôt 😄']]);
            }
          },
        },
        {
          label: 'Toutes les fiches action',
          dataTest: 'pa-fa-toutes',
          to: makeCollectiviteToutesLesFichesUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Répartition des fiches action',
          dataTest: 'pa-fa-repartition',
          to: makeCollectivitePlansActionsSyntheseUrl({
            collectiviteId,
          }),
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
          label: 'Tous les indicateurs',
          dataTest: 'ind-tous',
          to: makeCollectiviteTousLesIndicateursUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Indicateurs de la collectivité',
          dataTest: 'ind-collectivite',
          to: makeCollectiviteIndicateursCollectiviteUrl({
            collectiviteId,
          }),
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
    .filter((item) => !item.hideToVisitor)
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
  collectivite: CurrentCollectivite
): TNavItemsList => {
  const collectiviteId = collectivite.collectiviteId;

  const confidentiel =
    collectivite.accesRestreint && collectivite.niveauAcces === null;

  return filtreItems([
    {
      confidentiel,
      title: 'Paramètres',
      dataTest: 'nav-params',
      items: [
        {
          label: 'Gestion des membres',
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
