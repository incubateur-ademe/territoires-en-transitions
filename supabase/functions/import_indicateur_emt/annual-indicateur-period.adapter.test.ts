import {
  createAnnualIndicateurPeriod,
  type IndicateurDefinitionWithPeriodicite,
  NonAnnualIndicateurDefinitionError,
  parseAnnualIndicateurPeriod,
} from './annual-indicateur-period.adapter.ts';
import { InvalidEmtImportError } from './import-emt-indicateurs.error.ts';

const monthlyDefinition: IndicateurDefinitionWithPeriodicite = {
  id: 2,
  periodicite: 'mensuelle',
};
const annualDefinition: IndicateurDefinitionWithPeriodicite = {
  id: 1,
  periodicite: 'annuelle',
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

Deno.test('builds a canonical tagged annual period without using Date', () => {
  const period = createAnnualIndicateurPeriod(2026);

  assert(period.periodicite === 'annuelle', 'periodicite should be annuelle');
  assert(period.dateDebut === '2026-01-01', 'date should be canonical');
  assert(Object.isFrozen(period), 'period should be immutable');
});

Deno.test('rejects years outside the SQL date contract', async () => {
  for (const year of [0, 1.5, 10_000]) {
    await assertRejectsWith(
      () => createAnnualIndicateurPeriod(year),
      InvalidEmtImportError
    );
  }

  await assertRejectsWith(
    () => parseAnnualIndicateurPeriod(annualDefinition, '0000-01-01'),
    InvalidEmtImportError
  );
  await assertRejectsWith(
    () => parseAnnualIndicateurPeriod(annualDefinition, '2026-02-01'),
    InvalidEmtImportError
  );
});

Deno.test(
  'rejects monthly definitions before interpreting January or February',
  async () => {
    for (const dateValeur of ['2026-01-01', '2026-02-01']) {
      await assertRejectsWith(
        () => parseAnnualIndicateurPeriod(monthlyDefinition, dateValeur),
        NonAnnualIndicateurDefinitionError
      );
    }
  }
);
