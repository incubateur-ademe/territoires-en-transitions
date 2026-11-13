import { appLabels } from '@/app/labels/catalog';
import {
  combineSearchSources,
  createSearchSource,
} from '@/app/utils/search/search-source';
import type { RouterOutput } from '@tet/api';

export type CollectivitesSuivies =
  RouterOutput['demarches']['pcaet']['listCollectivitesSuivies'];

/** Le groupe d'une suggestion dit à quel filtre elle se rapporte. */
export const SEARCH_GROUP = {
  collectivites: 'collectivites',
  departements: 'departements',
  regions: 'regions',
} as const;

/**
 * Les suggestions de la liste d'instruction : les collectivités et Supra du
 * territoire, puis ses départements et régions — seulement s'il en couvre
 * plusieurs, comme les colonnes qu'ils filtrent.
 */
export const buildSearchDossiersSuggestions = ({
  collectivites,
  departements,
  regions,
}: CollectivitesSuivies) => {
  const countCollectivites = (
    predicate: (collectivite: (typeof collectivites)[number]) => boolean
  ) =>
    appLabels.instructionListeRechercheNbCollectivites({
      count: collectivites.filter(predicate).length,
    });

  return combineSearchSources([
    createSearchSource({
      id: SEARCH_GROUP.collectivites,
      label: appLabels.instructionListeRechercheCollectivites,
      items: collectivites,
      getTexts: ({ nom }) => [nom],
      toOption: ({
        id,
        nom,
        porteur,
        isSupra,
        departementCode,
        departementLibelle,
      }) => ({
        id: String(id),
        label: nom,
        badge: isSupra ? appLabels.instructionListeBadgeSupra : undefined,
        description: porteur
          ? appLabels.instructionListeRechercheCouvertePar({
              porteur: porteur.nom,
            })
          : departementLibelle
          ? `${departementLibelle} (${departementCode})`
          : undefined,
      }),
    }),
    departements.length > 1 &&
      createSearchSource({
        id: SEARCH_GROUP.departements,
        label: appLabels.instructionListeRechercheDepartements,
        items: departements,
        getTexts: ({ code, libelle }) => [libelle, code],
        toOption: ({ code, libelle }) => ({
          id: code,
          label: `${libelle} (${code})`,
          meta: countCollectivites((c) => c.departementCode === code),
        }),
        limit: 4,
      }),
    regions.length > 1 &&
      createSearchSource({
        id: SEARCH_GROUP.regions,
        label: appLabels.instructionListeRechercheRegions,
        items: regions,
        getTexts: ({ libelle }) => [libelle],
        toOption: ({ code, libelle }) => ({
          id: code,
          label: libelle,
          meta: countCollectivites((c) => c.regionCode === code),
        }),
        limit: 4,
      }),
  ]);
};
