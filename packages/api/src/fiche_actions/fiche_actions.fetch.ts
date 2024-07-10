import {FicheResumeLegacy} from './domain';
import {DBClient} from '../typeUtils';

// charge les fiches action liées à une action (et ses sous-actions)
export const selectActionFiches = async (
  dbClient: DBClient,
  collectiviteId: number,
  actionId: string
) => {
  const {data} = await dbClient
    .from('fiche_action_action')
    .select('...fiche_resume(*)')
    .eq('fiche_resume.collectivite_id', collectiviteId)
    .like('action_id', `${actionId}%`)
    // TODO: utiliser `objectToCamel` et `FicheResume`
    .returns<FicheResumeLegacy[]>();

  return (
    (data || [])
      // filtre les fiches non valides
      .filter(fiche => Boolean(fiche))
      // dédoublonne les fiches liées à plusieurs sous-actions de la même action
      .filter((fiche, i, a) => a.findIndex(v => v.id === fiche.id) === i)
  );
};
