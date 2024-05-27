import {z} from 'zod';
import {DBClient} from '../../../typeUtils';
import {Module, moduleSchema} from '../domain/module.schema';

const outputSchema = moduleSchema.array();
type Output = z.infer<typeof outputSchema>;

type Props = {
  dbClient: DBClient;
  collectiviteId: number;
  userId: string;
};

export async function modulesFetch({dbClient, collectiviteId, userId}: Props) {
  try {
    const {data, error} = await dbClient
      .from('tableau_de_bord_module')
      .select('*')
      .eq('collectivite_id', collectiviteId)
      .eq('user_id', userId)
      .returns<Output>();

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return {
        data: getDefaultModules({userId, collectiviteId}),
      };
    }

    return {data};
  } catch (error) {
    console.error(error);
    return {error};
  }
}

function getDefaultModules({userId, collectiviteId}) {
  const now = new Date().toISOString();

  const indicateurs: Module = {
    id: crypto.randomUUID(),
    userId,
    collectiviteId,
    titre: 'Indicateurs de suivi de mes plans',
    type: 'indicateur.list',
    options: {},
    createdAt: now,
    modifiedAt: now,
  };

  const actionsDontJeSuisPilote: Module = {
    id: crypto.randomUUID(),
    userId,
    collectiviteId,
    titre: 'Actions dont je suis pilote',
    type: 'fiche_action.list',
    options: {
      filtre: {
        utilisateurPiloteIds: [userId],
      },
    },
    createdAt: now,
    modifiedAt: now,
  };

  const actionsRecentlyModified: Module = {
    id: crypto.randomUUID(),
    userId,
    collectiviteId,
    titre: 'Actions récemment modifiées',
    type: 'fiche_action.list',
    options: {
      filtre: {
        modifiedSince: 'last-30-days',
      },
    },
    createdAt: now,
    modifiedAt: now,
  };

  return [indicateurs, actionsDontJeSuisPilote, actionsRecentlyModified];
}
