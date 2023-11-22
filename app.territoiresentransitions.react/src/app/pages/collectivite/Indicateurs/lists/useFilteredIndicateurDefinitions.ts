import {useQuery} from 'react-query';
import {Enums} from 'types/alias';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {IndicateurViewParamOption} from 'app/paths';
import {TIndicateurListItem} from '../types';

/**
 * Charge la liste d'indicateurs en fonction du filtre donné
 *
 * @param filter Paramètres de filtrage
 */
export const useFilteredIndicateurDefinitions = (
  view: IndicateurViewParamOption,
  filter: Filters
) => {
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateur_definitions', collectivite_id, view, filter],
    async () => {
      if (!collectivite_id) return [];
      const {data, error} = await fetchFilteredIndicateurs(
        collectivite_id,
        view,
        filter
      );

      if (error) {
        throw new Error(error.message);
      }

      return (
        data
          // tri par nom (pour que les diacritiques soient pris en compte)
          ?.sort((a, b) => (a.nom && b.nom ? a.nom.localeCompare(b.nom) : 0))
      );
    },
    DISABLE_AUTO_REFETCH
  );
};

// Le filtre à passer au fetch.
export type Filters = {
  thematique_ids?: number[];
  action_id?: string;
  plan_ids?: number[];
  pilote_user_ids?: string[];
  pilote_tag_ids?: number[];
  service_ids?: number[];
  type?: Enums<'indicateur_referentiel_type'>[];
  participation_score?: boolean;
  rempli?: boolean;
  text?: string;
};

// Associe les parties requises aux champs sur lesquels on filtre.
const filterParts: {[key in keyof Filters]?: string} = {
  thematique_ids: 'thematiques!inner()',
  plan_ids: 'axes!inner()',
  pilote_user_ids: 'pilotes!inner()',
  pilote_tag_ids: 'pilotes!inner()',
  service_ids: 'services!inner()',
};

/**
 * Donne la liste des indicateurs en fonction des paramètres de filtrage
 *
 * @param subset Sous-ensemble voulu (clés, sélection, cae, eci, etc.)
 * @param filters Paramètres de filtrage
 * @returns Liste d'id de définitions d'indicateur
 */
const fetchFilteredIndicateurs = (
  collectivite_id: number,
  subset: IndicateurViewParamOption,
  filters: Filters
) => {
  const parts = new Set<string>();
  const isPerso = subset === 'perso';

  // cas des indicateurs prédéfinis
  if (!isPerso) {
    parts.add('definition_referentiel!inner(programmes)');
  }

  // ajoute les relations supplémentaires en fonction des filtres voulus
  let key: keyof Filters;
  for (key in filters) {
    if (
      (filters[key] as Array<string | number>)?.length ||
      (filters[key] !== undefined && !Array.isArray(filters[key]))
    ) {
      const part = filterParts[key];
      if (part) parts.add(part);
    }
  }

  // construit la requête
  const query = supabaseClient
    // depuis la vue des définitions des indicateurs personnalisés et prédéfinis
    .from('indicateur_definitions')
    .select(
      [
        // la colonne `id` appropriée
        `id: ${isPerso ? 'indicateur_perso_id' : 'indicateur_id'}`,
        // le nom
        'nom',
        // et les relations supplémentaires nécessaires au filtrage
        ...parts,
      ].join(',')
    )
    // filtre toujours sur la collectivité
    .eq('collectivite_id', collectivite_id);

  // filtre par sous-ensemble voulu
  if (isPerso) {
    query.not('indicateur_perso_id', 'is', null);
  } else {
    // que les indicateurs avec un id non null
    query.not('indicateur_id', 'is', null);

    // et uniquement les indicateurs parent (sauf pour CRTE)
    if (subset !== 'crte') {
      query.is('definition_referentiel.parent', null);
    }

    if (subset === 'selection') {
      query.is('definition_referentiel.selection', true);
    } else if (subset === 'cles') {
      query.contains('definition_referentiel.programmes', ['clef']);
    } else {
      query.contains('definition_referentiel.programmes', [subset]);
    }
  }

  // recherche dans le nom ou la description
  if (filters.text) {
    query.textSearch(
      'cherchable',
      filters.text
        .split(' ')
        .map(s => s.trim())
        .filter(s => !!s)
        .map(s => `'${s}':*`)
        .join(' & ')
      //{config: 'fr'}
    );
  }

  // par thématique
  if (filters.thematique_ids?.length) {
    query.in('thematiques.id', filters.thematique_ids);
  }

  // par action du référentiel
  if (filters.action_id) {
    query.contains('action_ids', [filters.action_id]);
  }

  // par plan
  if (filters.plan_ids?.length) {
    query.in('axes.plan', filters.plan_ids);
  }

  // par service pilote
  if (filters.service_ids?.length) {
    query.in('services.service_tag_id', filters.service_ids);
  }

  // par type
  if (filters.type?.length) {
    query.in('definition_referentiel.type', filters.type);
  }

  // participation au score CAE
  if (subset === 'cae' && filters.participation_score !== undefined) {
    query.is(
      'definition_referentiel.participation_score',
      filters.participation_score
    );
  }

  // filtre les indicateurs complétés / à compléter
  if (filters.rempli !== undefined) {
    query.is('rempli', filters.rempli);
  }

  // par personne pilote
  if (filters.pilote_user_ids?.length || filters.pilote_tag_ids?.length) {
    const filterParams: string[] = [];

    // cumule les user_ids
    filters.pilote_user_ids?.forEach(user_id => {
      filterParams.push(`user_id.eq.${user_id}`);
    });
    // et les tag_ids
    filters.pilote_tag_ids?.forEach(tag_id => {
      filterParams.push(`tag_id.eq.${tag_id}`);
    });

    // que l'on fusionne dans un `or` sur la relation calculée
    query.or(filterParams.join(','), {foreignTable: 'pilotes'});
  }

  return query.returns<TIndicateurListItem[]>();
};
