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

const buildSearchIndicateursSource = (
  indicateurs: readonly IndicateurCherchable[]
) =>
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
  });

/** Les suggestions du champ de recherche : les indicateurs du bloc. */
export const buildSearchIndicateursSuggestions = (
  indicateurs: readonly IndicateurCherchable[]
) => combineSearchSources([buildSearchIndicateursSource(indicateurs)]);

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

/** Un critère de filtre cherchable, identifié par sa valeur de filtre. */
type FiltreCherchable = { id: string; nom: string };

const buildSearchFiltreSource = (
  id: string,
  label: string,
  prefixe: string,
  items: readonly FiltreCherchable[]
) =>
  createSearchSource({
    id,
    label,
    items,
    getTexts: ({ nom }) => [nom],
    toOption: (item) => ({
      id: `${prefixe}:${item.id}`,
      label: item.nom,
    }),
  });

/** Préfixe des critères de filtre dans l'identifiant d'une suggestion */
export const FILTRE_PREFIXES = {
  axe: 'axe',
  pilote: 'pilote',
  service: 'service',
  thematique: 'thematique',
} as const;

/**
 * Les suggestions du champ de recherche : les indicateurs du bloc, puis les
 * axes, personnes pilotes, services pilotes et thématiques, qui posent le
 * filtre correspondant quand on les choisit.
 */
export const buildSearchSuggestions = ({
  indicateurs,
  axes,
  pilotes,
  services,
  thematiques,
}: {
  indicateurs: readonly IndicateurCherchable[];
  axes: readonly { id: number; nom: string | null }[];
  pilotes: readonly FiltreCherchable[];
  services: readonly FiltreCherchable[];
  thematiques: readonly FiltreCherchable[];
}) =>
  combineSearchSources([
    buildSearchIndicateursSource(indicateurs),
    buildSearchFiltreSource(
      'axes',
      appLabels.suiviPlanAxe,
      FILTRE_PREFIXES.axe,
      axes.map(({ id, nom }) => ({
        id: String(id),
        nom: nom || appLabels.sansTitre,
      }))
    ),
    buildSearchFiltreSource(
      'pilotes',
      appLabels.personnePilote({ plural: true }),
      FILTRE_PREFIXES.pilote,
      pilotes
    ),
    buildSearchFiltreSource(
      'services',
      appLabels.directionOuServicePilote(),
      FILTRE_PREFIXES.service,
      services
    ),
    buildSearchFiltreSource(
      'thematiques',
      appLabels.suiviPlanThematiques,
      FILTRE_PREFIXES.thematique,
      thematiques
    ),
  ]);

/** La valeur d'une suggestion de filtre : `axe:12` → `['axe', '12']`, sinon `null`. */
export const parseSuggestionFiltre = (
  id: string
): { prefixe: string; valeur: string } | null => {
  const separateur = id.indexOf(':');
  if (separateur === -1) {
    return null;
  }
  return {
    prefixe: id.slice(0, separateur),
    valeur: id.slice(separateur + 1),
  };
};
