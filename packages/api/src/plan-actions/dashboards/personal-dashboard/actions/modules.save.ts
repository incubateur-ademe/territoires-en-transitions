import { objectToSnake } from 'ts-case-convert';
import { DBClient } from '../../../../typeUtils';
import {
  ModuleInsert,
  prepareModuleForPersistence,
} from '../domain/module.schema';

type Props = {
  dbClient: DBClient;
  module: ModuleInsert;
};

export async function modulesSave({ dbClient, module: unsafeModule }: Props) {
  const myModule = prepareModuleForPersistence(unsafeModule);

  try {
    const { error } = await dbClient
      .from('tableau_de_bord_module')
      .upsert(objectToSnake(myModule), {
        onConflict: 'id',
      })
      .eq('id', myModule.id);

    if (error) {
      throw error;
    }

    return {};
  } catch (error) {
    console.error(error);
    return { error };
  }
}
