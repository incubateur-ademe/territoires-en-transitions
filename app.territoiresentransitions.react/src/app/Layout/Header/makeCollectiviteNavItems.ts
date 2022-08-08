import {CurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {NiveauAcces} from 'generated/dataLayer';
import {
  makeCollectiviteIndicateursUrl,
  makeCollectiviteLabellisationUrl,
  makeCollectivitePersoRefUrl,
  makeCollectivitePlanActionUrl,
  makeCollectiviteReferentielUrl,
  makeCollectiviteTableauBordUrl,
  makeCollectiviteUsersUrl,
  planActionDefaultId,
} from 'app/paths';

export interface CollectiviteNavSingle {
  displayOnlyToMember?: boolean;
  label: string;
  path: string;
  alternativeActivePath?: string[];
  niveauAcces?: NiveauAcces | null;
}

export interface CollectiviteNavDropdown {
  isSelectCollectivite?: boolean;
  displayOnlyToMember?: boolean;
  menuLabel: string;
  niveauAcces?: NiveauAcces | null;
  listPathsAndLabels: CollectiviteNavSingle[];
}

export type CollectiviteNavItems = (
  | CollectiviteNavSingle
  | CollectiviteNavDropdown
)[];

export const isSingleNavItemDropdown = (
  item: CollectiviteNavSingle | CollectiviteNavDropdown
): item is CollectiviteNavDropdown =>
  (item as CollectiviteNavDropdown).listPathsAndLabels !== undefined;

/** Génère les liens de navigation pour un identifiant de collectivité donné */
export const makeCollectiviteNavItems = (
  collectivite: CurrentCollectivite
): CollectiviteNavItems => {
  const collectiviteId = collectivite.collectivite_id;

  const common = [
    {
      label: 'Tableau de bord',
      path: makeCollectiviteTableauBordUrl({collectiviteId}),
    },
    {
      menuLabel: 'Climat Air Énergie',
      listPathsAndLabels: [
        {
          label: 'Référentiel',
          path: makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
          alternativeActivePath: [
            makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId: 'cae',
              referentielVue: 'priorisation',
            }),
            makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId: 'cae',
              referentielVue: 'detail',
            }),
          ],
        },
        {
          label: 'Indicateurs',
          path: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'cae',
          }),
        },
        {
          label: 'Labellisation',
          path: makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: 'cae',
          }),
        },
      ],
    },
    {
      menuLabel: 'Économie circulaire',
      listPathsAndLabels: [
        {
          label: 'Référentiel',
          path: makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
          alternativeActivePath: [
            makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId: 'eci',
              referentielVue: 'priorisation',
            }),
            makeCollectiviteReferentielUrl({
              collectiviteId,
              referentielId: 'eci',
              referentielVue: 'detail',
            }),
          ],
        },
        {
          label: 'Indicateurs',
          path: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'eci',
          }),
        },
        {
          label: 'Labellisation',
          path: makeCollectiviteLabellisationUrl({
            collectiviteId,
            referentielId: 'eci',
          }),
        },
      ],
    },
    {
      menuLabel: 'Pilotage',
      listPathsAndLabels: [
        {
          label: "Plans d'action",
          path: makeCollectivitePlanActionUrl({
            collectiviteId,
            planActionUid: planActionDefaultId,
          }),
        },
        {
          label:
            'Indicateurs contrat de relance et de transition écologique (CRTE)',
          path: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'crte',
          }),
        },
        {
          label: 'Indicateurs personnalisés',
          path: makeCollectiviteIndicateursUrl({
            collectiviteId,
            indicateurView: 'perso',
          }),
        },
      ],
    },
  ];

  if (collectivite.readonly) {
    return common;
  }

  return [
    ...common,
    {
      menuLabel: 'Paramètres',
      listPathsAndLabels: [
        {
          label: 'Personnalisation des référentiels',
          path: makeCollectivitePersoRefUrl({
            collectiviteId,
          }),
        },
        {
          label: 'Gestion des membres',
          path: makeCollectiviteUsersUrl({
            collectiviteId,
          }),
        },
      ],
    },
  ];
};
