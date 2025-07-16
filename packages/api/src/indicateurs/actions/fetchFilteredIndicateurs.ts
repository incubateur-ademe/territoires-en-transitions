import { removeAccents } from '@/domain/utils';
import { selectGroupements } from '../../collectivites/shared/data-access/groupement.fetch';
import { Groupement } from '../../collectivites/shared/domain/groupement.schema';
import { Tables } from '../../database.types';
import { DBClient } from '../../typeUtils';
import { FetchFiltre, FetchOptions } from '../domain/fetch-options.schema';

const filtresOptions: { [key in keyof FetchFiltre]?: string } = {
  thematiqueIds: 'indicateur_thematique!inner(thematique_id)',
  actionId: 'indicateur_action!inner(action_id)',
  planActionIds:
    'fiche_action_indicateur!inner(fiche_id, fiche_action!inner(fiche_action_axe!inner(axe!inner())))',
  ficheActionIds: 'fiche_action_indicateur!inner()',
  utilisateurPiloteIds: 'indicateur_pilote!inner()',
  personnePiloteIds: 'indicateur_pilote!inner()',
  servicePiloteIds: 'indicateur_service_tag!inner(service_tag_id)',
  estConfidentiel:
    'indicateur_collectivite(commentaire, confidentiel, favoris, collectivite_id)',
  estFavorisCollectivite:
    'indicateur_collectivite(commentaire, confidentiel, favoris, collectivite_id)',
  fichesNonClassees:
    'fiche_action_indicateur!inner(fiche_id, fiche_action!inner(fiche_action_axe!inner(axe!inner())))',
  categorieNoms: 'categorie_tag!inner(id,nom,collectivite_id,groupement_id)',
};

export async function fetchFilteredIndicateurs(
  dbClient: DBClient,
  collectiviteId: number,
  { filtre, sort }: FetchOptions
) {
  const filters = filtre ?? {};
  const parts = new Set<string>();
  const groupements: Groupement[] = await selectGroupements(dbClient);

  // Ajoute les relations supplémentaires en fonction des filtres voulus
  let key: keyof FetchFiltre;
  for (key in filters) {
    if (
      (filters[key] as Array<string | number>)?.length ||
      (filters[key] !== undefined && !Array.isArray(filters[key]))
    ) {
      const part = filtresOptions[key];
      if (part) parts.add(part);
    }
  }

  // Partie nécessaire pour :
  // - (toujours) récupérer la présence de valeurs open-data associées
  // - (optionnel) filtrer sur la présence de valeurs open-data associées
  // - (optionnel) filtrer ou trier sur l'état de complétude
  parts.add('indicateur_valeur(id, metadonnee_id, collectivite_id)');

  // construit la requête
  const query = dbClient
    .from('indicateur_definition')
    .select(
      [
        'id',
        'collectivite_id',
        'identifiant_referentiel',
        'titre',
        'groupement_id',
        'indicateur_parents(id)',
        ...parts,
      ].join(',')
    );

  // filtre par sous-ensemble voulu
  if (filters.estPerso) {
    // On ne récupère que les indicateurs personnalisés
    query.eq('collectivite_id', collectiviteId);
  } else if (!filters.categorieNoms || filters.categorieNoms.length === 0) {
    // quand on ne travaille pas sur un sous-ensemble on limite aux indicateurs
    // prédéfinis et à ceux de la collectivité voulue
    query.or(`collectivite_id.is.null,collectivite_id.eq.${collectiviteId}`);
  } else {
    // S'il y a un tri que sur le programme

    // On ne récupère que les indicateurs prédéfinis
    query.is('collectivite_id', null);
    // S'il y a un tri sur les catégories prédéfinies,
    // on ne garde que les indicateurs ayant des catégories prédéfinies
    query.is('categorie_tag.collectivite_id', null);

    query.in('categorie_tag.nom', filters.categorieNoms);
  }

  // recherche par texte
  const text = filters.text?.trim() || '';
  let searchById = false;
  if (text) {
    // par identifiant si le texte recherché commence par un #
    if (text.startsWith('#') && !filtresOptions.estPerso) {
      const idToSearch = text.replaceAll(/[#\s]/g, '');
      if (idToSearch) {
        searchById = true;
        query.ilike('identifiant_referentiel', `%${idToSearch}%`);
      }
    } else {
      const search = removeAccents(text)
        .split(' ')
        .map((s: string) => s.trim())
        .filter((s: string) => !!s)
        .map((s: string) => `"${s}":*`)
        .join(' & ');
      // ou dans le nom ou la description
      query.or(`titre.fts.${search}, description.fts.${search}`);
    }
  }

  // détermine certains des filtres complémentaires à appliquer :
  // si une de ces conditions est vraie alors le filtre "parent uniquement" sera désactivé
  const filtrerPar = {
    participationAuScore: filters.participationScore !== undefined,
    confidentiel: filters.estConfidentiel !== undefined,
    planAction: !!filters.planActionIds?.length,
    service: !!filters.servicePiloteIds?.length,
    personne:
      !!filters.utilisateurPiloteIds?.length ||
      !!filters.personnePiloteIds?.length,
    fichesNonClassees: !!filters.fichesNonClassees,
  };

  // sélectionne uniquement les indicateurs parent (sauf pour CRTE et perso ou si on fait
  // une recherche par id ou si un des filtres complémentaires est actif)
  const filtrerParParent =
    !filters.withChildren &&
    !filtresOptions.estPerso &&
    !filters.categorieNoms?.find((nom) => nom === 'crte') &&
    !searchById &&
    !Object.values(filtrerPar).includes(true);

  if (filtrerParParent) {
    query.is('indicateur_parents', null);
  }

  // par thématique
  if (filters.thematiqueIds?.length) {
    query.in('indicateur_thematique.thematique_id', filters.thematiqueIds);
  }

  // par action du référentiel (ne remonte que les parents)
  if (filters.actionId) {
    query.in('indicateur_action.action_id', [filters.actionId]);
  }

  // par fiche actions
  if (filters.ficheActionIds?.length) {
    query.in('fiche_action_indicateur.fiche_id', filters.ficheActionIds);
  }

  // par plan
  if (filtrerPar.planAction && filters.planActionIds?.length) {
    query.in(
      'fiche_action_indicateur.fiche_action.fiche_action_axe.axe.plan',
      filters.planActionIds
    );
  }

  // filtre les indicateurs confidentiels
  if (
    filters.estConfidentiel !== undefined ||
    filters.estFavorisCollectivite !== undefined
  ) {
    // /!\ on ne peut pas demander confidentiels et favoris à faux avec ce code
    if (filters.estConfidentiel || filters.estFavorisCollectivite) {
      query.not('indicateur_collectivite', 'is', null);
      query.eq('indicateur_collectivite.collectivite_id', collectiviteId);
      if (filters.estConfidentiel !== undefined) {
        query.is(
          'indicateur_collectivite.confidentiel',
          filters.estConfidentiel
        );
      }
      if (filters.estFavorisCollectivite !== undefined) {
        query.is(
          'indicateur_collectivite.favoris',
          filters.estFavorisCollectivite
        );
      }
    } else {
      query.or(`indicateur_id.is.null, collectivite_id.eq.${collectiviteId})`, {
        referencedTable: 'indicateur_collectivite',
      });
    }
  }

  // par service pilote
  if (filtrerPar.service && filters.servicePiloteIds?.length) {
    query.eq('indicateur_service_tag.collectivite_id', collectiviteId);
    query.in('indicateur_service_tag.service_tag_id', filters.servicePiloteIds);
  }

  // par personne pilote
  if (filtrerPar.personne) {
    const filterParams: string[] = [];

    // cumule les user_ids
    filters.utilisateurPiloteIds?.forEach((user_id) => {
      filterParams.push(`user_id.eq.${user_id}`);
    });
    // et les tag_ids
    filters.personnePiloteIds?.forEach((tag_id) => {
      filterParams.push(`tag_id.eq.${tag_id}`);
    });

    // que l'on fusionne dans un `or` sur la relation calculée
    query.or(filterParams.join(','), { referencedTable: 'indicateur_pilote' });
  }

  // participation au score CAE
  if (filtrerPar.participationAuScore) {
    query.is('participation_score', filters.participationScore ?? false);
  }

  // On ajoute toujours le filtre sur les valeurs de la collectivité
  query.eq('indicateur_valeur.collectivite_id', collectiviteId);

  // filtre les indicateurs complétés / à compléter
  if (filters.estComplet !== undefined) {
    query.is('indicateur_valeur.metadonnee_id', null);

    if (filters.estComplet) {
      query.not('indicateur_valeur', 'is', null);
    } else {
      query.is('indicateur_valeur', null);
    }
  }

  if (filters.hasOpenData) {
    query.not('indicateur_valeur', 'is', null);
    query.not('indicateur_valeur.metadonnee_id', 'is', null);
  }

  // Par défaut tri par ordre alphabétique
  const defaultSort = {
    field: 'titre',
    direction: 'asc',
  };

  // S'il l'utilisateur a spécifié un tri, on le met en premier
  const finalSort = sort ? [...sort, defaultSort] : [defaultSort];

  finalSort.forEach((sort) => {
    if (sort.field !== 'estComplet') {
      // la colonne `estComplet` n'existe pas dans la base (on fait le tri a posteriori)
      query.order(sort.field, { ascending: sort.direction === 'asc' });
    }
  });

  type Output = Tables<'indicateur_definition'> & {
    indicateur_collectivite: Array<Tables<'indicateur_collectivite'>>;
    indicateur_valeur: Array<Tables<'indicateur_valeur'>>;
  };

  const { data, ...remaining } = await query.returns<Array<Output>>();

  let rows = data || [];

  if (filters.estConfidentiel === false) {
    // Filtre supplémentaire sur confidentiel car pas trouvé comment faire ma condition avec postgrest
    rows = rows.filter(
      (r) =>
        r.indicateur_collectivite.length === 0 ||
        r.indicateur_collectivite[0].confidentiel === false
    );
  }
  // Filtre sur les indicateurs d'un groupement
  rows = rows.filter(
    (r) =>
      r.groupement_id === null ||
      groupements
        .filter((g: Groupement) => g.id === r.groupement_id)[0]
        .collectivites?.includes(collectiviteId)
  );

  // tri programmatique sur la complétude
  if (sort?.at(0)?.field === 'estComplet') {
    rows.sort((a, b) => {
      return (
        (b.indicateur_valeur?.filter((v) => v.metadonnee_id === null).length ||
          -1) -
        (a.indicateur_valeur?.filter((v) => v.metadonnee_id === null).length ||
          -1)
      );
    });
  }

  return {
    ...remaining,
    data: rows
      // et conserve un id unique
      .map((d) => ({
        id: d.id as number,
        titre: d.titre as string,
        estPerso: d.collectivite_id !== null,
        identifiant: d.identifiant_referentiel as string,
        hasOpenData: d.indicateur_valeur?.some((v) => !!v.metadonnee_id),
      })),
  };
}
