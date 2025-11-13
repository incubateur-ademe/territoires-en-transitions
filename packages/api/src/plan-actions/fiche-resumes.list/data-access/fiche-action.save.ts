import { DBClient } from '../../../typeUtils';

export async function updateLinkedFiches(
  dbClient: DBClient,
  collectiviteId: number,
  ficheId: number,
  linkedFicheIds: number[]
) {
  const { data: existingLinkedFiches, error } = await dbClient
    .from('fiche_action_lien')
    .select('fiche_une, fiche_deux')
    .or(`fiche_une.eq.${ficheId}, fiche_deux.eq.${ficheId}`);

  if (error) {
    console.error(error);
    throw error;
  }

  const existingLinkedFicheIds: number[] = existingLinkedFiches.map((f) =>
    f.fiche_une === ficheId ? f.fiche_deux : f.fiche_une
  );

  if (existingLinkedFicheIds.length > 0) {
    // Supprime les liens vers les fiches qui ne sont plus concernées
    await dbClient
      .from('fiche_action_lien')
      .delete()
      .eq('fiche_une', ficheId)
      .in('fiche_deux', existingLinkedFicheIds)
      .not('fiche_deux', 'in', `(${linkedFicheIds.join(',')})`);

    await dbClient
      .from('fiche_action_lien')
      .delete()
      .eq('fiche_deux', ficheId)
      .in('fiche_une', existingLinkedFicheIds)
      .not('fiche_une', 'in', `(${linkedFicheIds.join(',')})`);
  }

  // Ajoute les nouveaux liens entre les fiches
  const newLinkedFicheIds = linkedFicheIds.filter(
    (id) => !existingLinkedFicheIds.includes(id)
  );

  if (newLinkedFicheIds.length === 0) {
    return;
  }

  await dbClient.from('fiche_action_lien').insert(
    newLinkedFicheIds.map((newLinkedFiche) => ({
      fiche_une: ficheId,
      fiche_deux: newLinkedFiche,
    }))
  );
}
