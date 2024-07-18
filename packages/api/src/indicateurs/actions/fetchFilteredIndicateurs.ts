import {Enums, DBClient} from '../../typeUtils';
import {unaccent} from '../../utils/unaccent';
import {selectGroupements} from '../../collectivites/shared/actions/groupement.fetch';
import {FetchOptions} from '../domain/fetch_options.schema';
import {Groupement} from '../../collectivites/shared/domain/groupement.schema';

// Sous-ensemble d'indicateurs
export type Subset = 'cae' | 'eci' | 'crte' | 'perso' | 'cles' | 'selection';

const subsetPassage = new Map<Subset, string>([
  ['cae', 'cae'],
  ['eci', 'eci'],
  ['crte', 'crte'],
  ['cles', 'clef'],
  ['selection', 'prioritaire'],
]);

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
  sort?: {
    field: keyof Filters;
    direction: 'asc' | 'desc';
  };
};

const filtresOptions: {[key in keyof Filters]?: string} = {
  thematique_ids: 'indicateur_thematique!inner(thematique_id)',
  action_id: 'indicateur_action!inner(action_id)',
  plan_ids:
    'fiche_action_indicateur!inner(fiche_id, fiche_action!inner(fiche_action_axe!inner(axe!inner())))',
  pilote_user_ids: 'indicateur_pilote!inner()',
  pilote_tag_ids: 'indicateur_pilote!inner()',
  service_ids: 'indicateur_service_tag!inner(service_tag_id)',
  rempli: 'indicateur_valeur()',
  confidentiel:
    'indicateur_collectivite(commentaire, confidentiel, collectivite_id)',
  fiches_non_classees:
    'fiche_action_indicateur!inner(fiche_id, fiche_action!inner(fiche_action_axe!inner(axe!inner())))',
};

export async function fetchFilteredIndicateurs(
  dbClient: DBClient,
  collectiviteId: number,
  subset: Subset | null,
  filters: Filters
) {
  const parts = new Set<string>();
  const isPerso = subset === 'perso';
  const groupements: Groupement[] = await selectGroupements(dbClient);

  // Ajoute les relations supplémentaires en fonction des filtres voulus
  let key: keyof Filters;
  for (key in filters) {
    if (
      (filters[key] as Array<string | number>)?.length ||
      (filters[key] !== undefined && !Array.isArray(filters[key]))
    ) {
      const part = filtresOptions[key];
      if (part) parts.add(part);
    }
  }
  if (subset !== null && !isPerso)
    parts.add(
      'indicateur_categorie_tag!inner(categorie_tag!inner(id,nom,collectivite_id,groupement_id))'
    );

  // pour pouvoir trier sur la complétude (dans le TDB)
  if (filters.rempli === undefined && filters.sort?.field === 'rempli') {
    parts.add('indicateur_valeur(id)');
  }

  // construit la requête
  const query = dbClient
    .from('indicateur_definition')
    .select(
      [
        'id',
        'identifiant_referentiel',
        'titre',
        'groupement_id',
        'indicateur_parents(id)',
        ...parts,
      ].join(',')
    );

  // filtre par sous-ensemble voulu
  if (isPerso) {
    // On ne récupère que les indicateurs personnalisés
    query.eq('collectivite_id', collectiviteId);
  } else {
    if (subset !== null || filters.type?.length) {
      // On ne récupère que les indicateurs prédéfinis
      query.is('collectivite_id', null);
      // S'il y a un tri sur les catégories prédéfinies,
      // on ne garde que les indicateurs ayant des catégories prédéfinies
      query.is('indicateur_categorie_tag.categorie_tag.collectivite_id', null);
      if (subset !== null) {
        if (filters.type?.length) {
          // S'il y a un tri sur le type et le programme
          query.or(
            `nom.eq.${subsetPassage.get(subset)!}, nom.in.${filters.type}`,
            {referencedTable: 'indicateur_categorie_tag.categorie_tag'}
          );
        } else {
          // S'il y a un tri que sur le programme
          query.eq(
            'indicateur_categorie_tag.categorie_tag.nom',
            subsetPassage.get(subset)!
          );
        }
      } else if (filters.type?.length) {
        // S'il y a un tri que sur le type
        query.in('indicateur_categorie_tag.categorie_tag.nom', filters.type);
      }
    } else {
      // quand on ne travaille pas sur un sous-ensemble on limite aux indicateurs
      // prédéfinis et à ceux de la collectivité voulue
      query.or(`collectivite_id.is.null,collectivite_id.eq.${collectiviteId}`);
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
        query.ilike('identifiant_referentiel', `%${idToSearch}%`);
      }
    } else {
      const search = unaccent(text)
        .split(' ')
        .map(s => s.trim())
        .filter(s => !!s)
        .map(s => `"${s}":*`)
        .join(' & ');
      // ou dans le nom ou la description
      query.or(`titre.fts.${search}, description.fts.${search}`);
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
    query.is('indicateur_parents', null);
  }

  // par thématique
  if (filters.thematique_ids?.length) {
    query.in('indicateur_thematique.thematique_id', filters.thematique_ids);
  }

  // par action du référentiel (ne remonte que les parents)
  if (filters.action_id) {
    query.in('indicateur_action.action_id', [filters.action_id]);
  }

  // par plan
  if (filtrerPar.planAction) {
    query.in(
      'fiche_action_indicateur.fiche_action.fiche_action_axe.axe.plan',
      filters.plan_ids!
    );
  }

  // filtre les indicateurs confidentiels
  if (filters.confidentiel !== undefined) {
    if (filters.confidentiel) {
      query.not('indicateur_collectivite', 'is', null);
      query.eq('indicateur_collectivite.collectivite_id', collectiviteId);
      query.is('indicateur_collectivite.confidentiel', true);
    } else {
      query.or(`indicateur_id.is.null, collectivite_id.eq.${collectiviteId})`, {
        referencedTable: 'indicateur_collectivite',
      });
    }
  }

  // par service pilote
  if (filtrerPar.service) {
    query.eq('indicateur_service_tag.collectivite_id', collectiviteId);
    query.in('indicateur_service_tag.service_tag_id', filters.service_ids!);
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
    query.or(filterParams.join(','), {referencedTable: 'indicateur_pilote'});
  }

  // participation au score CAE
  if (filtrerPar.participationAuScore) {
    query.is('participation_score', filters.participation_score!);
  }
  // filtre les indicateurs complétés / à compléter
  if (filters.rempli !== undefined) {
    query.eq('indicateur_valeur.collectivite_id', collectiviteId);
    if (filters.rempli) {
      query.not('indicateur_valeur', 'is', null);
    } else {
      query.is('indicateur_valeur', null);
    }
  }

  // pour pouvoir trier sur la complétude (dans le TDB)
  if (filters.rempli === undefined && filters.sort?.field === 'rempli') {
    query.eq('indicateur_valeur.collectivite_id', collectiviteId);
  }

  /** Par défaut tri par ordre alphabétique */
  const orderByOptions = [
    {
      field: 'titre',
      direction: 'asc',
    },
  ];

  if (filters.sort) {
    orderByOptions.unshift(filters.sort);
  }

  orderByOptions.forEach(sort => {
    if (sort.field !== 'rempli') {
      // la colonne `rempli` n'existe pas dans la base (on fait le tri a posteriori)
      query.order(sort.field, {ascending: sort.direction === 'asc'});
    }
  });
  const {data, ...remaining} = await query;
  let rows = data || [];
  if (filters.confidentiel === false) {
    // Filtre supplémentaire sur confidentiel car pas trouvé comment faire ma condition avec postgrest
    rows = rows.filter(
      (r: any) =>
        r.indicateur_collectivite.length === 0 ||
        r.indicateur_collectivite[0].confidentiel === false
    );
  }
  // Filtre sur les indicateurs d'un groupement
  rows = rows.filter(
    (r: any) =>
      r.groupement_id === null ||
      groupements
        .filter((g: Groupement) => g.id === r.groupement_id)[0]
        .collectivites?.includes(collectiviteId)
  );

  // tri local sur la complétude
  if (filters.sort?.field === 'rempli') {
    rows.sort((a: any, b: any) => {
      return (
        (b.indicateur_valeur?.length || -1) -
        (a.indicateur_valeur?.length || -1)
      );
    });
  }

  return {
    ...remaining,
    data: rows
      // et conserve un id unique
      .map((d: any) => ({
        id: d.id as number,
        titre: d.titre as string,
        estPerso: d.estPerso as boolean,
        identifiant: d.identifiant_referentiel as string,
      })),
  };
}

export function moduleOptionsToFilters(
    options: Pick<FetchOptions, 'filtre'>
): Filters {
  const {filtre} = options;

  return {
    thematique_ids: filtre.thematiqueIds,
    plan_ids: filtre.planActionIds,
    pilote_user_ids: filtre.utilisateurPiloteIds,
    pilote_tag_ids: filtre.personnePiloteIds,
    service_ids: filtre.servicePiloteIds,
    rempli: filtre.estComplet,
    // sort: sort?.map(({field, direction}) => ({field, direction}))[0],
    // page,
    // limit,
  };
}