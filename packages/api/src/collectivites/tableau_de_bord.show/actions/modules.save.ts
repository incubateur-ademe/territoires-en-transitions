import {objectToSnake} from 'ts-case-convert';
import {z} from 'zod';
import {DBClient} from '../../../typeUtils';
import {
  Module,
  moduleCommonSchemaInsert,
  moduleFicheActionsSchema,
  moduleIndicateursSchema,
} from '../domain/module.schema';

const insertSchema = moduleCommonSchemaInsert;
type ModuleInsert = z.infer<typeof insertSchema>;

type Props = {
  dbClient: DBClient;
  module: Module;
};

export async function modulesSave({dbClient, module: unsafeModule}: Props) {
  const module = parseModule(unsafeModule);

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

function parseModule(module) {
  const commonPart = moduleCommonSchemaInsert.parse(module);

  if (module.type === 'fiche_action.list') {
    return {
      ...moduleFicheActionsSchema.parse(module),
      ...commonPart,
    };
  }

  if (module.type === 'indicateur.list') {
    return {
      ...moduleIndicateursSchema.parse(module),
      ...commonPart,
    };
  }

  throw new Error('Invalid module type');
}
