import {z} from 'zod';
import {DBClient} from '../../../typeUtils';
import {
  moduleCommonSchemaInsert,
  moduleFicheActionsSchema,
  moduleIndicateursSchema,
} from '../domain/module.schema';
import {objectToCamel, objectToSnake} from 'ts-case-convert';

const insertSchema = moduleCommonSchemaInsert;
type ModuleInsert = z.infer<typeof insertSchema>;

type Props = {
  dbClient: DBClient;
  module: ModuleInsert;
};

export async function modulesSave({dbClient, module: unsafeModule}: Props) {
  const commonPart = moduleCommonSchemaInsert.parse(unsafeModule);
  const specificPart = parseSpecificPart(unsafeModule);

  const module = {
    ...commonPart,
    ...specificPart,
  };

  try {
    const {data, error} = await dbClient
      .from('tableau_de_bord_module')
      .upsert(objectToSnake(module), {onConflict: 'id'})
      .eq('id', module.id);
    // .eq('collectivite_id', module.collectiviteId)
    // .eq('user_id', module.userId);

    if (error) {
      throw error;
    }

    return {data};
  } catch (error) {
    console.error(error);
    return {error};
  }
}

function parseSpecificPart(module) {
  if (module.type === 'fiche_action.list') {
    return moduleFicheActionsSchema.parse(module);
  }

  if (module.type === 'indicateur.list') {
    return moduleIndicateursSchema.parse(module);
  }

  throw new Error('Invalid module type');
}
