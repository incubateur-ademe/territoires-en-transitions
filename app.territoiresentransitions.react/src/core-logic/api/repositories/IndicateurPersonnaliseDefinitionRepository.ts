import {indicateurPersonnaliseDefinitionReadEndpoint} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionReadEndpoint';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import {IndicateurPersonnaliseDefinitionWrite} from 'generated/dataLayer/indicateur_personnalise_definition_write';
import {indicateurPersonnaliseDefinitionWriteEndpoint} from 'core-logic/api/endpoints/IndicateurPersonnaliseDefinitionWriteEndpoint';

class IndicateurPersonnaliseDefinitionRepository {
  save(
    indicateurPersonnaliseDefinition: IndicateurPersonnaliseDefinitionWrite
  ): Promise<IndicateurPersonnaliseDefinitionWrite | null> {
    return indicateurPersonnaliseDefinitionWriteEndpoint.save(
      indicateurPersonnaliseDefinition
    );
  }

  async fetchCollectiviteIndicateurPersonnaliseDefinitionList(args: {
    collectiviteId: number;
  }): Promise<IndicateurPersonnaliseDefinitionRead[]> {
    const results = await indicateurPersonnaliseDefinitionReadEndpoint.getBy({
      collectivite_id: args.collectiviteId,
    });
    return results;
  }
}

export const indicateurPersonnaliseDefinitionRepository =
  new IndicateurPersonnaliseDefinitionRepository();
