import { DBClient } from '../../typeUtils';

/**
 * Supprime un indicateur pour une collectivité
 * @param dbClient client supabase
 * @param indicateurId identifiant de l'indicateur
 * @param collectiviteId identifiant de la collectivité
 */
export async function deleteIndicateur(
  dbClient: DBClient,
  indicateurId: number,
  collectiviteId: number // Permet d'éviter de modifier un indicateur prédéfini
) {
  await dbClient
    .from('indicateur_definition')
    .delete()
    .eq('id', indicateurId)
    .eq('collectivite_id', collectiviteId);
}
