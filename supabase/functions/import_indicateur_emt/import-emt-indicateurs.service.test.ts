import type { EmtIndicateurDefinition } from './annual-indicateur-period.adapter.ts';
import {
  type ImportAnnualEmtValeursInput,
  type ImportEmtIndicateursRepository,
  ImportEmtIndicateursService,
} from './import-emt-indicateurs.service.ts';

const annualDefinition: EmtIndicateurDefinition = {
  id: 1,
  identifiant_referentiel: 'cae_1.a',
  periodicite: 'annuelle',
  unite: '%',
};
const monthlyDefinition: EmtIndicateurDefinition = {
  id: 2,
  identifiant_referentiel: 'cae_1.b',
  periodicite: 'mensuelle',
  unite: 'kWh',
};

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const worksheetFromCells = (cells: ReadonlyMap<string, unknown>) => ({
  firstDataRow: 1,
  lastDataRowExclusive: 3,
  getCellValue: (row: number, column: number): unknown | null =>
    cells.get(`${row}:${column}`) ?? null,
});

Deno.test(
  'validates every EMT definition before writing the first value',
  async () => {
    const imports: ImportAnnualEmtValeursInput[] = [];
    const repository: ImportEmtIndicateursRepository = {
      listDefinitions: () =>
        Promise.resolve(
          new Map([
            ['cae_1.a', annualDefinition],
            ['cae_1.b', monthlyDefinition],
          ])
        ),
      importAnnualValeurs: (input) => {
        imports.push(input);
        return Promise.resolve(input.valeurs.length);
      },
    };
    const service = new ImportEmtIndicateursService(repository);

    let rejected = false;
    try {
      await service.import({
        collectiviteId: 10,
        referentiel: 'cae',
        worksheet: worksheetFromCells(
          new Map<string, unknown>([
            ['1:0', '1a'],
            ['1:4', 25],
            ['1:5', 2026],
            ['2:0', '1b'],
            ['2:4', 12],
            ['2:5', 2026],
          ])
        ),
      });
    } catch {
      rejected = true;
    }

    assert(rejected, 'a monthly definition must reject the annual-only import');
    assert(imports.length === 0, 'prevalidation must prevent persistence');
  }
);

Deno.test('keeps zero as a meaningful annual EMT value', async () => {
  const imports: ImportAnnualEmtValeursInput[] = [];
  const repository: ImportEmtIndicateursRepository = {
    listDefinitions: () =>
      Promise.resolve(new Map([['cae_1.a', annualDefinition]])),
    importAnnualValeurs: (input) => {
      imports.push(input);
      return Promise.resolve(input.valeurs.length);
    },
  };
  const service = new ImportEmtIndicateursService(repository);

  const result = await service.import({
    collectiviteId: 10,
    referentiel: 'cae',
    worksheet: worksheetFromCells(
      new Map<string, unknown>([
        ['1:0', '1a'],
        ['1:4', 0],
        ['1:5', '2026'],
      ])
    ),
  });

  assert(result.writtenValeursCount === 1, 'one value should be written');
  assert(imports.length === 1, 'the repository should receive one batch');
  const valeur = imports[0]?.valeurs[0];
  assert(valeur?.resultat === 0, 'zero must not be treated as absent');
  assert(
    valeur?.period.dateDebut === '2026-01-01',
    'the annual storage date should be canonical'
  );
});

Deno.test(
  'validates request identifiers before loading definitions',
  async () => {
    let definitionsReadCount = 0;
    const repository: ImportEmtIndicateursRepository = {
      listDefinitions: () => {
        definitionsReadCount += 1;
        return Promise.resolve(new Map());
      },
      importAnnualValeurs: () => Promise.resolve(1),
    };
    const service = new ImportEmtIndicateursService(repository);
    const worksheet = worksheetFromCells(new Map());

    for (const input of [
      { collectiviteId: 0, referentiel: 'cae' },
      { collectiviteId: 10, referentiel: '   ' },
    ]) {
      let rejected = false;
      try {
        await service.import({ ...input, worksheet });
      } catch {
        rejected = true;
      }
      assert(rejected, 'an invalid request should be rejected');
    }

    assert(
      definitionsReadCount === 0,
      'invalid requests must fail before persistence is accessed'
    );
  }
);

Deno.test(
  'writes a comment-only cell and counts only effective writes',
  async () => {
    const imports: ImportAnnualEmtValeursInput[] = [];
    const repository: ImportEmtIndicateursRepository = {
      listDefinitions: () =>
        Promise.resolve(new Map([['cae_1.a', annualDefinition]])),
      importAnnualValeurs: (input) => {
        imports.push(input);
        return Promise.resolve(0);
      },
    };
    const service = new ImportEmtIndicateursService(repository);

    const result = await service.import({
      collectiviteId: 10,
      referentiel: 'cae',
      worksheet: worksheetFromCells(
        new Map<string, unknown>([
          ['1:0', '1a'],
          ['1:5', '2026'],
          ['1:6', 'Commentaire sans valeur'],
        ])
      ),
    });

    assert(
      imports.length === 1 && imports[0]?.valeurs.length === 1,
      'the comment-only cell should reach batch persistence'
    );
    const valeur = imports[0]?.valeurs[0];
    assert(valeur?.resultat === null, 'the absent result should stay null');
    assert(
      valeur?.commentaire === 'Commentaire sans valeur',
      'the comment should be preserved'
    );
    assert(
      result.writtenValeursCount === 0,
      'a no-op reported by persistence should not be counted as a write'
    );
  }
);

Deno.test('persists all prepared cells through one atomic batch', async () => {
  const imports: ImportAnnualEmtValeursInput[] = [];
  const repository: ImportEmtIndicateursRepository = {
    listDefinitions: () =>
      Promise.resolve(new Map([['cae_1.a', annualDefinition]])),
    importAnnualValeurs: (input) => {
      imports.push(input);
      return Promise.resolve(input.valeurs.length);
    },
  };
  const service = new ImportEmtIndicateursService(repository);

  const result = await service.import({
    collectiviteId: 10,
    referentiel: 'cae',
    worksheet: worksheetFromCells(
      new Map<string, unknown>([
        ['1:0', '1a'],
        ['1:4', 1],
        ['1:5', 2025],
        ['1:7', 2],
        ['1:8', 2026],
      ])
    ),
  });

  assert(imports.length === 1, 'the workbook must use one repository call');
  assert(
    imports[0]?.valeurs.length === 2,
    'both prepared values should belong to the same batch'
  );
  assert(
    result.writtenValeursCount === 2,
    'the batch count should be returned'
  );
});
