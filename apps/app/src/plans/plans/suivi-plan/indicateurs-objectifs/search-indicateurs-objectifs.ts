import { appLabels } from '@/app/labels/catalog';
import {
  combineSearchSources,
  createSearchSource,
} from '@/app/utils/search/search-source';
import { rankSearchMatches } from '@tet/domain/utils';

type IndicateurCherchable = {
  id: number;
  titre: string;
  identifiantReferentiel: string | null;
  favori: boolean;
};

export const SEARCH_INDICATEURS_GROUP = 'indicateurs';

const getTexts = ({ titre, identifiantReferentiel }: IndicateurCherchable) =>
  identifiantReferentiel ? [titre, identifiantReferentiel] : [titre];

/** Les suggestions du champ de recherche : les indicateurs du bloc. */
export const buildSearchIndicateursSuggestions = (
  indicateurs: readonly IndicateurCherchable[]
) =>
  combineSearchSources([
    createSearchSource({
      id: SEARCH_INDICATEURS_GROUP,
      label: appLabels.indicateursObjectifsRechercheGroupe,
      items: indicateurs,
      getTexts,
      toOption: ({ id, titre, favori }) => ({
        id: String(id),
        label: titre,
        badge: favori ? appLabels.indicateursObjectifsFavori : undefined,
      }),
    }),
  ]);

/**
 * Les indicateurs à afficher : ceux choisis en étiquette s'il y en a, puis ceux
 * qui répondent à la recherche libre, avec la règle partagée du domaine. L'ordre
 * de la liste — favoris d'abord, puis alphabétique — est conservé.
 */
export const filterIndicateursObjectifs = <T extends IndicateurCherchable>(
  indicateurs: readonly T[],
  { recherche, selectionIds }: { recherche: string; selectionIds: number[] }
): T[] => {
  const choisis = selectionIds.length
    ? indicateurs.filter(({ id }) => selectionIds.includes(id))
    : [...indicateurs];
  if (!recherche.trim()) {
    return choisis;
  }
  const trouves = new Set(
    rankSearchMatches(choisis, recherche, { getTexts }).matches.map(
      ({ item }) => item
    )
  );
  return choisis.filter((indicateur) => trouves.has(indicateur));
};
