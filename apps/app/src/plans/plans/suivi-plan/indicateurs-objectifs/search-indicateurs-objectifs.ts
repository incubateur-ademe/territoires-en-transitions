import { appLabels } from '@/app/labels/catalog';
import {
  combineSearchSources,
  createSearchSource,
} from '@/app/utils/search/search-source';
import { IndicateurObjectifSource } from '@tet/domain/plans';
import { rankSearchMatches } from '@tet/domain/utils';

type IndicateurCherchable = {
  id: number;
  titre: string;
  identifiantReferentiel: string | null;
  favori: boolean;
  sources: IndicateurObjectifSource[];
};

/** Le filtre « Afficher » d'un plan rattaché à un dépôt PCAET. */
export const INDICATEURS_OBJECTIFS_FILTRES_SOURCE = [
  'tous',
  'reglementaires',
  'plan',
] as const;

export type IndicateursObjectifsFiltreSource =
  (typeof INDICATEURS_OBJECTIFS_FILTRES_SOURCE)[number];

const SOURCE_PAR_FILTRE: Record<
  IndicateursObjectifsFiltreSource,
  IndicateurObjectifSource | null
> = {
  tous: null,
  reglementaires: 'reglementaire',
  plan: 'plan',
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
 * Les indicateurs à afficher : ceux de la source choisie, puis ceux choisis en
 * étiquette s'il y en a, puis ceux qui répondent à la recherche libre, avec la
 * règle partagée du domaine. L'ordre de la liste est conservé.
 */
export const filterIndicateursObjectifs = <T extends IndicateurCherchable>(
  indicateurs: readonly T[],
  {
    recherche,
    selectionIds,
    source = 'tous',
  }: {
    recherche: string;
    selectionIds: number[];
    source?: IndicateursObjectifsFiltreSource;
  }
): T[] => {
  const sourceRetenue = SOURCE_PAR_FILTRE[source];
  const deLaSource = sourceRetenue
    ? indicateurs.filter(({ sources }) => sources.includes(sourceRetenue))
    : indicateurs;
  const choisis = selectionIds.length
    ? deLaSource.filter(({ id }) => selectionIds.includes(id))
    : [...deLaSource];
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
