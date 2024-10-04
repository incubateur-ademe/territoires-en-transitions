import { DBClient } from '../typeUtils';
import { objectToCamel } from 'ts-case-convert';
import { FicheResume } from './domain';

// charge les fiches action liées à une action (et ses sous-actions)
export const selectActionFiches = async (
  dbClient: DBClient,
  collectiviteId: number,
  actionId: string
) => {
  const { data } = await dbClient
    .from('fiche_action_action')
    .select('...fiche_resume(*)')
    .eq('fiche_resume.collectivite_id', collectiviteId)
    .like('action_id', `${actionId}%`);

  return (
    (objectToCamel(data ?? []) as FicheResume[])
      // filtre les fiches non valides
      .filter((fiche) => Boolean(fiche))
      // dédoublonne les fiches liées à plusieurs sous-actions de la même action
      .filter((fiche, i, a) => a.findIndex((v) => v.id === fiche.id) === i)
  );
};
