import { DBClient } from '@tet/api/typeUtils';
import { objectToCamel } from 'ts-case-convert';
import { Personne } from '../domain/personne.schema';

/**
 * Récupère les personnes d'une collectivité
 * @param dbClient client supabase
 * @param collectiviteId identifiant de la collectivité
 * @return liste de personnes
 */
export async function fetchPersonnes(
  dbClient: DBClient,
  collectiviteId: number
): Promise<Personne[]> {
  // TODO ne plus utiliser une rpc postgresql
  const { data, error } = await dbClient
    .rpc('personnes_collectivite', {
      collectivite_id: collectiviteId,
    })
    .order('nom');

  if (error) {
    console.error(error);
    throw error;
  }

  return objectToCamel(data) as Personne[];
}
