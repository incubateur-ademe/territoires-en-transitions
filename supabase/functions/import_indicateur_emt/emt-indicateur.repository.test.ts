import {
  createAnnualIndicateurPeriod,
  type IndicateurDefinitionWithPeriodicite,
  NonAnnualIndicateurDefinitionError,
} from './annual-indicateur-period.adapter.ts';
import { EmtIndicateurRepository } from './emt-indicateur.repository.ts';
import { InvalidEmtImportError } from './import-emt-indicateurs.error.ts';

const annualDefinition: IndicateurDefinitionWithPeriodicite = {
  id: 1,
  periodicite: 'annuelle',
};
const monthlyDefinition: IndicateurDefinitionWithPeriodicite = {
  id: 2,
  periodicite: 'mensuelle',
};

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertRejectsWith = async (
  callback: () => unknown | Promise<unknown>,
  ExpectedError: new (...args: never[]) => Error
): Promise<void> => {
  try {
    await callback();
  } catch (error) {
    assert(
      error instanceof ExpectedError,
      `Expected ${ExpectedError.name}, received ${String(error)}`
    );
    return;
  }
  throw new Error(`Expected ${ExpectedError.name} to be thrown`);
};

Deno.test('refuses a monthly write before calling Supabase', async () => {
  let writeCount = 0;
  const client = {
    rpc: () => {
      writeCount += 1;
      return Promise.resolve({ data: 1, error: null });
    },
  };
  const repository = new EmtIndicateurRepository(client as never);

  await assertRejectsWith(
    () =>
      repository.importAnnualValeurs({
        collectiviteId: 10,
        valeurs: [
          {
            definition: monthlyDefinition,
            period: createAnnualIndicateurPeriod(2026),
            resultat: 1,
            commentaire: null,
          },
        ],
      }),
    NonAnnualIndicateurDefinitionError
  );
  assert(writeCount === 0, 'monthly definitions must fail before the DB write');
});

Deno.test('writes zero on the canonical annual date', async () => {
  let rpcName: string | undefined;
  let rpcArguments: Record<string, unknown> | undefined;
  const client = {
    rpc: (name: string, args: Record<string, unknown>) => {
      rpcName = name;
      rpcArguments = args;
      return Promise.resolve({ data: 1, error: null });
    },
  };
  const repository = new EmtIndicateurRepository(client as never);

  const writtenCount = await repository.importAnnualValeurs({
    collectiviteId: 10,
    valeurs: [
      {
        definition: annualDefinition,
        period: createAnnualIndicateurPeriod(2026),
        resultat: 0,
        commentaire: null,
      },
    ],
  });

  assert(
    rpcName === 'import_indicateur_emt_valeurs',
    'the transactional RPC should own the write'
  );
  assert(
    Array.isArray(rpcArguments?.valeurs_a_ecrire) &&
      rpcArguments.valeurs_a_ecrire.length === 1,
    'all values should be sent in one payload'
  );
  const valeur = (
    rpcArguments?.valeurs_a_ecrire as Record<string, unknown>[]
  )[0];
  assert(valeur?.indicateur_id === 1, 'indicator id should be preserved');
  assert(
    valeur?.date_debut === '2026-01-01',
    'annual date should be canonical'
  );
  assert(
    valeur?.periodicite === 'annuelle',
    'the expected cadence should be explicit'
  );
  assert(
    valeur?.resultat === 0,
    'zero is a meaningful value and must be written'
  );
  assert(writtenCount === 1, 'the RPC result should be returned');
});

Deno.test(
  'loads only platform definitions keyed by referential identifier',
  async () => {
    const filters: unknown[][] = [];
    let selectedColumns: string | undefined;
    const rows = [
      {
        id: 1,
        identifiant_referentiel: 'cae_1.a',
        periodicite: 'annuelle',
        unite: 'kWh',
      },
      {
        id: 2,
        identifiant_referentiel: null,
        periodicite: 'annuelle',
        unite: 'kWh',
      },
    ];
    const query = {
      is: (column: string, value: unknown) => {
        filters.push(['is', column, value]);
        return query;
      },
      not: (column: string, operator: string, value: unknown) => {
        filters.push(['not', column, operator, value]);
        return Promise.resolve({ data: rows, error: null });
      },
    };
    const client = {
      from: (table: string) => {
        assert(table === 'indicateur_definition', 'definition table expected');
        return {
          select: (columns: string) => {
            selectedColumns = columns;
            return query;
          },
        };
      },
    };

    const definitions = await new EmtIndicateurRepository(
      client as never
    ).listDefinitions();

    assert(
      selectedColumns === 'id, identifiant_referentiel, periodicite, unite',
      'the annual-import contract columns should be selected explicitly'
    );
    assert(
      JSON.stringify(filters) ===
        JSON.stringify([
          ['is', 'collectivite_id', null],
          ['is', 'groupement_id', null],
          ['not', 'identifiant_referentiel', 'is', null],
        ]),
      'only platform definitions with an identifier should be requested'
    );
    assert(definitions.size === 1, 'null identifiers should not enter the map');
    assert(
      definitions.get('cae_1.a')?.id === 1,
      'definitions should be keyed by referential identifier'
    );
  }
);

Deno.test('propagates transactional infrastructure errors', async () => {
  const client = {
    rpc: () =>
      Promise.resolve({ data: null, error: { message: 'database failure' } }),
  };
  const repository = new EmtIndicateurRepository(client as never);

  let receivedError: unknown;
  try {
    await repository.importAnnualValeurs({
      collectiviteId: 10,
      valeurs: [
        {
          definition: annualDefinition,
          period: createAnnualIndicateurPeriod(2026),
          resultat: 1,
          commentaire: null,
        },
      ],
    });
  } catch (error) {
    receivedError = error;
  }

  assert(
    receivedError instanceof Error &&
      receivedError.message === 'database failure',
    'the RPC error should reject the import'
  );
});

Deno.test('maps transactional cadence conflicts to input errors', async () => {
  const client = {
    rpc: () =>
      Promise.resolve({
        data: null,
        error: { code: '23514', message: 'cadence changed' },
      }),
  };
  const repository = new EmtIndicateurRepository(client as never);

  await assertRejectsWith(
    () =>
      repository.importAnnualValeurs({
        collectiviteId: 10,
        valeurs: [
          {
            definition: annualDefinition,
            period: createAnnualIndicateurPeriod(2026),
            resultat: 1,
            commentaire: null,
          },
        ],
      }),
    InvalidEmtImportError
  );
});
