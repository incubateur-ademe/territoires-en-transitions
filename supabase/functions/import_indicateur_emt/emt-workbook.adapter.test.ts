import { createEmtWorksheetDecoder } from './emt-workbook.adapter.ts';

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertRejectsWithMessage = async (
  callback: () => Promise<unknown>,
  expectedMessage: string
): Promise<void> => {
  try {
    await callback();
  } catch (error) {
    assert(
      error instanceof Error && error.message === expectedMessage,
      `Expected "${expectedMessage}", received ${String(error)}`
    );
    return;
  }
  throw new Error(`Expected "${expectedMessage}" to be thrown`);
};

const coordinatesByAddress = new Map([
  ['A1', { r: 0, c: 0 }],
  ['A3', { r: 2, c: 0 }],
  ['A4', { r: 3, c: 0 }],
  ['C4', { r: 3, c: 2 }],
  ['E6', { r: 5, c: 4 }],
]);
const addressByCoordinates = new Map(
  [...coordinatesByAddress].map(([address, { r, c }]) => [`${r}:${c}`, address])
);

const sheetJsUtils = {
  decode_cell: (address: string) => {
    const coordinates = coordinatesByAddress.get(address);
    if (!coordinates) {
      throw new Error(`Unknown test cell: ${address}`);
    }
    return coordinates;
  },
  encode_cell: ({ r, c }: { r: number; c: number }) =>
    addressByCoordinates.get(`${r}:${c}`) ?? 'missing',
};

Deno.test('adapts the first worksheet header, bounds and cells', async () => {
  let readByteLength: number | undefined;
  let readType: string | undefined;
  const sheetJs = {
    read: (data: ArrayBuffer, options: { type: 'array' }) => {
      readByteLength = data.byteLength;
      readType = options.type;
      return {
        SheetNames: ['Première feuille', 'Feuille ignorée'],
        Sheets: {
          'Première feuille': {
            '!ref': { v: 'A1:E6' },
            A1: { v: 'N°' },
            A3: { v: 'N°' },
            A4: { v: '1a' },
            C4: { v: 'Nom indicateur' },
            E6: { v: 42 },
          },
          'Feuille ignorée': {
            A3: { v: 'N°' },
            C4: { v: 'Autre indicateur' },
          },
        },
      };
    },
    utils: sheetJsUtils,
  };

  const worksheet = await createEmtWorksheetDecoder(sheetJs)(
    new File([new Uint8Array([1, 2, 3])], 'emt.xlsx')
  );

  assert(readByteLength === 3, 'the complete file should be decoded');
  assert(readType === 'array', 'SheetJS should receive the array input mode');
  assert(worksheet.firstDataRow === 3, 'data should start after row A3');
  assert(
    worksheet.lastDataRowExclusive === 6,
    'the maximum populated row should define the exclusive bound'
  );
  assert(
    worksheet.getCellValue(3, 2) === 'Nom indicateur',
    'cell reads should use SheetJS coordinates from the first sheet'
  );
  assert(
    worksheet.getCellValue(4, 2) === null,
    'an absent cell should be exposed as null'
  );
});

Deno.test('rejects workbooks without a first sheet or EMT header', async () => {
  const file = new File([new Uint8Array()], 'emt.xlsx');

  await assertRejectsWithMessage(
    () =>
      createEmtWorksheetDecoder({
        read: () => ({ SheetNames: [], Sheets: {} }),
        utils: sheetJsUtils,
      })(file),
    'Le classeur EMT ne contient aucune feuille'
  );

  await assertRejectsWithMessage(
    () =>
      createEmtWorksheetDecoder({
        read: () => ({
          SheetNames: ['Première feuille'],
          Sheets: { 'Première feuille': { A4: { v: '1a' } } },
        }),
        utils: sheetJsUtils,
      })(file),
    "L'en-tête EMT « N° » est introuvable"
  );
});
