import {objectToSnake} from 'ts-case-convert';
import {TablesInsert} from '../../../database.types';
import {DBClient} from '../../../typeUtils';
import {
  ModuleInsert,
  moduleCommonSchemaInsert,
  moduleFichesSchema,
  moduleIndicateursSchema,
} from '../domain/module.schema';

type Props = {
  dbClient: DBClient;
  module: ModuleInsert;
};

export async function modulesSave({dbClient, module: unsafeModule}: Props) {
  const module = parseModule(unsafeModule);

  try {
    const {error} = await dbClient
      .from('tableau_de_bord_module')
      .upsert(objectToSnake(module) as TablesInsert<'tableau_de_bord_module'>, {
        onConflict: 'id',
      })
      .eq('id', module.id);

    if (error) {
      throw error;
    }

    return {};
  } catch (error) {
    console.error(error);
    return {error};
  }
}

function parseModule(module: ModuleInsert) {
  const commonPart = moduleCommonSchemaInsert.parse(module);

  if (module.type === 'fiche_action.list') {
    return {
      ...moduleFichesSchema.parse(module),
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
