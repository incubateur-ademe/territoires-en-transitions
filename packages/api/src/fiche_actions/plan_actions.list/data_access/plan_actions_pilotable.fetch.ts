import {DBClient} from '../../../typeUtils';

type FetchedData = {
  id: number;
  axe: {plan: number}[];
};

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
};

/**
 * Renvoi la liste des plans d'actions d'une collectivité comportant au moins 5
 * fiches dont le titre a été renseigné.
 */
export const planActionsPilotableFetch = async ({
  dbClient,
  collectiviteId,
}: Props) => {
  // récupère les ID de fiches et les ID de plan auxquels elles sont associées
  // et pour lesquelles le titre est renseigné.
  const {error, data} = await dbClient
    .from('fiche_action')
    .select('id,axe:fiche_action_axe!inner(...axe!inner(plan))')
    .eq('collectivite_id', collectiviteId)
    .not('titre', 'is', null)
    .neq('titre', '')
    .neq('titre', 'Nouvelle fiche')
    .returns<FetchedData[] | null>();

  if (error) {
    throw new Error(error.message);
  }

  // groupe les fiches par plan
  const parPlan = new Map<number, Set<number>>();
  data?.forEach(fiche => {
    fiche.axe.forEach(axe => {
      parPlan.set(
        axe.plan,
        (parPlan.get(axe.plan) || new Set<number>()).add(fiche.id)
      );
    });
  });

  // conserve uniquement les plans ayant au moins 5 fiches
  const plans = [...parPlan.entries()]
    .filter(([, fiches]) => fiches.size > 4)
    .map(([planId, fiches]) => ({
      planId,
      fiches: [...fiches],
    }));

  return plans || [];
};
