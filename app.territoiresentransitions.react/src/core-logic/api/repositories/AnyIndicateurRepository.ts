import {
  AnyIndicateurValueRead,
  AnyIndicateurValueWrite,
} from 'generated/dataLayer/any_indicateur_value_write';
import {
  DataLayerReadEndpoint,
  DataLayerWriteEndpoint,
} from 'core-logic/api/dataLayerEndpoint';
import {
  AnyIndicateurValueGetParams,
  indicateurObjectifReadEndpoint,
  indicateurPersonnaliseObjectifReadEndpoint,
  indicateurPersonnaliseResultatReadEndpoint,
  indicateurResultatReadEndpoint,
} from 'core-logic/api/endpoints/AnyIndicateurValueReadEndpoint';
import {
  indicateurObjectifWriteEndpoint,
  indicateurPersonnaliseObjectifWriteEndpoint,
  indicateurPersonnaliseResultatWriteEndpoint,
  indicateurResultatWriteEndpoint,
} from 'core-logic/api/endpoints/AnyIndicateurValueWriteEndpoint';

export class AnyIndicateurRepository {
  readEndpoint: DataLayerReadEndpoint<
    AnyIndicateurValueRead,
    AnyIndicateurValueGetParams
  >;
  writeEndpoint: DataLayerWriteEndpoint<AnyIndicateurValueWrite>;

  constructor({
    readEndpoint,
    writeEndpoint,
  }: {
    readEndpoint: DataLayerReadEndpoint<
      AnyIndicateurValueRead,
      AnyIndicateurValueGetParams
    >;
    writeEndpoint: DataLayerWriteEndpoint<AnyIndicateurValueWrite>;
  }) {
    this.readEndpoint = readEndpoint;
    this.writeEndpoint = writeEndpoint;
  }
  save(
    anyIndicateur: AnyIndicateurValueWrite
  ): Promise<AnyIndicateurValueWrite | null> {
    return this.writeEndpoint.save(anyIndicateur);
  }

  async fetchIndicateurValueForIdForYear(args: {
    collectiviteId: number;
    indicateurId: string | number;
    year: number;
  }): Promise<AnyIndicateurValueRead | null> {
    const allIndicateurValues = await this.readEndpoint.getBy({
      collectiviteId: args.collectiviteId,
    });
    return (
      allIndicateurValues.find(
        indicateurValue =>
          indicateurValue.annee === args.year &&
          indicateurValue.indicateur_id === args.indicateurId
      ) ?? null
    );
  }
  async fetchIndicateurValuesForId(args: {
    collectiviteId: number;
    indicateurId: string | number;
  }): Promise<AnyIndicateurValueRead[]> {
    const allIndicateurValues = await this.readEndpoint.getBy({
      collectiviteId: args.collectiviteId,
    });

    return allIndicateurValues.filter(
      indicateurValue => indicateurValue.indicateur_id === args.indicateurId
    );
  }
}

export const indicateurResultatRepository = new AnyIndicateurRepository({
  readEndpoint: indicateurResultatReadEndpoint,
  writeEndpoint: indicateurResultatWriteEndpoint,
});

export const indicateurObjectifRepository = new AnyIndicateurRepository({
  readEndpoint: indicateurObjectifReadEndpoint,
  writeEndpoint: indicateurObjectifWriteEndpoint,
});

export const indicateurPersonnaliseResultatRepository =
  new AnyIndicateurRepository({
    readEndpoint: indicateurPersonnaliseResultatReadEndpoint,
    writeEndpoint: indicateurPersonnaliseResultatWriteEndpoint,
  });

export const indicateurPersonnaliseObjectifRepository =
  new AnyIndicateurRepository({
    readEndpoint: indicateurPersonnaliseObjectifReadEndpoint,
    writeEndpoint: indicateurPersonnaliseObjectifWriteEndpoint,
  });
