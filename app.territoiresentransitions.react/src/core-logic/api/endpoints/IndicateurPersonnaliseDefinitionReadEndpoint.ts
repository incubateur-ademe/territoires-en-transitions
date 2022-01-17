import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {indicateurPersonnaliseDefinitionWriteEndpoint} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionWriteEndpoint';
// import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';

export interface IndicateurPersonnaliseDefinitionGetParams {
  collectivite_id: number;
  indicateur_id?: number;
}

class IndicateurPersonnaliseDefinitionReadEndpoint extends DataLayerReadCachedEndpoint<
  IndicateurPersonnaliseDefinitionRead,
  IndicateurPersonnaliseDefinitionGetParams
> {
  readonly name = 'indicateur_personnalise_definition';

  async _read(
    getParams: IndicateurPersonnaliseDefinitionGetParams
  ): Promise<PostgrestResponse<IndicateurPersonnaliseDefinitionRead>> {
    if (getParams.indicateur_id !== undefined)
      return this._table
        .eq('collectivite_id', getParams.collectivite_id)
        .eq('id', getParams.indicateur_id);
    return this._table
      .eq('collectivite_id', getParams.collectivite_id)
      .order('titre', {ascending: true});
  }
}

export const indicateurPersonnaliseDefinitionReadEndpoint =
  new IndicateurPersonnaliseDefinitionReadEndpoint([
    indicateurPersonnaliseDefinitionWriteEndpoint,
  ]);
