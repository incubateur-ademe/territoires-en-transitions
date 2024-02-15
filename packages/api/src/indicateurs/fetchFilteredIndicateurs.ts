import {Enums, DBClient} from '../typeUtils';
import {unaccent} from '../utils/unaccent';

// type renvoyé par la fonction de fetch
type IndicateurItemFetched = {
  indicateur_id: string;
  indicateur_perso_id: number;
  nom: string;
};

export type IndicateurItem = {
  id: string | number;
  nom: string;
};

// Sous-ensemble d'indicateurs
export type Subset = 'cae' | 'eci' | 'crte' | 'perso' | 'cles' | 'selection';

// Options de filtrage
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
  confidentiel?: boolean;
  fiches_non_classees?: boolean;
  text?: string;
};

// Associe les parties requises aux champs sur lesquels on filtre.
const filterParts: {[key in keyof Filters]?: string} = {
  thematique_ids: 'thematiques!inner()',
  plan_ids: 'axes!inner()',
  pilote_user_ids: 'pilotes!inner()',
  pilote_tag_ids: 'pilotes!inner()',
  service_ids: 'services!inner()',
  action_id: 'indicateur_action!inner()',
  fiches_non_classees: 'fiches_non_classees!inner()',
};

/**
 * Charge une liste d'indicateurs en fonction des paramètres de filtrage
 *
 * @param subset Sous-ensemble voulu (clés, sélection, cae, eci, etc.)
 * @param filters Paramètres de filtrage
 * @returns Liste d'id de définitions d'indicateur
 */
export const fetchFilteredIndicateurs = async (
  dbClient: DBClient,
  collectivite_id: number,
  subset: Subset | null,
  filters: Filters
) => {
  const parts = new Set<string>();
  const isPerso = subset === 'perso';

  // cas des indicateurs prédéfinis
  if (subset && !isPerso) {
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
  const query = dbClient
    // depuis la vue des définitions des indicateurs personnalisés et prédéfinis
    .from('indicateur_definitions')
    .select(
      [
        'indicateur_perso_id',
        'indicateur_id',
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
    if (subset === 'selection') {
      query.is('definition_referentiel.selection', true);
    } else if (subset === 'cles') {
      query.contains('definition_referentiel.programmes', ['clef']);
    } else if (subset !== null) {
      query.contains('definition_referentiel.programmes', [subset]);
    }
  }

  // recherche par texte
  const text = filters.text?.trim() || '';
  let searchById = false;
  if (text) {
    // par identifiant si le texte recherché commence par un #
    if (text.startsWith('#') && !isPerso) {
      const idToSearch = text.replaceAll(/[#\s]/g, '');
      if (idToSearch) {
        searchById = true;
        query.ilike('definition_referentiel.identifiant', `${idToSearch}%`);
      }
    } else {
      // ou dans le nom ou la description
      query.textSearch(
        'cherchable',
        unaccent(text)
          .split(' ')
          .map(s => s.trim())
          .filter(s => !!s)
          .map(s => `'${s}':*`)
          .join(' & ')
      );
    }
  }

  // détermine certains des filtres complémentaires à appliquer :
  // si une de ces conditions est vraie alors le filtre "parent uniquement" sera désactivé
  const filtrerPar = {
    participationAuScore:
      subset === 'cae' && filters.participation_score !== undefined,
    confidentiel: filters.confidentiel,
    planAction: !!filters.plan_ids?.length,
    service: !!filters.service_ids?.length,
    personne:
      !!filters.pilote_user_ids?.length || !!filters.pilote_tag_ids?.length,
    fichesNonClassees: !!filters.fiches_non_classees,
  };

  // sélectionne uniquement les indicateurs parent (sauf pour CRTE et perso ou si on fait
  // une recherche par id ou si un des filtres complémentaires est actif)
  const filtrerParParent =
    subset !== null &&
    subset !== 'crte' &&
    subset !== 'perso' &&
    !searchById &&
    !Object.values(filtrerPar).find(v => !!v);

  if (filtrerParParent) {
    query.is('definition_referentiel.parent', null);
  }

  // par thématique
  if (filters.thematique_ids?.length) {
    query.in('thematiques.id', filters.thematique_ids);
  }

  // par action du référentiel (ne remonte que les parents)
  if (filters.action_id) {
    query.in('indicateur_action.action_id', [filters.action_id]);
  }

  // par plan
  if (filtrerPar.planAction) {
    query.in('axes.plan', filters.plan_ids!);
  }

  // par service pilote
  if (filtrerPar.service) {
    query.in('services.service_tag_id', filters.service_ids!);
  }

  // par type
  if (filters.type?.length) {
    query.in('definition_referentiel.type', filters.type);
  }

  // participation au score CAE
  if (filtrerPar.participationAuScore) {
    query.is(
      'definition_referentiel.participation_score',
      filters.participation_score!
    );
  }

  // filtre les indicateurs complétés / à compléter
  if (filters.rempli !== undefined) {
    query.is('rempli', filters.rempli!);
  }

  // filtre les indicateurs confidentiels
  if (filters.confidentiel !== undefined) {
    query.is('confidentiel', filters.confidentiel!);
  }

  // par personne pilote
  if (filtrerPar.personne) {
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

  const {data, ...remaining} = await query.returns<IndicateurItemFetched[]>();

  return {
    ...remaining,
    data: data
      // tri par nom (pour que les diacritiques soient pris en compte)
      ?.sort((a, b) => (a.nom && b.nom ? a.nom.localeCompare(b.nom) : 0))
      // et conserve un id unique
      .map(({indicateur_id, indicateur_perso_id, ...otherProps}) => ({
        id: indicateur_id || indicateur_perso_id,
        ...otherProps,
      })),
  };
};
