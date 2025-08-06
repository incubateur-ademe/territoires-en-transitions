import { Tag, TagInsert } from '@/domain/collectivites';
import { indicateurDefinitionSchemaInsert } from '@/domain/indicateurs';
import { Thematique, thematiqueSchema } from '@/domain/shared';
import { z } from 'zod';
import { Personne } from '../../collectivites/shared/domain/personne.schema';
import { insertTags } from '../../shared/actions/tag.save';
import { DBClient } from '../../typeUtils';
import { IndicateurDefinitionUpdate } from '../domain/definition.schema';

/**
 * Modifie la définition d'un indicateur pour une collectivité
 * @param dbClient client supabase
 * @param indicateur indicateur à modifier
 * @param collectiviteId identifiant de la collectivité
 */
export async function updateIndicateurDefinition(
  dbClient: DBClient,
  indicateur: IndicateurDefinitionUpdate,
  collectiviteId: number
) {
  // Modifier commentaire && confidentiel
  const indicateurCollectiviteResponse = await dbClient
    .from('indicateur_collectivite')
    .upsert({
      indicateur_id: indicateur.id,
      collectivite_id: collectiviteId,
      commentaire: indicateur.commentaire,
      confidentiel: indicateur.confidentiel,
    });
  if (indicateurCollectiviteResponse.error) {
    throw new Error(indicateurCollectiviteResponse.error.message);
  }

  // Modifier l'indicateur si personnalise
  if (indicateur.estPerso) {
    const indicateurDefinitionResponse = await dbClient
      .from('indicateur_definition')
      .upsert({
        id: indicateur.id,
        collectivite_id: indicateur.collectiviteId,
        titre: indicateur.titre,
        titre_long: indicateur.titreLong,
        description: indicateur.description,
        unite: indicateur.unite,
        borne_max: indicateur.borneMax,
        borne_min: indicateur.borneMin,
      });
    if (indicateurDefinitionResponse.error) {
      throw new Error(indicateurDefinitionResponse.error.message);
    }
  }
}

/**
 * Rend un indicateur favori ou non pour une collectivité
 * @param dbClient client supabase
 * @param indicateurId id de l'indicateur à modifier
 * @param collectiviteId id de la collectivité concernée
 * @param isFavori vrai pour rendre favori, faux pour ne plus l'être
 */
export async function updateIndicateurFavoriCollectivite(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number,
  isFavori: boolean
) {
  // Modifier commentaire && confidentiel
  await dbClient.from('indicateur_collectivite').upsert({
    indicateur_id: indicateurId,
    collectivite_id: collectiviteId,
    favoris: isFavori,
  });
}

const schema = indicateurDefinitionSchemaInsert
  .pick({
    titre: true,
    collectiviteId: true,
    unite: true,
    description: true,
  })
  .partial({ unite: true })
  .extend({
    thematiques: thematiqueSchema
      .pick({ id: true, nom: true })
      .array()
      .optional(),
  });

/**
 * Ajoute un indicateur personnalisé
 * @param dbClient client supabase
 * @param indicateur indicateur à ajouter
 * @return identifiant de l'indicateur ajouté
 */
export async function insertIndicateurDefinition(
  dbClient: DBClient,
  indicateur: z.infer<typeof schema>
): Promise<number | null> {
  schema.parse(indicateur); // Vérifie le type

  const { data, error } = await dbClient
    .from('indicateur_definition')
    .insert({
      collectivite_id: indicateur.collectiviteId,
      titre: indicateur.titre,
      unite: indicateur.unite ? indicateur.unite : '',
      description: indicateur.description,
    })
    .select('id');

  if (
    data &&
    data.length > 0 &&
    indicateur.thematiques != null &&
    indicateur.thematiques.length > 0
  ) {
    await dbClient.from('indicateur_thematique').insert(
      indicateur.thematiques.map((t) => ({
        indicateur_id: data[0].id,
        thematique_id: t.id,
      }))
    );
  }

  if (error) {
    throw error;
  }

  return data ? data[0].id : null;
}

/**
 * Modifie les thématiques d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param thematiques thématiques à modifier
 */
export async function upsertThematiques(
  dbClient: DBClient,
  indicateurId: number,
  estPerso: boolean,
  thematiques: Thematique[]
) {
  if (estPerso) {
    // Supprime les liens vers les thématiques qui ne sont plus concernés
    await dbClient
      .from('indicateur_thematique')
      .delete()
      .eq('indicateur_id', indicateurId)
      .not(
        'thematique_id',
        'in',
        `(${thematiques.map((t) => t.id).join(',')})`
      );

    // Fait les nouveaux liens entre l'indicateur et les thématiques
    await dbClient.from('indicateur_thematique').upsert(
      thematiques.map((t) => ({
        thematique_id: t.id,
        indicateur_id: indicateurId,
      })),
      { onConflict: 'indicateur_id,thematique_id' }
    );
  }
}

/**
 * Modifie les services d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param collectiviteId identifiant de la collectivité concernée
 * @param services services à modifier
 */
export async function upsertServices(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number,
  services: TagInsert[]
) {
  const tagIds: number[] = [];
  const newTags: TagInsert[] = [];

  services.forEach((s) => {
    if (s.id) {
      tagIds.push(s.id as number);
    } else if (s.nom) {
      newTags.push(s);
    }
  });

  // Supprime les services qui ne sont plus concernés
  await dbClient
    .from('indicateur_service_tag')
    .delete()
    .eq('indicateur_id', indicateurId)
    .eq('collectivite_id', collectiviteId)
    .not('service_tag_id', 'in', `(${tagIds.join(',')})`);

  // Ajoute les nouveaux tags
  const newTagsAdded: Tag[] = await insertTags(dbClient, 'service', newTags);

  // Fait les nouveaux liens entre l'indicateur et les services
  const toUpsert = tagIds
    .concat(newTagsAdded.map((t) => t.id as number))
    .map((s) => ({
      collectivite_id: collectiviteId,
      indicateur_id: indicateurId,
      service_tag_id: s,
    }));

  await dbClient.from('indicateur_service_tag').upsert(toUpsert, {
    onConflict: 'indicateur_id, collectivite_id, service_tag_id',
  });
}

export async function updateIndicateurCard(
  dbClient: DBClient,
  indicateur: {
    id: number;
    estPerso: boolean;
  },
  collectiviteId: number,
  pilotes: Personne[],
  services: Tag[],
  thematiques: Thematique[]
) {
  await upsertServices(dbClient, indicateur.id, collectiviteId, services);
  await upsertThematiques(
    dbClient,
    indicateur.id,
    indicateur.estPerso,
    thematiques
  );
}

/**
 * Modifie les fiches d'un indicateur
 * @param dbClient client supabase
 * @param indicateur indicateur concerné
 * @param collectiviteId identifiant de la collectivité
 * @param fiches fiches à modifier
 */
export async function upsertFiches(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number,
  fiches: number[]
) {
  const requestCol = await dbClient
    .from('fiche_action')
    .select('id')
    .eq('collectivite_id', collectiviteId);
  const fichesCol: number[] = requestCol.data?.map((r) => r.id) || [];
  if (fichesCol.length > 0) {
    // Supprime les liens vers les fiches qui ne sont plus concernés
    await dbClient
      .from('fiche_action_indicateur')
      .delete()
      .eq('indicateur_id', indicateurId)
      .in('fiche_id', fichesCol)
      .not('fiche_id', 'in', `(${fiches.join(',')})`);
  }

  // Fait les nouveaux liens entre l'indicateur et les fiches
  await dbClient.from('fiche_action_indicateur').upsert(
    fiches.map((fiche_id) => ({ fiche_id, indicateur_id: indicateurId })),
    { onConflict: 'indicateur_id,fiche_id' }
  );
}
