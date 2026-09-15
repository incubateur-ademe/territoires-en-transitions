import type { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import {
  type EmtIndicateurDefinition,
  parseAnnualIndicateurPeriod,
} from './annual-indicateur-period.adapter.ts';
import type {
  ImportAnnualEmtValeursInput,
  ImportEmtIndicateursRepository,
} from './import-emt-indicateurs.service.ts';
import { InvalidEmtImportError } from './import-emt-indicateurs.error.ts';

/** Persistence boundary for the legacy EMT Edge Function. */
export class EmtIndicateurRepository implements ImportEmtIndicateursRepository {
  constructor(private readonly supabaseClient: TSupabaseClient) {}

  async listDefinitions(): Promise<
    ReadonlyMap<string, EmtIndicateurDefinition>
  > {
    const { error, data } = await this.supabaseClient
      .from('indicateur_definition')
      .select('id, identifiant_referentiel, periodicite, unite')
      .is('collectivite_id', null)
      .is('groupement_id', null)
      .not('identifiant_referentiel', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    const definitionsByIdentifiant = new Map<string, EmtIndicateurDefinition>();
    for (const definition of data) {
      if (definition.identifiant_referentiel) {
        definitionsByIdentifiant.set(
          definition.identifiant_referentiel,
          definition
        );
      }
    }
    return definitionsByIdentifiant;
  }

  async importAnnualValeurs({
    collectiviteId,
    valeurs,
  }: ImportAnnualEmtValeursInput): Promise<number> {
    const valeursPayload = valeurs.map(
      ({ definition, period, resultat, commentaire }) => {
        const validatedPeriod = parseAnnualIndicateurPeriod(
          definition,
          period.dateDebut
        );
        return {
          indicateur_id: definition.id,
          periodicite: validatedPeriod.periodicite,
          date_debut: validatedPeriod.dateDebut,
          resultat,
          commentaire,
        };
      }
    );

    // This one RPC is the workbook transaction boundary. It also owns the
    // definition locks and cadence rechecks: a local check cannot distinguish
    // an annual value from a monthly January value after a concurrent change.
    const { error, data } = await this.supabaseClient.rpc(
      'import_indicateur_emt_valeurs',
      {
        collectivite_id_a_ecrire: collectiviteId,
        valeurs_a_ecrire: valeursPayload,
      }
    );
    if (error) {
      if (error.code === '23503' || error.code === '23514') {
        throw new InvalidEmtImportError(error.message, { cause: error });
      }
      throw new Error(error.message);
    }
    return data;
  }
}
