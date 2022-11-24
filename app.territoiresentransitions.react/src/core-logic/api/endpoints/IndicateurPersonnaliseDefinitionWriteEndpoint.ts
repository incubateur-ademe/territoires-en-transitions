import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {IndicateurPersonnaliseDefinitionWrite} from 'generated/dataLayer/indicateur_personnalise_definition_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export class IndicateurPersonnaliseDefinitionWriteEndpoint extends DataLayerWriteEndpoint<IndicateurPersonnaliseDefinitionWrite> {
  readonly name = 'indicateur_personnalise_definition';

  async _write(
    IndicateurPersonnaliseDefinition: IndicateurPersonnaliseDefinitionWrite
  ): Promise<PostgrestResponse<IndicateurPersonnaliseDefinitionWrite>> {
    return this._table.upsert([IndicateurPersonnaliseDefinition]).select();
  }
}

export const indicateurPersonnaliseDefinitionWriteEndpoint =
  new IndicateurPersonnaliseDefinitionWriteEndpoint();
